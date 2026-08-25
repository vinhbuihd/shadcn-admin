import { and, desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { bookmarks } from '../db/schema/index.js'
import { hasPostgresErrorCode } from '../lib/postgres-errors.js'

const createBookmarkBodySchema = z.object({
  url: z.string().trim().url().max(2048),
  title: z.string().trim().min(1).max(200),
  note: z.string().trim().max(2000).nullable().optional(),
})

const updateBookmarkBodySchema = createBookmarkBodySchema
  .partial()
  .refine(
    (body) => Object.values(body).some((value) => value !== undefined),
    { message: 'At least one field is required' }
  )

const bookmarkParamsSchema = z.object({
  id: z.string().uuid(),
})

const bookmarkSelection = {
  id: bookmarks.id,
  url: bookmarks.url,
  title: bookmarks.title,
  note: bookmarks.note,
  createdAt: bookmarks.createdAt,
  updatedAt: bookmarks.updatedAt,
}

export async function bookmarkRoutes(app: FastifyInstance) {
  app.post('/bookmarks', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId
    const bodyResult = createBookmarkBodySchema.safeParse(request.body)

    if (!bodyResult.success) {
      return reply.code(400).send({
        message: 'Invalid request',
      })
    }

    const body = bodyResult.data

    try {
      const createdBookmarks = await db
        .insert(bookmarks)
        .values({
          userId,
          url: body.url,
          title: body.title,
          note: body.note ?? null,
        })
        .returning(bookmarkSelection)

      const createdBookmark = createdBookmarks[0]

      if (!createdBookmark) {
        throw new Error('Bookmark was not created')
      }

      return reply.code(201).send({
        message: 'Bookmark created successfully',
        data: createdBookmark,
      })
    } catch (error) {
      if (hasPostgresErrorCode(error, '23505')) {
        return reply.code(409).send({
          message: 'Bookmark already exists',
        })
      }

      request.log.error(error)

      return reply.code(500).send({
        message: 'Internal server error',
      })
    }
  })

  app.get('/bookmarks', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId

    try {
      const userBookmarks = await db
        .select(bookmarkSelection)
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId))
        .orderBy(desc(bookmarks.createdAt))

      return {
        data: userBookmarks,
      }
    } catch (error) {
      request.log.error(error)

      return reply.code(500).send({
        message: 'Internal server error',
      })
    }
  })

  app.patch('/bookmarks/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId

    const paramsResult = bookmarkParamsSchema.safeParse(request.params)
    const bodyResult = updateBookmarkBodySchema.safeParse(request.body)

    if (
      !paramsResult.success ||
      !bodyResult.success
    ) {
      return reply.code(400).send({
        message: 'Invalid request',
      })
    }

    const body = bodyResult.data

    try {
      const updatedBookmarks = await db
        .update(bookmarks)
        .set({
          ...(body.url !== undefined ? { url: body.url } : {}),
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.note !== undefined ? { note: body.note } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookmarks.id, paramsResult.data.id),
            eq(bookmarks.userId, userId)
          )
        )
        .returning(bookmarkSelection)

      const updatedBookmark = updatedBookmarks[0]

      if (!updatedBookmark) {
        return reply.code(404).send({
          message: 'Bookmark not found',
        })
      }

      return {
        data: updatedBookmark,
      }
    } catch (error) {
      if (hasPostgresErrorCode(error, '23505')) {
        return reply.code(409).send({
          message: 'Bookmark already exists',
        })
      }

      request.log.error(error)

      return reply.code(500).send({
        message: 'Internal server error',
      })
    }
  })

  app.delete('/bookmarks/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId
    const paramsResult = bookmarkParamsSchema.safeParse(request.params)

    if (!paramsResult.success) {
      return reply.code(400).send({
        message: 'Invalid request',
      })
    }

    try {
      const deletedBookmarks = await db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.id, paramsResult.data.id),
            eq(bookmarks.userId, userId)
          )
        )
        .returning({
          id: bookmarks.id,
        })

      const deletedBookmark = deletedBookmarks[0]

      if (!deletedBookmark) {
        return reply.code(404).send({
          message: 'Bookmark not found',
        })
      }

      return reply.code(204).send()
    } catch (error) {
      request.log.error(error)

      return reply.code(500).send({
        message: 'Internal server error',
      })
    }
  })
}
