import 'dotenv/config'
import { Client } from 'pg'

const testUrl = process.env.DATABASE_URL_TEST

if (!testUrl) {
    console.error('DATABASE_URL_TEST is required')
    process.exit(1)
}

// Không thể CREATE DATABASE từ bên trong chính database đó, nên nối vào `postgres`
// (database quản trị luôn tồn tại) rồi mới tạo.
const adminUrl = new URL(testUrl)
const databaseName = adminUrl.pathname.slice(1)
adminUrl.pathname = '/postgres'

const client = new Client({ connectionString: adminUrl.toString() })
await client.connect()

try {
    await client.query(`CREATE DATABASE "${databaseName}"`)
    console.log(`Created database ${databaseName}`)
} catch (error) {
    if (error.code !== '42P04') throw error // 42P04 = duplicate_database
    console.log(`Database ${databaseName} already exists`)
} finally {
    await client.end()
}
