import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Minimal env guardrails for a workspace monorepo.

const nodeVersion = process.versions.node;
const [major] = nodeVersion.split('.').map((n) => Number(n));

const root = process.cwd();
const hasClientPkg = existsSync(join(root, 'client', 'package.json'));
const hasServerPkg = existsSync(join(root, 'server', 'package.json'));

if (!hasClientPkg || !hasServerPkg) {
  console.error(
    '\n[env] Похоже, вы запускаете команды НЕ из корня репозитория (где есть папки client/ и server/).\n' +
      '      Перейдите в папку collab-mvp-app и повторите.\n'
  );
  process.exit(1);
}

if (major < 18) {
  console.error(`\n[env] Node.js слишком старый: ${nodeVersion}. Нужно хотя бы Node 18, а лучше Node 20+.\n`);
  process.exit(1);
}

if (major < 20) {
  console.warn(
    `\n[env] Node.js ${nodeVersion}. Это может работать, но рекомендуем Node 20+ (особенно если будете обновлять Vite).\n`
  );
}

// Hard check: deps must exist in both workspaces.
const clientNodeModules = join(root, 'client', 'node_modules');
const serverNodeModules = join(root, 'server', 'node_modules');

if (!existsSync(clientNodeModules) || !existsSync(serverNodeModules)) {
  console.error(
    '\n[env] Не вижу установленных зависимостей для client/ или server/.\n' +
      '      Самый простой способ: выполнить `npm install` в корне проекта.\n' +
      '      (postinstall сам поставит зависимости в client/ и server/)\n\n' +
      '      Либо вручную:\n' +
      '        npm install --prefix server\n' +
      '        npm install --prefix client\n'
  );
  process.exit(1);
}
