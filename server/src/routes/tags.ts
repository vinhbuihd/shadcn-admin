import { and, asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import { tags } from "../db/schema/index.js";
import { hasPostgresErrorCode } from "../lib/postgres-errors.js";

const createTagBodySchema = z.object({
    name: z.string().trim().min(1).max(50),
})

const userIdSchema = z.string().uuid()
const tagParamsSchema = z.object({
    id: z.string().uuid(),
})

export async function tagRoutes(app: FastifyInstance) {
    app.post('/tags', async (request, reply) => {
        const userIdResult = userIdSchema.safeParse(
            request.headers['x-user-id']
        )

        const bodyResult = createTagBodySchema.safeParse(request.body)

        if (!userIdResult.success || !bodyResult.success) {
            return reply.code(400).send({
                message: 'Invalid request',
            })
        }
        const userId = userIdResult.data
        const name = bodyResult.data.name.toLowerCase()

        try {
            // 3. INSERT bằng Drizzle
            const createdTags = await db
                .insert(tags)
                .values({
                    userId,
                    name,
                })
                .returning({
                    id: tags.id,
                    name: tags.name,
                    createdAt: tags.createdAt,
                })

            const createdTag = createdTags[0]

            if (!createdTag) {
                throw new Error('Tag was not created')
            }

            return reply.code(201).send({
                message: 'Tag created successfully',
                data: createdTag
            })
        } catch (error) {

            if (hasPostgresErrorCode(error, '23505')) {
                return reply.code(409).send({
                    message: 'Tag already exists',
                })
            }

            request.log.error(error)

            return reply.code(500).send({
                message: 'Internal server error',
            })
        }

    })


    app.get('/tags', async (request, reply) => {
        const userIdResult = userIdSchema.safeParse(
            request.headers['x-user-id']
        )
        if (!userIdResult.success) {
            return reply.code(400).send({
                message: 'Invalid user ID',
            })
        }
        const userId = userIdResult.data

        try {
            const userTags = await db
                .select({
                    id: tags.id,
                    name: tags.name,
                    createdAt: tags.createdAt,
                    updatedAt: tags.updatedAt,
                })
                .from(tags)
                .where(eq(tags.userId, userId))
                .orderBy(asc(tags.name))

            return {
                data: userTags
            }
        } catch (error) {
            request.log.error(error)

            return reply.code(500).send({
                message: 'Internal server error',
            })
        }
    })

    app.patch('/tags/:id', async (request, reply) => {
        const userIdResult = userIdSchema.safeParse(
            request.headers['x-user-id']
        )
        const paramsResult = tagParamsSchema.safeParse(request.params)
        const bodyResult = createTagBodySchema.safeParse(request.body)

        if (!userIdResult.success || !paramsResult.success || !bodyResult.success) {
            return reply.code(400).send({
                message: 'Invalid request',
            })
        }

        const name = bodyResult.data.name.toLowerCase()

        try {
            const updatedTag = await db.update(tags)
                .set({
                    name,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(tags.id, paramsResult.data.id),
                        eq(tags.userId, userIdResult.data)
                    )
                )
                .returning({
                    id: tags.id,
                    name: tags.name,
                    createdAt: tags.createdAt,
                    updatedAt: tags.updatedAt,
                })

            if (!updatedTag.length) {
                return reply.code(404).send({
                    message: 'Tag not found',
                })
            }

            return {
                data: updatedTag[0]
            }
        } catch (error) {
            if (hasPostgresErrorCode(error, '23505')) {
                return reply.code(409).send({
                    message: 'Tag already exists',
                })
            }

            request.log.error(error)

            return reply.code(500).send({
                message: 'Internal server error',
            })
        }
    })

    app.delete('/tags/:id', async (request, reply) => {
        const userIdResult = userIdSchema.safeParse(
            request.headers['x-user-id']
        )
        const paramsResult = tagParamsSchema.safeParse(request.params)

        if (!userIdResult.success || !paramsResult.success) {
            return reply.code(400).send({
                message: 'Invalid request',
            })
        }

        try {
            const deletedTag = await db.delete(tags)
                .where(
                    and(
                        eq(tags.id, paramsResult.data.id),
                        eq(tags.userId, userIdResult.data)
                    )
                )
                .returning({
                    id: tags.id,
                })

            if (!deletedTag.length) {
                return reply.code(404).send({
                    message: 'Tag not found',
                })
            }

            return reply.status(204).send()
        } catch (error) {

            request.log.error(error)

            return reply.code(500).send({
                message: 'Internal server error',
            })
        }
    })
}
