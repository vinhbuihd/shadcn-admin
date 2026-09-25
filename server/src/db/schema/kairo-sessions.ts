import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const kairoSessions = pgTable('kairo_sessions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  authTokenHash: text('auth_token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('kairo_sessions_auth_token_hash_idx').on(table.authTokenHash)])
