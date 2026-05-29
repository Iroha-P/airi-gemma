import type { GenerateTextOptions } from '@xsai/generate-text'

import type { MemoryAwareChatRuntimeOptions } from './memory-aware'

import { generateText } from '@xsai/generate-text'

export interface XsaiOpenAICompatibleChatGenerateTextOptions {
  apiKey?: string
  baseURL: string
  headers?: Record<string, string>
  model: string
}

function normalizeRequiredString(value: string | undefined, message: string) {
  const normalized = value?.trim() ?? ''
  if (!normalized)
    throw new Error(message)

  return normalized
}

function normalizeBaseURL(value: string) {
  const baseURL = normalizeRequiredString(value, 'OpenAI-compatible chat baseURL is required')
  return baseURL.endsWith('/') ? baseURL : `${baseURL}/`
}

function hasAuthorizationHeader(headers: Record<string, string> | undefined) {
  return Object.keys(headers ?? {}).some(key => key.toLowerCase() === 'authorization')
}

export function createXsaiOpenAICompatibleChatGenerateText(
  options: XsaiOpenAICompatibleChatGenerateTextOptions,
): MemoryAwareChatRuntimeOptions['generateText'] {
  const baseURL = normalizeBaseURL(options.baseURL)
  const model = normalizeRequiredString(options.model, 'OpenAI-compatible chat model is required')
  const apiKey = options.apiKey?.trim()

  if (apiKey && hasAuthorizationHeader(options.headers))
    throw new Error('OpenAI-compatible chat credentials are ambiguous')

  return async (request) => {
    const result = await generateText({
      ...(apiKey ? { apiKey } : {}),
      baseURL,
      headers: options.headers,
      messages: request.messages,
      model,
    } satisfies GenerateTextOptions)

    if (!result.text?.trim())
      throw new Error('OpenAI-compatible chat provider returned empty text')

    return result.text
  }
}
