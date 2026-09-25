import { createHash } from 'node:crypto'
import { env } from '../config/env.js'
import { AppError } from './errors.js'

type KairoUser = { id: string; email: string; name: string }
type KairoIdentity = { userId: string; member: boolean; locked?: boolean }
type KairoSession = { token: string; sessionId: string; expiresAt: string; userId: string }
type Json = Record<string, unknown>

function appKey() {
  const key = env.KAIRO_APP_KEY ?? env.APP_KEY
  if (!key) throw new AppError('Kairos is not configured', 503)
  return key
}

async function request<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>) {
  const key = appKey()
  let response: Response
  try {
    response = await fetch(new URL(path, env.KAIRO_SDK_BASE_URL), {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw new AppError('Kairos is temporarily unavailable', 503)
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (method === 'DELETE' && path.startsWith('/sdk/v2/sessions/') && response.status === 404) {
    return { status: response.status, data: null as T, headers: response.headers }
  }
  if (!response.ok) {
    if (response.status === 429 || response.status >= 500) {
      throw new AppError('Kairos is temporarily unavailable', 503)
    }
    if (response.status === 403 && path === '/sdk/v2/conversations/business') {
      throw new AppError('Kairos từ chối tạo kênh đối tác. Kiểm tra quyền mời đối tác của tài khoản.', 403)
    }
    if (response.status === 409 && (data as Json | null)?.error &&
      ((data as Json).error as Json).code === 'user_locked') {
      throw new AppError('Kairos account is locked', 403)
    }
    throw new AppError('Kairos rejected the request', 502)
  }
  return { status: response.status, data: data as T, headers: response.headers }
}

function identityFromResult(data: Json): KairoIdentity | null {
  const item = data.user as Json | undefined
  if (!item || typeof item.userId !== 'string') return null
  return {
    userId: item.userId,
    member: item.member === true,
    locked: data.locked === true || item.status === 'locked',
  }
}

export async function ensureKairoUser(user: KairoUser): Promise<string> {
  const resolved = await request<Json>('POST', '/sdk/v2/users/resolve', { externalId: user.id })
  if (resolved.data?.found === true) {
    const identity = identityFromResult(resolved.data)
    if (identity?.locked) throw new AppError('Kairos account is locked', 403)
    if (identity?.member) return identity.userId
  }

  const payload = { externalId: user.id, email: user.email, displayName: user.name.slice(0, 80) }
  const idempotencyKey = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  const provisioned = await request<Json>('POST', '/sdk/v2/users', payload, {
    'Idempotency-Key': idempotencyKey,
  })
  if (!provisioned.data || typeof provisioned.data !== 'object') {
    throw new AppError('Kairos returned an invalid response', 502)
  }
  let result: Json = provisioned.data

  if (provisioned.status === 202) {
    const requestId = result.requestId
    if (typeof requestId !== 'string') throw new AppError('Kairos returned an invalid response', 502)
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2_000))
      const polled = await request<Json>('GET', `/sdk/v2/provisioning/${encodeURIComponent(requestId)}`)
      if (polled.data.state !== 'completed') continue
      const rows = polled.data.results
      result = Array.isArray(rows) && rows[0] ? rows[0] as Json : {}
      break
    }
  }

  if (result.result === 'error') throw new AppError('Kairos could not link this user', 409)
  const identity = identityFromResult(result)
  if (!identity?.member) throw new AppError('Kairos user is not ready; try again shortly', 503)
  return identity.userId
}

export async function mintKairoSession(userId: string): Promise<KairoSession> {
  const { data } = await request<KairoSession>('POST', '/sdk/v2/tokens', {
    userId,
    deviceLabel: 'Shadcn Admin web',
  })
  if (!data || typeof data.token !== 'string' || typeof data.sessionId !== 'string' ||
      typeof data.expiresAt !== 'string' || data.userId !== userId) {
    throw new AppError('Kairos returned an invalid session', 502)
  }
  return data
}

export async function revokeKairoSession(sessionId: string) {
  await request<null>('DELETE', `/sdk/v2/sessions/${encodeURIComponent(sessionId)}`)
}

export async function openKairoDirect(actorUserId: string, peerUserId: string) {
  const { data } = await request<{ conversationId: string }>('POST', '/sdk/v2/conversations/direct', {
    actorUserId, peerUserId,
  })
  if (typeof data?.conversationId !== 'string') throw new AppError('Kairos returned an invalid conversation', 502)
  return data.conversationId
}

export async function openKairoGroup(actorUserId: string, memberUserIds: string[], title: string, clientRequestId: string) {
  const { data } = await request<{ conversationId: string }>('POST', '/sdk/v2/conversations/groups', {
    actorUserId, memberUserIds, title, clientRequestId,
  })
  if (typeof data?.conversationId !== 'string') throw new AppError('Kairos returned an invalid conversation', 502)
  return data.conversationId
}

type BusinessResult = {
  conversationId: string
  invitations: { token: string; expiresAt: string }[]
}

export async function openKairoBusiness(
  actorUserId: string,
  memberUserIds: string[],
  title: string,
  clientRequestId: string
) {
  const { data } = await request<BusinessResult>('POST', '/sdk/v2/conversations/business', {
    actorUserId, memberUserIds, title, clientRequestId, invitationCount: 1,
  })
  const invitation = data?.invitations?.[0]
  if (typeof data?.conversationId !== 'string' || typeof invitation?.token !== 'string' ||
      !invitation.token || typeof invitation.expiresAt !== 'string' ||
      Number.isNaN(Date.parse(invitation.expiresAt))) {
    throw new AppError('Kairos returned an invalid partner invitation', 502)
  }
  return { conversationId: data.conversationId, invitation }
}
