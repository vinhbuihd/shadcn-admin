import { and, desc, eq, exists, ilike, inArray, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { bookmarks, bookmarkTags, tags } from '../db/schema/index.js'
import { NotFoundError } from '../lib/errors.js'
import { parseOrThrow } from '../lib/validate.js'

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

export async function bookmarkRoutes(app: FastifyInstance) {
  // POST /api/bookmarks
  app.post('/bookmarks', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = parseOrThrow(createBookmarkBodySchema, request.body)

    const createdBookmarks = await db
      .insert(bookmarks)
      .values({
        userId: request.user.userId,
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
  })

  // GET /api/bookmarks
  app.get('/bookmarks', { preHandler: [app.authenticate] }, async (request) => {
    const userId = request.user.userId
    const { search, tagId, page, pageSize } = parseOrThrow(
      listBookmarksQuerySchema,
      request.query
    )

    const conditions = [eq(bookmarks.userId, userId)]

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
      conditions.push(
        exists(
          db
            .select({ id: bookmarkTags.bookmarkId })
            .from(bookmarkTags)
            .where(
              and(
                eq(bookmarkTags.bookmarkId, bookmarks.id),
                eq(bookmarkTags.tagId, tagId)
              )
            )
        )
      )
    }

    const offset = (page - 1) * pageSize

    const userBookmarks = await db
      .select(bookmarkSelection)
      .from(bookmarks)
      .where(and(...conditions))
      .orderBy(desc(bookmarks.createdAt))
      .limit(pageSize)
      .offset(offset)

    const bookmarkIds = userBookmarks.map((bookmark) => bookmark.id)

    // Lấy tag của đúng trang hiện tại bằng một query, rồi gom lại phía JS.
    // Cách này tránh N+1 (mỗi bookmark một query) mà không cần GROUP BY.
    const bookmarkTagRows = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
        tagId: bookmarkTags.tagId,
        tagName: tags.name,
      })
      .from(bookmarkTags)
      .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
      .where(inArray(bookmarkTags.bookmarkId, bookmarkIds))

    const tagsByBookmarkId = new Map<string, Array<{ id: string; name: string }>>()

    for (const row of bookmarkTagRows) {
      const bookmarkTagList = tagsByBookmarkId.get(row.bookmarkId) ?? []
      bookmarkTagList.push({ id: row.tagId, name: row.tagName })
      tagsByBookmarkId.set(row.bookmarkId, bookmarkTagList)
    }

    const data = userBookmarks.map((bookmark) => ({
      ...bookmark,
      tags: tagsByBookmarkId.get(bookmark.id) ?? [],
    }))

    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookmarks)
      .where(and(...conditions))

    const total = countRows[0]?.count ?? 0

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  })

  // PATCH /api/bookmarks/:id
  app.patch('/bookmarks/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = parseOrThrow(bookmarkParamsSchema, request.params)
    const body = parseOrThrow(updateBookmarkBodySchema, request.body)

    const updatedBookmarks = await db
      .update(bookmarks)
      .set({
        ...(body.url !== undefined ? { url: body.url } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, request.user.userId)))
      .returning(bookmarkSelection)

    const updatedBookmark = updatedBookmarks[0]
    if (!updatedBookmark) {
      throw new NotFoundError('Bookmark not found')
    }

    return { data: updatedBookmark }
  })

  // DELETE /api/bookmarks/:id
  app.delete('/bookmarks/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = parseOrThrow(bookmarkParamsSchema, request.params)

    const deletedBookmarks = await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, request.user.userId)))
      .returning({ id: bookmarks.id })

    if (!deletedBookmarks[0]) {
      throw new NotFoundError('Bookmark not found')
    }

    return reply.code(204).send()
  })

  // PUT /api/bookmarks/:bookmarkId/tags/:tagId
  app.put(
    '/bookmarks/:bookmarkId/tags/:tagId',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.userId
      const { bookmarkId, tagId } = parseOrThrow(bookmarkTagParamsSchema, request.params)

      // Transaction vì thao tác đọc hai bảng rồi ghi sang bảng thứ ba: nếu bookmark
      // hoặc tag bị xoá xen giữa, phần đã làm phải được huỷ theo.
      await db.transaction(async (tx) => {
        const foundBookmarks = await tx
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)))
          .limit(1)

        const foundTags = await tx
          .select({ id: tags.id })
          .from(tags)
          .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
          .limit(1)

        // Không phân biệt "không tồn tại" với "của người khác" — cùng trả 404.
        if (foundBookmarks.length === 0 || foundTags.length === 0) {
          throw new NotFoundError('Bookmark or tag not found')
        }

        await tx.insert(bookmarkTags).values({
          bookmarkId,
          tagId,
          createdAt: new Date(),
        })
      })

      return reply.code(200).send({
        message: 'Tag attached to bookmark successfully',
      })
    }
  )

  // DELETE /api/bookmarks/:bookmarkId/tags/:tagId
  app.delete(
    '/bookmarks/:bookmarkId/tags/:tagId',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { bookmarkId, tagId } = parseOrThrow(bookmarkTagParamsSchema, request.params)

      const deletedBookmarkTags = await db
        .delete(bookmarkTags)
        .where(
          and(
            eq(bookmarkTags.bookmarkId, bookmarkId),
            eq(bookmarkTags.tagId, tagId),
            // Chỉ xoá được liên kết thuộc bookmark của chính mình
            inArray(
              bookmarkTags.bookmarkId,
              db
                .select({ id: bookmarks.id })
                .from(bookmarks)
                .where(eq(bookmarks.userId, request.user.userId))
            )
          )
        )
        .returning({
          bookmarkId: bookmarkTags.bookmarkId,
          tagId: bookmarkTags.tagId,
        })

      if (!deletedBookmarkTags[0]) {
        throw new NotFoundError('Bookmark tag not found')
      }

      return reply.code(204).send()
    }
  )
}
