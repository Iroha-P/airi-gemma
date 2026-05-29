import { describe, expect, it, vi } from 'vitest'

const beforeComposeHooks: Array<(message: string) => Promise<void>> = []
const ingestContextMessage = vi.hoisted(() => vi.fn())
const listMemories = vi.hoisted(() => vi.fn(async () => ({
  items: [
    {
      id: 'memory-1',
      scope: 'user',
      type: 'profile',
      content: '用户本科是土木工程，现在在 FDU 智能机器人与先进制造创新学院学习。',
      summary: null,
      tags: ['profile', 'education'],
      importance: 4,
      privacy: 'local',
      sourceType: 'chat_turn',
      sourceId: 'message-1',
      status: 'active',
      createdAt: '2026-05-07T00:00:00.000Z',
      updatedAt: '2026-05-07T00:00:00.000Z',
      lastAccessedAt: null,
      accessCount: 0,
      archivedAt: null,
      metadata: null,
    },
  ],
})))
const searchLlmWiki = vi.hoisted(() => vi.fn(async () => ({
  inputDir: 'F:/airi-brain/70-llmwiki',
  scannedFiles: 1,
  snippets: [
    {
      relativePath: 'profile.md',
      path: 'F:/airi-brain/70-llmwiki/profile.md',
      text: '用户画像片段：用户正在准备算法岗面试。',
      score: 3,
    },
  ],
})))

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaInvoke: (event: { receiveEvent?: { id?: string } }) => {
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:list-receive')
      return listMemories
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:search-llmwiki-receive')
      return searchLlmWiki

    throw new Error(`Unexpected eventa invoke: ${JSON.stringify(event)}`)
  },
}))

vi.mock('@proj-airi/stage-ui/stores/chat', () => ({
  useChatOrchestratorStore: () => ({
    onBeforeMessageComposed: (callback: (message: string) => Promise<void>) => {
      beforeComposeHooks.push(callback)
      return () => {
        const index = beforeComposeHooks.indexOf(callback)
        if (index >= 0)
          beforeComposeHooks.splice(index, 1)
      }
    },
  }),
}))

vi.mock('@proj-airi/stage-ui/stores/chat/context-store', () => ({
  useChatContextStore: () => ({
    ingestContextMessage,
  }),
}))

describe('memory context bridge', async () => {
  const { initializeMemoryContextBridge } = await import('./memory-context')

  it('injects active local memories as chat context before composing a message', async () => {
    initializeMemoryContextBridge()

    await beforeComposeHooks[0]?.('我准备算法岗面试，你记得我的背景吗？')

    expect(listMemories).toHaveBeenCalledWith({
      query: '我准备算法岗面试，你记得我的背景吗？',
      status: 'active',
      privacy: 'local',
      limit: 6,
      trackAccess: true,
    })
    expect(ingestContextMessage).toHaveBeenCalledWith(expect.objectContaining({
      contextId: 'airi:memory:local',
      strategy: 'replace-self',
      text: expect.stringContaining('用户本科是土木工程'),
    }))
    expect(searchLlmWiki).toHaveBeenCalledWith({
      query: '我准备算法岗面试，你记得我的背景吗？',
      limit: 3,
    })
    expect(ingestContextMessage).toHaveBeenCalledWith(expect.objectContaining({
      contextId: 'airi:llmwiki:rag',
      strategy: 'replace-self',
      text: expect.stringContaining('用户画像片段'),
    }))
  })
})
