import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.js'

describe('Health checks', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = buildApp()
    })

    afterAll(async () => {
        await app.close()
    })

    it('GET /health should return 200 ok', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health',
        })
        expect(response.statusCode).toBe(200)
        expect(JSON.parse(response.payload)).toEqual({ status: 'ok' })
    })

    it('GET /health/db should return 200 if db connected', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health/db',
        })
        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.payload)
        expect(body.status).toBe('ok')
        expect(body.database).toBe('connected')
    })
})
