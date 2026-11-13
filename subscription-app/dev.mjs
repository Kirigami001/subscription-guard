import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const viteBin = resolve(__dirname, 'node_modules/vite/bin/vite.js');
const serverEntry = resolve(__dirname, 'server/index.js');

async function isBackendAlive() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/health', {
      signal: AbortSignal.timeout(400),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let serverProc = null;
if (await isBackendAlive()) {
  console.log('[SubTrack] Backend уже запущен на http://127.0.0.1:3001');
} else {
  serverProc = spawn(process.execPath, [serverEntry], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (serverProc.exitCode !== null) {
      process.exit(serverProc.exitCode || 1);
    }
    if (await isBackendAlive()) break;
    await new Promise((r) => setTimeout(r, 150));
  }
}

const viteProc = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], {
  cwd: __dirname,
  stdio: 'inherit',
});

function shutdown(signal) {
  if (viteProc && viteProc.exitCode === null) viteProc.kill(signal);
  if (serverProc && serverProc.exitCode === null) serverProc.kill(signal);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

if (serverProc) {
  serverProc.on('exit', (code) => {
    if (viteProc.exitCode === null) {
      viteProc.kill('SIGTERM');
    }
    if (code && code !== 0) process.exit(code);
  });
}

viteProc.on('exit', (code) => {
  if (serverProc && serverProc.exitCode === null) {
    serverProc.kill('SIGTERM');
  }
  process.exit(code ?? 0);
});
