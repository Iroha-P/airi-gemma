import type {
  ElectronDreamScheduleConfig,
  ElectronDreamScheduleState,
  ElectronDreamSession,
  ElectronDreamStartRequest,
} from '../../../../shared/eventa'

import { errorMessageFrom } from '@moeru/std'
import { boolean, number, object, optional } from 'valibot'

import { createConfig } from '../../../libs/electron/persistence'

export interface DreamScheduleConfigStore {
  get: () => Partial<ElectronDreamScheduleConfig> | undefined
  update: (config: ElectronDreamScheduleConfig) => void
}

export interface DreamSchedulerManager {
  cancelCurrent: () => ElectronDreamSession | null
  getCurrent: () => ElectronDreamSession | null
  startLocalDream: (payload?: ElectronDreamStartRequest) => Promise<ElectronDreamSession>
}

export interface DreamSchedulerDeps {
  clearTimer?: (timer: unknown) => void
  configStore: DreamScheduleConfigStore
  manager: DreamSchedulerManager
  now?: () => Date
  setTimer?: (callback: () => void, ms: number) => unknown
}

export const defaultDreamScheduleConfig: ElectronDreamScheduleConfig = {
  enabled: false,
  includeLoraCandidates: true,
  intervalHours: 6,
  windowHours: 4,
}

export const dreamScheduleConfigSchema = object({
  enabled: optional(boolean(), defaultDreamScheduleConfig.enabled),
  includeLoraCandidates: optional(boolean(), defaultDreamScheduleConfig.includeLoraCandidates),
  intervalHours: optional(number(), defaultDreamScheduleConfig.intervalHours),
  windowHours: optional(number(), defaultDreamScheduleConfig.windowHours),
})

const hourMs = 60 * 60 * 1000

function clampRounded(value: number | undefined, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' || Number.isNaN(value))
    return fallback

  return Math.min(max, Math.max(min, Math.round(value)))
}

export function normalizeDreamScheduleConfig(config: Partial<ElectronDreamScheduleConfig> | undefined): ElectronDreamScheduleConfig {
  return {
    enabled: config?.enabled ?? defaultDreamScheduleConfig.enabled,
    includeLoraCandidates: config?.includeLoraCandidates ?? defaultDreamScheduleConfig.includeLoraCandidates,
    intervalHours: clampRounded(config?.intervalHours, defaultDreamScheduleConfig.intervalHours, 1, 168),
    windowHours: clampRounded(config?.windowHours, defaultDreamScheduleConfig.windowHours, 1, 24),
  }
}

export function createDreamScheduleConfig() {
  const config = createConfig('dream-schedule', 'config.json', dreamScheduleConfigSchema, {
    default: defaultDreamScheduleConfig,
  })
  config.setup()

  return config
}

export function createDreamScheduler(deps: DreamSchedulerDeps) {
  let timer: unknown | null = null
  let started = false
  let nextRunAt: string | null = null
  let lastRunAt: string | null = null
  let lastError: string | null = null

  const now = () => deps.now?.() ?? new Date()
  const setTimer = deps.setTimer ?? ((callback, ms) => setTimeout(callback, ms))
  const clearTimer = deps.clearTimer ?? (timer => clearTimeout(timer as ReturnType<typeof setTimeout>))

  function getConfig() {
    return normalizeDreamScheduleConfig(deps.configStore.get())
  }

  function clearScheduledTimer() {
    if (timer)
      clearTimer(timer)

    timer = null
    nextRunAt = null
  }

  function scheduleNext() {
    clearScheduledTimer()

    const config = getConfig()
    if (!started || !config.enabled)
      return

    const ms = config.intervalHours * hourMs
    nextRunAt = new Date(now().getTime() + ms).toISOString()
    timer = setTimer(() => {
      void triggerNow()
    }, ms)
  }

  function getState(): ElectronDreamScheduleState {
    return {
      active: Boolean(timer),
      config: getConfig(),
      lastError,
      lastRunAt,
      nextRunAt,
    }
  }

  function start() {
    started = true
    scheduleNext()
    return getState()
  }

  function stop() {
    started = false
    clearScheduledTimer()
    return getState()
  }

  function applyConfig(config: Partial<ElectronDreamScheduleConfig>) {
    deps.configStore.update(normalizeDreamScheduleConfig(config))
    scheduleNext()
    return getState()
  }

  async function triggerNow() {
    const current = deps.manager.getCurrent()
    if (current?.status === 'running') {
      lastError = 'Dream session already running'
      scheduleNext()
      return getState()
    }

    const config = getConfig()
    try {
      const session = await deps.manager.startLocalDream({
        includeLoraCandidates: config.includeLoraCandidates,
        windowHours: config.windowHours,
      })
      lastRunAt = now().toISOString()
      lastError = session.status === 'failed' ? session.errorMessage ?? 'Scheduled local dream failed' : null
      return getState()
    }
    catch (error) {
      lastError = errorMessageFrom(error) ?? 'Scheduled local dream failed'
      return getState()
    }
    finally {
      scheduleNext()
    }
  }

  return {
    applyConfig,
    getState,
    start,
    stop,
    triggerNow,
  }
}
