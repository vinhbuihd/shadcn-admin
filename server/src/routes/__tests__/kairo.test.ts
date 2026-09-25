import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../app.js'
import { db } from '../../db/index.js'
import { kairoSessions } from '../../db/schema/kairo-sessions.js'
import { createUser, resetDb, type TestUser } from '../../test/helpers.js'

const actorKairoId = '11111111-1111-4111-8111-111111111111'
const peerKairoId = '22222222-2222-4222-8222-222222222222'
const remoteSessionId = '33333333-3333-4333-8333-333333333333'

describe('Kairos integration boundary', () => {
  let app: FastifyInstance
  let actor: TestUser
  let peer: TestUser

  beforeAll(() => { app = buildApp() })
  afterAll(async () => { await app.close() })
  afterEach(() => { vi.restoreAllMocks() })
  beforeEach(async () => {
    await resetDb()
    actor = await createUser(app, 'actor@example.test')
    peer = await createUser(app, 'peer@example.test')
  })

  it('requires app authentication to list people', async () => {
    const denied = await app.inject({ method: 'GET', url: '/api/kairo/users' })
    expect(denied.statusCode).toBe(401)
    const allowed = await app.inject({ method: 'GET', url: '/api/kairo/users', cookies: actor.cookies })
    expect(allowed.statusCode).toBe(200)
    expect(JSON.parse(allowed.payload).data.map((user: { id: string }) => user.id)).toEqual([peer.id])
  })

  it('mints only for the authenticated user and revokes that session on logout', async () => {
    const calls: Array<{ path: string; body?: Record<string, string>; method?: string }> = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const path = new URL(input.toString()).pathname
      const body = init?.body ? JSON.parse(String(init.body)) as Record<string, string> : undefined
      calls.push({ path, body, method: init?.method })
      if (path.endsWith('/users/resolve')) return Response.json({
        found: true, member: true, user: { userId: actorKairoId, member: true },
      })
      if (path.endsWith('/tokens')) return Response.json({
        token: 'only-actor-token', sessionId: remoteSessionId,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(), userId: actorKairoId,
      })
      if (path.endsWith(`/sessions/${remoteSessionId}`)) return new Response(null, { status: 204 })
      throw new Error(`Unexpected Kairos path ${path}`)
    })

    const response = await app.inject({
      method: 'POST', url: '/api/kairo/session', cookies: actor.cookies, payload: { userId: peer.id },
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload).data).toHaveProperty('token', 'only-actor-token')
    expect(JSON.parse(response.payload).data).not.toHaveProperty('sessionId')
    expect(calls[0]?.body).toEqual({ externalId: actor.id })
    expect(calls[1]?.body?.userId).toBe(actorKairoId)
    expect(await db.select().from(kairoSessions).where(eq(kairoSessions.userId, actor.id))).toHaveLength(1)

    const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', cookies: actor.cookies })
    expect(logout.statusCode).toBe(200)
    expect(calls.at(-1)?.path).toBe(`/sdk/v2/sessions/${remoteSessionId}`)
    expect(await db.select().from(kairoSessions).where(eq(kairoSessions.userId, actor.id))).toHaveLength(0)
  })

  it('uses the logged-in user as the direct-chat actor', async () => {
    let directBody: Record<string, string> | undefined
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const path = new URL(input.toString()).pathname
      const body = JSON.parse(String(init?.body)) as Record<string, string>
      if (path.endsWith('/users/resolve')) return Response.json({
        found: true, member: true,
        user: { userId: body.externalId === actor.id ? actorKairoId : peerKairoId, member: true },
      })
      if (path.endsWith('/conversations/direct')) {
        directBody = body
        return Response.json({ conversationId: '44444444-4444-4444-8444-444444444444' })
      }
      throw new Error(`Unexpected Kairos path ${path}`)
    })
    const response = await app.inject({
      method: 'POST', url: '/api/kairo/conversations/direct', cookies: actor.cookies,
      payload: { peerId: peer.id, actorUserId: peerKairoId },
    })
    expect(response.statusCode).toBe(200)
    expect(directBody).toEqual({ actorUserId: actorKairoId, peerUserId: peerKairoId })
  })

  it('creates a group with two distinct colleagues and a stable retry ID', async () => {
    const third = await createUser(app, 'third@example.test')
    const thirdKairoId = '55555555-5555-4555-8555-555555555555'
    const retryId = '66666666-6666-4666-8666-666666666666'
    let groupBody: Record<string, unknown> | undefined
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const path = new URL(input.toString()).pathname
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      if (path.endsWith('/users/resolve')) {
        const ids: Record<string, string> = {
          [actor.id]: actorKairoId, [peer.id]: peerKairoId, [third.id]: thirdKairoId,
        }
        return Response.json({ found: true, member: true,
          user: { userId: ids[String(body.externalId)], member: true } })
      }
      if (path.endsWith('/conversations/groups')) {
        groupBody = body
        return Response.json({ conversationId: '77777777-7777-4777-8777-777777777777' }, { status: 201 })
      }
      throw new Error(`Unexpected Kairos path ${path}`)
    })
    const response = await app.inject({
      method: 'POST', url: '/api/kairo/conversations/groups', cookies: actor.cookies,
      payload: { title: 'Team chat', memberIds: [peer.id, third.id], clientRequestId: retryId },
    })
    expect(response.statusCode).toBe(201)
    expect(groupBody).toEqual({ actorUserId: actorKairoId,
      memberUserIds: [peerKairoId, thirdKairoId], title: 'Team chat', clientRequestId: retryId })
  })

  it('creates a business channel and a link on the partner tenant origin', async () => {
    const retryId = '66666666-6666-4666-8666-666666666666'
    const conversationId = '77777777-7777-4777-8777-777777777777'
    const expiresAt = '2026-09-28T08:00:00Z'
    const inviteToken = 'invite-once.a+b/='
    let businessBody: Record<string, unknown> | undefined
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const path = new URL(input.toString()).pathname
      if (path.endsWith('/users/resolve')) return Response.json({
        found: true, member: true, user: { userId: actorKairoId, member: true },
      })
      if (path.endsWith('/conversations/business')) {
        businessBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return Response.json({
          conversationId,
          invitations: [{ invitationId: '88888888-8888-4888-8888-888888888888', token: inviteToken, expiresAt }],
        }, { status: 201 })
      }
      throw new Error(`Unexpected Kairos path ${path}`)
    })

    const payload = {
      title: 'Trao đổi đơn thuê xe', memberIds: [],
      partnerTenantSlug: 'San-Xe', clientRequestId: retryId,
    }
    const denied = await app.inject({ method: 'POST', url: '/api/kairo/conversations/business', payload })
    expect(denied.statusCode).toBe(401)
    const invalidSlug = await app.inject({
      method: 'POST', url: '/api/kairo/conversations/business', cookies: actor.cookies,
      payload: { ...payload, partnerTenantSlug: 'other.example.com' },
    })
    expect(invalidSlug.statusCode).toBe(400)

    const response = await app.inject({
      method: 'POST', url: '/api/kairo/conversations/business', cookies: actor.cookies, payload,
    })
    expect(response.statusCode).toBe(201)
    expect(response.headers['cache-control']).toBe('no-store')
    expect(businessBody).toEqual({
      actorUserId: actorKairoId, memberUserIds: [], title: payload.title,
      clientRequestId: retryId, invitationCount: 1,
    })
    const result = JSON.parse(response.payload).data
    const link = new URL(result.link)
    expect(link.hostname).toBe('san-xe.sit.yousee.vn')
    expect(link.pathname).toBe('/doi-tac/moi')
    expect(link.searchParams.get('token')).toBe(inviteToken)
    expect(result.expiresAt).toBe(expiresAt)
    expect(result).not.toHaveProperty('token')
  })

  it('shows a permission error when Kairos rejects partner invitations', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const path = new URL(input.toString()).pathname
      if (path.endsWith('/users/resolve')) return Response.json({
        found: true, member: true, user: { userId: actorKairoId, member: true },
      })
      if (path.endsWith('/conversations/business')) return Response.json({
        error: { code: 'forbidden' },
      }, { status: 403 })
      throw new Error(`Unexpected Kairos path ${path}`)
    })
    const response = await app.inject({
      method: 'POST', url: '/api/kairo/conversations/business', cookies: actor.cookies,
      payload: {
        title: 'Trao đổi với sàn', memberIds: [], partnerTenantSlug: 'san-xe',
        clientRequestId: '66666666-6666-4666-8666-666666666666',
      },
    })
    expect(response.statusCode).toBe(403)
    expect(JSON.parse(response.payload).message).toContain('quyền mời đối tác')
  })
})
