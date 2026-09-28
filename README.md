# Календарь звонков

[![hexlet-check](https://github.com/yozhikOm/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/yozhikOm/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- **Frontend**: React 19, TypeScript, Vite 8 (`apps/web`)
- **Backend**: Fastify 5, TypeScript, Node.js 24 (`apps/api`)
- **Тесты**: Vitest (integration через `app.inject`) + smoke test запущенного приложения
- **Качество кода**: ESLint 10 (flat config) + typescript-eslint, Prettier
- **CI/CD**: GitHub Actions (lint, format, typecheck, test, build, smoke, Docker)
- **Контейнеризация**: Docker (multi-stage, `node:24-alpine`)

Монорепозиторий на npm workspaces: `apps/api` — HTTP API и раздача статики,
`apps/web` — SPA. В production один процесс Node обслуживает и API (`/api/*`),
и фронтенд.

## Требования

- Node.js >= 24 (см. `.nvmrc`)
- Для запуска в контейнере — Docker

## Установка

```bash
git clone https://github.com/yozhikOm/ai-for-developers-project-386.git
cd ai-for-developers-project-386
npm install
```

## Использование

### Разработка

```bash
npm run dev
```

Поднимает API на http://localhost:3000 и Vite dev-сервер на
http://localhost:5173 (запросы `/api/*` проксируются на API).

### Production

```bash
npm run build   # сборка web (apps/web/dist) и api (apps/api/dist)
npm start       # http://localhost:3000
```

### Проверки

```bash
npm test              # тесты (Vitest)
npm run lint          # ESLint
npm run typecheck     # проверка типов TypeScript
npm run format:check  # проверка форматирования Prettier
npm run smoke         # smoke test production-сборки (нужен предварительный build)
npm run ci            # вся цепочка проверок целиком
```

### Docker

```bash
docker build -t call-calendar .
docker run -d -p 3000:3000 call-calendar
# проверка: curl http://localhost:3000/api/health
```

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
