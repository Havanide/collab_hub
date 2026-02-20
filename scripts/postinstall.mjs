import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const clientDir = join(root, 'client');
const serverDir = join(root, 'server');

function npmCmd() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function runInstall(where) {
  const pkg = join(where, 'package.json');
  if (!existsSync(pkg)) return;

  const nodeModules = join(where, 'node_modules');
  // If node_modules exists, don't force reinstall — keep installs fast.
  if (existsSync(nodeModules)) return;

  // Force dev deps too (vite/nodemon are devDeps) even if user's npm config omits them.
  const res = spawnSync(npmCmd(), ['install', '--include=dev', '--no-audit', '--no-fund'], {
    cwd: where,
    stdio: 'inherit',
    env: process.env
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

// Install workspace deps even if npm workspaces are disabled in user's config.
runInstall(serverDir);
runInstall(clientDir);
