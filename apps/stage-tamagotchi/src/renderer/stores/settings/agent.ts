import type {
  ElectronAgentConfirmActionRequest,
  ElectronAgentReflectAndStoreRequest,
  ElectronAgentRun,
  ElectronAgentRunRequest,
  ElectronAgentToolDescriptor,
} from '../../../shared/eventa'

import { errorMessageFrom } from '@moeru/std'
import { useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import {
  electronAgentCancelRun,
  electronAgentConfirmAction,
  electronAgentGetRun,
  electronAgentListTools,
  electronAgentReflectAndStore,
  electronAgentRun,
} from '../../../shared/eventa'

export const useAgentSettingsStore = defineStore('tamagotchi-agent-settings', () => {
  const runs = ref<ElectronAgentRun[]>([])
  const currentRun = ref<ElectronAgentRun | null>(null)
  const tools = ref<ElectronAgentToolDescriptor[]>([])
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  const runAgentInvoke = useElectronEventaInvoke(electronAgentRun)
  const getRunInvoke = useElectronEventaInvoke(electronAgentGetRun)
  const cancelRunInvoke = useElectronEventaInvoke(electronAgentCancelRun)
  const listToolsInvoke = useElectronEventaInvoke(electronAgentListTools)
  const confirmActionInvoke = useElectronEventaInvoke(electronAgentConfirmAction)
  const reflectAndStoreInvoke = useElectronEventaInvoke(electronAgentReflectAndStore)

  function setError(error: unknown, fallback: string) {
    const message = errorMessageFrom(error) ?? fallback
    lastError.value = message
    toast.error(message)
  }

  function rememberRun(run: ElectronAgentRun) {
    currentRun.value = run
    runs.value = [
      run,
      ...runs.value.filter(existing => existing.id !== run.id),
    ].slice(0, 20)
    return run
  }

  async function runAgent(payload: ElectronAgentRunRequest) {
    const input = payload.input.trim()
    if (!input) {
      const error = new Error('Agent input cannot be empty')
      setError(error, 'Agent input cannot be empty')
      throw error
    }

    loading.value = true
    lastError.value = null

    try {
      const run = await runAgentInvoke({
        ...payload,
        input,
      })
      return rememberRun(run)
    }
    catch (error) {
      setError(error, 'Failed to run agent')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function refreshRun(id: string) {
    loading.value = true
    lastError.value = null

    try {
      const run = await getRunInvoke({ id })
      if (!run)
        return null

      return rememberRun(run)
    }
    catch (error) {
      setError(error, 'Failed to refresh agent run')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function refreshTools() {
    loading.value = true
    lastError.value = null

    try {
      tools.value = await listToolsInvoke()
      return tools.value
    }
    catch (error) {
      setError(error, 'Failed to load agent tools')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function cancelCurrentRun() {
    if (!currentRun.value)
      return null

    loading.value = true
    lastError.value = null

    try {
      const run = await cancelRunInvoke({ id: currentRun.value.id })
      return rememberRun(run)
    }
    catch (error) {
      setError(error, 'Failed to cancel agent run')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function confirmCurrentAction(approved: boolean) {
    if (!currentRun.value)
      return null

    const payload: ElectronAgentConfirmActionRequest = {
      id: currentRun.value.id,
      approved,
    }

    loading.value = true
    lastError.value = null

    try {
      const run = await confirmActionInvoke(payload)
      return rememberRun(run)
    }
    catch (error) {
      setError(error, 'Failed to confirm agent action')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function reflectCurrentRun(content?: string) {
    if (!currentRun.value)
      return null

    const trimmedContent = content?.trim()
    const payload: ElectronAgentReflectAndStoreRequest = trimmedContent
      ? { id: currentRun.value.id, content: trimmedContent }
      : { id: currentRun.value.id }

    loading.value = true
    lastError.value = null

    try {
      const run = await reflectAndStoreInvoke(payload)
      rememberRun(run)
      toast.success('Stored agent reflection as a memory candidate')
      return run
    }
    catch (error) {
      setError(error, 'Failed to store agent reflection')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  return {
    runs,
    currentRun,
    tools,
    loading,
    lastError,
    runAgent,
    refreshRun,
    refreshTools,
    cancelCurrentRun,
    confirmCurrentAction,
    reflectCurrentRun,
  }
})
