import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'node:path'
import { Pool } from 'pg'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Chạy một lần trước toàn bộ test suite: đảm bảo database test có schema mới nhất.
 *
 * NODE_ENV được gán ở đây thay vì dựa vào `test.env` của Vitest, vì globalSetup chạy
 * trong process chính của Vitest chứ không phải trong worker. Và vì `import` của ESM
 * luôn được nạp trước mọi câu lệnh, config/env.js phải nạp bằng dynamic import SAU khi
 * NODE_ENV đã được gán — nếu không nó sẽ đọc nhầm sang database dev.
 */
export default async function globalSetup() {
    process.env.NODE_ENV = 'test'

    const { resolveDatabaseUrl } = await import('../config/env.js')
    const pool = new Pool({ connectionString: resolveDatabaseUrl() })

    try {
        await migrate(drizzle(pool), {
            migrationsFolder: path.join(__dirname, '../../drizzle'),
        })
    } finally {
        await pool.end()
    }
}
