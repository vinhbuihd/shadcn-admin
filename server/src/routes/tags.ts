import { and, asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import { tags } from "../db/schema/index.js";
import { NotFoundError } from "../lib/errors.js";
import { parseOrThrow } from "../lib/validate.js";

const createTagBodySchema = z.object({
    name: z.string().trim().min(1).max(50),
})

const tagParamsSchema = z.object({
    id: z.string().uuid(),
})

const tagSelection = {
    id: tags.id,
    name: tags.name,
    createdAt: tags.createdAt,
    updatedAt: tags.updatedAt,
}

export async function tagRoutes(app: FastifyInstance) {
    // POST /api/tags
    app.post('/tags', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { name } = parseOrThrow(createTagBodySchema, request.body)

        const createdTags = await db
            .insert(tags)
            .values({
                userId: request.user.userId,
                name: name.toLowerCase(),
            })
            .returning(tagSelection)

        const createdTag = createdTags[0]
        if (!createdTag) {
            throw new Error('Tag was not created')
        }

        return reply.code(201).send({
            message: 'Tag created successfully',
            data: createdTag,
        })
    })

    // GET /api/tags
    app.get('/tags', { preHandler: [app.authenticate] }, async (request) => {
        const userTags = await db
            .select(tagSelection)
            .from(tags)
            .where(eq(tags.userId, request.user.userId))
            .orderBy(asc(tags.name))

        return { data: userTags }
    })

    // PATCH /api/tags/:id
    app.patch('/tags/:id', { preHandler: [app.authenticate] }, async (request) => {
        const { id } = parseOrThrow(tagParamsSchema, request.params)
        const { name } = parseOrThrow(createTagBodySchema, request.body)

        // Điều kiện `userId` vừa là bộ lọc vừa là kiểm tra quyền: tag của người khác
        // không khớp dòng nào, nên trả 404 chứ không phải 403.
        const updatedTags = await db.update(tags)
            .set({
                name: name.toLowerCase(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(tags.id, id),
                    eq(tags.userId, request.user.userId)
                )
            )
            .returning(tagSelection)

        const updatedTag = updatedTags[0]
        if (!updatedTag) {
            throw new NotFoundError('Tag not found')
        }

        return { data: updatedTag }
    })

    // DELETE /api/tags/:id
    app.delete('/tags/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id } = parseOrThrow(tagParamsSchema, request.params)

        const deletedTags = await db.delete(tags)
            .where(
                and(
                    eq(tags.id, id),
                    eq(tags.userId, request.user.userId)
                )
            )
            .returning({ id: tags.id })

        if (!deletedTags[0]) {
            throw new NotFoundError('Tag not found')
        }

        return reply.code(204).send()
    })
}
