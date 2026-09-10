import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.js'
import { createBookmark, createTag, createUser, resetDb, type TestUser } from '../../test/helpers.js'

/**
 * Error handler toàn cục thay cho ~10 khối try/catch giống hệt nhau trong route.
 *
 * Phần dễ sai nhất là bảng ánh xạ tên constraint sang thông báo: tên lấy từ file
 * migration, gõ sai một ký tự thì rơi về thông báo chung chung mà không ai biết.
 * Bốn test 409 bên dưới khoá chặt đúng chỗ đó.
 */
describe('Error handler toàn cục', () => {
  let app: FastifyInstance
  let user: TestUser

  beforeAll(async () => {
    app = buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDb()
    user = await createUser(app, 'user@example.com')
  })

  describe('400 kèm chi tiết field', () => {
    it('nói rõ field nào sai, không chỉ "Invalid request"', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/bookmarks',
        cookies: user.cookies,
        payload: { url: 'khong-phai-url', title: '' },
      })

      expect(response.statusCode).toBe(400)

      const body = JSON.parse(response.payload)
      const fields = body.errors.map((issue: { field: string }) => issue.field)
      expect(fields).toContain('url')
      expect(fields).toContain('title')
    })
  })

  describe('404 cho route không tồn tại', () => {
    it('trả về đúng dạng { message } như mọi lỗi khác', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/khong-ton-tai' })

      expect(response.statusCode).toBe(404)
      expect(JSON.parse(response.payload).message).toBe('Route not found')
    })
  })

  describe('409 theo đúng constraint bị vi phạm', () => {
    it('trùng email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { name: 'Trùng', email: 'user@example.com', password: 'password123' },
      })

      expect(response.statusCode).toBe(409)
      expect(JSON.parse(response.payload).message).toBe('Email already exists')
    })

    it('trùng tên tag trong cùng một user', async () => {
      await createTag(app, user, 'work')

      const response = await app.inject({
        method: 'POST',
        url: '/api/tags',
        cookies: user.cookies,
        payload: { name: 'work' },
      })

      expect(response.statusCode).toBe(409)
      expect(JSON.parse(response.payload).message).toBe('Tag already exists')
    })

    it('trùng URL trong cùng một user', async () => {
      const url = 'https://example.com/trung-url'
      await createBookmark(app, user, { url, title: 'Lần đầu' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/bookmarks',
        cookies: user.cookies,
        payload: { url, title: 'Lần hai' },
      })

      expect(response.statusCode).toBe(409)
      expect(JSON.parse(response.payload).message).toBe('Bookmark already exists')
    })

    it('gắn cùng một tag hai lần vào một bookmark', async () => {
      const bookmark = await createBookmark(app, user, {
        url: 'https://example.com/gan-tag',
        title: 'Bookmark',
      })
      const tag = await createTag(app, user, 'work')

      const url = `/api/bookmarks/${bookmark.id}/tags/${tag.id}`
      const first = await app.inject({ method: 'PUT', url, cookies: user.cookies })
      expect(first.statusCode).toBe(200)

      const response = await app.inject({ method: 'PUT', url, cookies: user.cookies })

      expect(response.statusCode).toBe(409)
      expect(JSON.parse(response.payload).message).toBe('Bookmark tag already exists')
    })
  })
})
