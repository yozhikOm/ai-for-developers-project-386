import { describe, expect, it } from 'vitest'
import { buildApp } from './app.js'

describe('GET /api/health', () => {
  it('responds with 200 and status ok', async () => {
    const app = buildApp()

    const response = await app.inject({ method: 'GET', url: '/api/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
