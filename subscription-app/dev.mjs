import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const viteBin = resolve(__dirname, 'node_modules/vite/bin/vite.js');
const serverEntry = resolve(__dirname, 'server/index.js');

async function checkExistingBackend() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/health', {
      signal: AbortSignal.timeout(400),
    });
    if (!res.ok) return { alive: false };
    const data = await res.json().catch(() => ({}));
    return { alive: true, data };
  } catch {
    return { alive: false };
  }
}

async function isPort5173Busy() {
  try {
    await fetch('http://127.0.0.1:5173/', { signal: AbortSignal.timeout(300) });
    return true;
  } catch {
    return false;
  }
}

const existingBackend = await checkExistingBackend();
let serverProc = null;
if (existingBackend.alive) {
  if (!existingBackend.data?.seedSupport) {
    console.error(
      '[SubTrack] ОШИБКА: на порту 3001 уже запущена СТАРАЯ версия backend-сервера!'
    );
    console.error(
      '[SubTrack] Закройте старый терминал (или остановите старый процесс node) и снова запустите npm run dev.'
    );
    process.exit(1);
  }
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
    const check = await checkExistingBackend();
    if (check.alive) break;
    await new Promise((r) => setTimeout(r, 150));
  }
}

const hasCustomPort = process.argv.includes('--port') || process.argv.includes('-p');
if (!hasCustomPort && (await isPort5173Busy())) {
  console.warn(
    '[SubTrack] ВНИМАНИЕ: порт 5173 уже занят другим запущенным сервером! Откройте новый порт, который Vite покажет ниже, или закройте старый терминал.'
  );
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
