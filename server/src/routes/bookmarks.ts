import { and, desc, eq, exists, ilike, inArray, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { bookmarks, bookmarkTags, tags } from '../db/schema/index.js'
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

const bookmarkTagParamsSchema = z.object({
  bookmarkId: z.string().uuid(),
  tagId: z.string().uuid(),
})



const bookmarkSelection = {
  id: bookmarks.id,
  url: bookmarks.url,
  title: bookmarks.title,
  note: bookmarks.note,
  createdAt: bookmarks.createdAt,
  updatedAt: bookmarks.updatedAt,
}

const listBookmarksQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  tagId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})


class NotFoundError extends Error { }

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

    const conditions = [eq(bookmarks.userId, userId)]

    const queryResult = listBookmarksQuerySchema.safeParse(request.query)
    if (!queryResult.success) {
      return reply.code(400).send({
        message: 'Invalid query parameters',
      })
    }

    const { search, tagId, page, pageSize } = queryResult.data
    if (search) {
      const searchCondition = or(
        ilike(bookmarks.title, `%${search}%`),
        ilike(bookmarks.note, `%${search}%`)
      )

      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    if (tagId) {
      conditions.push(exists(db.select({ id: bookmarkTags.bookmarkId }).from(bookmarkTags).where(
        and(
          eq(bookmarkTags.bookmarkId, bookmarks.id),
          eq(bookmarkTags.tagId, tagId)
        )
      )))
    }

    const offset = (page - 1) * pageSize

    try {
      const userBookmarks = await db
        .select(bookmarkSelection)
        .from(bookmarks)
        .where(and(...conditions))
        .orderBy(desc(bookmarks.createdAt))
        .limit(pageSize).offset(offset)

      const bookmarkIds = userBookmarks.map(b => b.id)

      // Lấy các bookmarkTags mà bookmarkId nằm trong bookmarkIds sau đó join với tags để lấy thông tin tag (name)
      const bookmarkTagsWithTagInfo = await db.select({
        bookmarkId: bookmarkTags.bookmarkId,
        tagId: bookmarkTags.tagId,
        tagName: tags.name
      }).from(bookmarkTags).innerJoin(tags, eq(bookmarkTags.tagId, tags.id)).where(inArray(bookmarkTags.bookmarkId, bookmarkIds))


      // Tạo một map từ bookmarkId đến danh sách tags
      const tagsByBookmarkId = new Map()

      for (const row of bookmarkTagsWithTagInfo) {
        if (!tagsByBookmarkId.has(row.bookmarkId)) {
          tagsByBookmarkId.set(row.bookmarkId, [])
        }
        tagsByBookmarkId.get(row.bookmarkId)!.push({
          id: row.tagId,
          name: row.tagName
        })
      }

      const data = userBookmarks.map((b) => ({
        ...b,
        tags: tagsByBookmarkId.get(b.id) ?? [],
      }))

      const [countRows] = await db.select({ count: sql<number>`count(*)::int` }).from(bookmarks).where(and(...conditions))

      const total = countRows?.count ?? 0

      return {
        data,
        meta: {
          page, pageSize, total, totalPages: Math.ceil(total / pageSize)
        }
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

  app.put('/bookmarks/:bookmarkId/tags/:tagId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId
    const paramsResult = bookmarkTagParamsSchema.safeParse(request.params)
    // check bookmarkId and tagId are valid uuid
    if (!paramsResult.success) {
      return reply.code(400).send({
        message: 'Invalid request',
      })
    }

    const { bookmarkId, tagId } = paramsResult.data

    try {

      await db.transaction(async (tx) => {
        // check if bookmark exists and tag exists  and belongs to the user
        const foundBookmarks = await tx.select().from(bookmarks).where(
          and(
            eq(bookmarks.id, bookmarkId),
            eq(bookmarks.userId, userId)
          )
        ).limit(1)

        // check tag exists and belongs to the user
        const foundTags = await tx.select().from(tags).where(
          and(
            eq(tags.id, tagId),
            eq(tags.userId, userId)
          )
        ).limit(1)

        if (foundBookmarks.length === 0 || foundTags.length === 0) {
          throw new NotFoundError()   // ← xem giải thích bên dưới

        }

        await tx.insert(bookmarkTags).values({
          bookmarkId, tagId, createdAt: new Date()
        })

      })

      return reply.code(200).send({
        message: 'Tag attached to bookmark successfully',
      })

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ message: 'Bookmark or tag not found' })
      }

      if (hasPostgresErrorCode(error, '23505')) {
        return reply.code(409).send({ message: 'Bookmark tag already exists' })
      }


      request.log.error(error)

      return reply.code(500).send({
        message: 'Internal server error',
      })
    }
  })


  app.delete('/bookmarks/:bookmarkId/tags/:tagId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.userId
    const paramsResult = bookmarkTagParamsSchema.safeParse(request.params)
    // check bookmarkId and tagId are valid uuid
    if (!paramsResult.success) {
      return reply.code(400).send({
        message: 'Invalid request',
      })
    }

    const { bookmarkId, tagId } = paramsResult.data

    try {
      const deletedBookmarkTags = await db
        .delete(bookmarkTags)
        .where(
          and(
            eq(bookmarkTags.bookmarkId, bookmarkId),
            eq(bookmarkTags.tagId, tagId),
            inArray(bookmarkTags.bookmarkId, db.select({ id: bookmarks.id }).from(bookmarks).where(eq(bookmarks.userId, userId)))
          )
        )
        .returning({
          bookmarkId: bookmarkTags.bookmarkId,
          tagId: bookmarkTags.tagId,
        })

      const deletedBookmarkTag = deletedBookmarkTags[0]

      if (!deletedBookmarkTag) {
        return reply.code(404).send({
          message: 'Bookmark tag not found',
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


