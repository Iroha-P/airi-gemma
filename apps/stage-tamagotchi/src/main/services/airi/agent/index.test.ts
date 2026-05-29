import type { ElectronAgentRun, ElectronAgentToolDescriptor } from '../../../../shared/eventa'
import type { AgentOrchestrator } from './orchestrator'

import { createContext, defineInvoke } from '@moeru/eventa'
import { describe, expect, it, vi } from 'vitest'

import {
  electronAgentCancelRun,
  electronAgentConfirmAction,
  electronAgentGetRun,
  electronAgentListTools,
  electronAgentReflectAndStore,
  electronAgentRun,
} from '../../../../shared/eventa'
import { createAgentService, setupAgentOrchestrator } from './index'

const generateTextMock = vi.hoisted(() => vi.fn())

vi.mock('@xsai/generate-text', () => ({
  generateText: generateTextMock,
}))

describe('agent service eventa adapter', () => {
  it('registers agent invokes against the provided orchestrator', async () => {
    const context = createContext()
    const run: ElectronAgentRun = {
      id: 'agent-run-1',
      input: 'Help with AIRI memory',
      mode: 'direct_answer' as const,
      status: 'completed' as const,
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
      context: [],
      response: 'ok',
    }
    const tools: ElectronAgentToolDescriptor[] = [{
      name: 'memory.search',
      title: 'Search local memory',
      description: 'Read local memory.',
      risk: 'low',
      requiresConfirmation: false,
    }]
    const cancelledRun: ElectronAgentRun = {
      ...run,
      status: 'cancelled',
    }
    const reflectedRun: ElectronAgentRun = {
      ...run,
      mode: 'reflect_and_store',
      memoryId: 'memory-1',
    }
    const orchestrator: AgentOrchestrator = {
      run: vi.fn(async () => run),
      getRun: vi.fn(() => run),
      cancelRun: vi.fn(async () => cancelledRun),
      listTools: vi.fn(() => tools),
      confirmAction: vi.fn(async () => run),
      configureChatRuntime: vi.fn(),
      reflectAndStore: vi.fn(async () => reflectedRun),
    }

    createAgentService({ context: context as never, orchestrator })

    await expect(defineInvoke(context, electronAgentRun)({ input: 'Help with AIRI memory' })).resolves.toEqual(run)
    await expect(defineInvoke(context, electronAgentGetRun)({ id: 'agent-run-1' })).resolves.toEqual(run)
    await expect(defineInvoke(context, electronAgentCancelRun)({ id: 'agent-run-1' })).resolves.toMatchObject({ status: 'cancelled' })
    await expect(defineInvoke(context, electronAgentListTools)()).resolves.toEqual([expect.objectContaining({ name: 'memory.search' })])
    await expect(defineInvoke(context, electronAgentConfirmAction)({ id: 'agent-run-1', approved: true })).resolves.toMatchObject({ status: 'completed' })
    await expect(defineInvoke(context, electronAgentReflectAndStore)({ id: 'agent-run-1', content: 'Remember this.' })).resolves.toMatchObject({
      mode: 'reflect_and_store',
      memoryId: 'memory-1',
    })

    expect(orchestrator.run).toHaveBeenCalledWith({ input: 'Help with AIRI memory' })
    expect(orchestrator.getRun).toHaveBeenCalledWith({ id: 'agent-run-1' })
    expect(orchestrator.cancelRun).toHaveBeenCalledWith({ id: 'agent-run-1' })
    expect(orchestrator.listTools).toHaveBeenCalled()
    expect(orchestrator.confirmAction).toHaveBeenCalledWith({ id: 'agent-run-1', approved: true })
    expect(orchestrator.reflectAndStore).toHaveBeenCalledWith({ id: 'agent-run-1', content: 'Remember this.' })
  })
})

describe('setupAgentOrchestrator', () => {
  const memoryManager = {
    list: vi.fn(async () => []),
    searchLlmWiki: vi.fn(async () => ({ inputDir: 'F:/airi-brain/70-llmwiki', scannedFiles: 0, snippets: [] })),
    compactProfile: vi.fn(),
  } as never

  it('keeps deterministic fallback when chat runtime config is disabled', async () => {
    const orchestrator = setupAgentOrchestrator({
      chatRuntimeConfig: {
        enabled: false,
        provider: 'openai-compatible',
        target: 'local',
      },
      memoryManager,
    })

    await expect(orchestrator.run({ input: 'Hello' })).resolves.toMatchObject({
      response: 'I did not find local context for this request yet.',
      status: 'completed',
    })
  })

  it('uses configured chat runtime when chat runtime config is enabled', async () => {
    generateTextMock.mockResolvedValueOnce({ text: 'configured chat response' })
    const orchestrator = setupAgentOrchestrator({
      chatRuntimeConfig: {
        enabled: true,
        openAICompatible: {
          baseURL: 'http://localhost:11434/v1',
          model: 'gemma',
        },
        provider: 'openai-compatible',
        target: 'local',
      },
      memoryManager,
    })

    await expect(orchestrator.run({ input: 'Hello' })).resolves.toMatchObject({
      response: 'configured chat response',
      status: 'completed',
    })
    expect(generateTextMock).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'http://localhost:11434/v1/',
      model: 'gemma',
    }))
  })

  it('falls back when chat runtime config is invalid', async () => {
    const onChatRuntimeConfigError = vi.fn()
    const orchestrator = setupAgentOrchestrator({
      chatRuntimeConfig: {
        enabled: true,
        provider: 'openai-compatible',
        target: 'local',
      },
      memoryManager,
      onChatRuntimeConfigError,
    })

    await expect(orchestrator.run({ input: 'Hello' })).resolves.toMatchObject({
      response: 'I did not find local context for this request yet.',
      status: 'completed',
    })
    expect(onChatRuntimeConfigError).toHaveBeenCalledWith(expect.objectContaining({
      message: 'OpenAI-compatible chat runtime config is required when agent chat runtime is enabled',
    }))
  })
})
