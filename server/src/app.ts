import { sql } from 'drizzle-orm'
import Fastify from 'fastify'
import { db, pool } from './db/index.js'
import { bookmarkRoutes } from './routes/bookmarks.js'
import { tagRoutes } from './routes/tags.js'

export function buildApp() {
    const app = Fastify({
        logger: true,
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
