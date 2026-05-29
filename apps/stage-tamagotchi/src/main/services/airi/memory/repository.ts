import type { SQL } from 'drizzle-orm'

import type {
  ElectronMemoryCreateRequest,
  ElectronMemoryItem,
  ElectronMemoryListRequest,
  ElectronMemoryPrivacy,
  ElectronMemoryStatus,
  ElectronMemoryType,
  ElectronMemoryUpdateRequest,
} from '../../../../shared/eventa'
import type { MemoryDatabase } from './database'
import type { MemoryItemRow, NewMemoryItemRow } from './schema'

import { randomUUID } from 'node:crypto'

import { and, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'

import { hasMemorySafetyRisk, scanMemoryCandidateSafety } from './safety'
import { memoryItems } from './schema'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function now() {
  return new Date()
}

function toIso(value: Date | string | null | undefined) {
  if (!value)
    return null
  if (value instanceof Date)
    return value.toISOString()
  return new Date(value).toISOString()
}

function clampImportance(value: number | undefined) {
  if (value === undefined)
    return 3
  return Math.min(5, Math.max(1, Math.round(value)))
}

function normalizeTags(tags: string[] | undefined) {
  return [...new Set((tags ?? []).map(tag => tag.trim()).filter(Boolean))]
}

function normalizeMetadata(metadata: Record<string, unknown> | null | undefined) {
  return metadata ?? null
}

function safetyAdjustedWrite(values: {
  content: string
  metadata: Record<string, unknown> | null | undefined
  privacy: ElectronMemoryPrivacy
  summary: string | null
  status: ElectronMemoryStatus
  tags: string[]
}) {
  const metadata = normalizeMetadata(values.metadata)
  const safety = scanMemoryCandidateSafety({
    content: values.content,
    summary: values.summary,
  })
  const safetyRisk = hasMemorySafetyRisk({
    content: values.content,
    metadata,
    summary: values.summary,
  })

  if (!safetyRisk) {
    return {
      privacy: values.privacy,
      status: values.status,
      tags: values.tags,
      metadata,
    }
  }

  return {
    privacy: 'secret' as const,
    status: values.status === 'active' ? 'needs_review' as const : values.status,
    tags: normalizeTags([...values.tags, 'safety-review']),
    metadata: {
      ...metadata,
      ...(!safety.safe ? { safety } : {}),
    },
  }
}

function normalizeLimit(limit: number | undefined) {
  if (!limit)
    return DEFAULT_LIMIT
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(limit)))
}

function assertContent(content: string) {
  if (!content.trim()) {
    throw new Error('Memory content cannot be empty')
  }
}

function serializeMemoryItem(row: MemoryItemRow): ElectronMemoryItem {
  return {
    id: row.id,
    scope: row.scope,
    type: row.type as ElectronMemoryType,
    content: row.content,
    summary: row.summary,
    tags: Array.isArray(row.tags) ? row.tags : [],
    importance: row.importance,
    privacy: row.privacy as ElectronMemoryPrivacy,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    status: row.status as ElectronMemoryStatus,
    createdAt: toIso(row.createdAt)!,
    updatedAt: toIso(row.updatedAt)!,
    lastAccessedAt: toIso(row.lastAccessedAt),
    accessCount: row.accessCount,
    archivedAt: toIso(row.archivedAt),
    metadata: row.metadata,
  }
}

function buildListFilters(request: ElectronMemoryListRequest | undefined) {
  const filters: SQL[] = []
  const query = request?.query?.trim()

  if (query) {
    const pattern = `%${query}%`
    filters.push(or(
      ilike(memoryItems.content, pattern),
      ilike(memoryItems.summary, pattern),
    )!)
  }

  if (request?.status)
    filters.push(eq(memoryItems.status, request.status))
  if (request?.type)
    filters.push(eq(memoryItems.type, request.type))
  if (request?.privacy)
    filters.push(eq(memoryItems.privacy, request.privacy))

  return filters
}

function definedUpdate(values: Partial<NewMemoryItemRow>) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<NewMemoryItemRow>
}

