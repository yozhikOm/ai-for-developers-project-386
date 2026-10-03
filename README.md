# Календарь звонков


[![hexlet-check](https://github.com/yozhikOm/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/yozhikOm/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- Node.js 24, TypeScript, npm workspaces
- Backend: Fastify 5 (нативный запуск TypeScript без компиляции)
- Frontend: React 19, Vite
- Тесты: Vitest (+ React Testing Library), smoke test
- Линт: ESLint 10 (flat config)
- CI: GitHub Actions; Docker (multi-stage)

## Установка

Требования: Node.js 24+ (см. `.nvmrc`), npm 11.

```bash
git clone https://github.com/yozhikOm/ai-for-developers-project-386.git
cd ai-for-developers-project-386
npm install
```

Переменные окружения — по необходимости: скопируйте `.env.example` в `.env`
(порт, имя и часовой пояс владельца календаря; у всех есть значения по умолчанию).

## Использование

```bash
# Dev-режим (два терминала)
npm run dev:api        # backend: http://localhost:3000
npm run dev:web        # frontend: http://localhost:5173 (прокси /api → 3000)

# Prod-режим (один процесс, порт 3000)
npm run build
npm start

# Контракт API (contract/) → OpenAPI, SDK для frontend, артефакты для backend
npm run generate

# Проверки
npm run check          # lint + typecheck + тесты
npm run smoke          # smoke test запущенного приложения (после npm run build)

# Docker
npm run docker:build   # сборка образа call-calendar
npm run docker:run     # запуск на http://localhost:3000
```

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
