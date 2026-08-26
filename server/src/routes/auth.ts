import argon2 from "argon2";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { hasPostgresErrorCode } from "../lib/postgres-errors.js";


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



export async function authRoutes(app: FastifyInstance) {
    // POST /api/auth/register
    app.post('/auth/register', async (request, reply) => {
        // 1. Validate request body
        const bodyResult = registerBodySchema.safeParse(request.body);
        if (!bodyResult.success) {
            return reply.code(400).send({
                status: 'error',
                message: 'Invalid request body',
            })
        }

        const { email, name, password } = bodyResult.data
        try {
            // 2. Hash password bằng argon2
            const passwordHash = await argon2.hash(password)
            // 3. Insert vào database
            const createdUser = await db.insert(users).values({
                email, name, passwordHash
            }).returning({
                id: users.id,
                email: users.email,
                name: users.name,
                createdAt: users.createdAt,
            })

            const user = createdUser[0]
            if (!user) {
                throw new Error('User was not created')
            }
            // 4. Tạo JWT token
            const token = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' })

            // 5. Set cookie và return response
            reply.setCookie('auth', token, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60,
            })

            return reply.code(201).send({
                message: 'User registered successfully',
                data: user,
            })
        } catch (error) {
            // 6. Handle duplicate email
            if (hasPostgresErrorCode(error, '23505')) {
                return reply.code(409).send({
                    message: 'Email already exists',
                })
            }

            request.log.error(error)
            return reply.code(500).send({
                message: 'Internal server error',
            })
        }
    })

    app.post('/auth/login', async (request, reply) => {
        // 1. Validate request body
        const bodyResult = loginBodySchema.safeParse(request.body);
        if (!bodyResult.success) {
            return reply.code(400).send({
                status: 'error',
                message: 'Invalid request body',
            })
        }

        const { email, password } = bodyResult.data

        try {
            // 2. Tìm user theo email
            const foundUsers = await db.select({
                id: users.id,
                email: users.email,
                name: users.name,
                passwordHash: users.passwordHash,
            }).from(users).where(eq(users.email, email)).limit(1)

            const user = foundUsers[0]
            // 3. Không tiết lộ "email không tồn tại" hay "sai mật khẩu" riêng biệt
            if (!user) {
                return reply.code(401).send({
                    message: 'Invalid email or password',
                })
            }

            // 4. Verify password
            const isPasswordValid = await argon2.verify(user.passwordHash, password)
            if (!isPasswordValid) {
                return reply.code(401).send({
                    message: 'Invalid email or password',
                })
            }

            // 5. Tạo JWT token
            const token = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' })

            // 6. Set cookie
            reply.setCookie('auth', token, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60,
            })


            return reply.code(200).send({
                message: 'Login successful',
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            })
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({
                message: 'Internal server error',
            })
        }


    })

    app.get('/auth/me', { preHandler: [app.authenticate] }, async (request, reply) => {
        const userId = request.user.userId
        try {
            const foundUsers = await db.select({
                id: users.id,
                email: users.email,
                name: users.name,
            }).from(users).where(eq(users.id, userId)).limit(1)

            const user = foundUsers[0]
            if (!user) {
                return reply.code(404).send({
                    message: 'User not found',
                })
            }

            return {
                data: user,
            }
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({
                message: 'Internal server error',
            })
        }
    })

    app.post('/auth/logout', { preHandler: [app.authenticate] }, async (request, reply) => {
        reply.clearCookie('auth', cookieOptions)


        return reply.code(200).send({
            message: 'Logout successful',
        })
    })
}
