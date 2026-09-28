import type { FastifyInstance } from "fastify";

// Роуты служебных проверок состояния сервиса
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));
}
