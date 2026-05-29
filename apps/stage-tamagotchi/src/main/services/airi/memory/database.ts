import type { PGlite } from '@electric-sql/pglite'

import { mkdir } from 'node:fs/promises'

import { PGlite as PGliteClient } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'

import { memorySchema } from './schema'

export async function migrateMemoryDatabase(client: PGlite) {
  await client.exec(`
    CREATE TABLE IF NOT EXISTS memory_items (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL DEFAULT 'user',
      type TEXT NOT NULL DEFAULT 'note',
      content TEXT NOT NULL,
      summary TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      importance INTEGER NOT NULL DEFAULT 3,
      privacy TEXT NOT NULL DEFAULT 'local',
      source_type TEXT NOT NULL DEFAULT 'manual',
      source_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_accessed_at TIMESTAMPTZ,
      access_count INTEGER NOT NULL DEFAULT 0,
      archived_at TIMESTAMPTZ,
      metadata JSONB DEFAULT NULL
    );

    CREATE INDEX IF NOT EXISTS memory_items_status_idx ON memory_items (status);
    CREATE INDEX IF NOT EXISTS memory_items_type_idx ON memory_items (type);
    CREATE INDEX IF NOT EXISTS memory_items_privacy_idx ON memory_items (privacy);
    CREATE INDEX IF NOT EXISTS memory_items_updated_at_idx ON memory_items (updated_at);
  `)
}

export async function createMemoryDatabase(options: {
  dataDir?: string
  client?: PGlite
} = {}) {
  if (options.dataDir) {
    await mkdir(options.dataDir, { recursive: true })
  }

  const client = options.client ?? new PGliteClient(options.dataDir)
  await client.waitReady
  await migrateMemoryDatabase(client)

  const db = drizzle(client, { schema: memorySchema })

  return {
    client,
    db,
    path: options.dataDir ?? ':memory:',
    async close() {
      await client.close()
    },
  }
}

export type MemoryDatabase = Awaited<ReturnType<typeof createMemoryDatabase>>
