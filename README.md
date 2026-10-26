# AI Zastroichik — единый проект (веб + Android)

Агрегатор объявлений о недвижимости (М2.ru, Циан, Дом.РФ, ДомКлик) с чат-поиском на естественном языке.

## 🌐 Прод

- Сайт: **https://findhome-zeta.vercel.app**
- GitHub: **https://github.com/rmnzhyk09-png/find_home**
- Vercel-проект: `find_home` (аккаунт `rmnzhyk09-png`), Source = `web/`

## LLM

Чат работает через **OpenRouter, только бесплатные модели** (`OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free`, фоллбэки в `web/api/_lib/llm.js`). Без ключа — regex-NLP фоллбэк. Env: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.

## Структура

- `web/` — **объединённое веб-приложение** (React + TypeScript + Vite + Tailwind + zustand + react-query; ранее это был vanilla-фронт + Express-бэк `KvartiraPro`). Деплой: Vercel, Root Directory = `web`.
  - `src/` — React-приложение (Vite entry: `index.html`).
  - `api/` — Vercel serverless-функции:
    - `GET /api/parse?city=&rooms=&minPrice=&maxPrice=` — оригинальный роут (проверяйте `res used` своей интеграции), формат ответа `{items, sources, count, filters, fetchedAt, cached}`.
    - `GET /api/search` — то же, но расширенные фильтры (`minArea`, `maxArea`, `district`, `keywords`).
    - `POST /api/chat` — NLP-парсер сообщения (`двушка до 5 млн в центре, рядом школа`), расширен словарём из legacy (`нск/мск/спб/екб`, «не в центре», инфраструктура: метро/школа/парк...).
    - `GET /api/sources`, `GET /api/health`.
  - `api/_lib/parser.js` — единая библиотека парсеров (Все api-роуты импортируют отсюда).
  - `legacy/` — старый vanilla-фронт (index.html + js/app.js + css), сохранён для истории и как справочник словаря NLP.
  - Локально: `npm i && npm run dev` (Vite на :3000; API через `vercel dev`). Сборка: `npm run build` → `dist/`.
  - Env (опционально): см. `web/.env.example`.
- `android/` — Android-приложение (Kotlin + Compose): роль-плей локальный парсер, каталог 2-му с builder flow, избранное, история, SQLite-база, ViewModel архитектура.
  - Сборка: `gradlew.bat :app:assembleDebug` (JDK 17+, Android SDK).
