import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        exclude: ['**/node_modules/**', '**/dist/**'],
        globalSetup: ['./src/test/global-setup.ts'],

        // Mặc định Vitest chạy các file test song song. Ở đây mọi file dùng chung một
        // database test và đều `resetDb()` trong beforeEach, nên chạy song song sẽ khiến
        // file này xoá mất dữ liệu của file kia — test đỏ ngẫu nhiên, rất khó truy.
        // Cách khác là mỗi file một database riêng, nhưng với quy mô này thì chạy tuần tự
        // đơn giản và đủ nhanh.
        fileParallelism: false,

        env: {
            NODE_ENV: 'test',
            // Ngưỡng thật (10 request/15 phút) sẽ chặn chính test suite: riêng
            // ownership.test.ts đã gọi /auth/register 28 lần từ cùng một IP.
            // File rate-limit.test.ts tự truyền ngưỡng thấp qua buildApp() để kiểm chứng.
            AUTH_RATE_LIMIT_MAX: '1000',
        },
    },
})
