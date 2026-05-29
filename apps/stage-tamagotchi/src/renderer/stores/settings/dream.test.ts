import type {
  ElectronDreamScheduleConfig,
  ElectronDreamScheduleState,
  ElectronDreamSession,
  ElectronDreamStartRequest,
  ElectronMemoryCreateRequest,
  ElectronMemoryItem,
  ElectronRoutineDraft,
  ElectronRoutineDraftRequest,
  ElectronRoutineItem,
} from '../../../shared/eventa'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMocks = vi.hoisted(() => {
  const session: ElectronDreamSession = {
    id: 'dream-1',
    report: {
      evolutionSuggestionIds: [],
      generatedAt: '2026-05-13T00:00:00.000Z',
      id: 'dream-1',
      llmWikiDrafts: [],
      loraDatasetCandidates: [
        {
          messages: [
            { role: 'system', content: 'You are AIRI.' },
            { role: 'user', content: 'What should you remember from F:\\project\\private-notes.md?' },
            { role: 'assistant', content: 'password=local-dream-password-123456' },
          ],
          tags: ['local-first'],
        },
      ],
      memoryCandidates: [{ content: 'User wants local dreams from F:\\project\\private-notes.md.', type: 'preference', privacy: 'local', importance: 4, tags: ['dream'] }],
      routineCandidates: [{ title: 'Daily memory review password=local-dream-password-123456', steps: ['Open F:\\project\\private-notes.md', 'Approve safe candidates'] }],
      summary: 'AIRI dreamed about local memory consolidation.',
      withheld: [],
      sanitizedReport: {
        generatedAt: '2026-05-13T00:00:00.000Z',
        id: 'dream-1',
        llmWikiDrafts: [],
        loraDatasetCandidates: [
          {
            messages: [
              { role: 'system', content: 'You are AIRI.' },
              { role: 'user', content: 'What should you remember from [local path]?' },
              { role: 'assistant', content: 'The user prefers local-first tools.' },
            ],
            tags: ['local-first'],
          },
        ],
        memoryCandidates: [{ content: 'User wants local dreams.', type: 'preference', privacy: 'local', importance: 4, tags: ['dream'] }],
        routineCandidates: [{ title: 'Daily memory review', steps: ['Open review queue', 'Approve safe candidates'] }],
        summary: 'AIRI dreamed about local memory consolidation.',
        visibility: 'training_sanitized',
      },
    },
    startedAt: '2026-05-13T00:00:00.000Z',
    status: 'completed',
    windowHours: 4,
  }

  const createdMemories: ElectronMemoryItem[] = []
  const scheduleState: ElectronDreamScheduleState = {
    active: false,
    config: {
      enabled: false,
      includeLoraCandidates: true,
      intervalHours: 6,
      windowHours: 4,
    },
    lastError: null,
    lastRunAt: null,
    nextRunAt: null,
  }
  const createMemory = vi.fn(async (payload: ElectronMemoryCreateRequest): Promise<ElectronMemoryItem> => {
    const item: ElectronMemoryItem = {
      accessCount: 0,
      content: payload.content,
      createdAt: '2026-05-13T00:00:00.000Z',
      id: `memory-${createdMemories.length + 1}`,
      importance: payload.importance ?? 3,
      metadata: payload.metadata ?? null,
      privacy: payload.privacy ?? 'local',
      scope: payload.scope ?? 'default',
      sourceId: payload.sourceId ?? null,
      sourceType: payload.sourceType ?? 'manual',
      status: payload.status ?? 'active',
      summary: payload.summary ?? null,
      tags: payload.tags ?? [],
      type: payload.type ?? 'note',
      updatedAt: '2026-05-13T00:00:00.000Z',
    }
    createdMemories.push(item)
    return item
  })

  const draftRoutine = vi.fn(async (payload: ElectronRoutineDraftRequest): Promise<ElectronRoutineDraft> => ({
    content: payload.text,
    slug: 'daily-memory-review',
    status: 'draft',
    steps: ['Open review queue', 'Approve safe candidates'],
    title: 'Daily memory review',
  }))

  const saveRoutine = vi.fn(async (draft: ElectronRoutineDraft): Promise<ElectronRoutineItem> => ({
    ...draft,
    path: 'F:/project/airi-gemma/.airi/routines/daily-memory-review.md',
    updatedAt: '2026-05-13T00:00:00.000Z',
  }))

  return {
    applySchedule: vi.fn(async (payload: ElectronDreamScheduleConfig): Promise<ElectronDreamScheduleState> => ({
      active: payload.enabled,
      config: payload,
      lastError: null,
      lastRunAt: null,
      nextRunAt: payload.enabled ? '2026-05-13T06:00:00.000Z' : null,
    })),
    cancelCurrent: vi.fn(async () => ({ ...session, status: 'cancelled' as const })),
    createMemory,
    createdMemories,
    draftRoutine,
    getSchedule: vi.fn(async () => scheduleState),
    getCurrent: vi.fn(async () => session),
    saveRoutine,
    session,
    startLocal: vi.fn(async (_payload: ElectronDreamStartRequest) => session),
    triggerScheduledNow: vi.fn(async (): Promise<ElectronDreamScheduleState> => ({
      active: true,
      config: {
        enabled: true,
        includeLoraCandidates: true,
        intervalHours: 6,
        windowHours: 4,
      },
      lastError: null,
      lastRunAt: '2026-05-13T00:00:00.000Z',
      nextRunAt: '2026-05-13T06:00:00.000Z',
    })),
  }
})

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaInvoke: (event: { receiveEvent?: { id?: string } }) => {
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:dream:start-local-receive')
      return invokeMocks.startLocal
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:dream:get-current-receive')
      return invokeMocks.getCurrent
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:dream:cancel-current-receive')
      return invokeMocks.cancelCurrent
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:create-receive')
      return invokeMocks.createMemory
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:routine:draft-receive')
      return invokeMocks.draftRoutine
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:routine:save-receive')
      return invokeMocks.saveRoutine
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:dream:get-schedule-receive')
      return invokeMocks.getSchedule
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:dream:apply-schedule-receive')
      return invokeMocks.applySchedule
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:dream:trigger-scheduled-now-receive')
      return invokeMocks.triggerScheduledNow

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

describe('useDreamSettingsStore', async () => {
  const { useDreamSettingsStore } = await import('./dream')

  beforeEach(() => {
    setActivePinia(createPinia())
    invokeMocks.cancelCurrent.mockClear()
    invokeMocks.applySchedule.mockClear()
    invokeMocks.createMemory.mockClear()
    invokeMocks.createdMemories.length = 0
    invokeMocks.draftRoutine.mockClear()
    invokeMocks.getCurrent.mockClear()
    invokeMocks.getSchedule.mockClear()
    invokeMocks.saveRoutine.mockClear()
    invokeMocks.startLocal.mockClear()
    invokeMocks.triggerScheduledNow.mockClear()
    toastError.mockClear()
    toastSuccess.mockClear()
  })

  it('refreshes, starts, and cancels local dream sessions', async () => {
    const store = useDreamSettingsStore()

    const current = await store.refreshCurrent()
    expect(invokeMocks.getCurrent).toHaveBeenCalled()
    expect(current).toEqual(invokeMocks.session)
    expect(store.currentSession?.id).toBe('dream-1')

    const started = await store.startLocalDream({ includeLoraCandidates: true, windowHours: 4 })
    expect(invokeMocks.startLocal).toHaveBeenCalledWith({ includeLoraCandidates: true, windowHours: 4 })
    expect(started.status).toBe('completed')
    expect(store.currentSession?.report?.summary).toContain('local memory')

    const cancelled = await store.cancelCurrent()
    expect(invokeMocks.cancelCurrent).toHaveBeenCalled()
    expect(cancelled?.status).toBe('cancelled')
    expect(store.currentSession?.status).toBe('cancelled')
  })

  it('queues dream memory candidates for human review', async () => {
    const store = useDreamSettingsStore()
    await store.refreshCurrent()

    const created = await store.importMemoryCandidatesToReview()

    expect(created).toHaveLength(1)
    expect(invokeMocks.createMemory).toHaveBeenCalledWith(expect.objectContaining({
      content: 'User wants local dreams.',
      importance: 4,
      privacy: 'local',
      sourceId: 'dream-1',
      sourceType: 'dream',
      status: 'needs_review',
      type: 'preference',
    }))
    expect(invokeMocks.createMemory).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.not.stringContaining('F:\\project'),
    }))
    expect(invokeMocks.createMemory).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        requiresReview: true,
      }),
      tags: expect.arrayContaining(['dream']),
    }))
  })

  it('saves dream routine candidates through the routine draft workflow', async () => {
    const store = useDreamSettingsStore()
    await store.refreshCurrent()

    const saved = await store.saveRoutineCandidates()

    expect(saved).toHaveLength(1)
    expect(invokeMocks.draftRoutine).toHaveBeenCalledWith({
      text: 'Daily memory review\n- Open review queue\n- Approve safe candidates',
    })
    expect(invokeMocks.draftRoutine).toHaveBeenCalledWith({
      text: expect.not.stringContaining('password='),
    })
    expect(invokeMocks.draftRoutine).toHaveBeenCalledWith({
      text: expect.not.stringContaining('F:\\project'),
    })
    expect(invokeMocks.saveRoutine).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'daily-memory-review',
      title: 'Daily memory review',
    }))
  })

  it('queues dream LoRA candidates as sanitized review memories', async () => {
    const store = useDreamSettingsStore()
    await store.refreshCurrent()

    const created = await store.importLoraCandidatesToReview()

    expect(created).toHaveLength(1)
    expect(invokeMocks.createMemory).toHaveBeenCalledWith(expect.objectContaining({
      privacy: 'local',
      sourceId: 'dream-1',
      sourceType: 'dream',
      status: 'needs_review',
      type: 'conversation',
    }))
    expect(invokeMocks.createMemory).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('assistant: The user prefers local-first tools.'),
      metadata: expect.objectContaining({
        loraDatasetCandidate: true,
        profileVisibility: 'training_sanitized',
        requiresReview: true,
      }),
      tags: expect.arrayContaining(['dream', 'lora-candidate', 'local-first']),
    }))
    expect(invokeMocks.createMemory).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.not.stringContaining('password='),
    }))
    expect(invokeMocks.createMemory).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.not.stringContaining('F:\\project'),
    }))
  })

  it('does not queue dream LoRA candidates when no sanitized report is available', async () => {
    invokeMocks.getCurrent.mockResolvedValueOnce({
      ...invokeMocks.session,
      report: {
        ...invokeMocks.session.report!,
        sanitizedReport: undefined,
      },
    })
    const store = useDreamSettingsStore()
    await store.refreshCurrent()

    const created = await store.importLoraCandidatesToReview()

    expect(created).toEqual([])
    expect(invokeMocks.createMemory).not.toHaveBeenCalled()
  })

  it('does not queue dream memory or routine candidates when no sanitized report is available', async () => {
    invokeMocks.getCurrent.mockResolvedValueOnce({
      ...invokeMocks.session,
      report: {
        ...invokeMocks.session.report!,
        sanitizedReport: undefined,
      },
    })
    const store = useDreamSettingsStore()
    await store.refreshCurrent()

    const created = await store.importMemoryCandidatesToReview()
    const saved = await store.saveRoutineCandidates()

    expect(created).toEqual([])
    expect(saved).toEqual([])
    expect(invokeMocks.createMemory).not.toHaveBeenCalled()
    expect(invokeMocks.draftRoutine).not.toHaveBeenCalled()
    expect(invokeMocks.saveRoutine).not.toHaveBeenCalled()
  })

  it('loads, saves, and manually triggers the dream schedule', async () => {
    const store = useDreamSettingsStore()

    const schedule = await store.refreshSchedule()
    expect(schedule.config.intervalHours).toBe(6)
    expect(store.schedule?.active).toBe(false)

    const applied = await store.saveSchedule({
      enabled: true,
      includeLoraCandidates: true,
      intervalHours: 8,
      windowHours: 4,
    })
    expect(invokeMocks.applySchedule).toHaveBeenCalledWith({
      enabled: true,
      includeLoraCandidates: true,
      intervalHours: 8,
      windowHours: 4,
    })
    expect(applied.nextRunAt).toBe('2026-05-13T06:00:00.000Z')
    expect(store.schedule?.active).toBe(true)

    const triggered = await store.triggerScheduledDreamNow()
    expect(invokeMocks.triggerScheduledNow).toHaveBeenCalled()
    expect(triggered.lastRunAt).toBe('2026-05-13T00:00:00.000Z')
  })
})
