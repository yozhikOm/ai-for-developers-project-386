import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";

import { healthRoutes } from "./routes/health.ts";

// Собирает экземпляр приложения.
// Выделено отдельно от точки входа, чтобы в тестах использовать app.inject()
// без поднятия реального порта.
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(healthRoutes, { prefix: "/api" });

  // В dev-режиме фронтенд обслуживает Vite, поэтому статики может не быть —
  // тогда плагин просто не регистрируем.
  const webDist = fileURLToPath(new URL("../../web/dist", import.meta.url));
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist });

    // SPA-fallback: всё, что не API и не файл, отдаём на index.html
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "Not Found" });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}
