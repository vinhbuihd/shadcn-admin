import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    DATABASE_URL_TEST: z.string().url().optional(),

    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().min(1).default('0.0.0.0'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),

    // Ngưỡng cho /auth/login và /auth/register, tính theo IP.
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    AUTH_RATE_LIMIT_WINDOW: z.string().min(1).default('15 minutes'),
})

export const env = envSchema.parse(process.env)

/**
 * Chọn database theo môi trường.
 *
 * Test suite xoá sạch mọi bảng ở `beforeEach`, nên khi NODE_ENV=test nó bắt buộc
 * phải chạy trên database riêng. Ở đây cố tình throw thay vì fallback về
 * DATABASE_URL: fallback âm thầm nghĩa là `yarn test` sẽ xoá database dev — hoặc
 * production, nếu .env đang tạm trỏ vào đó.
 */
export function resolveDatabaseUrl(): string {
    if (env.NODE_ENV !== 'test') {
        return env.DATABASE_URL
    }

    if (!env.DATABASE_URL_TEST) {
        throw new Error(
            'DATABASE_URL_TEST is required when NODE_ENV=test. ' +
            'Tests wipe every table, so they must run on a dedicated database.'
        )
    }

    if (env.DATABASE_URL_TEST === env.DATABASE_URL) {
        throw new Error(
            'DATABASE_URL_TEST must not be the same as DATABASE_URL. ' +
            'Tests wipe every table, so they must run on a dedicated database.'
        )
    }

    return env.DATABASE_URL_TEST
}
