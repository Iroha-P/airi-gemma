import type { ElectronAgentChatRuntimeConfig, ElectronMemoryEvolutionPreviewResult, ElectronMemoryItem } from '../../../../shared/eventa'
import type { DreamGenerateTextRequest } from './manager'

import { describe, expect, it, vi } from 'vitest'

import { createDreamManager } from './manager'

const localConfig: ElectronAgentChatRuntimeConfig = {
  enabled: true,
  openAICompatible: {
    baseURL: 'http://localhost:11434/v1',
    model: 'gemma3:4b',
  },
  provider: 'openai-compatible',
  target: 'local',
}

const cloudConfig: ElectronAgentChatRuntimeConfig = {
  ...localConfig,
  target: 'cloud',
}

const evolution: ElectronMemoryEvolutionPreviewResult = {
  generatedAt: '2026-05-13T00:00:00.000Z',
  total: 1,
  suggestions: [{
    id: 'evolve-memory-1-promote-candidate',
    kind: 'promote_candidate',
    priority: 'medium',
    title: 'Review candidate',
    reason: 'Pending candidate',
    memoryIds: ['memory-1'],
    recommendedActions: ['approve'],
    createdAt: '2026-05-13T00:00:00.000Z',
  }],
}

describe('dream manager', () => {
  it('rejects cloud runtime config without calling the model', async () => {
    const generateText = vi.fn()
    const manager = createDreamManager({
      generateText,
      getRuntimeConfig: async () => cloudConfig,
      listMemories: async () => [],
      now: () => new Date('2026-05-13T00:00:00.000Z'),
      previewEvolution: async () => evolution,
      randomId: () => 'dream-cloud',
    })

    const session = await manager.startLocalDream({ windowHours: 4 })

    expect(session.status).toBe('failed')
    expect(session.errorMessage).toContain('local')
    expect(generateText).not.toHaveBeenCalled()
  })

  it('creates a completed dream session from local Gemma JSON output', async () => {
    const generateText = vi.fn(async (_request: DreamGenerateTextRequest) => JSON.stringify({
      summary: 'AIRI dreamed about memory work.',
      memoryCandidates: [{ content: 'User wants local Gemma dream cycle.', type: 'preference', privacy: 'local', importance: 4, tags: ['dream'] }],
      routineCandidates: [{ title: 'Ship a phase', steps: ['test', 'typecheck'] }],
      llmWikiDrafts: [{ title: 'Dream Cycle', content: 'Local dream summary.' }],
      loraDatasetCandidates: [{ messages: [{ role: 'user', content: '做梦' }, { role: 'assistant', content: '整理候选记忆。' }], tags: ['dream'] }],
    }))
    const manager = createDreamManager({
      generateText,
      getRuntimeConfig: async () => localConfig,
      listMemories: async () => [
        memory({ id: 'memory-1', privacy: 'local', content: 'Local memory' }),
        memory({ id: 'secret-1', privacy: 'secret', content: 'Secret memory' }),
        memory({ id: 'unsafe-1', privacy: 'local', content: 'Local file path C:\\Users\\me\\wechat-export.txt' }),
      ],
      now: () => new Date('2026-05-13T00:00:00.000Z'),
      previewEvolution: async () => evolution,
      randomId: () => 'dream-1',
    })

    const session = await manager.startLocalDream({ includeLoraCandidates: true, windowHours: 8 })

    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'http://localhost:11434/v1',
      model: 'gemma3:4b',
    }))
    expect(session).toMatchObject({
      id: 'dream-1',
      localModel: 'gemma3:4b',
      status: 'completed',
      windowHours: 8,
    })
    expect(session.report?.summary).toBe('AIRI dreamed about memory work.')
    const prompt = generateText.mock.calls[0]![0].input
    expect(prompt).toContain('Local memory')
    expect(prompt).not.toContain('wechat-export.txt')
    expect(session.report?.withheld).toEqual([
      { sourceId: 'secret-1', reason: 'secret_memory' },
      { sourceId: 'unsafe-1', reason: 'safety_risk' },
    ])
    expect(session.report?.sanitizedReport?.visibility).toBe('training_sanitized')
  })

  it('prevents concurrent dream sessions and can cancel a running session', async () => {
    let resolveGenerate: (value: string) => void = () => {}
    const generateText = vi.fn(() => new Promise<string>((resolve) => {
      resolveGenerate = resolve
    }))
    const manager = createDreamManager({
      generateText,
      getRuntimeConfig: async () => localConfig,
      listMemories: async () => [],
      now: () => new Date('2026-05-13T00:00:00.000Z'),
      previewEvolution: async () => evolution,
      randomId: () => 'dream-running',
    })

    const firstRun = manager.startLocalDream()

    await vi.waitFor(() => {
      expect(manager.getCurrent()?.status).toBe('running')
    })
    await expect(manager.startLocalDream()).rejects.toThrow('Dream session already running')

    const cancelled = manager.cancelCurrent()
    expect(cancelled?.status).toBe('cancelled')

    resolveGenerate(JSON.stringify({ summary: 'late completion' }))
    await firstRun
    expect(manager.getCurrent()?.status).toBe('cancelled')
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
