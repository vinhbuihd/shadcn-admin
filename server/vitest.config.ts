import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        exclude: ['**/node_modules/**', '**/dist/**'],
        globalSetup: ['./src/test/global-setup.ts'],
        env: {
            NODE_ENV: 'test',
        },
    },
})
