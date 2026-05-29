import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { exportMemoryLlmWiki, searchMemoryLlmWiki } from './llmwiki'

describe('memory llmwiki export', () => {
  let outputDir: string

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'airi-llmwiki-'))
  })

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true })
  })

  it('exports active non-secret memories into stable llm-readable markdown pages', async () => {
    const memories = [
      memory({
        type: 'profile',
        content: '用户本科是土木工程背景，现在在 FDU 智能机器人与先进制造创新学院学习。',
        tags: ['profile', 'education'],
        importance: 5,
      }),
      memory({
        id: 'boundary-1',
        type: 'preference',
        content: '不要在没有确认时删除文件。',
        tags: ['boundary', 'safety'],
        importance: 5,
      }),
      memory({
        id: 'project-1',
        type: 'project',
        content: 'AIRI Gemma 当前已经实现 Memory Service 最小闭环。',
        tags: ['airi-gemma', 'project'],
        importance: 4,
      }),
      memory({
        id: 'secret-1',
        type: 'note',
        content: 'secret token should not be exported',
        privacy: 'secret',
        tags: ['secret'],
      }),
      memory({
        id: 'pending-1',
        type: 'profile',
        content: 'pending memory should not be exported',
        status: 'needs_review',
      }),
      memory({
        id: 'unsafe-1',
        type: 'profile',
        content: 'Local path C:\\Users\\me\\private-chat.txt should not be exported',
      }),
    ]

    const result = await exportMemoryLlmWiki({ memories, outputDir })

    expect(result.files.map(file => file.relativePath)).toEqual([
      'index.md',
      'log.md',
      'profile.md',
      'boundaries.md',
      'projects/airi-gemma.md',
    ])

    const index = await readFile(join(outputDir, 'index.md'), 'utf8')
    const log = await readFile(join(outputDir, 'log.md'), 'utf8')
    const profile = await readFile(join(outputDir, 'profile.md'), 'utf8')
    const boundaries = await readFile(join(outputDir, 'boundaries.md'), 'utf8')
    const project = await readFile(join(outputDir, 'projects', 'airi-gemma.md'), 'utf8')

    expect(index).toContain('# AIRI LLMWiki Index')
    expect(index).toContain('[Export Log](./log.md)')
    expect(index).toContain('(1)')
    expect(index).not.toContain('secret token')
    expect(log).toContain('# AIRI LLMWiki Export Log')
    expect(log).toContain('Source of truth: Memory DB')
    expect(log).toContain('unsafe content')
    expect(log).not.toContain(outputDir)

    expect(profile).toContain('用户本科是土木工程背景')
    expect(profile).toContain('## 记忆条目')
    expect(profile).toContain('类型：profile；重要性：5')
    expect(boundaries).toContain('不要在没有确认时删除文件')
    expect(project).toContain('Memory Service 最小闭环')
    expect(profile).not.toContain('secret token')
    expect(profile).not.toContain('pending memory')
    expect(profile).not.toContain('C:\\Users\\me')
  })

  it('searches exported llmwiki markdown and returns relevant snippets', async () => {
    await exportMemoryLlmWiki({
      memories: [
        memory({
          type: 'profile',
          content: '用户本科是土木工程背景，现在正在准备大厂算法岗面试。',
          tags: ['profile', 'education', 'interview'],
          importance: 5,
        }),
        memory({
          id: 'project-1',
          type: 'project',
          content: 'AIRI Gemma 已经实现 LLMWiki 导出。',
          tags: ['project', 'airi-gemma'],
          importance: 4,
        }),
      ],
      outputDir,
    })

    const result = await searchMemoryLlmWiki({
      inputDir: outputDir,
      query: '我准备算法岗面试时应该结合什么背景？',
      limit: 2,
    })

    expect(result.scannedFiles).toBe(4)
    expect(result.snippets).toEqual([
      expect.objectContaining({
        relativePath: 'profile.md',
        text: expect.stringContaining('土木工程背景'),
      }),
    ])
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
    createdAt: '2026-05-07T00:00:00.000Z',
    updatedAt: '2026-05-07T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
    ...overrides,
  }
}
