import { beforeEach, describe, expect, it, vi } from 'vitest'

const hookCallbacks: Array<(chat: unknown, context: { message: { content?: string } }) => Promise<void>> = []
const addMemory = vi.hoisted(() => vi.fn(async () => ({})))
const editMemory = vi.hoisted(() => vi.fn(async () => ({})))
const findSimilarMemories = vi.hoisted(() => vi.fn(async (): Promise<any[]> => []))

vi.mock('@proj-airi/stage-ui/stores/chat', () => ({
  useChatOrchestratorStore: () => ({
    onChatTurnComplete: (callback: (chat: unknown, context: { message: { content?: string } }) => Promise<void>) => {
      hookCallbacks.push(callback)
      return () => {
        const index = hookCallbacks.indexOf(callback)
        if (index >= 0)
          hookCallbacks.splice(index, 1)
      }
    },
  }),
}))

vi.mock('../stores/settings/memory', () => ({
  useMemorySettingsStore: () => ({
    addMemory,
    editMemory,
    findSimilarMemories,
  }),
}))

describe('memory candidate bridge', async () => {
  const { extractMemoryCandidates, initializeMemoryCandidateBridge, resetMemoryCandidateBridgeForTest } = await import('./memory-candidates')

  beforeEach(() => {
    resetMemoryCandidateBridgeForTest()
    hookCallbacks.length = 0
    addMemory.mockClear()
    editMemory.mockClear()
    findSimilarMemories.mockReset()
    findSimilarMemories.mockResolvedValue([])
  })

  it('extracts explicit user profile and preference candidates from one chat turn', () => {
    const candidates = extractMemoryCandidates({
      userText: '请记住：我本科是土木工程。我喜欢你用分步骤解释。我的目标是面试大厂算法岗。',
      assistantText: '我记住了，会帮你整理。',
      sessionId: 'session-1',
    })

    expect(candidates).toEqual([
      expect.objectContaining({
        content: '我本科是土木工程。',
        status: 'needs_review',
        sourceType: 'chat_turn',
        type: 'note',
      }),
      expect.objectContaining({
        content: '用户喜欢你用分步骤解释。',
        status: 'needs_review',
        type: 'preference',
      }),
      expect.objectContaining({
        content: '用户的目标是面试大厂算法岗。',
        status: 'needs_review',
        type: 'profile',
      }),
    ])
  })

  it('stores extracted candidates as needs_review memories after chat turn completion', async () => {
    initializeMemoryCandidateBridge()

    await hookCallbacks[0]?.(
      { outputText: '好的，我会记住。' },
      {
        message: {
          content: '记住：我喜欢 concise explanations.',
        },
      },
    )

    expect(addMemory).toHaveBeenCalledWith(expect.objectContaining({
      content: '我喜欢 concise explanations.',
      status: 'needs_review',
      sourceType: 'chat_turn',
    }))
  })

  it('skips active duplicates and merges pending duplicates instead of creating new candidates', async () => {
    findSimilarMemories
      .mockResolvedValueOnce([
        {
          id: 'active-memory',
          content: '用户喜欢 concise explanations.',
          tags: ['preference'],
          importance: 4,
          status: 'active',
          metadata: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'pending-memory',
          content: '用户的目标是面试大厂算法岗。',
          tags: ['profile'],
          importance: 3,
          status: 'needs_review',
          metadata: { extractedBy: 'rule:v1' },
        },
      ])

    initializeMemoryCandidateBridge()

    await hookCallbacks[0]?.(
      { outputText: '收到，我会更新。' },
      {
        message: {
          content: '我喜欢 concise explanations. 我的目标是面试大厂算法岗。',
        },
      },
    )

    expect(addMemory).not.toHaveBeenCalled()
    expect(editMemory).toHaveBeenCalledWith(expect.objectContaining({
      id: 'pending-memory',
      tags: ['profile', 'goal'],
      importance: 4,
      metadata: expect.objectContaining({
        extractedBy: 'rule:v1',
        mergedBy: 'rule:v1',
      }),
    }))
  })

  it('merges semantically similar pending memories even when wording differs', async () => {
    findSimilarMemories.mockResolvedValueOnce([
      {
        id: 'pending-goal',
        content: '用户想准备算法工程师求职。',
        tags: ['profile'],
        importance: 3,
        status: 'needs_review',
        metadata: null,
      },
    ])

    initializeMemoryCandidateBridge()

    await hookCallbacks[0]?.(
      { outputText: '我会帮你围绕算法岗准备。' },
      {
        message: {
          content: '我的目标是面试大厂算法岗。',
        },
      },
    )

    expect(addMemory).not.toHaveBeenCalled()
    expect(editMemory).toHaveBeenCalledWith(expect.objectContaining({
      id: 'pending-goal',
      content: '用户的目标是面试大厂算法岗。',
      tags: ['profile', 'goal'],
    }))
  })
})
