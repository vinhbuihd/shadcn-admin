import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookmarks } from './bookmarks.js';
import { tags } from './tags.js';

export const bookmarkTags = pgTable('bookmark_tags', {
    bookmarkId: uuid("bookmark_id").notNull().references(() => bookmarks.id, { onDelete: 'cascade' }),
    tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    primaryKey({
        columns: [table.bookmarkId, table.tagId],
    }),
    index('bookmark_tags_tag_id_idx').on(table.tagId)
]);