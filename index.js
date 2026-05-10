import * as electron from 'electron';
import net from 'net';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

globalThis.electron = electron;

electron.app.commandLine.appendSwitch('remote-debugging-port', '9222');
// 允许渲染进程（https://app.kecream.cn）访问 http://localhost 通信，替代 webSecurity: false
electron.app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'http://localhost');

const logDir = join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Public', 'AppData', 'Local', 'Temp', 'kecream-debug');
try { mkdirSync(logDir, { recursive: true }); } catch {}
const logPath = join(logDir, 'electron-main.log');
const logStream = createWriteStream(logPath, { flags: 'w' });

const origLog = console.log;
const origError = console.error;

function ts() { return new Date().toISOString(); }

console.log = (...args) => {
  origLog(...args);
  try { logStream.write(`[${ts()}] LOG ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}\n`); } catch {}
};
console.error = (...args) => {
  origError(...args);
  try { logStream.write(`[${ts()}] ERR ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}\n`); } catch {}
};

console.log(`[main] Log file: ${logPath}`);

const portArray = new Uint32Array(1);
crypto.getRandomValues(portArray);
globalThis.electronPort = (portArray[0] % 40001) + 10000;

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

await import('./src/index.js');
