import type { FastifyServerOptions } from 'fastify'
import { env } from './env.js'

const loggerByEnv: Record<typeof env.NODE_ENV, FastifyServerOptions['logger']> = {
    development: {
        level: 'debug',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
    test: false,
    production: {
        level: 'info',
    },
}

export const loggerConfig = loggerByEnv[env.NODE_ENV]
