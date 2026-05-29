import type { ElectronDreamScheduleConfig, ElectronDreamSession } from '../../../../shared/eventa'

import { describe, expect, it, vi } from 'vitest'

import { createDreamScheduler, defaultDreamScheduleConfig, normalizeDreamScheduleConfig } from './scheduler'

describe('dream scheduler', () => {
  it('normalizes unsafe schedule config values', () => {
    expect(normalizeDreamScheduleConfig({
      enabled: true,
      includeLoraCandidates: true,
      intervalHours: 0,
      windowHours: 99,
    })).toEqual({
      enabled: true,
      includeLoraCandidates: true,
      intervalHours: 1,
      windowHours: 24,
    })
  })

  it('starts and reschedules local dreams when enabled', async () => {
    let nowMs = Date.UTC(2026, 4, 13, 0, 0, 0)
    const timers: Array<{ callback: () => void, ms: number }> = []
    const configStore = createConfigStore({
      enabled: true,
      includeLoraCandidates: false,
      intervalHours: 2,
      windowHours: 6,
    })
    const startLocalDream = vi.fn(async (): Promise<ElectronDreamSession> => ({
      id: 'dream-1',
      startedAt: new Date(nowMs).toISOString(),
      status: 'completed',
      windowHours: 6,
    }))
    const scheduler = createDreamScheduler({
      configStore,
      manager: {
        cancelCurrent: vi.fn(),
        getCurrent: vi.fn(() => null),
        startLocalDream,
      },
      now: () => new Date(nowMs),
      setTimer: (callback, ms) => {
        timers.push({ callback, ms })
        return { id: timers.length }
      },
      clearTimer: vi.fn(),
    })

    scheduler.start()

    expect(scheduler.getState()).toMatchObject({
      active: true,
      config: {
        enabled: true,
        includeLoraCandidates: false,
        intervalHours: 2,
        windowHours: 6,
      },
      nextRunAt: '2026-05-13T02:00:00.000Z',
    })
    expect(timers).toHaveLength(1)
    expect(timers[0]?.ms).toBe(2 * 60 * 60 * 1000)

    nowMs = Date.UTC(2026, 4, 13, 2, 0, 0)
    await scheduler.triggerNow()

    expect(startLocalDream).toHaveBeenCalledWith({
      includeLoraCandidates: false,
      windowHours: 6,
    })
    expect(scheduler.getState()).toMatchObject({
      lastRunAt: '2026-05-13T02:00:00.000Z',
      nextRunAt: '2026-05-13T04:00:00.000Z',
    })
  })

  it('disables timers when schedule config is disabled', () => {
    const clearTimer = vi.fn()
    const configStore = createConfigStore({
      ...defaultDreamScheduleConfig,
      enabled: true,
    })
    const scheduler = createDreamScheduler({
      configStore,
      manager: {
        cancelCurrent: vi.fn(),
        getCurrent: vi.fn(() => null),
        startLocalDream: vi.fn(),
      },
      now: () => new Date('2026-05-13T00:00:00.000Z'),
      setTimer: () => ({ id: 'timer' }),
      clearTimer,
    })

    scheduler.start()
    scheduler.applyConfig({ ...defaultDreamScheduleConfig, enabled: false })

    expect(clearTimer).toHaveBeenCalledWith({ id: 'timer' })
    expect(configStore.update).toHaveBeenCalledWith(defaultDreamScheduleConfig)
    expect(scheduler.getState()).toMatchObject({
      active: false,
      nextRunAt: null,
    })
  })
})

function createConfigStore(initial: ElectronDreamScheduleConfig) {
  let config = initial
  return {
    get: vi.fn(() => config),
    update: vi.fn((nextConfig: ElectronDreamScheduleConfig) => {
      config = nextConfig
    }),
  }
}
