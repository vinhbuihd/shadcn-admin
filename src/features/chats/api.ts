import { apiClient } from '@/lib/api-client'

export type ChatPerson = { id: string; email: string; name: string }
export type KairoSession = { token: string; expiresAt: string }
export type BusinessInvitation = {
  conversationId: string
  link: string
  expiresAt: string
}

export async function getChatPeople(q: string): Promise<ChatPerson[]> {
  const response = await apiClient.get<{ data: ChatPerson[] }>('/kairo/users', {
    params: { q },
  })
  return response.data.data
}

export async function createKairoSession(): Promise<KairoSession> {
  const response = await apiClient.post<{ data: KairoSession }>(
    '/kairo/session'
  )
  return response.data.data
}

export async function createDirectChat(peerId: string): Promise<string> {
  const response = await apiClient.post<{ data: { conversationId: string } }>(
    '/kairo/conversations/direct',
    { peerId }
  )
  return response.data.data.conversationId
}

export async function createGroupChat(
  title: string,
  memberIds: string[],
  clientRequestId: string
): Promise<string> {
  const response = await apiClient.post<{ data: { conversationId: string } }>(
    '/kairo/conversations/groups',
    { title, memberIds, clientRequestId }
  )
  return response.data.data.conversationId
}

export async function createBusinessChat(
  title: string,
  memberIds: string[],
  partnerTenantSlug: string,
  clientRequestId: string
): Promise<BusinessInvitation> {
  const response = await apiClient.post<{ data: BusinessInvitation }>(
    '/kairo/conversations/business',
    { title, memberIds, partnerTenantSlug, clientRequestId }
  )
  return response.data.data
}
