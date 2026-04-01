import * as electron from 'electron';
import net from 'net';

globalThis.electron = electron;

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

// Import the app code
await import('./src/index.js');
