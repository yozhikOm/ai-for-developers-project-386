# AGENTS.md

Инструкции для ИИ-агентов, работающих с этим репозиторием.

## О проекте

«Календарь звонков» — full-stack сервис бронирования календаря (учебный проект
Хекслета). Разработка ведётся преимущественно через ИИ-агента. Бизнес-функциональность
добавляется по тикетам поверх каркаса.

## Структура

Монорепозиторий (npm workspaces):

- `apps/api` — backend: Fastify 5, TypeScript, нативный type stripping Node 24
  (без шага компиляции). `src/app.ts` — фабрика `buildApp()` (маршруты, статика),
  `src/index.ts` — точка входа (listen). Новые маршруты — новые файлы в `src/routes/`.
- `apps/web` — frontend: React 19, TypeScript, Vite. В dev-режиме proxy `/api` →
  `localhost:3000`.
- `scripts/smoke.mjs` — smoke test на чистом Node, без зависимостей.
- `vitest.config.ts` (корень) — единый запуск тестов, `projects: ['apps/*']`;
  окружение каждый пакет описывает в своём конфиге.
- `eslint.config.mjs` (корень) — единый ESLint 10 flat config.
- `Dockerfile` — multi-stage образ: backend раздаёт API и собранную статику frontend.

## Команды

| Команда | Назначение |
| --- | --- |
| `npm run dev:api` / `npm run dev:web` | dev-режим (два терминала; web на 5173, api на 3000) |
| `npm run check` | lint + typecheck + тесты. **Запускать обязательно перед завершением любой задачи** |
| `npm run build` | сборка frontend в `apps/web/dist` |
| `npm start` | prod-режим: один процесс, порт 3000 (API + статика) |
| `npm run smoke` | smoke test запущенного приложения (требует предварительный `npm run build`) |
| `npm run docker:build` / `npm run docker:run` | сборка и запуск Docker-образа |

## Правила для backend (важно: нативный type stripping)

Backend запускается Node.js 24 напрямую из `.ts`-исходников, без компиляции.
Поэтому в `apps/api`:

- только «стираемый» синтаксис TypeScript: **нельзя** `enum`, namespaces,
  parameter properties (`constructor(private x)`), декораторы;
- в относительных импортах всегда указывать расширение `.ts`:
  `import { x } from './y.ts'`;
- типы импортировать через `import type ...`;
- страховка: tsconfig содержит `erasableSyntaxOnly` + `verbatimModuleSyntax`,
  поэтому `npm run typecheck` (и CI) упадёт при нарушении этих правил.

## Стиль и процесс

- TypeScript в strict-режиме; комментарии в коде — на русском.
- Тесты: backend — через `app.inject()` (без поднятия порта), frontend —
  React Testing Library (jsdom).
- Минимальные изменения; новые зависимости — только при явной необходимости.
- Фоновые серверы после проверок останавливать (Windows: `taskkill //PID <pid> //F`),
  не оставлять зомби-процессы.

## Ограничения

- `.github/workflows/hexlet-check.yml` — **не изменять и не удалять**.
- `.env` не коммитить; шаблон переменных — `.env.example`.
- CI живёт в `.github/workflows/ci.yml` (lint, typecheck, тесты, build, smoke, Docker).
