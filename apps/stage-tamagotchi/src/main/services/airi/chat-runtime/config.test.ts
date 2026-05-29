import type { AgentChatRuntimeConfigStore } from './config'

import { createContext, defineInvoke } from '@moeru/eventa'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  electronAgentChatRuntimeApplyConfig,
  electronAgentChatRuntimeGetConfig,
  electronAgentChatRuntimeTestConfig,
} from '../../../../shared/eventa'
import {
  createAgentChatRuntimeConfigService,
  defaultAgentChatRuntimeConfig,
  resolveAgentChatRuntimeFromConfig,
  testAgentChatRuntimeConfig,
} from './config'

const generateTextMock = vi.hoisted(() => vi.fn())

vi.mock('@xsai/generate-text', () => ({
  generateText: generateTextMock,
}))

describe('agent chat runtime config resolver', () => {
  beforeEach(() => {
    generateTextMock.mockReset()
    generateTextMock.mockResolvedValue({ text: 'configured provider response' })
  })

  it('returns no runtime when config is disabled', () => {
    expect(resolveAgentChatRuntimeFromConfig({
      enabled: false,
      provider: 'openai-compatible',
    })).toEqual({})
  })

  it('creates a local memory-aware runtime from enabled OpenAI-compatible config', async () => {
    const result = resolveAgentChatRuntimeFromConfig({
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible',
      target: 'local',
    })

    expect(result.chatTarget).toBe('local')
    await expect(result.chatRuntime?.generate({
      input: 'Hello with memory.',
      target: result.chatTarget!,
      compactProfileMarkdown: '# AIRI Compact Profile',
      context: [{
        kind: 'memory',
        id: 'memory-1',
        privacy: 'local',
        text: 'User is configuring local Gemma.',
      }],
    })).resolves.toMatchObject({
      response: 'configured provider response',
      usedContextIds: ['memory-1'],
    })
    expect(generateTextMock).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'http://localhost:11434/v1/',
      model: 'gemma3:4b',
    }))
  })

  it('creates a cloud-target runtime from enabled OpenAI-compatible config', () => {
    const result = resolveAgentChatRuntimeFromConfig({
      enabled: true,
      openAICompatible: {
        apiKey: 'cloud-key',
        baseURL: 'https://api.example.com/v1',
        model: 'cloud-model',
      },
      provider: 'openai-compatible',
      target: 'cloud',
    })

    expect(result.chatRuntime).toBeDefined()
    expect(result.chatTarget).toBe('cloud')
  })

  it('throws a clear error when enabled config is missing provider details', () => {
    expect(() => resolveAgentChatRuntimeFromConfig({
      enabled: true,
      provider: 'openai-compatible',
      target: 'local',
    })).toThrow('OpenAI-compatible chat runtime config is required when agent chat runtime is enabled')
  })

  it('throws a clear error when enabled config is missing an explicit target', () => {
    expect(() => resolveAgentChatRuntimeFromConfig({
      enabled: true,
      openAICompatible: {
        baseURL: 'https://api.example.com/v1',
        model: 'cloud-model',
      },
      provider: 'openai-compatible',
    })).toThrow('Agent chat runtime target is required when agent chat runtime is enabled')
  })
})

