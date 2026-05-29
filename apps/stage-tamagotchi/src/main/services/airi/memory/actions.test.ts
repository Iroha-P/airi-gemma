import type { ElectronMemoryItem } from '../../../../shared/eventa'
import type { MemoryRepository } from './repository'

import { describe, expect, it, vi } from 'vitest'

import { applyMemoryAction } from './actions'

const createdAt = '2026-05-07T00:00:00.000Z'

function memory(overrides: Partial<ElectronMemoryItem> = {}): ElectronMemoryItem {
  return {
    id: 'memory-1',
    scope: 'user',
    type: 'preference',
    content: '用户不喜欢数学。',
    summary: null,
    tags: ['profile'],
    importance: 3,
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

describe('memory actions', () => {
  it('replaces, archives, reclassifies, and corrects memories through repository actions', async () => {
    const repository = {
      update: vi.fn(async payload => memory({
        id: payload.id,
        content: payload.content ?? 'updated',
        status: payload.status ?? 'active',
        privacy: payload.privacy ?? 'local',
        importance: payload.importance ?? 3,
        tags: payload.tags ?? ['profile'],
        metadata: payload.metadata ?? null,
      })),
      create: vi.fn(async payload => memory({
        id: 'memory-correction',
        type: payload.type ?? 'note',
        content: payload.content,
        summary: payload.summary,
        tags: payload.tags ?? [],
        privacy: payload.privacy ?? 'local',
        sourceType: payload.sourceType ?? 'manual',
        sourceId: payload.sourceId ?? null,
        metadata: payload.metadata ?? null,
      })),
      get: vi.fn(async (id: string) => memory({
        id,
        type: 'profile',
        content: '用户正在准备算法岗面试。',
        importance: 5,
        sourceType: 'import_wechat',
        accessCount: 3,
        lastAccessedAt: '2026-05-07T08:00:00.000Z',
      })),
    } as unknown as MemoryRepository

    await expect(applyMemoryAction(repository, {
      action: 'replace',
      id: 'memory-1',
      content: '用户不是不喜欢数学，而是不喜欢没有例子的抽象解释。',
      reason: '用户纠正偏好',
    })).resolves.toMatchObject({
      item: { content: '用户不是不喜欢数学，而是不喜欢没有例子的抽象解释。' },
      action: 'replace',
    })
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'memory-1',
      content: '用户不是不喜欢数学，而是不喜欢没有例子的抽象解释。',
      metadata: {
        memoryAction: {
          action: 'replace',
          reason: '用户纠正偏好',
        },
      },
    }))

    await applyMemoryAction(repository, {
      action: 'archive',
      id: 'memory-1',
      reason: '过期',
    })
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'memory-1',
      status: 'archived',
    }))

    await applyMemoryAction(repository, {
      action: 'reclassify',
      id: 'memory-1',
      privacy: 'sensitive',
      importance: 5,
      tags: ['profile', 'boundary'],
      reason: '涉及用户偏好边界',
    })
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'memory-1',
      privacy: 'sensitive',
      importance: 5,
      tags: ['profile', 'boundary'],
    }))

    const correction = await applyMemoryAction(repository, {
      action: 'correct',
      id: 'memory-1',
      correction: '用户讨厌没有例子的抽象解释，不是讨厌数学。',
      reason: '用户显式纠错',
    })
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'memory-1',
      status: 'archived',
    }))
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      content: '用户讨厌没有例子的抽象解释，不是讨厌数学。',
      type: 'note',
      tags: ['correction'],
      sourceType: 'memory_action',
      sourceId: 'memory-1',
      metadata: {
        memoryAction: {
          action: 'correct',
          targetId: 'memory-1',
          reason: '用户显式纠错',
        },
      },
    }))
    expect(correction.item.id).toBe('memory-correction')

    const explanation = await applyMemoryAction(repository, {
      action: 'explain_usage',
      id: 'memory-1',
      query: '我该怎么准备算法岗面试？',
    })
    expect(repository.get).toHaveBeenCalledWith('memory-1')
    expect(explanation.explanation).toContain('profile')
    expect(explanation.explanation).toContain('import_wechat')
    expect(explanation.explanation).toContain('重要性 5')
    expect(explanation.explanation).toContain('使用过 3 次')
    expect(explanation.explanation).toContain('我该怎么准备算法岗面试？')
  })
})
