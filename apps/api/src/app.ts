import Fastify from 'fastify';
import healthRoutes from './routes/health.ts';

// Фабрика приложения: собирает Fastify-инстанс со всеми маршрутами.
// Отделена от index.ts, чтобы тесты могли вызывать app.inject()
// без поднятия реального HTTP-порта.
export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(healthRoutes);

  return app;
}
