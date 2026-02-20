# Сервис для коллабораций — MVP (full-stack)

Это **учебное MVP-приложение**: ЛК селлера, профиль, объявления (партнёрство / услуга / поставщик), поиск (главная строка + фильтры), заявки (двухшаговый match) и матчи.

## Документация
Смотри папку **docs/**:
- `docs/00_setup.md` — запуск и типовые ошибки
- `docs/00_scope.md` — MVP-скоуп
- `docs/00_architecture.md` — архитектура

## Что внутри
- **client/** — React + Vite (UI)
- **server/** — Node.js + Express + **JSON storage** (без SQLite и без native-модулей)
- **root** — скрипты запуска (работают даже если npm workspaces отключены в системе)

## Быстрый старт
### Требования
- Node.js: **рекомендуем 20+** (см. `.nvmrc`).

> Примечание про npm registry: в проекте лежит `.npmrc`, который принудительно ставит
> `registry=https://registry.npmjs.org/`. Это нужно, если в системе/корп‑сети у тебя
> был прописан внутренний registry и `npm install` падал по таймауту.

### Установка и запуск
Команды выполняй **из корня** `collab-mvp-app/`:

```bash
cd collab-mvp-app
npm install
npm run dev
```

> `npm install` в корне автоматически поставит зависимости в `server/` и `client/` (через `postinstall`).
> Если по какой-то причине это не сработало — можно вручную:
> 
> ```bash
> npm install --prefix server
> npm install --prefix client
> ```

Адреса:
- UI: http://localhost:5173
- API: http://localhost:5174

Если упрёшься в «белый экран» — смотри консоль браузера: чаще всего это рантайм‑ошибка React Router или отсутствующий `AuthProvider`. В этом архиве это исправлено.

## Демо-аккаунты
- demo1@collab.local / demo1234
- demo2@collab.local / demo1234
- demo3@collab.local / demo1234

## База данных
Данные хранятся тут:
- `server/data/db.json`

Сброс:
```bash
npm run reset:db
```
# collab_hub
