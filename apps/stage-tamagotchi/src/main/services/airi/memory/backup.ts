import type {
  ElectronMemoryCreateRequest,
  ElectronMemoryItem,
} from '../../../../shared/eventa'
import type { MemorySafetyFinding } from './safety'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { hasMemorySafetyRisk, scanMemoryCandidateSafety } from './safety'

const BACKUP_SCHEMA_VERSION = 1
const BACKUP_FILE_NAME = 'airi-memory-backup.json'

interface MemoryBackupItem {
  id: string
  scope: string
  type: ElectronMemoryItem['type']
  content: string
  summary?: string | null
  tags: string[]
  importance: number
  privacy: ElectronMemoryItem['privacy']
  sourceType: string
  sourceId?: string | null
  status: ElectronMemoryItem['status']
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
  metadata?: Record<string, unknown> | null
}

interface MemoryBackupFile {
  schemaVersion: number
  exportedAt: string
  items: MemoryBackupItem[]
}

export interface MemoryBackupExportRequest {
  memories: ElectronMemoryItem[]
  outputDir: string
}

export interface MemoryBackupExportResult {
  outputDir: string
  files: Array<{
    relativePath: string
    path: string
    count: number
  }>
  exportedAt: string
}

export interface MemoryBackupImportRequest {
  backupFile: string
  selectedOriginalIds?: string[]
  createMemory: (request: ElectronMemoryCreateRequest) => Promise<ElectronMemoryItem>
}

export interface MemoryBackupImportResult {
  backupFile: string
  imported: ElectronMemoryItem[]
  skipped: Array<{
    index: number
    reason: 'empty_content' | 'not_selected'
  }>
  importedAt: string
}

export interface MemoryBackupPreviewConflict {
  kind: 'duplicate' | 'conflict'
  itemId: string
  score: number
  reason: string
}

export interface MemoryBackupPreviewItem {
  index: number
  originalId: string
  type: ElectronMemoryItem['type']
  privacy: ElectronMemoryItem['privacy']
  status: ElectronMemoryItem['status']
  sourceType: string
  sourceId?: string | null
  createdAt: string
  summary?: string | null
  contentPreview: string
  tags: string[]
  empty: boolean
  safetyRisk: boolean
  safetyFindings: MemorySafetyFinding[]
  conflicts: MemoryBackupPreviewConflict[]
}

export interface MemoryBackupPreviewRequest {
  backupFile: string
  detectConflicts?: (request: ElectronMemoryCreateRequest) => Promise<{
    findings: Array<{
      kind: 'duplicate' | 'conflict'
      item: ElectronMemoryItem
      score: number
      reason: string
    }>
  }>
}

export interface MemoryBackupPreviewResult {
  backupFile: string
  schemaVersion: number
  exportedAt: string
  total: number
  items: MemoryBackupPreviewItem[]
}

async function readBackupFile(backupFile: string) {
  const backup = JSON.parse(await readFile(backupFile, 'utf8')) as unknown
  assertBackupFile(backup)
  return backup
}

function toBackupItem(memory: ElectronMemoryItem): MemoryBackupItem {
  return {
    id: memory.id,
    scope: memory.scope,
    type: memory.type,
    content: memory.content,
    summary: memory.summary ?? null,
    tags: memory.tags,
    importance: memory.importance,
    privacy: memory.privacy,
    sourceType: memory.sourceType,
    sourceId: memory.sourceId ?? null,
    status: memory.status,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    archivedAt: memory.archivedAt ?? null,
    metadata: memory.metadata ?? null,
  }
}

function assertBackupFile(value: unknown): asserts value is MemoryBackupFile {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid memory backup file')

  const backup = value as Partial<MemoryBackupFile>
  if (backup.schemaVersion !== BACKUP_SCHEMA_VERSION)
    throw new Error(`Unsupported memory backup schema version: ${String(backup.schemaVersion)}`)
  if (!Array.isArray(backup.items))
    throw new Error('Invalid memory backup items')
}

function mergeRestoredMetadata(item: MemoryBackupItem): Record<string, unknown> {
  const safety = scanMemoryCandidateSafety({
    content: item.content,
    summary: item.summary ?? null,
  })

  return {
    ...item.metadata,
    ...(!safety.safe ? { safety } : {}),
    restoredFromBackup: {
      originalId: item.id,
      originalStatus: item.status,
      originalCreatedAt: item.createdAt,
    },
  }
}

