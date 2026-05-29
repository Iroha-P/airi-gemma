import type { ElectronMemoryCreateRequest, ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { exportMemoryBackup, importMemoryBackup, previewMemoryBackup } from './backup'

describe('memory backup', () => {
  let outputDir: string

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'airi-memory-backup-'))
  })

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true })
  })

  it('exports a versioned JSON backup without access counters', async () => {
    const result = await exportMemoryBackup({
      outputDir,
      memories: [
        memory({
          id: 'memory-profile',
          content: 'User is preparing algorithm interviews.',
          type: 'profile',
          accessCount: 9,
          lastAccessedAt: '2026-05-12T01:00:00.000Z',
          metadata: { profileVisibility: 'training_sanitized' },
        }),
      ],
    })

    expect(result.files).toEqual([
      expect.objectContaining({ relativePath: 'airi-memory-backup.json', count: 1 }),
    ])

    const json = JSON.parse(await readFile(join(outputDir, 'airi-memory-backup.json'), 'utf8')) as {
      schemaVersion: number
      exportedAt: string
      items: Array<Record<string, unknown>>
    }

    expect(json.schemaVersion).toBe(1)
    expect(json.exportedAt).toBe(result.exportedAt)
    expect(json.items).toEqual([
      expect.objectContaining({
        id: 'memory-profile',
        content: 'User is preparing algorithm interviews.',
        type: 'profile',
        metadata: { profileVisibility: 'training_sanitized' },
      }),
    ])
    expect(json.items[0]).not.toHaveProperty('accessCount')
    expect(json.items[0]).not.toHaveProperty('lastAccessedAt')
  })

  it('imports backup items as needs-review memories and preserves the original id in metadata', async () => {
    await exportMemoryBackup({
      outputDir,
      memories: [
        memory({
          id: 'memory-project',
          content: 'AIRI memory backup should support migration.',
          type: 'project',
          privacy: 'sensitive',
          sourceType: 'knowledge_base',
          sourceId: 'obsidian',
          tags: ['migration'],
          metadata: { file: { name: 'migration.md' } },
        }),
      ],
    })

    const createMemory = vi.fn(async (request: ElectronMemoryCreateRequest) => memory({
      id: 'new-memory',
      ...request,
      tags: request.tags ?? [],
      importance: request.importance ?? 3,
      summary: request.summary ?? null,
      sourceId: request.sourceId ?? null,
      metadata: request.metadata ?? null,
      status: request.status ?? 'active',
      privacy: request.privacy ?? 'local',
      sourceType: request.sourceType ?? 'manual',
      type: request.type ?? 'note',
    }))

    const result = await importMemoryBackup({
      backupFile: join(outputDir, 'airi-memory-backup.json'),
      createMemory,
    })

    expect(result.imported).toHaveLength(1)
    expect(createMemory).toHaveBeenCalledWith({
      scope: 'user',
      type: 'project',
      content: 'AIRI memory backup should support migration.',
      summary: null,
      tags: ['migration', 'restored-backup'],
      importance: 3,
      privacy: 'sensitive',
      sourceType: 'knowledge_base',
      sourceId: 'obsidian',
      status: 'needs_review',
      metadata: {
        file: { name: 'migration.md' },
        restoredFromBackup: {
          originalId: 'memory-project',
          originalStatus: 'active',
          originalCreatedAt: '2026-05-12T00:00:00.000Z',
        },
      },
    })
  })

  it('rescans restored backup items and keeps unsafe content in safety review', async () => {
    await exportMemoryBackup({
      outputDir,
      memories: [
        memory({
          id: 'unsafe-backup',
          content: 'Restored path C:\\Users\\me\\private-chat.txt must be reviewed.',
          privacy: 'local',
          tags: ['migration'],
        }),
      ],
    })

    const createMemory = vi.fn(async (request: ElectronMemoryCreateRequest) => memory({
      id: 'restored-unsafe',
      ...request,
      tags: request.tags ?? [],
      importance: request.importance ?? 3,
      summary: request.summary ?? null,
      sourceId: request.sourceId ?? null,
      metadata: request.metadata ?? null,
      status: request.status ?? 'active',
      privacy: request.privacy ?? 'local',
      sourceType: request.sourceType ?? 'manual',
      type: request.type ?? 'note',
    }))

    await importMemoryBackup({
      backupFile: join(outputDir, 'airi-memory-backup.json'),
      createMemory,
    })

    expect(createMemory).toHaveBeenCalledWith(expect.objectContaining({
      privacy: 'secret',
      status: 'needs_review',
      tags: ['migration', 'restored-backup', 'safety-review'],
      metadata: expect.objectContaining({
        safety: expect.objectContaining({
          safe: false,
          findings: expect.arrayContaining([
            expect.objectContaining({ kind: 'local_path' }),
          ]),
        }),
        restoredFromBackup: expect.objectContaining({
          originalId: 'unsafe-backup',
        }),
      }),
    }))
  })

  it('rescans restored backup summaries before import and preview', async () => {
    await exportMemoryBackup({
      outputDir,
      memories: [
        memory({
          id: 'unsafe-summary-backup',
          content: 'Plain restored memory.',
          privacy: 'local',
          summary: 'Imported from C:\\Users\\me\\private-summary.txt',
          tags: ['migration'],
        }),
      ],
    })

    const createMemory = vi.fn(async (request: ElectronMemoryCreateRequest) => memory({
      id: 'restored-unsafe-summary',
      ...request,
      tags: request.tags ?? [],
      importance: request.importance ?? 3,
      summary: request.summary ?? null,
      sourceId: request.sourceId ?? null,
      metadata: request.metadata ?? null,
      status: request.status ?? 'active',
      privacy: request.privacy ?? 'local',
      sourceType: request.sourceType ?? 'manual',
      type: request.type ?? 'note',
    }))
    const backupFile = join(outputDir, 'airi-memory-backup.json')

    const preview = await previewMemoryBackup({ backupFile })
    await importMemoryBackup({ backupFile, createMemory })

    expect(preview.items[0]).toEqual(expect.objectContaining({
      originalId: 'unsafe-summary-backup',
      safetyRisk: true,
      safetyFindings: expect.arrayContaining([
        expect.objectContaining({ kind: 'local_path' }),
      ]),
    }))
    expect(createMemory).toHaveBeenCalledWith(expect.objectContaining({
      privacy: 'secret',
      tags: ['migration', 'restored-backup', 'safety-review'],
      metadata: expect.objectContaining({
        safety: expect.objectContaining({
          safe: false,
          findings: expect.arrayContaining([
            expect.objectContaining({ kind: 'local_path' }),
          ]),
        }),
      }),
    }))
  })

  it('previews backup items with compact conflict summaries', async () => {
    await exportMemoryBackup({
      outputDir,
      memories: [
        memory({
          id: 'duplicate-profile',
          content: 'User is preparing algorithm interviews.',
          type: 'profile',
          privacy: 'local',
          tags: ['career'],
        }),
        memory({
          id: 'empty-memory',
          content: ' ',
          type: 'note',
        }),
      ],
    })

    const detectConflicts = vi.fn(async () => ({
      findings: [{
        kind: 'duplicate' as const,
        item: memory({ id: 'existing-profile' }),
        score: 0.98,
        reason: '候选记忆与已有记忆高度重复。',
      }],
    }))

    const result = await previewMemoryBackup({
      backupFile: join(outputDir, 'airi-memory-backup.json'),
      detectConflicts,
    })

    expect(result.total).toBe(2)
    expect(result.items).toEqual([
      expect.objectContaining({
        index: 0,
        originalId: 'duplicate-profile',
        contentPreview: 'User is preparing algorithm interviews.',
        empty: false,
        safetyRisk: false,
        safetyFindings: [],
        conflicts: [{
          kind: 'duplicate',
          itemId: 'existing-profile',
          score: 0.98,
          reason: '候选记忆与已有记忆高度重复。',
        }],
      }),
      expect.objectContaining({
        index: 1,
        originalId: 'empty-memory',
        empty: true,
        safetyRisk: false,
        safetyFindings: [],
        conflicts: [],
      }),
    ])
    expect(detectConflicts).toHaveBeenCalledTimes(1)
    expect(detectConflicts).toHaveBeenCalledWith(expect.objectContaining({
      content: 'User is preparing algorithm interviews.',
      type: 'profile',
      tags: ['career'],
    }))
  })

  it('previews backup safety risks before import', async () => {
    await exportMemoryBackup({
      outputDir,
      memories: [
        memory({
          id: 'unsafe-preview',
          content: 'Restored backup has password=super-secret-token and must be reviewed.',
          privacy: 'local',
        }),
      ],
    })

    const result = await previewMemoryBackup({
      backupFile: join(outputDir, 'airi-memory-backup.json'),
    })

    expect(result.items[0]).toEqual(expect.objectContaining({
      originalId: 'unsafe-preview',
      safetyRisk: true,
      safetyFindings: expect.arrayContaining([
        expect.objectContaining({ kind: 'credential', severity: 'high' }),
      ]),
    }))
  })

  it('imports only selected backup item ids', async () => {
    await exportMemoryBackup({
      outputDir,
      memories: [
        memory({ id: 'restore-this', content: 'Restore this memory.' }),
        memory({ id: 'skip-this', content: 'Skip this memory.' }),
      ],
    })

    const createMemory = vi.fn(async (request: ElectronMemoryCreateRequest) => memory({
      id: `new-${request.content}`,
      ...request,
      tags: request.tags ?? [],
      importance: request.importance ?? 3,
      summary: request.summary ?? null,
      sourceId: request.sourceId ?? null,
      metadata: request.metadata ?? null,
      status: request.status ?? 'active',
      privacy: request.privacy ?? 'local',
      sourceType: request.sourceType ?? 'manual',
      type: request.type ?? 'note',
    }))

    const result = await importMemoryBackup({
      backupFile: join(outputDir, 'airi-memory-backup.json'),
      selectedOriginalIds: ['restore-this'],
      createMemory,
    })

    expect(result.imported.map(item => item.content)).toEqual(['Restore this memory.'])
    expect(result.skipped).toEqual([{ index: 1, reason: 'not_selected' }])
    expect(createMemory).toHaveBeenCalledTimes(1)
  })
})

function memory(overrides: Partial<ElectronMemoryItem>): ElectronMemoryItem {
  return {
    id: 'memory-1',
    scope: 'user',
    type: 'note',
    content: 'memory content',
    summary: null,
    tags: [],
    importance: 3,
    privacy: 'local',
    sourceType: 'manual',
    sourceId: null,
    status: 'active',
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
    ...overrides,
  }
}
