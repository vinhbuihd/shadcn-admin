import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyRateLimit from '@fastify/rate-limit'
import { sql } from 'drizzle-orm'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import { env } from './config/env.js'
import { loggerConfig } from './config/logger.js'
import { db, pool } from './db/index.js'
import { errorHandler } from './lib/error-handler.js'
import { authRoutes, type AuthRateLimit } from './routes/auth.js'
import { bookmarkRoutes } from './routes/bookmarks.js'
import { tagRoutes } from './routes/tags.js'

export type BuildAppOptions = {
    /**
     * Cho phép test truyền ngưỡng thấp để kiểm chứng rate limit mà không phải bắn
     * hàng nghìn request. Không truyền thì lấy từ biến môi trường.
     */
    authRateLimit?: AuthRateLimit
}

export function buildApp(options: BuildAppOptions = {}) {
    const app = Fastify({
        logger: loggerConfig,
        trustProxy: true,
    })

    const authRateLimit: AuthRateLimit = options.authRateLimit ?? {
        max: env.AUTH_RATE_LIMIT_MAX,
        timeWindow: env.AUTH_RATE_LIMIT_WINDOW,
    }

    app.register(fastifyCors, {
        origin: env.FRONTEND_URL,
        credentials: true,
        // Không khai báo thì trình duyệt giấu header này khỏi JS ở kịch bản
        // cross-origin, và frontend mất thông tin "chờ bao lâu" khi bị 429.
        exposedHeaders: ['retry-after'],
    })


    app.register(fastifyCookie)

    app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
        cookie: {
            cookieName: 'auth',
            signed: false,
        },
    })

    /**
     * `global: false` — chỉ route nào tự khai báo `config.rateLimit` mới bị giới hạn.
     * Bộ đếm mặc định theo `request.ip`, mà app đang bật `trustProxy` nên đó là IP thật
     * của client lấy từ `X-Forwarded-For`, không phải IP của Vercel/Render.
     *
     * Store nằm trong bộ nhớ tiến trình: đúng với hiện tại (Render free, một instance).
     * Khi nào chạy từ hai instance trở lên thì mỗi instance đếm riêng, ngưỡng thực tế
     * nhân đôi — lúc đó mới cần store dùng chung như Redis.
     */
    app.register(fastifyRateLimit, {
        global: false,
    })

    app.setErrorHandler(errorHandler)

    app.setNotFoundHandler((_request, reply) => {
        return reply.code(404).send({ message: 'Route not found' })
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
        authRateLimit,
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
