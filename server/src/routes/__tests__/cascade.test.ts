import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../app.js'
import { db } from '../../db/index.js'
import { bookmarks, bookmarkTags, tags, users } from '../../db/schema/index.js'
import {
  attachTag,
  createBookmark,
  createTag,
  createUser,
  resetDb,
  type TestUser,
} from '../../test/helpers.js'

type Fixture = {
  user: TestUser
  bookmark: { id: string }
  tag: { id: string }
}

/**
 * Dựng một user có đủ bookmark, tag và liên kết giữa hai bảng đó,
 * để mỗi test thấy được cascade lan tới đâu và dừng ở đâu.
 */
async function seedUser(app: FastifyInstance, slug: string): Promise<Fixture> {
  const user = await createUser(app, `${slug}@example.com`)
  const bookmark = await createBookmark(app, user, {
    url: `https://example.com/${slug}`,
    title: `Bookmark của ${slug}`,
  })
  const tag = await createTag(app, user, `tag-${slug}`)
  await attachTag(app, user, bookmark.id, tag.id)

  return { user, bookmark, tag }
}

/**
 * Cascade là hành vi của Postgres (`ON DELETE CASCADE`), không phải của API — nên
 * assert ở tầng database. Xoá user cũng không có endpoint, phải gọi thẳng `db.delete`.
 *
 * Điểm mấu chốt là cascade phải dừng đúng chỗ: xoá tag KHÔNG được kéo theo bookmark,
 * và ngược lại. Chỉ liên kết trong bảng trung gian mới biến mất.
 */
describe('Cascade khi xoá', () => {
  let app: FastifyInstance
  let a: Fixture
  let b: Fixture

  beforeAll(async () => {
    app = buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDb()
    a = await seedUser(app, 'usera')
    b = await seedUser(app, 'userb')
  })

  it('xoá user thì bookmark, tag và liên kết của user đó biến mất', async () => {
    await db.delete(users).where(eq(users.id, a.user.id))

    expect(await db.select().from(bookmarks).where(eq(bookmarks.userId, a.user.id))).toHaveLength(0)
    expect(await db.select().from(tags).where(eq(tags.userId, a.user.id))).toHaveLength(0)
    expect(
      await db.select().from(bookmarkTags).where(eq(bookmarkTags.bookmarkId, a.bookmark.id))
    ).toHaveLength(0)
  })

  it('xoá user không đụng tới dữ liệu của user khác', async () => {
    await db.delete(users).where(eq(users.id, a.user.id))

    expect(await db.select().from(bookmarks).where(eq(bookmarks.userId, b.user.id))).toHaveLength(1)
    expect(await db.select().from(tags).where(eq(tags.userId, b.user.id))).toHaveLength(1)
    expect(
      await db.select().from(bookmarkTags).where(eq(bookmarkTags.bookmarkId, b.bookmark.id))
    ).toHaveLength(1)
  })

  it('xoá bookmark thì mất liên kết nhưng tag vẫn còn', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/bookmarks/${a.bookmark.id}`,
      cookies: a.user.cookies,
    })
    expect(response.statusCode).toBe(204)

    expect(
      await db.select().from(bookmarkTags).where(eq(bookmarkTags.bookmarkId, a.bookmark.id))
    ).toHaveLength(0)
    expect(await db.select().from(tags).where(eq(tags.id, a.tag.id))).toHaveLength(1)
  })

  it('xoá tag thì mất liên kết nhưng bookmark vẫn còn', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/tags/${a.tag.id}`,
      cookies: a.user.cookies,
    })
    expect(response.statusCode).toBe(204)

    expect(
      await db.select().from(bookmarkTags).where(eq(bookmarkTags.tagId, a.tag.id))
    ).toHaveLength(0)
    expect(await db.select().from(bookmarks).where(eq(bookmarks.id, a.bookmark.id))).toHaveLength(1)
  })
})
