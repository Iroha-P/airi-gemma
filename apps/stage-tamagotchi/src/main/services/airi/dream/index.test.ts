import type { DreamManager } from './index'

import { createContext, defineInvoke } from '@moeru/eventa'
import { describe, expect, it, vi } from 'vitest'

import {
  electronDreamApplySchedule,
  electronDreamCancelCurrent,
  electronDreamGetCurrent,
  electronDreamGetSchedule,
  electronDreamStartLocal,
  electronDreamTriggerScheduledNow,
} from '../../../../shared/eventa'
import { createDreamService } from './index'

describe('dream service eventa adapter', () => {
  it('registers dream invokes against the provided manager', async () => {
    const context = createContext()
    const session = {
      id: 'dream-1',
      startedAt: '2026-05-13T00:00:00.000Z',
      status: 'completed' as const,
      windowHours: 4,
    }
    const manager: DreamManager = {
      cancelCurrent: vi.fn(() => ({ ...session, status: 'cancelled' as const })),
      getCurrent: vi.fn(() => session),
      startLocalDream: vi.fn(async () => session),
    }
    const scheduler = {
      applyConfig: vi.fn(config => ({
        active: config.enabled,
        config,
        lastError: null,
        lastRunAt: null,
        nextRunAt: config.enabled ? '2026-05-13T06:00:00.000Z' : null,
      })),
      getState: vi.fn(() => ({
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
      })),
      start: vi.fn(),
      stop: vi.fn(),
      triggerNow: vi.fn(async () => ({
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

    createDreamService({ context: context as never, manager, scheduler })

    await expect(defineInvoke(context, electronDreamStartLocal)({ windowHours: 4, includeLoraCandidates: true })).resolves.toEqual(session)
    await expect(defineInvoke(context, electronDreamGetCurrent)()).resolves.toEqual(session)
    await expect(defineInvoke(context, electronDreamCancelCurrent)()).resolves.toMatchObject({ status: 'cancelled' })
    await expect(defineInvoke(context, electronDreamGetSchedule)()).resolves.toMatchObject({ active: false })
    await expect(defineInvoke(context, electronDreamApplySchedule)({
      enabled: true,
      includeLoraCandidates: true,
      intervalHours: 6,
      windowHours: 4,
    })).resolves.toMatchObject({ active: true })
    await expect(defineInvoke(context, electronDreamTriggerScheduledNow)()).resolves.toMatchObject({ lastRunAt: '2026-05-13T00:00:00.000Z' })

    expect(manager.startLocalDream).toHaveBeenCalledWith({ windowHours: 4, includeLoraCandidates: true })
    expect(manager.getCurrent).toHaveBeenCalled()
    expect(manager.cancelCurrent).toHaveBeenCalled()
    expect(scheduler.getState).toHaveBeenCalled()
    expect(scheduler.applyConfig).toHaveBeenCalledWith({
      enabled: true,
      includeLoraCandidates: true,
      intervalHours: 6,
      windowHours: 4,
    })
    expect(scheduler.triggerNow).toHaveBeenCalled()
  })
})
