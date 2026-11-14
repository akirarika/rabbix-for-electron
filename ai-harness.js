import fs from 'node:fs';
import net from 'node:net';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

// 调用方可能是终端、启动器或 AI 工具，随时会关掉管道：Ctrl+C、工具超时杀掉父进程、
// 终端关闭都会让 stdout / stderr 的对端消失，此后每次写入都以 EPIPE 失败。
// 未处理的流错误会被 Electron 当成主进程未捕获异常，弹出「A JavaScript error occurred
// in the main process」并打断正在运行的客户端；这类错误只说明没人在读输出，应当忽略。
const CLOSED_PIPE_ERROR_CODES = new Set(['EPIPE', 'ECONNRESET', 'ERR_STREAM_DESTROYED']);
let stdioBroken = false;

function guardProcessStdio() {
  for (const stream of [process.stdout, process.stderr]) {
    stream.on('error', (error) => {
      if (CLOSED_PIPE_ERROR_CODES.has(error?.code)) {
        stdioBroken = true;
        return;
      }
      // 事件回调里再抛错同样会变成未捕获异常，只能就地吞掉
      try {
        fs.writeSync(2, `[ai-harness] stdio error: ${error?.message ?? error}\n`);
      } catch {}
    });
  }
}

guardProcessStdio();

/** 输出通道是否已经断开；断开的通道上继续等响应没有意义 */
export function isStdioBroken() {
  return stdioBroken;
}

// 写入失败说明对端已经走了，协议响应写不出去也无法补救，按失败收场
function writeStdout(line) {
  if (stdioBroken) return false;
  try {
    process.stdout.write(`${line}\n`);
    return true;
  } catch {
    stdioBroken = true;
    return false;
  }
}

function writeStderr(text) {
  if (stdioBroken) return;
  try {
    fs.writeSync(2, text);
  } catch {
    stdioBroken = true;
  }
}

// AI harness 通道的 Electron 主进程入口侧实现。
//
// 角色判定不依赖 Electron 的单实例锁：已运行的主实例常驻一个命名管道，
// 调用方先尝试连接它；连上说明客户端已在运行，本次进程只做转发与等待；
// 连不上说明客户端未运行，本次进程走正常启动流程，由 bootstrap 建立管道。

export const AI_HARNESS_ARG = '--ai-harness';
export const AI_HARNESS_INIT_ARG = '--ai-harness-init';
export const AI_HARNESS_UPDATE_ARG = '--ai-harness-update';
export const AI_HARNESS_TIMEOUT_MS = 60000;
// SKILL 版本校验在 embed，这里只发动作与载荷，不携带 version
const AI_HARNESS_SKILL_READ_TYPE = 'SKILL_READ';
// 客户端未运行时不该让调用方久等：探测窗口只覆盖"管道已就绪"这一常见情形
const PIPE_CONNECT_DEADLINE_MS = 3000;
const PIPE_CONNECT_ATTEMPT_MS = 500;
const PIPE_CONNECT_INTERVAL_MS = 200;
// 强杀前留出的时间，让 stdout / stderr 上的内容先落地
const FORCE_EXIT_DELAY_MS = 300;

export const AI_HARNESS_HELP = [
  'Rabbix',
  '',
  'Usage:',
  '  rabbix.exe --ai-harness',
  '  rabbix.exe --ai-harness-init <path>',
  '  rabbix.exe --ai-harness-update <path>',
  '  rabbix.exe -h | --help',
  '',
  'Options:',
  '  --ai-harness                Read one JSON request per line from stdin and write one JSON response per line to stdout.',
  "  --ai-harness-init <path>    Write the client's current SKILL document to <path>. <path> must end with /rabbix/SKILL.md, its parent directory must exist and the file must not exist yet.",
  "  --ai-harness-update <path>  Overwrite <path> with the client's current SKILL document. <path> must end with /rabbix/SKILL.md and the file must already exist.",
  '  -h, --help                  Show this help and exit.',
  '',
  'Notes:',
  '  init / update report their result on stdout. Judge success by that output:',
  '  when stdin is left open the process is force-killed after writing it and the exit code is non-zero.',
  '',
].join('\n');

/**
 * 解析命令行里与 ai-harness 相关的选项。
 * 返回 { kind: 'help' | 'harness' | 'skill-init' | 'skill-update' | 'none', file? }。
 */
