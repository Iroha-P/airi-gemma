import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const memoryItems = pgTable('memory_items', {
  id: text('id').primaryKey(),
  scope: text('scope').notNull().default('user'),
  type: text('type').notNull().default('note'),
  content: text('content').notNull(),
  summary: text('summary'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  importance: integer('importance').notNull().default(3),
  privacy: text('privacy').notNull().default('local'),
  sourceType: text('source_type').notNull().default('manual'),
  sourceId: text('source_id'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at'),
  accessCount: integer('access_count').notNull().default(0),
  archivedAt: timestamp('archived_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown> | null>().default(null),
})

export type MemoryItemRow = InferSelectModel<typeof memoryItems>
export type NewMemoryItemRow = InferInsertModel<typeof memoryItems>

export const memorySchema = {
  memoryItems,
}
