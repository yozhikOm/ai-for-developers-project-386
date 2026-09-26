import { existsSync } from 'node:fs';
import path from 'node:path';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import healthRoutes from './routes/health.ts';

// Каталог собранного frontend (apps/web/dist).
// В dev-режиме его может не быть: тогда backend обслуживает только API,
// а статику отдаёт Vite dev server.
const webDistDir = path.resolve(import.meta.dirname, '../../web/dist');

// Фабрика приложения: собирает Fastify-инстанс со всеми маршрутами.
// Отделена от index.ts, чтобы тесты могли вызывать app.inject()
// без поднятия реального HTTP-порта.
export async function buildApp() {
  // Под тестами (Vitest выставляет NODE_ENV=test) логгер отключаем,
  // чтобы не засорять вывод; в остальных режимах — JSON-логи Pino
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  await app.register(healthRoutes);

  if (existsSync(webDistDir)) {
    await app.register(fastifyStatic, { root: webDistDir });

    // SPA-fallback: на неизвестные GET-маршруты (кроме /api) отдаём index.html.
    // Для неизвестных API-маршрутов — обычный JSON 404.
    app.setNotFoundHandler((request, reply) => {
      if (request.method !== 'GET' || request.url.startsWith('/api')) {
        reply.code(404).send({ error: 'Not Found' });
        return;
      }
      reply.sendFile('index.html');
    });
  }

  return app;
}
