import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { healthRoutes } from './routes/health.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.resolve(__dirname, '../../frontend/dist')

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(healthRoutes, { prefix: '/api' })

  // frontend/dist only exists after `npm run build`; skip static serving
  // (e.g. in backend-only unit tests) so its absence isn't a startup error.
  if (existsSync(frontendDist)) {
    app.register(fastifyStatic, { root: frontendDist })
  }

  return app
}
