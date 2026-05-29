import type { ElectronMemoryEvolutionPreviewResult, ElectronMemoryItem } from '../../../../shared/eventa'

import { describe, expect, it } from 'vitest'

import { collectDreamContext } from './context'

describe('dream context collector', () => {
  it('collects safe non-secret memories and records secret or unsafe memories as withheld', () => {
    const evolution: ElectronMemoryEvolutionPreviewResult = {
      generatedAt: '2026-05-13T00:00:00.000Z',
      total: 1,
      suggestions: [{
        id: 'evolve-local-1-promote-candidate',
        kind: 'promote_candidate',
        priority: 'medium',
        title: 'Review',
        reason: 'Pending',
        memoryIds: ['local-1'],
        recommendedActions: ['approve'],
        createdAt: '2026-05-13T00:00:00.000Z',
      }],
    }

    const result = collectDreamContext({
      memories: [
        memory({ id: 'local-1', privacy: 'local', content: 'User is building AIRI dream cycle.' }),
        memory({ id: 'sensitive-1', privacy: 'sensitive', content: 'Sensitive but local context.' }),
        memory({ id: 'secret-1', privacy: 'secret', content: 'Never send this into dream prompt.' }),
        memory({ id: 'unsafe-1', privacy: 'local', content: 'Private export path C:\\Users\\me\\wechat.txt must not enter dream context.' }),
        memory({
          id: 'unsafe-metadata-1',
          privacy: 'local',
          content: 'Plain text with persisted unsafe metadata.',
          metadata: { safety: { safe: false } },
        }),
      ],
      evolution,
    })

    expect(result.memories.map(item => item.id)).toEqual(['local-1', 'sensitive-1'])
    expect(result.withheld).toEqual([
      { sourceId: 'secret-1', reason: 'secret_memory' },
      { sourceId: 'unsafe-1', reason: 'safety_risk' },
      { sourceId: 'unsafe-metadata-1', reason: 'safety_risk' },
    ])
    expect(result.evolutionSuggestionIds).toEqual(['evolve-local-1-promote-candidate'])
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
    createdAt: '2026-05-13T00:00:00.000Z',
    updatedAt: '2026-05-13T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
    ...overrides,
  }
}
