import type { ElectronAgentRun, ElectronAgentToolDescriptor } from '../../../shared/eventa'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMocks = vi.hoisted(() => {
  const run: ElectronAgentRun = {
    id: 'agent-run-1',
    input: 'What should AIRI remember?',
    mode: 'direct_answer',
    status: 'completed',
    createdAt: '2026-05-13T00:00:00.000Z',
    updatedAt: '2026-05-13T00:00:00.000Z',
    context: [{
      id: 'memory-1',
      kind: 'memory',
      privacy: 'local',
      text: 'User is building AIRI memory.',
      title: 'AIRI memory',
    }],
    response: 'AIRI should remember project habits.',
    usedContextIds: ['memory-1'],
    withheldContextIds: ['memory-secret'],
  }
  const pendingRun: ElectronAgentRun = {
    ...run,
    id: 'agent-run-pending',
    mode: 'confirmation',
    status: 'awaiting_confirmation',
    pendingAction: {
      id: 'action-1',
      arguments: { path: 'F:/project/airi-gemma' },
      requiresConfirmation: true,
      risk: 'high',
      title: 'Open local file',
      toolName: 'computer.open-file',
    },
    response: undefined,
  }
  const confirmedRun: ElectronAgentRun = {
    ...pendingRun,
    mode: 'tool_call',
    pendingAction: undefined,
    response: 'Confirmed action: Open local file. Execution is not enabled in P4.',
    status: 'completed',
  }
  const reflectedRun: ElectronAgentRun = {
    ...run,
    memoryId: 'memory-reflection-1',
    mode: 'reflect_and_store',
    response: 'AIRI should remember project habits.',
  }
  const tools: ElectronAgentToolDescriptor[] = [{
    description: 'Search local memories.',
    name: 'memory.search',
    requiresConfirmation: false,
    risk: 'low',
    title: 'Search memory',
  }]

  return {
    run,
    pendingRun,
    confirmedRun,
    reflectedRun,
    tools,
    runAgent: vi.fn(async () => run),
    getRun: vi.fn(async () => run),
    cancelRun: vi.fn(async (payload: { id: string }) => ({
      ...run,
      id: payload.id,
      status: 'cancelled',
    })),
    listTools: vi.fn(async () => tools),
    confirmAction: vi.fn(async () => confirmedRun),
    reflectAndStore: vi.fn(async () => reflectedRun),
  }
})

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaInvoke: (event: { receiveEvent?: { id?: string } }) => {
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent:run-receive')
      return invokeMocks.runAgent
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent:get-run-receive')
      return invokeMocks.getRun
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent:cancel-run-receive')
      return invokeMocks.cancelRun
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent:list-tools-receive')
      return invokeMocks.listTools
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent:confirm-action-receive')
      return invokeMocks.confirmAction
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent:reflect-and-store-receive')
      return invokeMocks.reflectAndStore

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

describe('useAgentSettingsStore', async () => {
  const { useAgentSettingsStore } = await import('./agent')

  beforeEach(() => {
    setActivePinia(createPinia())
    invokeMocks.runAgent.mockClear()
    invokeMocks.getRun.mockClear()
    invokeMocks.cancelRun.mockClear()
    invokeMocks.listTools.mockClear()
    invokeMocks.confirmAction.mockClear()
    invokeMocks.reflectAndStore.mockClear()
    toastError.mockClear()
    toastSuccess.mockClear()
  })

  it('runs an agent request and remembers the current run', async () => {
    const store = useAgentSettingsStore()

    const run = await store.runAgent({ input: '  What should AIRI remember?  ' })

    expect(invokeMocks.runAgent).toHaveBeenCalledWith({ input: 'What should AIRI remember?' })
    expect(run).toEqual(invokeMocks.run)
    expect(store.currentRun).toEqual(invokeMocks.run)
    expect(store.runs).toEqual([invokeMocks.run])
    expect(store.lastError).toBeNull()
  })

  it('rejects empty agent requests before invoking main process', async () => {
    const store = useAgentSettingsStore()

    await expect(store.runAgent({ input: '   ' })).rejects.toThrow('Agent input cannot be empty')

    expect(invokeMocks.runAgent).not.toHaveBeenCalled()
    expect(store.lastError).toBe('Agent input cannot be empty')
    expect(toastError).toHaveBeenCalledWith('Agent input cannot be empty')
  })

  it('loads tools, cancels, confirms, and reflects the current run through eventa invokes', async () => {
    const store = useAgentSettingsStore()

    const tools = await store.refreshTools()
    expect(invokeMocks.listTools).toHaveBeenCalled()
    expect(tools).toEqual(invokeMocks.tools)
    expect(store.tools).toEqual(invokeMocks.tools)

    await store.runAgent({ input: 'What should AIRI remember?' })

    const cancelled = await store.cancelCurrentRun()
    expect(invokeMocks.cancelRun).toHaveBeenCalledWith({ id: 'agent-run-1' })
    expect(cancelled?.status).toBe('cancelled')
    expect(store.currentRun?.status).toBe('cancelled')

    store.currentRun = invokeMocks.pendingRun
    const confirmed = await store.confirmCurrentAction(true)
    expect(invokeMocks.confirmAction).toHaveBeenCalledWith({ id: 'agent-run-pending', approved: true })
    expect(confirmed?.status).toBe('completed')
    expect(store.currentRun?.pendingAction).toBeUndefined()

    const reflected = await store.reflectCurrentRun(' AIRI should remember project habits. ')
    expect(invokeMocks.reflectAndStore).toHaveBeenCalledWith({
      id: 'agent-run-pending',
      content: 'AIRI should remember project habits.',
    })
    expect(reflected?.memoryId).toBe('memory-reflection-1')
    expect(store.currentRun).toEqual(invokeMocks.reflectedRun)
    expect(toastSuccess).toHaveBeenCalledWith('Stored agent reflection as a memory candidate')
  })
})
