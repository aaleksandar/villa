import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core'

/**
 * Nicknames table
 * Maps wallet addresses to human-readable nicknames
 */
export const nicknames = pgTable('nicknames', {
  id: serial('id').primaryKey(),
  address: varchar('address', { length: 42 }).notNull().unique(),
  nickname: varchar('nickname', { length: 32 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
})

export type Nickname = typeof nicknames.$inferSelect
export type NewNickname = typeof nicknames.$inferInsert
