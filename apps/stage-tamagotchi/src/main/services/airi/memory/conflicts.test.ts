import type { ElectronMemoryItem } from '../../../../shared/eventa'
import type { MemoryRepository } from './repository'

import { describe, expect, it, vi } from 'vitest'

import { detectMemoryConflicts } from './conflicts'

const createdAt = '2026-05-07T00:00:00.000Z'

function memory(overrides: Partial<ElectronMemoryItem> = {}): ElectronMemoryItem {
  return {
    id: 'memory-1',
    scope: 'user',
    type: 'preference',
    content: '用户喜欢有例子的数学解释。',
    summary: null,
    tags: ['learning'],
    importance: 4,
    privacy: 'local',
    sourceType: 'manual',
    sourceId: null,
    status: 'active',
    createdAt,
    updatedAt: createdAt,
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
    ...overrides,
  }
}

describe('memory conflict detector', () => {
  it('detects likely duplicates and opposite preference conflicts against active memories', async () => {
    const repository = {
      list: vi.fn(async () => [
        memory({
          id: 'duplicate',
          content: '用户正在准备大厂算法岗面试。',
          type: 'profile',
          tags: ['career', 'interview'],
        }),
        memory({
          id: 'conflict',
          content: '用户喜欢有例子的数学解释。',
          type: 'preference',
          tags: ['learning'],
        }),
      ]),
    } as unknown as MemoryRepository

    const duplicateResult = await detectMemoryConflicts(repository, {
      content: '用户正在准备大厂算法岗面试。',
      type: 'profile',
      tags: ['career'],
    })

    expect(repository.list).toHaveBeenCalledWith({ status: 'active', limit: 200 })
    expect(duplicateResult.findings).toEqual([
      expect.objectContaining({
        kind: 'duplicate',
        item: expect.objectContaining({ id: 'duplicate' }),
        score: 1,
      }),
    ])

    const conflictResult = await detectMemoryConflicts(repository, {
      content: '用户不喜欢没有例子的数学解释。',
      type: 'preference',
      tags: ['learning'],
    })

    expect(conflictResult.findings).toEqual([
      expect.objectContaining({
        kind: 'conflict',
        item: expect.objectContaining({ id: 'conflict' }),
        reason: expect.stringContaining('相反'),
      }),
    ])
  })
})
