import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import { sql } from 'drizzle-orm'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import { env } from './config/env.js'
import { db, pool } from './db/index.js'
import { authRoutes } from './routes/auth.js'
import { bookmarkRoutes } from './routes/bookmarks.js'
import { tagRoutes } from './routes/tags.js'


export function buildApp() {
    const app = Fastify({
        logger: true,
        trustProxy: true,
    })

    app.register(fastifyCors, {
        origin: env.FRONTEND_URL,
        credentials: true,
    })


    app.register(fastifyCookie)

    app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
        cookie: {
            cookieName: 'auth',
            signed: false,
        },
    })

    app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify()
        } catch (_error) {
            return reply.code(401).send({
                message: 'Unauthorized',
            })
        }
    })


    app.register(authRoutes, {
        prefix: '/api',
    })

    app.register(tagRoutes, {
        prefix: '/api',
    })
    app.register(bookmarkRoutes, {
        prefix: '/api',
    })

    // onClose
    app.addHook('onClose', async () => {
        await pool.end()
    })

    // GET /health
    app.get("/health", () => {
        return { status: 'ok' }
    })

    // GET /health/db
    app.get("/health/db", async (_request, reply) => {
        try {
            await db.execute(sql`SELECT 1`)
            return {
                "status": "ok",
                "database": "connected"
            }
        } catch (error) {
            app.log.error(error)
            return reply.code(503).send({
                status: 'error',
                database: 'disconnected',
            })
        }
    })



    return app
}
