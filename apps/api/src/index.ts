import { buildApp } from './app.ts';

// Точка входа: поднимает HTTP-сервер.
// Порт и хост берутся из окружения; 0.0.0.0 нужен для работы внутри Docker-контейнера.
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

const app = await buildApp();

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