export function createMemoryRepository(database: MemoryDatabase) {
  async function getStatus() {
    const [{ value: total }] = await database.db.select({ value: count() }).from(memoryItems)
    const [{ value: active }] = await database.db.select({ value: count() }).from(memoryItems).where(eq(memoryItems.status, 'active'))
    const [{ value: needsReview }] = await database.db.select({ value: count() }).from(memoryItems).where(eq(memoryItems.status, 'needs_review'))
    const [{ value: archived }] = await database.db.select({ value: count() }).from(memoryItems).where(eq(memoryItems.status, 'archived'))

    return {
      path: database.path,
      total: Number(total),
      active: Number(active),
      needsReview: Number(needsReview),
      archived: Number(archived),
      updatedAt: now().toISOString(),
    }
  }

  async function list(request?: ElectronMemoryListRequest) {
    const filters = buildListFilters(request)
    const query = database.db
      .select()
      .from(memoryItems)
      .$dynamic()

    if (filters.length > 0)
      query.where(and(...filters))

    const rows = await query
      .orderBy(desc(memoryItems.updatedAt))
      .limit(normalizeLimit(request?.limit))

    if (!request?.trackAccess || rows.length === 0)
      return rows.map(serializeMemoryItem)

    const accessedAt = now()
    const ids = rows.map(row => row.id)

    await database.db
      .update(memoryItems)
      .set({
        lastAccessedAt: accessedAt,
        accessCount: sql`${memoryItems.accessCount} + 1`,
      })
      .where(inArray(memoryItems.id, ids))

    const accessedRows = await database.db
      .select()
      .from(memoryItems)
      .where(inArray(memoryItems.id, ids))

    const accessedById = new Map(accessedRows.map(row => [row.id, row]))
    return rows.map(row => serializeMemoryItem(accessedById.get(row.id) ?? row))
  }

  async function get(id: string) {
    const [row] = await database.db
      .select()
      .from(memoryItems)
      .where(eq(memoryItems.id, id))
      .limit(1)

    if (!row)
      throw new Error(`Memory item not found: ${id}`)

    return serializeMemoryItem(row)
  }

  async function listAll() {
    const rows = await database.db
      .select()
      .from(memoryItems)
      .orderBy(desc(memoryItems.updatedAt))

    return rows.map(serializeMemoryItem)
  }

  async function create(request: ElectronMemoryCreateRequest) {
    assertContent(request.content)

    const createdAt = now()
    const content = request.content.trim()
    const summary = request.summary?.trim() || null
    const adjusted = safetyAdjustedWrite({
      content,
      metadata: request.metadata ?? null,
      privacy: request.privacy ?? 'local',
      summary,
      status: request.status ?? 'active',
      tags: normalizeTags(request.tags),
    })
    const [row] = await database.db.insert(memoryItems).values({
      id: randomUUID(),
      scope: request.scope?.trim() || 'user',
      type: request.type ?? 'note',
      content,
      summary,
      tags: adjusted.tags,
      importance: clampImportance(request.importance),
      privacy: adjusted.privacy,
      sourceType: request.sourceType?.trim() || 'manual',
      sourceId: request.sourceId?.trim() || null,
      status: adjusted.status,
      createdAt,
      updatedAt: createdAt,
      metadata: adjusted.metadata,
    }).returning()

    return serializeMemoryItem(row)
  }

  async function update(request: ElectronMemoryUpdateRequest) {
    const existing = await database.db
      .select()
      .from(memoryItems)
      .where(eq(memoryItems.id, request.id))
      .limit(1)

    if (!existing[0]) {
      throw new Error(`Memory item not found: ${request.id}`)
    }

    if (request.content !== undefined)
      assertContent(request.content)

    const existingItem = serializeMemoryItem(existing[0])
    const content = request.content?.trim() ?? existingItem.content
    const summary: string | null = request.summary === undefined ? existingItem.summary ?? null : request.summary?.trim() || null
    const tags = request.tags === undefined ? existingItem.tags : normalizeTags(request.tags)
    const privacy = request.privacy ?? existingItem.privacy
    const status = request.status ?? existingItem.status
    const metadata = request.metadata === undefined ? existingItem.metadata : request.metadata
    const adjusted = safetyAdjustedWrite({
      content,
      metadata,
      privacy,
      summary,
      status,
      tags,
    })
    const updates = definedUpdate({
      scope: request.scope?.trim(),
      type: request.type,
      content: request.content === undefined ? undefined : content,
      summary: request.summary === undefined ? undefined : summary,
      tags: adjusted.tags,
      importance: request.importance === undefined ? undefined : clampImportance(request.importance),
      privacy: adjusted.privacy,
      sourceType: request.sourceType?.trim(),
      sourceId: request.sourceId === undefined ? undefined : request.sourceId?.trim() || null,
      status: adjusted.status,
      archivedAt: request.status === 'archived' ? now() : undefined,
      updatedAt: now(),
      metadata: adjusted.metadata,
    })

    const [row] = await database.db
      .update(memoryItems)
      .set(updates)
      .where(eq(memoryItems.id, request.id))
      .returning()

    return serializeMemoryItem(row)
  }

  async function remove(id: string) {
    await database.db.delete(memoryItems).where(eq(memoryItems.id, id))
  }

  async function clear() {
    const status = await getStatus()
    await database.db.delete(memoryItems)
    return { deleted: status.total }
  }

  return {
    getStatus,
    list,
    listAll,
    get,
    create,
    update,
    delete: remove,
    clear,
  }
}

export type MemoryRepository = ReturnType<typeof createMemoryRepository>