export function parseAiHarnessCli(argv) {
  if (argv.includes('-h') || argv.includes('--help')) return { kind: 'help' };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];
    // 下一个参数以 - 开头时视为缺少路径，交给后续校验报错
    const nextFile = next !== undefined && !next.startsWith('-') ? next : undefined;

    if (arg === AI_HARNESS_ARG) return { kind: 'harness' };
    if (arg === AI_HARNESS_INIT_ARG) return { kind: 'skill-init', file: nextFile };
    if (arg === AI_HARNESS_UPDATE_ARG) return { kind: 'skill-update', file: nextFile };
    if (arg.startsWith(`${AI_HARNESS_INIT_ARG}=`)) return { kind: 'skill-init', file: arg.slice(AI_HARNESS_INIT_ARG.length + 1) };
    if (arg.startsWith(`${AI_HARNESS_UPDATE_ARG}=`)) return { kind: 'skill-update', file: arg.slice(AI_HARNESS_UPDATE_ARG.length + 1) };
  }

  return { kind: 'none' };
}

export function getAiHarnessPipeName(app) {
  const hash = createHash('sha1').update(app.getPath('userData')).digest('hex').slice(0, 16);
  return `\\\\.\\pipe\\rabbix-ai-harness-${hash}`;
}

// 按 LF 分帧读取 fd 0。不能用 process.stdin：在 Electron 里它是立即 end 的死流。
function createLineReader() {
  const stream = fs.createReadStream(null, { fd: 0, autoClose: false });
  const pending = [];
  const endCallbacks = [];
  let handler = null;
  let ended = false;
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let index = buffer.indexOf('\n');
    while (index >= 0) {
      const text = buffer.slice(0, index).replace(/\r$/, '');
      buffer = buffer.slice(index + 1);
      if (text.length > 0) {
        if (handler) handler(text);
        else pending.push(text);
      }
      index = buffer.indexOf('\n');
    }
  });

  const onEnded = () => {
    if (ended) return;
    ended = true;
    for (const callback of endCallbacks) callback();
  };
  stream.on('end', onEnded);
  stream.on('error', onEnded);

  return {
    setHandler(callback) {
      handler = callback;
      const queued = pending.splice(0);
      for (const line of queued) callback(line);
    },
    onEnd(callback) {
      if (ended) callback();
      else endCallbacks.push(callback);
    },
    get ended() {
      return ended;
    },
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryConnect(pipeName) {
  return new Promise((resolve) => {
    const socket = net.connect(pipeName);
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(null);
    }, PIPE_CONNECT_ATTEMPT_MS);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

async function connectPipe(pipeName) {
  const deadline = Date.now() + PIPE_CONNECT_DEADLINE_MS;
  for (;;) {
    const socket = await tryConnect(pipeName);
    if (socket) return socket;
    if (Date.now() >= deadline) return null;
    await delay(PIPE_CONNECT_INTERVAL_MS);
  }
}

// 转发模式：把 stdin 的请求逐行交给主实例，把主实例的响应逐行写回 stdout，
// 收齐全部响应（或超时）后以对应退出码结束本次进程。
function forward(socket) {
  return new Promise((resolve) => {
    const reader = createLineReader();
    let requestCount = 0;
    let responseCount = 0;
    let stdinEnded = false;
    let finished = false;
    let buffer = '';

    const finish = (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(deadlineTimer);
      try {
        socket.destroy();
      } catch {}
      if (reader.ended) {
        process.exit(code);
        return;
      }
      // stdin 未 EOF 时 Electron 的退出流程会卡在 fd 0 上（app.exit / process.exit 均挂死），
      // 只能强杀；先留出时间让 stdout 上的响应落地
      setTimeout(() => process.kill(process.pid, 'SIGKILL'), FORCE_EXIT_DELAY_MS);
    };

    // 主实例自身也有 60 秒超时，这里留出余量只作兜底。
    // 请求的 id / type / version 都由主实例生成或回显，转发器不解析协议内容，兜底响应只能留空
    const deadlineTimer = setTimeout(() => {
      writeStdout(JSON.stringify({ id: '', type: '', success: false, code: 'TIMEOUT', reject: { message: `No result within ${AI_HARNESS_TIMEOUT_MS}ms` }, timestamp: Date.now() }));
      finish(1);
    }, AI_HARNESS_TIMEOUT_MS + 5000);

    reader.setHandler((line) => {
      requestCount += 1;
      socket.write(`${line}\n`);
    });

    reader.onEnd(() => {
      stdinEnded = true;
      // 输出通道已断：即使主实例稍后写出响应也没人接收，不必继续等
      if (isStdioBroken()) return finish(1);
      if (requestCount === 0) finish(1);
      else if (responseCount >= requestCount) finish(0);
    });

    socket.setEncoding('utf8');
    socket.on('data', (chunk) => {
      buffer += chunk;
      let index = buffer.indexOf('\n');
      while (index >= 0) {
        const text = buffer.slice(0, index).replace(/\r$/, '');
        buffer = buffer.slice(index + 1);
        if (text.length > 0) {
          responseCount += 1;
          if (!writeStdout(text)) return finish(1);
          let timedOut = false;
          try {
            const parsed = JSON.parse(text);
            timedOut = parsed.success === false && parsed.code === 'TIMEOUT';
          } catch {}
          if (timedOut) return finish(1);
          if (stdinEnded && responseCount >= requestCount) return finish(0);
        }
        index = buffer.indexOf('\n');
      }
    });
    socket.on('error', () => finish(1));
    socket.on('close', () => finish(1));
  });
}

// 路径与文件校验全部在启动 Electron 之前完成：这些失败本机就能判定，不该拉起客户端。
// 传入的是 SKILL 文档自身的完整路径，约定为 <技能根目录>/rabbix/SKILL.md
function validateSkillTarget(mode, filePath) {
  const flag = mode === 'init' ? AI_HARNESS_INIT_ARG : AI_HARNESS_UPDATE_ARG;
  if (typeof filePath !== 'string' || filePath.length === 0) return { error: `${flag} requires a path ending with /rabbix/SKILL.md` };

  // 统一分隔符后再比对，避免用户按 Windows 习惯写反斜杠时被误判
  if (!filePath.replace(/\\/g, '/').endsWith('/rabbix/SKILL.md')) {
    return {
      error: `${filePath} does not end with /rabbix/SKILL.md
  pass the full path of the SKILL document itself, for example C:\\Users\\<name>\\.claude\\skills\\rabbix\\SKILL.md
  the skills directory and the rabbix directory are not accepted, see --help for details`,
    };
  }

  const skillFile = resolve(filePath);
  const skillDir = dirname(skillFile);
  const targetDir = dirname(skillDir);
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) return { error: `${targetDir} is not an existing directory` };

  if (mode === 'init') {
    if (fs.existsSync(skillDir) || fs.existsSync(skillFile)) return { error: `${skillDir} already exists, refusing to overwrite (use --ai-harness-update)` };
  } else {
    if (!fs.existsSync(skillDir) || !fs.statSync(skillDir).isDirectory()) return { error: `${skillFile} is not initialized, run --ai-harness-init first` };
    if (!fs.existsSync(skillFile)) return { error: `${skillFile} is not initialized, run --ai-harness-init first` };
  }

  return { skillDir, skillFile };
}

// 客户端已在运行时，通过命名管道取一次 SKILL 文档
function requestSkillOverSocket(socket) {
  return new Promise((resolveResponse) => {
    let settled = false;
    let buffer = '';
    let timer = null;

    const settle = (response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {}
      resolveResponse(response);
    };

    // 主实例自身有请求超时，这里留出余量只作兜底
    timer = setTimeout(() => settle({ success: false, code: 'TIMEOUT', reject: { message: `No SKILL_READ response within ${AI_HARNESS_TIMEOUT_MS}ms` } }), AI_HARNESS_TIMEOUT_MS + 5000);

    socket.setEncoding('utf8');
    socket.on('data', (chunk) => {
      buffer += chunk;
      const index = buffer.indexOf('\n');
      if (index < 0) return;
      const text = buffer.slice(0, index).replace(/\r$/, '');
      try {
        settle(JSON.parse(text));
      } catch {
        settle({ success: false, code: 'BAD_RESPONSE', reject: { message: 'The client returned an invalid response' } });
      }
    });
    socket.on('error', () => settle({ success: false, code: 'CHANNEL_ERROR', reject: { message: 'Connection to the running client failed' } }));
    socket.on('close', () => settle({ success: false, code: 'CHANNEL_ERROR', reject: { message: 'Connection to the running client closed' } }));

    socket.write(`${JSON.stringify({ type: AI_HARNESS_SKILL_READ_TYPE, payload: {} })}\n`);
  });
}

function exitProcess(reader, code) {
  if (reader.ended) {
    process.exit(code);
    return;
  }
  // stdin 未 EOF 时 Electron 的退出流程会卡在 fd 0 上，只能强杀，退出码也会因此非 0。
  // 成败信息已同步写到 stdout，调用方以输出判定结果（help 的 Notes 已说明）
  setTimeout(() => process.kill(process.pid, 'SIGKILL'), FORCE_EXIT_DELAY_MS);
}

// stdin 未 EOF 时 Electron 的退出流程会卡在 fd 0 上（app.exit / app.quit 均挂死），
// 因此这段时间内改为强杀；EOF 之后恢复原生行为，正常关闭的清理不被跳过。
function guardElectronExit(app, reader) {
  const originalExit = app.exit.bind(app);
  const originalQuit = app.quit.bind(app);
  const forceQuit = () => {
    setTimeout(() => process.kill(process.pid, 'SIGKILL'), FORCE_EXIT_DELAY_MS);
  };
  app.exit = (code) => (reader.ended ? originalExit(code) : forceQuit());
  app.quit = () => (reader.ended ? originalQuit() : forceQuit());
}

function applySkillResponse(response, target, reader) {
  // 响应来自另一个进程，可能是别的客户端版本，字段结构不可信
  if (typeof response !== 'object' || response === null) response = { success: false, code: 'BAD_RESPONSE', reject: { message: 'The client returned an invalid response' } };

  if (response.success !== true) {
    const code = typeof response.code === 'string' && response.code.length > 0 ? response.code : 'UNKNOWN';
    const message = typeof response.reject?.message === 'string' ? response.reject.message : '';

    if (code === 'LOGIN_REQUIRED') writeStderr(`error: LOGIN_REQUIRED: sign in to the Rabbix client first, then retry.${message ? ` ${message}` : ''}\n`);
    else writeStderr(`error: request rejected: code=${code} message=${message || '(none)'}\n`);
    exitProcess(reader, 1);
    return;
  }

  const content = response.data?.content;
  const version = response.data?.version;
  if (typeof content !== 'string' || typeof version !== 'number') {
    writeStderr('error: SKILL_READ response is missing data.content or data.version\n');
    exitProcess(reader, 1);
    return;
  }

  fs.mkdirSync(target.skillDir, { recursive: true });
  fs.writeFileSync(target.skillFile, content, 'utf8');
  writeStdout(`SKILL.md written to ${target.skillFile} (skill version ${version})`);
  exitProcess(reader, 0);
}

/**
 * init / update 命令：先本地校验路径，再通过 ai-harness 通道取 SKILL 文档。
 * 客户端已运行走命名管道；未运行则由本次进程作为主实例启动 Electron，
 * bootstrap 就绪后从 globalThis.__aiHarnessBridge 注入这一条请求。
 */
async function runSkillCommand({ app, cli }) {
  const reader = createLineReader();
  const mode = cli.kind === 'skill-init' ? 'init' : 'update';
  const target = validateSkillTarget(mode, cli.file);

  if (target.error) {
    writeStderr(`error: ${target.error}\n`);
    exitProcess(reader, 1);
    return 'exit';
  }

  const pipeName = getAiHarnessPipeName(app);
  const connection = await connectPipe(pipeName);

  if (connection) {
    const response = await requestSkillOverSocket(connection);
    applySkillResponse(response, target, reader);
    return 'exit';
  }

  let dispatch = null;

  const sendSkillRequest = () => {
    dispatch(JSON.stringify({ type: AI_HARNESS_SKILL_READ_TYPE, payload: {} }));
  };

  globalThis.__aiHarnessBridge = {
    setDispatch(callback) {
      dispatch = callback;
      sendSkillRequest();
    },
    writeLine(line) {
      let response;
      try {
        response = JSON.parse(line);
      } catch {
        response = { success: false, code: 'BAD_RESPONSE', reject: { message: 'The client returned an invalid response' } };
      }

      applySkillResponse(response, target, reader);
    },
  };

  guardElectronExit(app, reader);

  return 'primary';
}

/**
 * 返回 'primary' 表示本次进程应继续正常启动流程；'exit' / 'forwarded' 表示
 * 请求已处理完毕、进程正在退出，调用方不应再加载业务代码。
 */
export async function runAiHarnessCall({ app, cli }) {
  if (cli.kind === 'skill-init' || cli.kind === 'skill-update') return runSkillCommand({ app, cli });

  const socket = await connectPipe(getAiHarnessPipeName(app));
  if (socket) {
    await forward(socket);
    return 'forwarded';
  }

  const reader = createLineReader();
  globalThis.__aiHarnessBridge = {
    setDispatch(callback) {
      reader.setHandler(callback);
    },
    writeLine(line) {
      if (stdioBroken) return;
      try {
        process.stdout.write(line);
      } catch {
        stdioBroken = true;
      }
    },
  };

  guardElectronExit(app, reader);

  return 'primary';
}
