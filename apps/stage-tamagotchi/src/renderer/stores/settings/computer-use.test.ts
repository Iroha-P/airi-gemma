import type {
  ElectronComputerUseActionPreview,
  ElectronComputerUseActionPreviewRequest,
  ElectronComputerUseExecutionResult,
  ElectronComputerUsePolicySnapshot,
} from '../../../shared/eventa'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMocks = vi.hoisted(() => {
  const policy: ElectronComputerUsePolicySnapshot = {
    mode: 'controlled_execution',
    allowedReadRoots: ['F:/project'],
    allowedWriteRoots: ['F:/project/airi-gemma'],
    deniedRoots: ['F:/project/airi-gemma/private'],
    requireConfirmationRoots: ['F:/project'],
    highRiskKinds: ['delete_path', 'move_path', 'run_command', 'write_file'],
  }
  const preview: ElectronComputerUseActionPreview = {
    id: 'preview-1',
    kind: 'run_command',
    command: 'pnpm test',
    cwd: 'F:/project/airi-gemma',
    reason: 'Verify tests',
    risk: 'high',
    decision: 'confirm',
    reasons: ['Command execution is high risk.'],
    requiresConfirmation: true,
    canExecute: false,
    createdAt: '2026-05-13T00:00:00.000Z',
  }
  const executablePreview: ElectronComputerUseActionPreview = {
    id: 'preview-2',
    kind: 'open_url',
    target: 'https://example.com',
    reason: 'Open documentation',
    risk: 'medium',
    decision: 'confirm',
    reasons: ['Launching or opening resources requires confirmation.'],
    requiresConfirmation: true,
    canExecute: true,
    createdAt: '2026-05-13T00:00:02.000Z',
  }
  const execution: ElectronComputerUseExecutionResult = {
    executedAt: '2026-05-13T00:00:01.000Z',
    id: 'execution-1',
    kind: 'open_url',
    output: 'opened in tests',
    previewId: 'preview-2',
    status: 'completed',
  }

  return {
    executeAction: vi.fn(async () => execution),
    execution,
    policy,
    preview,
    getPolicy: vi.fn(async () => policy),
    previewAction: vi.fn(async (request: ElectronComputerUseActionPreviewRequest) => request.kind === 'open_url' ? executablePreview : preview),
    listAuditLogs: vi.fn(async () => ({ items: [preview] })),
  }
})

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaInvoke: (event: { receiveEvent?: { id?: string } }) => {
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:computer-use:get-policy-receive')
      return invokeMocks.getPolicy
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:computer-use:preview-action-receive')
      return invokeMocks.previewAction
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:computer-use:list-audit-logs-receive')
      return invokeMocks.listAuditLogs
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:computer-use:execute-action-receive')
      return invokeMocks.executeAction

    throw new Error(`Unexpected eventa invoke: ${JSON.stringify(event)}`)
  },
}))

const toastError = vi.fn()
const toastSuccess = vi.fn()

vi.mock('vue-sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

describe('useComputerUseSettingsStore', async () => {
  const { useComputerUseSettingsStore } = await import('./computer-use')

  beforeEach(() => {
    setActivePinia(createPinia())
    invokeMocks.executeAction.mockClear()
    invokeMocks.getPolicy.mockClear()
    invokeMocks.previewAction.mockClear()
    invokeMocks.listAuditLogs.mockClear()
    toastError.mockClear()
    toastSuccess.mockClear()
  })

  it('refreshes policy, previews an action, and loads audit logs through eventa invokes', async () => {
    const store = useComputerUseSettingsStore()

    const policy = await store.refreshPolicy()
    expect(invokeMocks.getPolicy).toHaveBeenCalled()
    expect(policy).toEqual(invokeMocks.policy)
    expect(store.policy).toEqual(invokeMocks.policy)

    const request: ElectronComputerUseActionPreviewRequest = {
      kind: 'run_command',
      command: 'pnpm test',
      cwd: 'F:/project/airi-gemma',
      reason: 'Verify tests',
    }
    const preview = await store.previewAction(request)
    expect(invokeMocks.previewAction).toHaveBeenCalledWith(request)
    expect(preview).toEqual(invokeMocks.preview)
    expect(store.currentPreview).toEqual(invokeMocks.preview)
    expect(store.auditEntries).toEqual([invokeMocks.preview])
    expect(toastSuccess).toHaveBeenCalledWith('Computer use action previewed')

    const auditEntries = await store.refreshAuditLogs()
    expect(invokeMocks.listAuditLogs).toHaveBeenCalled()
    expect(auditEntries).toEqual([invokeMocks.preview])
  })

  it('rejects preview requests without action-specific input', async () => {
    const store = useComputerUseSettingsStore()

    await expect(store.previewAction({ kind: 'run_command' })).rejects.toThrow('Command is required for this computer-use action')

    expect(invokeMocks.previewAction).not.toHaveBeenCalled()
    expect(store.lastError).toBe('Command is required for this computer-use action')
    expect(toastError).toHaveBeenCalledWith('Command is required for this computer-use action')
  })

  it('executes the current preview only with explicit approval', async () => {
    const store = useComputerUseSettingsStore()
    await store.previewAction({
      kind: 'open_url',
      reason: 'Open documentation',
      target: 'https://example.com',
    })

    const result = await store.executeCurrentPreview(true)

    expect(invokeMocks.executeAction).toHaveBeenCalledWith({
      approved: true,
      id: 'preview-2',
    })
    expect(result).toEqual(invokeMocks.execution)
    expect(store.currentExecution).toEqual(invokeMocks.execution)
    expect(toastSuccess).toHaveBeenCalledWith('Computer use action executed')
  })

  it('refuses renderer-side execution when the preview is not executable', async () => {
    const store = useComputerUseSettingsStore()
    await store.previewAction({
      command: 'pnpm test',
      cwd: 'F:/project/airi-gemma',
      kind: 'run_command',
      reason: 'Verify tests',
    })

    await expect(store.executeCurrentPreview(true)).rejects.toThrow('Current computer-use preview is not executable')

    expect(invokeMocks.executeAction).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith('Current computer-use preview is not executable')
  })
})
