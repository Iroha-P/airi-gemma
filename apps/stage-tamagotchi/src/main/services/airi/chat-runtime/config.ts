import type { createContext } from '@moeru/eventa/adapters/electron/main'

import type {
  ElectronAgentChatRuntimeConfig,
  ElectronAgentChatRuntimeProvider,
  ElectronAgentChatRuntimeTestResult,
  ElectronAgentChatTarget,
  ElectronAgentOpenAICompatibleChatRuntimeConfig,
} from '../../../../shared/eventa'
import type { MemoryAwareChatRuntime } from './memory-aware'

import { defineInvokeHandler } from '@moeru/eventa'
import { createContext as createElectronMainContext } from '@moeru/eventa/adapters/electron/main'
import { errorMessageFrom } from '@moeru/std'
import { ipcMain } from 'electron'
import { boolean, object, optional, parse, picklist, record, string } from 'valibot'

import {
  electronAgentChatRuntimeApplyConfig,
  electronAgentChatRuntimeGetConfig,
  electronAgentChatRuntimeTestConfig,
} from '../../../../shared/eventa'
import { createConfig } from '../../../libs/electron/persistence'
import { createMemoryAwareChatRuntime } from './memory-aware'
import { createXsaiOpenAICompatibleChatGenerateText } from './xsai-openai-compatible'

export type AgentChatRuntimeProvider = ElectronAgentChatRuntimeProvider

export type AgentOpenAICompatibleChatRuntimeConfig = ElectronAgentOpenAICompatibleChatRuntimeConfig

export type AgentChatRuntimeConfig = ElectronAgentChatRuntimeConfig

export interface AgentChatRuntimeConfigStore {
  get: () => AgentChatRuntimeConfig | undefined
  update: (config: AgentChatRuntimeConfig) => void
}

export interface ResolvedAgentChatRuntime {
  chatRuntime?: MemoryAwareChatRuntime
  chatTarget?: ElectronAgentChatTarget
}

export const defaultAgentChatRuntimeConfig: AgentChatRuntimeConfig = {
  enabled: false,
  provider: 'openai-compatible',
}

export const agentChatRuntimeTestTimeoutMs = 15000

export const agentChatRuntimeConfigSchema = object({
  enabled: optional(boolean(), false),
  openAICompatible: optional(object({
    apiKey: optional(string()),
    baseURL: string(),
    headers: optional(record(string(), string())),
    model: string(),
  })),
  provider: optional(picklist(['openai-compatible']), 'openai-compatible'),
  target: optional(picklist(['local', 'cloud'])),
})

export function createAgentChatRuntimeConfig() {
  const config = createConfig('agent-chat-runtime', 'config.json', agentChatRuntimeConfigSchema, {
    default: defaultAgentChatRuntimeConfig,
  })
  config.setup()

  return config
}

export function resolveAgentChatRuntimeFromConfig(config: AgentChatRuntimeConfig | undefined): ResolvedAgentChatRuntime {
  if (!config?.enabled)
    return {}

  if (config.provider !== 'openai-compatible')
    throw new Error(`Unsupported agent chat runtime provider: ${config.provider}`)

  if (!config.target)
    throw new Error('Agent chat runtime target is required when agent chat runtime is enabled')

  if (!config.openAICompatible)
    throw new Error('OpenAI-compatible chat runtime config is required when agent chat runtime is enabled')

  return {
    chatRuntime: createMemoryAwareChatRuntime({
      generateText: createXsaiOpenAICompatibleChatGenerateText(config.openAICompatible),
    }),
    chatTarget: config.target,
  }
}

export function getAgentChatRuntimeConfig(config: AgentChatRuntimeConfigStore): AgentChatRuntimeConfig {
  return config.get() ?? defaultAgentChatRuntimeConfig
}

export function validateAgentChatRuntimeConfig(payload: AgentChatRuntimeConfig): AgentChatRuntimeConfig {
  try {
    return parse(agentChatRuntimeConfigSchema, payload)
  }
  catch (error) {
    throw new Error('Invalid agent chat runtime config', { cause: error })
  }
}

export function applyAgentChatRuntimeConfig(config: AgentChatRuntimeConfigStore, nextConfig: AgentChatRuntimeConfig): AgentChatRuntimeConfig {
  const validatedConfig = validateAgentChatRuntimeConfig(nextConfig)
  resolveAgentChatRuntimeFromConfig(validatedConfig)
  config.update(validatedConfig)
  return getAgentChatRuntimeConfig(config)
}

async function withAgentChatRuntimeTestTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`Agent chat runtime connection test timed out after ${agentChatRuntimeTestTimeoutMs}ms`))
    }, agentChatRuntimeTestTimeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  }
  finally {
    if (timeout)
      clearTimeout(timeout)
  }
}

export async function testAgentChatRuntimeConfig(payload: AgentChatRuntimeConfig): Promise<ElectronAgentChatRuntimeTestResult> {
  try {
    const validatedConfig = validateAgentChatRuntimeConfig(payload)
    const resolved = resolveAgentChatRuntimeFromConfig(validatedConfig)

    if (!resolved.chatRuntime || !resolved.chatTarget)
      throw new Error('Agent chat runtime must be enabled before testing')

    const result = await withAgentChatRuntimeTestTimeout(resolved.chatRuntime.generate({
      input: 'ping',
      target: resolved.chatTarget,
      compactProfileMarkdown: undefined,
      context: [],
    }))

    return {
      ok: true,
      responsePreview: result.response.trim().slice(0, 300),
    }
  }
  catch (error) {
    return {
      errorMessage: errorMessageFrom(error) ?? 'Failed to test agent chat runtime config',
      ok: false,
    }
  }
}

export function createAgentChatRuntimeConfigService(params: {
  context: ReturnType<typeof createContext>['context']
  config: AgentChatRuntimeConfigStore
  onConfigApplied?: (config: AgentChatRuntimeConfig) => Promise<void> | void
}) {
  defineInvokeHandler(params.context, electronAgentChatRuntimeGetConfig, () => getAgentChatRuntimeConfig(params.config))
  defineInvokeHandler(params.context, electronAgentChatRuntimeApplyConfig, async (payload) => {
    const nextConfig = applyAgentChatRuntimeConfig(params.config, payload)
    await params.onConfigApplied?.(nextConfig)
    return nextConfig
  })
  defineInvokeHandler(params.context, electronAgentChatRuntimeTestConfig, payload => testAgentChatRuntimeConfig(payload))
}

let agentChatRuntimeConfigServiceRegistered = false

export function registerGlobalAgentChatRuntimeConfigService(params: {
  config: AgentChatRuntimeConfigStore
  onConfigApplied?: (config: AgentChatRuntimeConfig) => Promise<void> | void
}) {
  if (agentChatRuntimeConfigServiceRegistered)
    return

  agentChatRuntimeConfigServiceRegistered = true
  const { context } = createElectronMainContext(ipcMain)
  createAgentChatRuntimeConfigService({
    context,
    config: params.config,
    onConfigApplied: params.onConfigApplied,
  })
}
