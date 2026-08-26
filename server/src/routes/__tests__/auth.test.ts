import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildApp } from '../../app.js'
import { db } from '../../db/index.js'
import { users, bookmarks, tags, bookmarkTags } from '../../db/schema/index.js'
import type { FastifyInstance } from 'fastify'

describe('Auth Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Cleanup: delete in order of foreign key dependencies
    await db.delete(bookmarkTags)
    await db.delete(bookmarks)
    await db.delete(tags)
    await db.delete(users)
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.payload)
      expect(body.data).toHaveProperty('id')
      expect(body.data.email).toBe('test@example.com')
      expect(body.data.name).toBe('Test User')
      expect(body.data).not.toHaveProperty('passwordHash')
    })

    it('should return 409 if email already exists', async () => {
      const payload = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }

      // First registration
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload,
      })
      expect(res1.statusCode).toBe(201)

      // Second registration with same email
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          ...payload,
          name: 'Another User',
        },
      })

      expect(res2.statusCode).toBe(409)
      const body = JSON.parse(res2.payload)
      expect(body.message).toContain('already exists')
    })

    it('should return 400 if email is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 if password is less than 8 characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'pass',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 if name is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should normalize email to lowercase', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Test User',
          email: 'Test@EXAMPLE.COM',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.payload)
      expect(body.data.email).toBe('test@example.com')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // Register first
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      })

      // Login
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.data).toHaveProperty('id')
      expect(body.data.email).toBe('test@example.com')
    })

    it('should return 400 if email/password not provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 401 if password is incorrect', async () => {
      // Register
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      })

      // Login with wrong password
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 401 if user not found', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should not reveal whether email exists or not', async () => {
      // Register a user
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        },
      })

      // Try login with correct email but wrong password
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      })

      // Try login with non-existent email
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        },
      })

      // Both should return 401 with same message (security best practice)
      expect(res1.statusCode).toBe(401)
      expect(res2.statusCode).toBe(401)
      expect(res1.payload).toBe(res2.payload)
    })
  })
})
