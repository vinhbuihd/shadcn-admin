import type { FastifyInstance } from 'fastify'
import { db } from '../db/index.js'
import { bookmarks, bookmarkTags, tags, users } from '../db/schema/index.js'

export type TestUser = {
  id: string
  cookies: { auth: string }
}

/**
 * Xoá sạch dữ liệu theo đúng thứ tự phụ thuộc khoá ngoại: bảng con trước, bảng cha sau.
 * Gọi ở `beforeEach` để mỗi test bắt đầu từ trạng thái sạch.
 */
export async function resetDb() {
  await db.delete(bookmarkTags)
  await db.delete(bookmarks)
  await db.delete(tags)
  await db.delete(users)
}

/**
 * Helper cố tình `throw` thay vì `expect`: nếu bước dựng dữ liệu hỏng, test dừng ngay
 * tại đây kèm status + payload, thay vì fail ở một assertion vô nghĩa phía sau.
 */
function assertStatus(
  response: { statusCode: number; payload: string },
  expected: number,
  what: string
) {
  if (response.statusCode !== expected) {
    throw new Error(
      `${what}: expected ${expected}, got ${response.statusCode} — ${response.payload}`
    )
  }
}

/**
 * Đăng ký user mới và lấy luôn cookie `auth` server vừa set.
 *
 * `app.inject()` không có cookie jar như browser, nên phải tự moi cookie ra khỏi
 * response rồi tự đính vào các request sau. Tận dụng việc register tự đăng nhập
 * luôn: một request là có cả user lẫn cookie.
 */
export async function createUser(app: FastifyInstance, email: string): Promise<TestUser> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { name: email, email, password: 'password123' },
  })
  assertStatus(response, 201, `createUser(${email})`)

  const token = response.cookies.find((cookie) => cookie.name === 'auth')?.value
  if (!token) {
    throw new Error(`createUser(${email}): response không có cookie 'auth'`)
  }

  return {
    id: JSON.parse(response.payload).data.id as string,
    cookies: { auth: token },
  }
}

export async function createBookmark(
  app: FastifyInstance,
  user: TestUser,
  data: { url: string; title: string; note?: string }
) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/bookmarks',
    cookies: user.cookies,
    payload: data,
  })
  assertStatus(response, 201, `createBookmark(${data.url})`)

  return JSON.parse(response.payload).data as {
    id: string
    url: string
    title: string
    note: string | null
  }
}

export async function createTag(app: FastifyInstance, user: TestUser, name: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/tags',
    cookies: user.cookies,
    payload: { name },
  })
  assertStatus(response, 201, `createTag(${name})`)

  return JSON.parse(response.payload).data as { id: string; name: string }
}

export async function attachTag(
  app: FastifyInstance,
  user: TestUser,
  bookmarkId: string,
  tagId: string
) {
  const response = await app.inject({
    method: 'PUT',
    url: `/api/bookmarks/${bookmarkId}/tags/${tagId}`,
    cookies: user.cookies,
  })
  assertStatus(response, 200, 'attachTag')
}
