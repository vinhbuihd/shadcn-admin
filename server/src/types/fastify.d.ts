import type { preHandlerHookHandler } from 'fastify'

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: preHandlerHookHandler
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { userId: string }
        user: { userId: string }
    }
}
