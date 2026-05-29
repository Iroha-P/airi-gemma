import { describe, expect, it } from 'vitest'

import {
  createAgentChatRuntimeFormState,
  isAgentChatRuntimeFormSubmittable,
  isAgentChatRuntimeFormTestable,
  toAgentChatRuntimeConfigPayload,
} from './agent-chat-runtime-form'

describe('agent chat runtime settings form helpers', () => {
  it('omits target and provider details when building a disabled config payload', () => {
    expect(toAgentChatRuntimeConfigPayload({
      apiKey: 'secret-key',
      baseURL: 'http://localhost:11434/v1',
      enabled: false,
      model: 'gemma3:4b',
      target: 'local',
    })).toEqual({
      enabled: false,
      provider: 'openai-compatible',
    })
  })

  it('trims OpenAI-compatible provider fields for enabled configs', () => {
    expect(toAgentChatRuntimeConfigPayload({
      apiKey: ' cloud-key ',
      baseURL: ' http://localhost:11434/v1 ',
      enabled: true,
      model: ' gemma3:4b ',
      target: 'local',
    })).toEqual({
      enabled: true,
      openAICompatible: {
        apiKey: 'cloud-key',
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible',
      target: 'local',
    })
  })

  it('requires explicit target, base URL, and model before enabled configs can be submitted', () => {
    expect(isAgentChatRuntimeFormSubmittable({
      apiKey: '',
      baseURL: 'http://localhost:11434/v1',
      enabled: true,
      model: 'gemma3:4b',
      target: undefined,
    })).toBe(false)
    expect(isAgentChatRuntimeFormSubmittable({
      apiKey: '',
      baseURL: '',
      enabled: true,
      model: 'gemma3:4b',
      target: 'local',
    })).toBe(false)
    expect(isAgentChatRuntimeFormSubmittable({
      apiKey: '',
      baseURL: 'http://localhost:11434/v1',
      enabled: true,
      model: 'gemma3:4b',
      target: 'local',
    })).toBe(true)
  })

  it('only allows connection tests for enabled and complete runtime configs', () => {
    expect(isAgentChatRuntimeFormTestable({
      apiKey: '',
      baseURL: 'http://localhost:11434/v1',
      enabled: false,
      model: 'gemma3:4b',
      target: 'local',
    })).toBe(false)
    expect(isAgentChatRuntimeFormTestable({
      apiKey: '',
      baseURL: 'http://localhost:11434/v1',
      enabled: true,
      model: 'gemma3:4b',
      target: 'local',
    })).toBe(true)
  })

  it('creates form state from stored config without inventing a default target', () => {
    expect(createAgentChatRuntimeFormState({
      enabled: false,
      provider: 'openai-compatible',
    })).toEqual({
      apiKey: '',
      baseURL: '',
      enabled: false,
      model: '',
      target: undefined,
    })
  })
})
