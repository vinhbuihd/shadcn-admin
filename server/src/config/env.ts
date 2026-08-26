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
})

export const env = envSchema.parse(process.env)