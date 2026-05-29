import type { GenerateTextOptions } from '@xsai/generate-text'

import type { MemoryAwareChatRuntimeOptions } from './memory-aware'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMemoryAwareChatRuntime } from './memory-aware'
import { createXsaiOpenAICompatibleChatGenerateText } from './xsai-openai-compatible'

const generateTextMock = vi.hoisted(() => vi.fn())

vi.mock('@xsai/generate-text', () => ({
  generateText: generateTextMock,
}))

describe('xsAI OpenAI-compatible chat adapter', () => {
  beforeEach(() => {
    generateTextMock.mockReset()
    generateTextMock.mockResolvedValue({ text: 'provider text' })
  })

  it('passes OpenAI-compatible config and messages to xsAI generateText', async () => {
    const generateText = createXsaiOpenAICompatibleChatGenerateText({
      apiKey: 'test-key',
      baseURL: 'http://127.0.0.1:11434/v1',
      headers: { 'x-provider': 'local' },
      model: 'gemma3:4b',
    })

    const result = await generateText({
      target: 'local',
      messages: [
        { role: 'system', content: 'You are AIRI.' },
        { role: 'user', content: 'Hello.' },
      ],
    })

    expect(result).toBe('provider text')
    expect(generateTextMock).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'http://127.0.0.1:11434/v1/',
      headers: { 'x-provider': 'local' },
      model: 'gemma3:4b',
      messages: [
        { role: 'system', content: 'You are AIRI.' },
        { role: 'user', content: 'Hello.' },
      ],
    } satisfies GenerateTextOptions)
  })

  it('trims and normalizes baseURL before remote calls', async () => {
    const generateText = createXsaiOpenAICompatibleChatGenerateText({
      baseURL: '  http://localhost:1234/v1  ',
      model: 'local-model',
    })

    await generateText({
      target: 'local',
      messages: [{ role: 'user', content: 'Ping.' }],
    })

    expect(generateTextMock).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'http://localhost:1234/v1/',
    }))
  })

  it('throws a clear error when required config is missing', async () => {
    expect(() => createXsaiOpenAICompatibleChatGenerateText({
      baseURL: '',
      model: 'gemma',
    })).toThrow('OpenAI-compatible chat baseURL is required')
    expect(() => createXsaiOpenAICompatibleChatGenerateText({
      baseURL: 'http://localhost:11434/v1',
      model: '',
    })).toThrow('OpenAI-compatible chat model is required')

    expect(generateTextMock).not.toHaveBeenCalled()
  })

  it('rejects ambiguous apiKey and Authorization header credentials', () => {
    expect(() => createXsaiOpenAICompatibleChatGenerateText({
      apiKey: 'test-key',
      baseURL: 'http://localhost:11434/v1',
      headers: { Authorization: 'Bearer other-key' },
      model: 'gemma',
    })).toThrow('OpenAI-compatible chat credentials are ambiguous')
  })

  it('throws a clear error when xsAI returns no text', async () => {
    generateTextMock.mockResolvedValueOnce({ text: undefined })
    const generateText = createXsaiOpenAICompatibleChatGenerateText({
      baseURL: 'http://localhost:11434/v1',
      model: 'gemma',
    })

    await expect(generateText({
      target: 'local',
      messages: [{ role: 'user', content: 'Ping.' }],
    })).rejects.toThrow('OpenAI-compatible chat provider returned empty text')
  })

  it('can be used as the generateText function for memory-aware chat runtime', async () => {
    const generateText = createXsaiOpenAICompatibleChatGenerateText({
      baseURL: 'http://localhost:11434/v1',
      model: 'gemma',
    })
    const runtime = createMemoryAwareChatRuntime({ generateText })

    const result = await runtime.generate({
      input: 'Use memory safely.',
      target: 'local',
      compactProfileMarkdown: '# AIRI Compact Profile',
      context: [{
        kind: 'memory',
        id: 'memory-1',
        privacy: 'local',
        text: 'User is building a local assistant.',
      }],
    })

    expect(result.response).toBe('provider text')
    const request = generateTextMock.mock.calls[0]?.[0] as MemoryAwareChatRuntimeOptions['generateText'] extends (request: infer Request) => unknown ? Request : never
    expect(request.messages.map(message => message.content).join('\n')).toContain('AIRI Compact Profile')
    expect(request.messages.map(message => message.content).join('\n')).toContain('User is building a local assistant.')
  })
})
