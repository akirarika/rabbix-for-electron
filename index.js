import * as electron from 'electron';
import net from 'net';
import { createWriteStream, mkdirSync, writeSync } from 'fs';
import { join } from 'path';
import { AI_HARNESS_HELP, parseAiHarnessCli, runAiHarnessCall } from './ai-harness.js';

globalThis.electron = electron;

const cli = parseAiHarnessCli(process.argv);

// 帮助不依赖客户端与登录态，必须在创建日志文件、判定角色之前处理
if (cli.kind === 'help') {
  // 输出管道已断开时帮助文本写不出去，调用方也没法看到结果，按正常退出即可
  try {
    writeSync(1, AI_HARNESS_HELP);
  } catch {}
  process.exit(0);
}

const aiHarness = cli.kind !== 'none';

// 生产包不支持命令行传入 --remote-debugging-port：先移除该开关，杜绝用户绕过 CDP_ENABLE 私自开启调试端口。
// 生产包调试端口固定为 9224，默认关闭，仅当显式设置 CDP_ENABLE=1 时才开启，供本机长时间挂机排查使用。
// 正常用户永远不会设置该变量，因此不构成攻击面。
// 开发环境（未打包）保持 9223，且不拦截命令行传入的端口，供 e2e 使用随机端口。
if (electron.app.isPackaged) {
  electron.app.commandLine.removeSwitch('remote-debugging-port');
  if (process.env.CDP_ENABLE === '1') electron.app.commandLine.appendSwitch('remote-debugging-port', '9224');
} else {
  electron.app.commandLine.appendSwitch('remote-debugging-port', '9223');
}

const logDir = join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Public', 'AppData', 'Local', 'Temp', 'kecream-debug');
try {
  mkdirSync(logDir, { recursive: true });
} catch {}
const logPath = join(logDir, 'electron-main.log');
const logStream = createWriteStream(logPath, { flags: 'w' });

const origLog = console.log;
const origError = console.error;

function ts() {
  return new Date().toISOString();
}

console.log = (...args) => {
  // --ai-harness 时 stdout 是交给调用方的协议通道，日志只能走 stderr 与文件
  if (aiHarness) origError(...args);
  else origLog(...args);
  try {
    logStream.write(`[${ts()}] LOG ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}\n`);
  } catch {}
};
console.error = (...args) => {
  origError(...args);
  try {
    logStream.write(`[${ts()}] ERR ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}\n`);
  } catch {}
};

console.log(`[main] Log file: ${logPath}`);

// 带 ai-harness 相关参数时先判定角色：客户端已在运行则只转发并等待结果，不等同于再启动一个客户端；
// init / update 命令在角色判定或启动主实例后自行结束进程
let continueStartup = true;
if (aiHarness) {
  const role = await runAiHarnessCall({ app: electron.app, cli });
  if (role !== 'primary') continueStartup = false;
}

if (continueStartup) {
  const portArray = new Uint32Array(1);
  crypto.getRandomValues(portArray);
  globalThis.electronPort = (portArray[0] % 40001) + 10000;

  const tokenChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const tokenArray = new Uint8Array(96);
  crypto.getRandomValues(tokenArray);
  globalThis.electronToken = Array.from(tokenArray, (b) => tokenChars[b % tokenChars.length]).join('');

  while (
    !(await new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(globalThis.electronPort);
    }))
  ) {
    globalThis.electronPort = globalThis.electronPort >= 50000 ? 10000 : globalThis.electronPort + 1;
  }

  console.log(`[main] Electron port: ${globalThis.electronPort}`);
  console.log(`[main] Electron token: ${globalThis.electronToken}`);
  // 允许渲染进程（https://app.kecream.cn）访问 http://localhost 动态端口通信，替代 webSecurity: false
  electron.app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', `http://localhost:${globalThis.electronPort}`);
  console.log(`[main] Mixed content bypass: http://localhost:${globalThis.electronPort}`);

  await import('./src/index.js');
}
