import type { ElectronMemoryIngestRequest, ElectronMemoryIngestResult } from '../../../../shared/eventa'

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { importMarkdownKnowledgeBase } from './knowledge-base'

describe('markdown knowledge base importer', () => {
  let rootDir: string

  beforeEach(async () => {
    rootDir = join(tmpdir(), `airi-memory-kb-${crypto.randomUUID()}`)
    await mkdir(join(rootDir, 'Projects'), { recursive: true })
    await mkdir(join(rootDir, '.obsidian'), { recursive: true })
    await writeFile(join(rootDir, 'Projects', 'AIRI Plan.md'), [
      '---',
      'tags: [airi, memory]',
      '---',
      '',
      '# AIRI Memory Plan',
      '',
      'AIRI should use local memories to support companionship and desktop assistance.',
    ].join('\n'))
    await writeFile(join(rootDir, '.obsidian', 'workspace.md'), '# Hidden config')
    await writeFile(join(rootDir, 'AIRI-Brain.md'), [
      '---',
      'title: AIRI-Brain',
      'source: airi-memory-service',
      'updated: 2026-05-26T00:00:00.000Z',
      'memory_count: 1',
      '---',
      '',
      '# AIRI-Brain',
      '',
      'This generated vault index should not be imported back as user knowledge.',
    ].join('\n'))
    await writeFile(join(rootDir, 'empty.md'), '   ')
    await writeFile(join(rootDir, 'notes.txt'), 'ignored')
  })

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true })
  })

  it('imports markdown files as reviewable knowledge-base memories', async () => {
    const ingest = vi.fn(async (_request: ElectronMemoryIngestRequest): Promise<ElectronMemoryIngestResult> => ({
      created: [],
      skipped: [],
    }))

    const result = await importMarkdownKnowledgeBase({
      rootDir,
      ingest,
      defaults: {
        tags: ['obsidian'],
        privacy: 'local',
      },
    })

    expect(result.filesScanned).toBe(1)
    expect(result.emptyFiles).toEqual(['empty.md'])
    expect(result.skippedGeneratedFiles).toEqual(['AIRI-Brain.md'])
    expect(ingest).toHaveBeenCalledWith({
      source: {
        type: 'knowledge_base',
        id: rootDir,
        label: 'Markdown knowledge base',
      },
      defaults: {
        tags: ['obsidian'],
        privacy: 'local',
      },
      entries: [{
        externalId: 'Projects/AIRI Plan.md',
        content: [
          '# AIRI Memory Plan',
          '',
          'AIRI should use local memories to support companionship and desktop assistance.',
        ].join('\n'),
        summary: 'AIRI Memory Plan',
        type: 'knowledge',
        tags: ['airi', 'memory'],
        metadata: {
          file: {
            path: join(rootDir, 'Projects', 'AIRI Plan.md'),
            relativePath: 'Projects/AIRI Plan.md',
            title: 'AIRI Memory Plan',
          },
        },
      }],
    })
  })
})
