import argon2 from "argon2";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { NotFoundError, UnauthorizedError } from "../lib/errors.js";
import { parseOrThrow } from "../lib/validate.js";


const registerBodySchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().email().toLowerCase(),
    password: z.string().min(8).max(100),
})

const loginBodySchema = z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(8).max(100),
})

const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
}

const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export type AuthRateLimit = {
    max: number
    timeWindow: string | number
}

type AuthRoutesOptions = {
    authRateLimit: AuthRateLimit
}

export async function authRoutes(app: FastifyInstance, options: AuthRoutesOptions) {
    /**
     * Chỉ giới hạn hai endpoint này: chúng là cửa duy nhất mở cho người chưa xác thực,
     * cũng là nơi hứng brute force mật khẩu và spam tạo tài khoản.
     *
     * Mỗi route có bộ đếm riêng, nên đăng nhập bị chặn không kéo theo đăng ký.
     */
    const rateLimited = { config: { rateLimit: options.authRateLimit } }

    // POST /api/auth/register
    app.post('/auth/register', rateLimited, async (request, reply) => {
        const { email, name, password } = parseOrThrow(registerBodySchema, request.body)

        const passwordHash = await argon2.hash(password)

        // Trùng email sẽ ném lỗi Postgres 23505; error handler đọc tên constraint
        // `users_email_unique` rồi trả 409 kèm thông báo tương ứng.
        const createdUsers = await db.insert(users).values({
            email, name, passwordHash
        }).returning({
            id: users.id,
            email: users.email,
            name: users.name,
            createdAt: users.createdAt,
        })

        const user = createdUsers[0]
        if (!user) {
            throw new Error('User was not created')
        }

        const token = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' })

        reply.setCookie('auth', token, {
            ...cookieOptions,
            maxAge: TOKEN_MAX_AGE_SECONDS,
        })

        return reply.code(201).send({
            message: 'User registered successfully',
            data: user,
        })
    })

    // POST /api/auth/login
    app.post('/auth/login', rateLimited, async (request, reply) => {
        const { email, password } = parseOrThrow(loginBodySchema, request.body)

        const foundUsers = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            passwordHash: users.passwordHash,
        }).from(users).where(eq(users.email, email)).limit(1)

        const user = foundUsers[0]

        // Cùng một thông báo cho "email không tồn tại" và "sai mật khẩu",
        // tránh để người ngoài dò ra email nào đã đăng ký.
        if (!user) {
            throw new UnauthorizedError('Invalid email or password')
        }

        const isPasswordValid = await argon2.verify(user.passwordHash, password)
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password')
        }

        const token = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' })

        reply.setCookie('auth', token, {
            ...cookieOptions,
            maxAge: TOKEN_MAX_AGE_SECONDS,
        })

        return reply.code(200).send({
            message: 'Login successful',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        })
    })

    // GET /api/auth/me
    app.get('/auth/me', { preHandler: [app.authenticate] }, async (request) => {
        const foundUsers = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
        }).from(users).where(eq(users.id, request.user.userId)).limit(1)

        const user = foundUsers[0]
        if (!user) {
            throw new NotFoundError('User not found')
        }

        return { data: user }
    })

    // POST /api/auth/logout
    app.post('/auth/logout', { preHandler: [app.authenticate] }, async (_request, reply) => {
        reply.clearCookie('auth', cookieOptions)

        return reply.code(200).send({
            message: 'Logout successful',
        })
    })
}
