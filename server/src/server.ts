import { sql } from "drizzle-orm";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { db, pool } from "./db/index.js";

const app = Fastify({
    logger: true,
});

app.addHook('onClose', async () => {
    await pool.end()
})

app.get("/health", () => {
    return { status: 'ok' }
})

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

async function start() {
    try {
        await app.listen({ port: env.PORT, host: env.HOST });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

start();

