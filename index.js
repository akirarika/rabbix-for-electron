import * as electron from 'electron';
import net from 'net';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';

globalThis.electron = electron;

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
  origLog(...args);
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