function toCreateRequest(item: MemoryBackupItem): ElectronMemoryCreateRequest {
  const safetyRisk = hasMemorySafetyRisk({
    content: item.content,
    metadata: item.metadata,
    summary: item.summary ?? null,
  })

  return {
    scope: item.scope,
    type: item.type,
    content: item.content,
    summary: item.summary ?? null,
    tags: [...new Set([...item.tags, 'restored-backup', ...(safetyRisk ? ['safety-review'] : [])])],
    importance: item.importance,
    privacy: safetyRisk ? 'secret' : item.privacy,
    sourceType: item.sourceType,
    sourceId: item.sourceId ?? null,
    status: 'needs_review',
    metadata: mergeRestoredMetadata(item),
  }
}

function toConflictRequest(item: MemoryBackupItem): ElectronMemoryCreateRequest {
  return {
    scope: item.scope,
    type: item.type,
    content: item.content,
    summary: item.summary ?? null,
    tags: item.tags,
    importance: item.importance,
    privacy: item.privacy,
    sourceType: item.sourceType,
    sourceId: item.sourceId ?? null,
    metadata: item.metadata ?? null,
  }
}

function getContentPreview(content: string) {
  const normalized = content.trim().replace(/\s+/g, ' ')
  if (normalized.length <= 120)
    return normalized
  return `${normalized.slice(0, 117)}...`
}

export async function exportMemoryBackup(request: MemoryBackupExportRequest): Promise<MemoryBackupExportResult> {
  await mkdir(request.outputDir, { recursive: true })

  const exportedAt = new Date().toISOString()
  const backup: MemoryBackupFile = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    items: request.memories.map(toBackupItem),
  }
  const path = join(request.outputDir, BACKUP_FILE_NAME)

  await writeFile(path, `${JSON.stringify(backup, null, 2)}\n`, 'utf8')

  return {
    outputDir: request.outputDir,
    files: [{
      relativePath: BACKUP_FILE_NAME,
      path,
      count: backup.items.length,
    }],
    exportedAt,
  }
}

export async function previewMemoryBackup(request: MemoryBackupPreviewRequest): Promise<MemoryBackupPreviewResult> {
  const backup = await readBackupFile(request.backupFile)
  const items: MemoryBackupPreviewItem[] = []

  for (const [index, item] of backup.items.entries()) {
    const empty = item.content.trim().length === 0
    const safety = scanMemoryCandidateSafety({
      content: item.content,
      summary: item.summary ?? null,
    })
    const safetyRisk = hasMemorySafetyRisk({
      content: item.content,
      metadata: item.metadata,
      summary: item.summary ?? null,
    })
    const conflictResult = !empty && request.detectConflicts
      ? await request.detectConflicts(toConflictRequest(item))
      : { findings: [] }

    items.push({
      index,
      originalId: item.id,
      type: item.type,
      privacy: item.privacy,
      status: item.status,
      sourceType: item.sourceType,
      sourceId: item.sourceId ?? null,
      createdAt: item.createdAt,
      summary: item.summary ?? null,
      contentPreview: getContentPreview(item.content),
      tags: item.tags,
      empty,
      safetyRisk,
      safetyFindings: safety.findings,
      conflicts: conflictResult.findings.map(finding => ({
        kind: finding.kind,
        itemId: finding.item.id,
        score: finding.score,
        reason: finding.reason,
      })),
    })
  }

  return {
    backupFile: request.backupFile,
    schemaVersion: backup.schemaVersion,
    exportedAt: backup.exportedAt,
    total: backup.items.length,
    items,
  }
}

export async function importMemoryBackup(request: MemoryBackupImportRequest): Promise<MemoryBackupImportResult> {
  const importedAt = new Date().toISOString()
  const backup = await readBackupFile(request.backupFile)
  const selectedOriginalIds = request.selectedOriginalIds
    ? new Set(request.selectedOriginalIds)
    : null

  const imported: ElectronMemoryItem[] = []
  const skipped: MemoryBackupImportResult['skipped'] = []

  for (const [index, item] of backup.items.entries()) {
    if (selectedOriginalIds && !selectedOriginalIds.has(item.id)) {
      skipped.push({ index, reason: 'not_selected' })
      continue
    }

    if (!item.content.trim()) {
      skipped.push({ index, reason: 'empty_content' })
      continue
    }

    imported.push(await request.createMemory(toCreateRequest(item)))
  }

  return {
    backupFile: request.backupFile,
    imported,
    skipped,
    importedAt,
  }
}
