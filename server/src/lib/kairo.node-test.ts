import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { ensureKairoUser, mintKairoSession, revokeKairoSession } from './kairo.js'

const appUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.test',
  name: 'Test User',
}
const kairoUserId = '22222222-2222-4222-8222-222222222222'

afterEach(() => mock.restoreAll())

test('an existing tenant member is resolved using the server user ID', async () => {
  mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(new URL(input.toString()).pathname, '/sdk/v2/users/resolve')
    assert.deepEqual(JSON.parse(String(init?.body)), { externalId: appUser.id })
    return Response.json({ found: true, member: true, user: { userId: kairoUserId, member: true } })
  })
  assert.equal(await ensureKairoUser(appUser), kairoUserId)
  assert.equal((fetch as unknown as { mock: { callCount(): number } }).mock.callCount(), 1)
})

test('a missing user is provisioned without sending an app password', async () => {
  let calls = 0
  mock.method(globalThis, 'fetch', async (_input: string | URL | Request, init?: RequestInit) => {
    calls++
    if (calls === 1) return Response.json({ found: false })
    assert.equal(init?.method, 'POST')
    assert.ok(new Headers(init?.headers).get('Idempotency-Key'))
    assert.deepEqual(JSON.parse(String(init?.body)), {
      externalId: appUser.id, email: appUser.email, displayName: appUser.name,
    })
    return Response.json({ result: 'created', user: { userId: kairoUserId, member: true }, password: 'not-forwarded' }, { status: 201 })
  })
  assert.equal(await ensureKairoUser(appUser), kairoUserId)
  assert.equal(calls, 2)
})

test('a token for another user is rejected', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({
    token: 'session-token', sessionId: '33333333-3333-4333-8333-333333333333',
    expiresAt: '2026-09-26T00:00:00Z', userId: '44444444-4444-4444-8444-444444444444',
  }))
  await assert.rejects(mintKairoSession(kairoUserId), { statusCode: 502 })
})

test('revoking a session that has already expired succeeds', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ error: { code: 'not_found' } }, { status: 404 }))
  await revokeKairoSession('33333333-3333-4333-8333-333333333333')
})
