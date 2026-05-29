import type { ElectronRoutineDraft, ElectronRoutineItem } from '../../../shared/eventa'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMocks = vi.hoisted(() => {
  const draft: ElectronRoutineDraft = {
    slug: 'morning-check',
    title: 'Morning check',
    status: 'draft',
    steps: ['Morning check', 'Open dashboard'],
    content: '# Morning check\n\n## Steps\n\n- Morning check\n- Open dashboard\n',
  }
  const item: ElectronRoutineItem = {
    ...draft,
    path: 'F:/airi-memory/skills/morning-check.md',
    updatedAt: '2026-05-13T00:00:00.000Z',
  }

  return {
    draft,
    item,
    draftRoutine: vi.fn(async () => draft),
    saveRoutine: vi.fn(async () => item),
    listRoutines: vi.fn(async () => ({ items: [item] })),
    deleteRoutine: vi.fn(async () => {}),
  }
})

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaInvoke: (event: { receiveEvent?: { id?: string } }) => {
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:routine:draft-receive')
      return invokeMocks.draftRoutine
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:routine:save-receive')
      return invokeMocks.saveRoutine
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:routine:list-receive')
      return invokeMocks.listRoutines
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:routine:delete-receive')
      return invokeMocks.deleteRoutine

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

describe('useRoutineSettingsStore', async () => {
  const { useRoutineSettingsStore } = await import('./routines')

  beforeEach(() => {
    setActivePinia(createPinia())
    invokeMocks.draftRoutine.mockClear()
    invokeMocks.saveRoutine.mockClear()
    invokeMocks.listRoutines.mockClear()
    invokeMocks.deleteRoutine.mockClear()
    toastError.mockClear()
    toastSuccess.mockClear()
  })

  it('drafts, saves, lists, and deletes routines through eventa invokes', async () => {
    const store = useRoutineSettingsStore()

    const draft = await store.draftRoutine('  Morning check\nOpen dashboard  ')
    expect(invokeMocks.draftRoutine).toHaveBeenCalledWith({
      text: 'Morning check\nOpen dashboard',
    })
    expect(draft).toEqual(invokeMocks.draft)
    expect(store.currentDraft).toEqual(invokeMocks.draft)

    const saved = await store.saveCurrentDraft()
    expect(invokeMocks.saveRoutine).toHaveBeenCalledWith(invokeMocks.draft)
    expect(saved).toEqual(invokeMocks.item)
    expect(store.items).toEqual([invokeMocks.item])
    expect(toastSuccess).toHaveBeenCalledWith('Routine saved')

    const items = await store.refreshRoutines()
    expect(invokeMocks.listRoutines).toHaveBeenCalled()
    expect(items).toEqual([invokeMocks.item])
    expect(store.items).toEqual([invokeMocks.item])

    await store.deleteRoutine('morning-check')
    expect(invokeMocks.deleteRoutine).toHaveBeenCalledWith({ slug: 'morning-check' })
    expect(store.items).toEqual([])
    expect(toastSuccess).toHaveBeenCalledWith('Routine deleted')
  })

  it('rejects empty routine drafts before invoking main process', async () => {
    const store = useRoutineSettingsStore()

    await expect(store.draftRoutine('   ')).rejects.toThrow('Routine draft text cannot be empty')

    expect(invokeMocks.draftRoutine).not.toHaveBeenCalled()
    expect(store.lastError).toBe('Routine draft text cannot be empty')
    expect(toastError).toHaveBeenCalledWith('Routine draft text cannot be empty')
  })
})
