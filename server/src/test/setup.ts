import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'path'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'
import { env } from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function setupTestDb() {
    const databaseUrl = process.env.NODE_ENV === 'test'
        ? env.DATABASE_URL_TEST || env.DATABASE_URL
        : env.DATABASE_URL

    const pool = new Pool({ connectionString: databaseUrl })
    const db = drizzle(pool)

    // Run migration
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') })

    return { db, pool }
}

export async function cleanupTestDb(pool: Pool) {
    await pool.end()
}
