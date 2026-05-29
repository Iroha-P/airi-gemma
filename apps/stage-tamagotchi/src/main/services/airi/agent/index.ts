import type { createContext } from '@moeru/eventa/adapters/electron/main'

import type { AgentChatRuntimeConfig } from '../chat-runtime/config'
import type { ComputerUseManager } from '../computer-use'
import type { MemoryManager } from '../memory'
import type { RoutineManager } from '../routines'
import type { AgentOrchestrator } from './orchestrator'

import { defineInvokeHandler } from '@moeru/eventa'
import { createContext as createElectronMainContext } from '@moeru/eventa/adapters/electron/main'
import { errorMessageFrom } from '@moeru/std'
import { ipcMain } from 'electron'

import {
  electronAgentCancelRun,
  electronAgentConfirmAction,
  electronAgentGetRun,
  electronAgentListTools,
  electronAgentReflectAndStore,
  electronAgentRun,
} from '../../../../shared/eventa'
import { resolveAgentChatRuntimeFromConfig } from '../chat-runtime/config'
import { createAgentOrchestrator } from './orchestrator'

export function setupAgentOrchestrator(params: {
  memoryManager: MemoryManager
  chatRuntimeConfig?: AgentChatRuntimeConfig
  onChatRuntimeConfigError?: (error: Error) => void
  routineManager?: RoutineManager
  computerUseManager?: ComputerUseManager
}) {
  let resolvedChatRuntime
  try {
    resolvedChatRuntime = resolveAgentChatRuntimeFromConfig(params.chatRuntimeConfig)
  }
  catch (error) {
    params.onChatRuntimeConfigError?.(new Error(errorMessageFrom(error) ?? 'Failed to resolve agent chat runtime config'))
    resolvedChatRuntime = {}
  }

  if (resolvedChatRuntime.chatRuntime && resolvedChatRuntime.chatTarget) {
    return createAgentOrchestrator({
      memoryManager: params.memoryManager,
      chatRuntime: resolvedChatRuntime.chatRuntime,
      chatTarget: resolvedChatRuntime.chatTarget,
      routineManager: params.routineManager,
      computerUseManager: params.computerUseManager,
    })
  }

  return createAgentOrchestrator({
    memoryManager: params.memoryManager,
    routineManager: params.routineManager,
    computerUseManager: params.computerUseManager,
  })
}

export type { AgentOrchestrator }

let agentServiceRegistered = false

export function createAgentService(params: {
  context: ReturnType<typeof createContext>['context']
  orchestrator: AgentOrchestrator
}) {
  defineInvokeHandler(params.context, electronAgentRun, payload => params.orchestrator.run(payload))
  defineInvokeHandler(params.context, electronAgentGetRun, payload => params.orchestrator.getRun(payload))
  defineInvokeHandler(params.context, electronAgentCancelRun, payload => params.orchestrator.cancelRun(payload))
  defineInvokeHandler(params.context, electronAgentListTools, () => params.orchestrator.listTools())
  defineInvokeHandler(params.context, electronAgentConfirmAction, payload => params.orchestrator.confirmAction(payload))
  defineInvokeHandler(params.context, electronAgentReflectAndStore, payload => params.orchestrator.reflectAndStore(payload))
}

export function registerGlobalAgentService(params: { orchestrator: AgentOrchestrator }) {
  if (agentServiceRegistered)
    return

  agentServiceRegistered = true
  const { context } = createElectronMainContext(ipcMain)
  createAgentService({ context, orchestrator: params.orchestrator })
}
