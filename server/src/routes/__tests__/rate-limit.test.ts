import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.js'
import { createUser, resetDb } from '../../test/helpers.js'

const EMAIL = 'ratelimit@example.com'
const CORRECT_PASSWORD = 'password123'
const WRONG_PASSWORD = 'wrong-password'

/**
 * App riêng với ngưỡng 3 request, để kiểm chứng mà không phải bắn 1000 request.
 * Đây là lý do `buildApp()` nhận `authRateLimit` qua tham số thay vì đọc thẳng env:
 * config nào cần thay đổi khi test thì phải truyền vào được.
 *
 * Cả file dùng chung một app (đóng app sẽ đóng luôn connection pool), nên mỗi test
 * dùng một IP riêng để bộ đếm không dính sang nhau.
 */
describe('Rate limit cho /auth/login', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    await resetDb()
    app = buildApp({ authRateLimit: { max: 3, timeWindow: '1 minute' } })
    await createUser(app, EMAIL)
  })

  afterAll(async () => {
    await app.close()
  })

  function login(
    password: string,
    options: { ip?: string; forwardedFor?: string } = {}
  ) {
    return app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: EMAIL, password },
      ...(options.ip ? { remoteAddress: options.ip } : {}),
      ...(options.forwardedFor ? { headers: { 'x-forwarded-for': options.forwardedFor } } : {}),
    })
  }

  it('cho qua đúng 3 lần rồi trả 429', async () => {
    const ip = '10.0.0.1'

    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await login(WRONG_PASSWORD, { ip })
      expect(response.statusCode).toBe(401)
    }

    const blocked = await login(WRONG_PASSWORD, { ip })
    expect(blocked.statusCode).toBe(429)
    expect(JSON.parse(blocked.payload).message).toContain('Rate limit exceeded')
  })

  it('đã bị chặn thì mật khẩu đúng cũng không vào được', async () => {
    const ip = '10.0.0.2'

    for (let attempt = 1; attempt <= 3; attempt++) {
      await login(WRONG_PASSWORD, { ip })
    }

    const response = await login(CORRECT_PASSWORD, { ip })

    expect(response.statusCode).toBe(429)
    // Quan trọng: không được set cookie khi đang bị chặn
    expect(response.cookies.find((cookie) => cookie.name === 'auth')).toBeUndefined()
  })

  it('IP khác không bị vạ lây', async () => {
    const attacker = '10.0.0.3'
    const innocent = '10.0.0.4'

    for (let attempt = 1; attempt <= 4; attempt++) {
      await login(WRONG_PASSWORD, { ip: attacker })
    }
    expect((await login(WRONG_PASSWORD, { ip: attacker })).statusCode).toBe(429)

    const response = await login(CORRECT_PASSWORD, { ip: innocent })
    expect(response.statusCode).toBe(200)
  })

  /**
   * Sau khi deploy, request tới Render đều đi qua proxy nên `remoteAddress` là IP của
   * proxy — nếu đếm theo đó thì một người vượt ngưỡng sẽ khoá toàn bộ người dùng.
   * `trustProxy: true` khiến `request.ip` lấy từ `X-Forwarded-For`, và rate limit
   * đếm theo đúng IP thật đó.
   */
  it('đứng sau proxy thì đếm theo X-Forwarded-For, không phải IP của proxy', async () => {
    const attacker = '203.0.113.10'
    const innocent = '203.0.113.11'

    for (let attempt = 1; attempt <= 3; attempt++) {
      await login(WRONG_PASSWORD, { forwardedFor: attacker })
    }
    expect((await login(WRONG_PASSWORD, { forwardedFor: attacker })).statusCode).toBe(429)

    const response = await login(WRONG_PASSWORD, { forwardedFor: innocent })
    expect(response.statusCode).toBe(401)
  })
})
