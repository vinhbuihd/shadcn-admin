import { createHash } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { db } from '../db/index.js'
import { kairoSessions } from '../db/schema/kairo-sessions.js'
import { AppError } from './errors.js'
import { revokeKairoSession } from './kairo.js'

export function authTokenHash(request: FastifyRequest) {
  const token = request.cookies.auth
  if (!token) throw new AppError('Unauthorized', 401)
  return createHash('sha256').update(token).digest('hex')
}

export async function revokeCurrentLoginKairoSessions(request: FastifyRequest) {
  const hash = authTokenHash(request)
  const sessions = await db.select({ id: kairoSessions.id }).from(kairoSessions).where(and(
    eq(kairoSessions.userId, request.user.userId),
    eq(kairoSessions.authTokenHash, hash),
  ))
  for (const session of sessions) await revokeKairoSession(session.id)
  await db.delete(kairoSessions).where(and(
    eq(kairoSessions.userId, request.user.userId),
    eq(kairoSessions.authTokenHash, hash),
  ))
}
