import { existsSync, rmSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const dbPath = join(process.cwd(), 'server', 'data', 'db.json');
const uploadsDir = join(process.cwd(), 'server', 'data', 'uploads');

if (existsSync(dbPath)) {
  rmSync(dbPath);
  console.log(`[db] Удалил ${dbPath}.`);
} else {
  console.log('[db] Файл базы не найден.');
}

if (existsSync(uploadsDir)) {
  for (const f of readdirSync(uploadsDir)) {
    try { unlinkSync(join(uploadsDir, f)); } catch {}
  }
  console.log('[uploads] Очистил server/data/uploads');
}

console.log('Перезапусти сервер/`npm run dev` — база и демо-данные создадутся заново.');
