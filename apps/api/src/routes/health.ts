import type { FastifyInstance } from 'fastify';

// Health-check: используется smoke-тестом и Docker HEALTHCHECK
export default async function healthRoutes(app: FastifyInstance) {
  app.get('/api/health', async () => ({ status: 'ok' }));
}
