import { spawn } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const serverDir = join(root, 'server');
const clientDir = join(root, 'client');

function npmCmd() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function run(label, cwd) {
  const child = spawn(npmCmd(), ['run', 'dev'], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${label}] exited with signal ${signal}`);
    } else if (code && code !== 0) {
      console.log(`[${label}] exited with code ${code}`);
      process.exit(code);
    }
  });
  return child;
}

const server = run('server', serverDir);
const client = run('client', clientDir);

function shutdown() {
  for (const p of [client, server]) {
    try {
      p.kill('SIGINT');
    } catch {}
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});
