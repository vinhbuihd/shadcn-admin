import { and, eq, ilike, inArray, ne, or } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { kairoSessions } from '../db/schema/kairo-sessions.js'
import { users } from '../db/schema/users.js'
import { AppError, NotFoundError } from '../lib/errors.js'
import { authTokenHash } from '../lib/kairo-sessions.js'
import { ensureKairoUser, mintKairoSession, openKairoBusiness, openKairoDirect, openKairoGroup, revokeKairoSession } from '../lib/kairo.js'
import { parseOrThrow } from '../lib/validate.js'

const directSchema = z.object({ peerId: z.uuid() })
const groupSchema = z.object({
  title: z.string().trim().min(1).max(120),
  memberIds: z.array(z.uuid()).min(2).max(20),
  clientRequestId: z.uuid(),
})
const businessSchema = z.object({
  title: z.string().trim().min(1).max(120),
  memberIds: z.array(z.uuid()).max(20),
  partnerTenantSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
  clientRequestId: z.uuid(),
})
const usersQuerySchema = z.object({ q: z.string().trim().max(100).default('') })

type User = { id: string; email: string; name: string }

async function getUser(id: string): Promise<User> {
  const [user] = await db.select({ id: users.id, email: users.email, name: users.name })
    .from(users).where(eq(users.id, id)).limit(1)
  if (!user) throw new NotFoundError('User not found')
  return user
}

export async function kairoRoutes(app: FastifyInstance) {
  app.get('/kairo/users', { preHandler: [app.authenticate] }, async (request) => {
    const { q } = parseOrThrow(usersQuerySchema, request.query)
    const matches = q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)) : undefined
    const rows = await db.select({ id: users.id, email: users.email, name: users.name })
      .from(users).where(and(ne(users.id, request.user.userId), matches)).orderBy(users.name).limit(50)
    return { data: rows }
  })

  app.post('/kairo/session', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await getUser(request.user.userId)
    const kairoUserId = await ensureKairoUser(user)
    const session = await mintKairoSession(kairoUserId)
    const expiresAt = new Date(session.expiresAt)
    if (Number.isNaN(expiresAt.getTime())) {
      await revokeKairoSession(session.sessionId).catch(() => undefined)
      throw new AppError('Kairos returned an invalid session', 502)
    }
    try {
      await db.insert(kairoSessions).values({
        id: session.sessionId,
        userId: user.id,
        authTokenHash: authTokenHash(request),
        expiresAt,
      })
    } catch (error) {
      await revokeKairoSession(session.sessionId).catch(() => undefined)
      throw error
    }
    reply.header('Cache-Control', 'no-store')
    return { data: { token: session.token, expiresAt: session.expiresAt } }
  })

  app.post('/kairo/conversations/direct', { preHandler: [app.authenticate] }, async (request) => {
    const { peerId } = parseOrThrow(directSchema, request.body)
    if (peerId === request.user.userId) throw new AppError('Choose another user', 400)
    const actor = await getUser(request.user.userId)
    const peer = await getUser(peerId)
    const actorKairoId = await ensureKairoUser(actor)
    const peerKairoId = await ensureKairoUser(peer)
    const conversationId = await openKairoDirect(actorKairoId, peerKairoId)
    return { data: { conversationId } }
  })

  app.post('/kairo/conversations/groups', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { title, memberIds, clientRequestId } = parseOrThrow(groupSchema, request.body)
    if (new Set(memberIds).size !== memberIds.length || memberIds.includes(request.user.userId)) {
      throw new AppError('Choose distinct users other than yourself', 400)
    }
    const members = await db.select({ id: users.id, email: users.email, name: users.name })
      .from(users).where(inArray(users.id, memberIds))
    if (members.length !== memberIds.length) throw new NotFoundError('User not found')
    const actor = await getUser(request.user.userId)
    const actorKairoId = await ensureKairoUser(actor)
    const memberById = new Map(members.map((member) => [member.id, member]))
    const kairoMemberIds: string[] = []
    for (const id of memberIds) kairoMemberIds.push(await ensureKairoUser(memberById.get(id)!))
    const conversationId = await openKairoGroup(actorKairoId, kairoMemberIds, title, clientRequestId)
    reply.code(201)
    return { data: { conversationId } }
  })

  app.post('/kairo/conversations/business', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { title, memberIds, partnerTenantSlug, clientRequestId } = parseOrThrow(businessSchema, request.body)
    if (new Set(memberIds).size !== memberIds.length || memberIds.includes(request.user.userId)) {
      throw new AppError('Choose distinct users other than yourself', 400)
    }
    const members = memberIds.length
      ? await db.select({ id: users.id, email: users.email, name: users.name })
        .from(users).where(inArray(users.id, memberIds))
      : []
    if (members.length !== memberIds.length) throw new NotFoundError('User not found')
    const actor = await getUser(request.user.userId)
    const actorKairoId = await ensureKairoUser(actor)
    const memberById = new Map(members.map((member) => [member.id, member]))
    const kairoMemberIds: string[] = []
    for (const id of memberIds) kairoMemberIds.push(await ensureKairoUser(memberById.get(id)!))
    const { conversationId, invitation } = await openKairoBusiness(
      actorKairoId, kairoMemberIds, title, clientRequestId
    )
    const link = new URL(`https://${partnerTenantSlug}.sit.yousee.vn/doi-tac/moi`)
    link.searchParams.set('token', invitation.token)
    reply.header('Cache-Control', 'no-store')
    reply.code(201)
    return { data: { conversationId, link: link.toString(), expiresAt: invitation.expiresAt } }
  })
}
