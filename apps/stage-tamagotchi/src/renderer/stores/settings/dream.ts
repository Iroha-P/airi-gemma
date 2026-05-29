import type {
  ElectronDreamLoraDatasetCandidate,
  ElectronDreamMemoryCandidate,
  ElectronDreamRoutineCandidate,
  ElectronDreamScheduleConfig,
  ElectronDreamScheduleState,
  ElectronDreamSession,
  ElectronDreamStartRequest,
  ElectronMemoryCreateRequest,
} from '../../../shared/eventa'

import { errorMessageFrom } from '@moeru/std'
import { useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import {
  electronDreamApplySchedule,
  electronDreamCancelCurrent,
  electronDreamGetCurrent,
  electronDreamGetSchedule,
  electronDreamStartLocal,
  electronDreamTriggerScheduledNow,
  electronMemoryCreate,
  electronRoutineDraft,
  electronRoutineSave,
} from '../../../shared/eventa'

export const useDreamSettingsStore = defineStore('tamagotchi-dream-settings', () => {
  const currentSession = ref<ElectronDreamSession | null>(null)
  const schedule = ref<ElectronDreamScheduleState | null>(null)
  const lastError = ref<string | null>(null)
  const loading = ref(false)

  const startLocal = useElectronEventaInvoke(electronDreamStartLocal)
  const getCurrent = useElectronEventaInvoke(electronDreamGetCurrent)
  const cancelDream = useElectronEventaInvoke(electronDreamCancelCurrent)
  const getSchedule = useElectronEventaInvoke(electronDreamGetSchedule)
  const applySchedule = useElectronEventaInvoke(electronDreamApplySchedule)
  const triggerScheduledNow = useElectronEventaInvoke(electronDreamTriggerScheduledNow)
  const createMemory = useElectronEventaInvoke(electronMemoryCreate)
  const draftRoutine = useElectronEventaInvoke(electronRoutineDraft)
  const saveRoutine = useElectronEventaInvoke(electronRoutineSave)

  function setError(error: unknown, fallback: string) {
    const message = errorMessageFrom(error) ?? fallback
    lastError.value = message
    toast.error(message)
  }

  function uniqueTags(tags: string[], extraTags: string[]) {
    return [...new Set([...tags, ...extraTags].map(tag => tag.trim()).filter(Boolean))]
  }

  function getCurrentReport() {
    return currentSession.value?.report ?? null
  }

  function getSanitizedLoraDatasetCandidates() {
    const report = getCurrentReport()
    if (report?.sanitizedReport?.visibility !== 'training_sanitized')
      return []

    return report.sanitizedReport.loraDatasetCandidates
  }

  function getSanitizedMemoryCandidates() {
    const report = getCurrentReport()
    if (report?.sanitizedReport?.visibility !== 'training_sanitized')
      return []

    return report.sanitizedReport.memoryCandidates
  }

  function getSanitizedRoutineCandidates() {
    const report = getCurrentReport()
    if (report?.sanitizedReport?.visibility !== 'training_sanitized')
      return []

    return report.sanitizedReport.routineCandidates
  }

  function toDreamMemoryPayload(candidate: ElectronDreamMemoryCandidate): ElectronMemoryCreateRequest {
    return {
      content: candidate.content,
      importance: candidate.importance,
      metadata: {
        dream: {
          kind: 'memory_candidate',
          sessionId: currentSession.value?.id,
        },
        requiresReview: true,
      },
      privacy: candidate.privacy,
      sourceId: currentSession.value?.id ?? null,
      sourceType: 'dream',
      status: 'needs_review',
      tags: uniqueTags(candidate.tags, ['dream']),
      type: candidate.type,
    }
  }

  function formatRoutineCandidate(candidate: ElectronDreamRoutineCandidate) {
    return [
      candidate.title,
      ...candidate.steps.map(step => `- ${step}`),
    ].join('\n')
  }

  function formatLoraCandidate(candidate: ElectronDreamLoraDatasetCandidate) {
    return candidate.messages
      .map(message => `${message.role}: ${message.content}`)
      .join('\n\n')
  }

  function toDreamLoraMemoryPayload(candidate: ElectronDreamLoraDatasetCandidate): ElectronMemoryCreateRequest {
    return {
      content: formatLoraCandidate(candidate),
      importance: 4,
      metadata: {
        dream: {
          kind: 'lora_dataset_candidate',
          sessionId: currentSession.value?.id,
        },
        loraDatasetCandidate: true,
        messages: candidate.messages,
        profileVisibility: 'training_sanitized',
        requiresReview: true,
      },
      privacy: 'local',
      sourceId: currentSession.value?.id ?? null,
      sourceType: 'dream',
      status: 'needs_review',
      tags: uniqueTags(candidate.tags, ['dream', 'lora-candidate']),
      type: 'conversation',
    }
  }

  async function refreshCurrent() {
    loading.value = true
    lastError.value = null

    try {
      currentSession.value = await getCurrent()
      return currentSession.value
    }
    catch (error) {
      setError(error, 'Failed to refresh local dream session')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function startLocalDream(payload: ElectronDreamStartRequest = {}) {
    loading.value = true
    lastError.value = null

    try {
      const session = await startLocal(payload)
      currentSession.value = session
      return session
    }
    catch (error) {
      setError(error, 'Failed to start local dream')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function cancelCurrent() {
    loading.value = true
    lastError.value = null

    try {
      currentSession.value = await cancelDream()
      return currentSession.value
    }
    catch (error) {
      setError(error, 'Failed to cancel local dream')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function refreshSchedule() {
    loading.value = true
    lastError.value = null

    try {
      schedule.value = await getSchedule()
      return schedule.value
    }
    catch (error) {
      setError(error, 'Failed to refresh local dream schedule')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function saveSchedule(payload: ElectronDreamScheduleConfig) {
    loading.value = true
    lastError.value = null

    try {
      schedule.value = await applySchedule(payload)
      toast.success('Local dream schedule saved')
      return schedule.value
    }
    catch (error) {
      setError(error, 'Failed to save local dream schedule')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function triggerScheduledDreamNow() {
    loading.value = true
    lastError.value = null

    try {
      schedule.value = await triggerScheduledNow()
      currentSession.value = await getCurrent()
      toast.success('Scheduled local dream triggered')
      return schedule.value
    }
    catch (error) {
      setError(error, 'Failed to trigger scheduled local dream')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function importMemoryCandidatesToReview() {
    const candidates = getSanitizedMemoryCandidates()
    if (candidates.length === 0)
      return []

    loading.value = true
    lastError.value = null

    try {
      const created = await Promise.all(
        candidates.map(candidate => createMemory(toDreamMemoryPayload(candidate))),
      )
      toast.success(`Queued ${created.length} dream memory candidates for review`)
      return created
    }
    catch (error) {
      setError(error, 'Failed to queue dream memory candidates')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function saveRoutineCandidates() {
    const candidates = getSanitizedRoutineCandidates()
    if (candidates.length === 0)
      return []

    loading.value = true
    lastError.value = null

    try {
      const saved = []
      for (const candidate of candidates) {
        const draft = await draftRoutine({ text: formatRoutineCandidate(candidate) })
        saved.push(await saveRoutine(draft))
      }
      toast.success(`Saved ${saved.length} dream routine candidates`)
      return saved
    }
    catch (error) {
      setError(error, 'Failed to save dream routine candidates')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function importLoraCandidatesToReview() {
    const candidates = getSanitizedLoraDatasetCandidates()
    if (candidates.length === 0)
      return []

    loading.value = true
    lastError.value = null

    try {
      const created = await Promise.all(
        candidates.map(candidate => createMemory(toDreamLoraMemoryPayload(candidate))),
      )
      toast.success(`Queued ${created.length} dream LoRA candidates for review`)
      return created
    }
    catch (error) {
      setError(error, 'Failed to queue dream LoRA candidates')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  return {
    cancelCurrent,
    currentSession,
    importLoraCandidatesToReview,
    importMemoryCandidatesToReview,
    lastError,
    loading,
    refreshCurrent,
    refreshSchedule,
    saveRoutineCandidates,
    saveSchedule,
    schedule,
    startLocalDream,
    triggerScheduledDreamNow,
  }
})
