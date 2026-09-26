import Fastify from 'fastify';
import healthRoutes from './routes/health.ts';

// Фабрика приложения: собирает Fastify-инстанс со всеми маршрутами.
// Отделена от index.ts, чтобы тесты могли вызывать app.inject()
// без поднятия реального HTTP-порта.
export async function buildApp() {
  // Под тестами (Vitest выставляет NODE_ENV=test) логгер отключаем,
  // чтобы не засорять вывод; в остальных режимах — JSON-логи Pino
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  await app.register(healthRoutes);

  return app;
}