describe('agent chat runtime config eventa service', () => {
  it('returns the stored config through eventa', async () => {
    const context = createContext()
    const config: AgentChatRuntimeConfigStore = {
      get: vi.fn(() => ({
        enabled: false,
        provider: 'openai-compatible' as const,
      })),
      update: vi.fn(),
    }
    createAgentChatRuntimeConfigService({ context: context as never, config })

    const getConfig = defineInvoke(context, electronAgentChatRuntimeGetConfig)

    await expect(getConfig()).resolves.toEqual(defaultAgentChatRuntimeConfig)
    expect(config.get).toHaveBeenCalled()
  })

  it('persists an enabled local OpenAI-compatible config through eventa', async () => {
    const context = createContext()
    let stored = defaultAgentChatRuntimeConfig
    const config: AgentChatRuntimeConfigStore = {
      get: vi.fn(() => stored),
      update: vi.fn((next) => {
        stored = next
      }),
    }
    createAgentChatRuntimeConfigService({ context: context as never, config })

    const applyConfig = defineInvoke(context, electronAgentChatRuntimeApplyConfig)
    const nextConfig = {
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible' as const,
      target: 'local' as const,
    }

    await expect(applyConfig(nextConfig)).resolves.toEqual(nextConfig)
    expect(config.update).toHaveBeenCalledWith(nextConfig)
  })

  it('notifies after valid config applies through eventa', async () => {
    const context = createContext()
    let stored = defaultAgentChatRuntimeConfig
    const config: AgentChatRuntimeConfigStore = {
      get: vi.fn(() => stored),
      update: vi.fn((next) => {
        stored = next
      }),
    }
    const onConfigApplied = vi.fn()
    createAgentChatRuntimeConfigService({
      context: context as never,
      config,
      onConfigApplied,
    })

    const applyConfig = defineInvoke(context, electronAgentChatRuntimeApplyConfig)
    const nextConfig = {
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible' as const,
      target: 'local' as const,
    }

    await expect(applyConfig(nextConfig)).resolves.toEqual(nextConfig)
    expect(onConfigApplied).toHaveBeenCalledWith(nextConfig)
  })

  it('tests an enabled config through eventa without persisting it', async () => {
    const context = createContext()
    const config: AgentChatRuntimeConfigStore = {
      get: vi.fn(() => defaultAgentChatRuntimeConfig),
      update: vi.fn(),
    }
    const onConfigApplied = vi.fn()
    createAgentChatRuntimeConfigService({ context: context as never, config, onConfigApplied })

    const testConfig = defineInvoke(context, electronAgentChatRuntimeTestConfig)
    const nextConfig = {
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible' as const,
      target: 'local' as const,
    }

    await expect(testConfig(nextConfig)).resolves.toEqual({
      ok: true,
      responsePreview: 'configured provider response',
    })
    expect(generateTextMock).toHaveBeenCalled()
    expect(config.update).not.toHaveBeenCalled()
    expect(onConfigApplied).not.toHaveBeenCalled()
  })

  it('returns a failed probe result when the provider call fails', async () => {
    generateTextMock.mockRejectedValueOnce(new Error('provider unavailable'))
    const context = createContext()
    const config: AgentChatRuntimeConfigStore = {
      get: vi.fn(() => defaultAgentChatRuntimeConfig),
      update: vi.fn(),
    }
    createAgentChatRuntimeConfigService({ context: context as never, config })

    const testConfig = defineInvoke(context, electronAgentChatRuntimeTestConfig)

    await expect(testConfig({
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible',
      target: 'local',
    })).resolves.toEqual({
      errorMessage: 'provider unavailable',
      ok: false,
    })
    expect(config.update).not.toHaveBeenCalled()
  })

  it('times out provider probes instead of waiting forever', async () => {
    vi.useFakeTimers()
    generateTextMock.mockImplementationOnce(() => new Promise(() => {}))

    try {
      const result = testAgentChatRuntimeConfig({
        enabled: true,
        openAICompatible: {
          baseURL: 'http://localhost:11434/v1',
          model: 'gemma3:4b',
        },
        provider: 'openai-compatible',
        target: 'local',
      })

      await vi.advanceTimersByTimeAsync(15000)

      await expect(result).resolves.toEqual({
        errorMessage: 'Agent chat runtime connection test timed out after 15000ms',
        ok: false,
      })
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('rejects enabled configs without an explicit target before persistence', async () => {
    const context = createContext()
    const onConfigApplied = vi.fn()
    const config: AgentChatRuntimeConfigStore = {
      get: vi.fn(() => defaultAgentChatRuntimeConfig),
      update: vi.fn(),
    }
    createAgentChatRuntimeConfigService({ context: context as never, config, onConfigApplied })

    const applyConfig = defineInvoke(context, electronAgentChatRuntimeApplyConfig)

    await expect(applyConfig({
      ...defaultAgentChatRuntimeConfig,
      enabled: true,
      openAICompatible: {
        baseURL: 'https://api.example.com/v1',
        model: 'cloud-model',
      },
    })).rejects.toThrow('Agent chat runtime target is required when agent chat runtime is enabled')
    expect(config.update).not.toHaveBeenCalled()
    expect(onConfigApplied).not.toHaveBeenCalled()
  })

  it('rejects malformed config payloads before persistence', async () => {
    const context = createContext()
    const config: AgentChatRuntimeConfigStore = {
      get: vi.fn(() => defaultAgentChatRuntimeConfig),
      update: vi.fn(),
    }
    createAgentChatRuntimeConfigService({ context: context as never, config })

    const applyConfig = defineInvoke(context, electronAgentChatRuntimeApplyConfig)

    await expect(applyConfig({
      enabled: true,
      openAICompatible: {
        baseURL: 'https://api.example.com/v1',
        model: 'cloud-model',
      },
      provider: 'openai-compatible',
      target: 'private-device',
    } as never)).rejects.toThrow('Invalid agent chat runtime config')
    expect(config.update).not.toHaveBeenCalled()
  })
})
