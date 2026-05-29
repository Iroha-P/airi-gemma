import type { createContext } from '@moeru/eventa/adapters/electron/main'

import type { AgentChatRuntimeConfigStore } from '../chat-runtime/config'
import type { MemoryManager } from '../memory'
import type { DreamGenerateTextRequest } from './manager'

import { defineInvokeHandler } from '@moeru/eventa'
import { createContext as createElectronMainContext } from '@moeru/eventa/adapters/electron/main'
import { generateText } from '@xsai/generate-text'
import { ipcMain } from 'electron'

import {
  electronDreamApplySchedule,
  electronDreamCancelCurrent,
  electronDreamGetCurrent,
  electronDreamGetSchedule,
  electronDreamStartLocal,
  electronDreamTriggerScheduledNow,
} from '../../../../shared/eventa'
import { getAgentChatRuntimeConfig } from '../chat-runtime/config'
import { createDreamManager } from './manager'
import { createDreamScheduleConfig, createDreamScheduler } from './scheduler'

export type DreamManager = ReturnType<typeof createDreamManager>
export type DreamScheduler = ReturnType<typeof createDreamScheduler>

async function generateLocalDreamText(request: DreamGenerateTextRequest) {
  const result = await generateText({
    ...(request.apiKey ? { apiKey: request.apiKey } : {}),
    baseURL: request.baseURL.endsWith('/') ? request.baseURL : `${request.baseURL}/`,
    messages: [
      {
        content: request.input,
        role: 'user',
      },
    ],
    model: request.model,
  })

  if (!result.text?.trim())
    throw new Error('Local dream runtime returned empty text')

  return result.text
}

export function createDreamService(params: {
  context: ReturnType<typeof createContext>['context']
  manager: DreamManager
  scheduler?: DreamScheduler
}) {
  defineInvokeHandler(params.context, electronDreamStartLocal, (payload) => {
    return params.manager.startLocalDream(payload)
  })

  defineInvokeHandler(params.context, electronDreamGetCurrent, () => {
    return params.manager.getCurrent()
  })

  defineInvokeHandler(params.context, electronDreamCancelCurrent, () => {
    return params.manager.cancelCurrent()
  })

  if (params.scheduler) {
    defineInvokeHandler(params.context, electronDreamGetSchedule, () => {
      return params.scheduler?.getState()
    })

    defineInvokeHandler(params.context, electronDreamApplySchedule, (payload) => {
      return params.scheduler?.applyConfig(payload)
    })

    defineInvokeHandler(params.context, electronDreamTriggerScheduledNow, () => {
      return params.scheduler?.triggerNow()
    })
  }
}

export function setupDreamManager(params: {
  agentChatRuntimeConfig: AgentChatRuntimeConfigStore
  memoryManager: MemoryManager
}) {
  return createDreamManager({
    generateText: generateLocalDreamText,
    getRuntimeConfig: () => getAgentChatRuntimeConfig(params.agentChatRuntimeConfig),
    listMemories: () => params.memoryManager.list({ limit: 200 }),
    previewEvolution: () => params.memoryManager.previewEvolution({ limit: 20 }),
  })
}

export function setupDreamScheduler(params: {
  manager: DreamManager
}) {
  const scheduler = createDreamScheduler({
    configStore: createDreamScheduleConfig(),
    manager: params.manager,
  })
  scheduler.start()

  return scheduler
}

let dreamServiceRegistered = false

export function registerGlobalDreamService(params: { manager: DreamManager, scheduler?: DreamScheduler }) {
  if (dreamServiceRegistered)
    return

  dreamServiceRegistered = true
  const { context } = createElectronMainContext(ipcMain)
  createDreamService({ context, manager: params.manager, scheduler: params.scheduler })
}
