import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { exportPublicProfile } from './public-profile'

describe('public profile export', () => {
  let outputDir: string

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'airi-public-profile-'))
  })

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true })
  })

  it('exports only explicitly visible non-sensitive memories without raw metadata', async () => {
    const result = await exportPublicProfile({
      outputDir,
      memories: [
        memory({
          id: 'demo-profile',
          content: 'User is preparing for algorithm interviews.',
          type: 'profile',
          privacy: 'local',
          metadata: { profileVisibility: 'demo', file: { path: 'F:/private/chat.txt' } },
        }),
        memory({
          id: 'training-style',
          content: 'AIRI should answer with concise engineering reasoning.',
          type: 'preference',
          privacy: 'public',
          metadata: { profileVisibility: 'training_sanitized' },
        }),
        memory({
          id: 'sensitive-memory',
          content: 'Private chat detail must not be exported.',
          privacy: 'sensitive',
          metadata: { profileVisibility: 'demo' },
        }),
        memory({
          id: 'raw-chat',
          content: 'Raw imported WeChat message must not be exported.',
          privacy: 'local',
          sourceType: 'import_wechat',
          metadata: { profileVisibility: 'demo' },
        }),
        memory({
          id: 'not-visible',
          content: 'No explicit visibility must not be exported.',
          privacy: 'public',
          metadata: null,
        }),
        memory({
          id: 'path-visible',
          content: 'Public demo should not expose F:/private/chat.txt.',
          privacy: 'public',
          metadata: { profileVisibility: 'demo' },
        }),
      ],
    })

    expect(result.files).toEqual([
      expect.objectContaining({ relativePath: 'public-profile.md', count: 2 }),
      expect.objectContaining({ relativePath: 'public-profile.json', count: 2 }),
    ])

    const markdown = await readFile(join(outputDir, 'public-profile.md'), 'utf8')
    expect(markdown).toContain('User is preparing for algorithm interviews.')
    expect(markdown).toContain('AIRI should answer with concise engineering reasoning.')
    expect(markdown).not.toContain('Private chat detail')
    expect(markdown).not.toContain('Raw imported WeChat')
    expect(markdown).not.toContain('F:/private/chat.txt')

    const json = JSON.parse(await readFile(join(outputDir, 'public-profile.json'), 'utf8')) as { memories: Array<{ id: string, metadata?: unknown }> }
    expect(json.memories.map(item => item.id)).toEqual(['demo-profile', 'training-style'])
    expect(json.memories[0]).not.toHaveProperty('metadata')
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
