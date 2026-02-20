# Stage 0 — Setup (как запускать проект)

## Требования
- Node.js: **рекомендуем 20+** (см. `.nvmrc`).
- npm: любой современный (обычно вместе с Node).

## Структура репозитория
Проект — **monorepo** (server + client). Запуск сделан так, чтобы работать даже если
в твоей системе/настройках npm **workspaces отключены**.
- `server/` — Express + JSON storage (`server/data/db.json`)
- `client/` — React + Vite
- корень — orchestration скрипты (`npm run dev` запускает оба процесса)

## Быстрый старт
Всегда выполняй команды **из корня** `collab-mvp-app/`.

1) Установка зависимостей:

```bash
cd collab-mvp-app
npm install
```

`npm install` в корне автоматически ставит зависимости в `server/` и `client/` (через `postinstall`).
Если хочешь поставить вручную (или `postinstall` пропустился):

```bash
npm install --prefix server
npm install --prefix client
```

2) Запуск dev (сервер + клиент):

```bash
npm run dev
```

Адреса:
- UI: http://localhost:5173
- API: http://localhost:5174

## Полезные команды
Запуск по отдельности (если хочешь два терминала):

```bash
npm run dev:server
npm run dev:client
```

Сброс базы (удаляет `server/data/db.json`):

```bash
npm run reset:db
```

## Частые ошибки
### Белый экран (UI пустой)
Чаще всего это рантайм‑ошибка, которую видно в **Console** DevTools браузера.
В этом проекте UI требует, чтобы `Routes` были внутри `BrowserRouter`, а `useAuth()` — внутри `AuthProvider`.
Если эти обёртки убрать, будет белый экран.

Проверка:
- открой DevTools → Console
- если видишь ошибку вида `useRoutes() may be used only in the context of a <Router>` или `AuthProvider is missing` — значит сломались обёртки.

### `npm ERR! code ETIMEDOUT` и странный registry/URL в ошибке
Если в ошибке видишь не `registry.npmjs.org`, а какой-то внутренний registry (Artifactory), значит у тебя:

- либо npm сконфигурирован на другой registry через `~/.npmrc` / global config / env,
- либо `package-lock.json` содержит `resolved` URL на внутренний registry.

В этом репозитории уже лежит **root `.npmrc`** с `registry=https://registry.npmjs.org/`.
Обычно этого достаточно, чтобы проект ставился и запускался без правок глобальных настроек.

Фикс (без магии):
1) Удалить `package-lock.json` и поставить заново.
2) Убедиться, что `npm config get registry` показывает `https://registry.npmjs.org/`.
