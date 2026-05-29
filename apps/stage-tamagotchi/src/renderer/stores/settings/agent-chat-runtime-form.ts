import type { ElectronAgentChatRuntimeConfig, ElectronAgentChatTarget } from '../../../shared/eventa'

export interface AgentChatRuntimeFormState {
  apiKey: string
  baseURL: string
  enabled: boolean
  model: string
  target?: ElectronAgentChatTarget
}

export function createAgentChatRuntimeFormState(config: ElectronAgentChatRuntimeConfig | null | undefined): AgentChatRuntimeFormState {
  return {
    apiKey: config?.openAICompatible?.apiKey ?? '',
    baseURL: config?.openAICompatible?.baseURL ?? '',
    enabled: config?.enabled ?? false,
    model: config?.openAICompatible?.model ?? '',
    target: config?.target,
  }
}

export function isAgentChatRuntimeFormSubmittable(form: AgentChatRuntimeFormState): boolean {
  if (!form.enabled)
    return true

  return Boolean(form.target && form.baseURL.trim() && form.model.trim())
}

export function isAgentChatRuntimeFormTestable(form: AgentChatRuntimeFormState): boolean {
  return form.enabled && isAgentChatRuntimeFormSubmittable(form)
}

export function toAgentChatRuntimeConfigPayload(form: AgentChatRuntimeFormState): ElectronAgentChatRuntimeConfig {
  if (!form.enabled) {
    return {
      enabled: false,
      provider: 'openai-compatible',
    }
  }

  const apiKey = form.apiKey.trim()
  return {
    enabled: true,
    openAICompatible: {
      ...(apiKey ? { apiKey } : {}),
      baseURL: form.baseURL.trim(),
      model: form.model.trim(),
    },
    provider: 'openai-compatible',
    target: form.target,
  }
}
