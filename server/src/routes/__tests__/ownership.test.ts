import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.js'
import { db } from '../../db/index.js'
import { bookmarks, bookmarkTags, tags } from '../../db/schema/index.js'
import {
  attachTag,
  createBookmark,
  createTag,
  createUser,
  resetDb,
  type TestUser,
} from '../../test/helpers.js'

/**
 * Mọi truy cập chéo user phải trả 404, không phải 403: 403 nghĩa là "có tồn tại
 * nhưng bạn không được phép", tức là đã tiết lộ sự tồn tại của resource.
 *
 * Mỗi test kiểm tra hai thứ: status code, VÀ trạng thái thật trong database.
 * Status code không chứng minh dữ liệu còn nguyên — một route viết sai vẫn có thể
 * ghi đè dữ liệu rồi mới trả 404.
 */
describe('Ownership giữa hai user', () => {
  let app: FastifyInstance
  let userA: TestUser
  let userB: TestUser

  beforeAll(async () => {
    app = buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDb()
    userA = await createUser(app, 'a@example.com')
    userB = await createUser(app, 'b@example.com')
  })

  describe('Bookmark', () => {
    it('danh sách của B không chứa bookmark của A', async () => {
      await createBookmark(app, userA, { url: 'https://example.com/a', title: 'Của A' })

      const response = await app.inject({
        method: 'GET',
        url: '/api/bookmarks',
        cookies: userB.cookies,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.data).toHaveLength(0)
      expect(body.meta.total).toBe(0)
    })

    it('B không sửa được bookmark của A', async () => {
      const bookmark = await createBookmark(app, userA, {
        url: 'https://example.com/a',
        title: 'Tiêu đề gốc',
      })

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/bookmarks/${bookmark.id}`,
        cookies: userB.cookies,
        payload: { title: 'Đã bị sửa' },
      })

      expect(response.statusCode).toBe(404)

      const rows = await db.select().from(bookmarks).where(eq(bookmarks.id, bookmark.id))
      expect(rows[0]?.title).toBe('Tiêu đề gốc')
    })

    it('B không xoá được bookmark của A', async () => {
      const bookmark = await createBookmark(app, userA, {
        url: 'https://example.com/a',
        title: 'Của A',
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/bookmarks/${bookmark.id}`,
        cookies: userB.cookies,
      })

      expect(response.statusCode).toBe(404)

      const rows = await db.select().from(bookmarks).where(eq(bookmarks.id, bookmark.id))
      expect(rows).toHaveLength(1)
    })

    it('B lọc theo tag của A cũng không thấy gì', async () => {
      const bookmark = await createBookmark(app, userA, {
        url: 'https://example.com/a',
        title: 'Của A',
      })
      const tag = await createTag(app, userA, 'work')
      await attachTag(app, userA, bookmark.id, tag.id)

      const response = await app.inject({
        method: 'GET',
        url: `/api/bookmarks?tagId=${tag.id}`,
        cookies: userB.cookies,
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload).data).toHaveLength(0)
    })
  })

  describe('Tag', () => {
    it('danh sách của B không chứa tag của A', async () => {
      await createTag(app, userA, 'work')

      const response = await app.inject({
        method: 'GET',
        url: '/api/tags',
        cookies: userB.cookies,
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload).data).toHaveLength(0)
    })

    it('B không sửa được tag của A', async () => {
      const tag = await createTag(app, userA, 'work')

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/tags/${tag.id}`,
        cookies: userB.cookies,
        payload: { name: 'hacked' },
      })

      expect(response.statusCode).toBe(404)

      const rows = await db.select().from(tags).where(eq(tags.id, tag.id))
      expect(rows[0]?.name).toBe('work')
    })

    it('B không xoá được tag của A', async () => {
      const tag = await createTag(app, userA, 'work')

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/tags/${tag.id}`,
        cookies: userB.cookies,
      })

      expect(response.statusCode).toBe(404)

      const rows = await db.select().from(tags).where(eq(tags.id, tag.id))
      expect(rows).toHaveLength(1)
    })
  })

  describe('Gắn và gỡ tag', () => {
    it('B không gắn được tag của mình vào bookmark của A', async () => {
      const bookmarkA = await createBookmark(app, userA, {
        url: 'https://example.com/a',
        title: 'Của A',
      })
      const tagB = await createTag(app, userB, 'work')

      const response = await app.inject({
        method: 'PUT',
        url: `/api/bookmarks/${bookmarkA.id}/tags/${tagB.id}`,
        cookies: userB.cookies,
      })

      expect(response.statusCode).toBe(404)

      const rows = await db.select().from(bookmarkTags)
      expect(rows).toHaveLength(0)
    })

    it('B không gắn được tag của A vào bookmark của mình', async () => {
      const bookmarkB = await createBookmark(app, userB, {
        url: 'https://example.com/b',
        title: 'Của B',
      })
      const tagA = await createTag(app, userA, 'work')

      const response = await app.inject({
        method: 'PUT',
        url: `/api/bookmarks/${bookmarkB.id}/tags/${tagA.id}`,
        cookies: userB.cookies,
      })

      expect(response.statusCode).toBe(404)

      const rows = await db.select().from(bookmarkTags)
      expect(rows).toHaveLength(0)
    })

    it('B không gỡ được liên kết tag của A', async () => {
      const bookmarkA = await createBookmark(app, userA, {
        url: 'https://example.com/a',
        title: 'Của A',
      })
      const tagA = await createTag(app, userA, 'work')
      await attachTag(app, userA, bookmarkA.id, tagA.id)

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/bookmarks/${bookmarkA.id}/tags/${tagA.id}`,
        cookies: userB.cookies,
      })

      expect(response.statusCode).toBe(404)

      const rows = await db
        .select()
        .from(bookmarkTags)
        .where(
          and(eq(bookmarkTags.bookmarkId, bookmarkA.id), eq(bookmarkTags.tagId, tagA.id))
        )
      expect(rows).toHaveLength(1)
    })
  })

  describe('Chưa đăng nhập', () => {
    it('không có cookie thì trả 401, không phải 404', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/bookmarks' })

      expect(response.statusCode).toBe(401)
    })

    it('cookie rác cũng trả 401', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/bookmarks',
        cookies: { auth: 'khong-phai-jwt-hop-le' },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  /**
   * Hai unique constraint đều theo `(user_id, ...)` chứ không phải toàn cục.
   * Nếu ai đó lỡ đổi thành unique trên riêng `name` hoặc `url`, hai test này đỏ ngay.
   */
  describe('Unique theo từng user, không phải toàn cục', () => {
    it('A và B cùng tạo tag tên "work" đều thành công', async () => {
      await createTag(app, userA, 'work')
      await createTag(app, userB, 'work')

      const rows = await db.select().from(tags).where(eq(tags.name, 'work'))
      expect(rows).toHaveLength(2)
    })

    it('A và B cùng lưu một URL đều thành công', async () => {
      const url = 'https://example.com/cung-mot-url'
      await createBookmark(app, userA, { url, title: 'A lưu' })
      await createBookmark(app, userB, { url, title: 'B lưu' })

      const rows = await db.select().from(bookmarks).where(eq(bookmarks.url, url))
      expect(rows).toHaveLength(2)
    })
  })
})
