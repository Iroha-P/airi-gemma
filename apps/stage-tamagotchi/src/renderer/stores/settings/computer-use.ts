import type {
  ElectronComputerUseActionKind,
  ElectronComputerUseActionPreview,
  ElectronComputerUseActionPreviewRequest,
  ElectronComputerUseAuditEntry,
  ElectronComputerUseExecutionResult,
  ElectronComputerUsePolicySnapshot,
} from '../../../shared/eventa'

import { errorMessageFrom } from '@moeru/std'
import { useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import {
  electronComputerUseExecuteAction,
  electronComputerUseGetPolicy,
  electronComputerUseListAuditLogs,
  electronComputerUsePreviewAction,
} from '../../../shared/eventa'

const commandKinds: ElectronComputerUseActionKind[] = ['run_command']
const targetKinds: ElectronComputerUseActionKind[] = [
  'read_file',
  'search_files',
  'open_url',
  'open_path',
  'write_file',
  'delete_path',
  'move_path',
]

function normalizePreviewRequest(payload: ElectronComputerUseActionPreviewRequest): ElectronComputerUseActionPreviewRequest {
  const request: ElectronComputerUseActionPreviewRequest = {
    kind: payload.kind,
  }

  const target = payload.target?.trim()
  const command = payload.command?.trim()
  const cwd = payload.cwd?.trim()
  const reason = payload.reason?.trim()

  if (target)
    request.target = target
  if (command)
    request.command = command
  if (cwd)
    request.cwd = cwd
  if (reason)
    request.reason = reason

  return request
}

function validatePreviewRequest(payload: ElectronComputerUseActionPreviewRequest) {
  const request = normalizePreviewRequest(payload)

  if (commandKinds.includes(request.kind) && !request.command)
    throw new Error('Command is required for this computer-use action')

  if (targetKinds.includes(request.kind) && !request.target)
    throw new Error('Target is required for this computer-use action')

  return request
}

export const useComputerUseSettingsStore = defineStore('tamagotchi-computer-use-settings', () => {
  const policy = ref<ElectronComputerUsePolicySnapshot | null>(null)
  const currentPreview = ref<ElectronComputerUseActionPreview | null>(null)
  const currentExecution = ref<ElectronComputerUseExecutionResult | null>(null)
  const auditEntries = ref<ElectronComputerUseAuditEntry[]>([])
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  const getPolicy = useElectronEventaInvoke(electronComputerUseGetPolicy)
  const previewComputerUseAction = useElectronEventaInvoke(electronComputerUsePreviewAction)
  const executeComputerUseAction = useElectronEventaInvoke(electronComputerUseExecuteAction)
  const listAuditLogs = useElectronEventaInvoke(electronComputerUseListAuditLogs)

  function setError(error: unknown, fallback: string) {
    const message = errorMessageFrom(error) ?? fallback
    lastError.value = message
    toast.error(message)
  }

  async function refreshPolicy() {
    loading.value = true
    lastError.value = null

    try {
      policy.value = await getPolicy()
      return policy.value
    }
    catch (error) {
      setError(error, 'Failed to load computer-use policy')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function refreshAuditLogs() {
    loading.value = true
    lastError.value = null

    try {
      const result = await listAuditLogs()
      auditEntries.value = result.items
      return auditEntries.value
    }
    catch (error) {
      setError(error, 'Failed to load computer-use audit logs')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function previewAction(payload: ElectronComputerUseActionPreviewRequest) {
    let request: ElectronComputerUseActionPreviewRequest
    try {
      request = validatePreviewRequest(payload)
    }
    catch (error) {
      setError(error, 'Invalid computer-use action preview request')
      throw error
    }

    loading.value = true
    lastError.value = null

    try {
      const preview = await previewComputerUseAction(request)
      currentPreview.value = preview
      currentExecution.value = null
      auditEntries.value = [
        preview,
        ...auditEntries.value.filter(entry => entry.id !== preview.id),
      ].slice(0, 20)
      toast.success('Computer use action previewed')
      return preview
    }
    catch (error) {
      setError(error, 'Failed to preview computer-use action')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function executeCurrentPreview(approved: boolean) {
    if (!currentPreview.value) {
      const error = new Error('No computer-use preview is selected')
      setError(error, 'No computer-use preview is selected')
      throw error
    }
    if (!currentPreview.value.canExecute) {
      const error = new Error('Current computer-use preview is not executable')
      setError(error, 'Current computer-use preview is not executable')
      throw error
    }

    loading.value = true
    lastError.value = null

    try {
      const result = await executeComputerUseAction({
        approved,
        id: currentPreview.value.id,
      })
      currentExecution.value = result
      if (result.status === 'completed')
        toast.success('Computer use action executed')
      else
        toast.error(result.errorMessage ?? 'Computer use action failed')
      return result
    }
    catch (error) {
      setError(error, 'Failed to execute computer-use action')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  void Promise.all([
    refreshPolicy(),
    refreshAuditLogs(),
  ])

  return {
    policy,
    currentPreview,
    currentExecution,
    auditEntries,
    loading,
    lastError,
    refreshPolicy,
    refreshAuditLogs,
    previewAction,
    executeCurrentPreview,
  }
})
