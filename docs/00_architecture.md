# Stage 0 — Architecture overview

## Репозиторий (monorepo)
Корень использует **npm workspaces** и скрипты запускает из корня.

```
collab-mvp-app/
  client/        # React + Vite
  server/        # Node + Express (JSON storage)
  docs/
  scripts/
  package.json   # workspaces + scripts
```

## Клиент (`client/`)
- React + React Router
- API calls идут на `http://localhost:5174/api/...` (dev)
- Vite dev server: `http://localhost:5173`

## Сервер (`server/`)
- Express приложение
- Хранилище: **JSON-файл** `server/data/db.json` (без SQLite и без native-модулей)
- API порт: `5174`

## Основные потоки данных
1) UI запрашивает карточки (search) → сервер отдаёт публичные поля.
2) Профиль содержит публичную и скрытую часть.
3) Скрытая часть раскрывается **только при активном Match** (проверка на сервере).

## Конвенции
- Все команды запускаем из корня.
- После каждого stage обновляем `docs/` и фиксируем, что изменилось и как это тестировать.
