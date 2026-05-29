import type {
  ElectronRoutineDraft,
  ElectronRoutineItem,
} from '../../../shared/eventa'

import { errorMessageFrom } from '@moeru/std'
import { useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import {
  electronRoutineDelete,
  electronRoutineDraft,
  electronRoutineList,
  electronRoutineSave,
} from '../../../shared/eventa'

export const useRoutineSettingsStore = defineStore('tamagotchi-routine-settings', () => {
  const items = ref<ElectronRoutineItem[]>([])
  const currentDraft = ref<ElectronRoutineDraft | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const lastError = ref<string | null>(null)

  const draftRoutineInvoke = useElectronEventaInvoke(electronRoutineDraft)
  const saveRoutineInvoke = useElectronEventaInvoke(electronRoutineSave)
  const listRoutinesInvoke = useElectronEventaInvoke(electronRoutineList)
  const deleteRoutineInvoke = useElectronEventaInvoke(electronRoutineDelete)

  function setError(error: unknown, fallback: string) {
    const message = errorMessageFrom(error) ?? fallback
    lastError.value = message
    toast.error(message)
  }

  function rememberRoutine(item: ElectronRoutineItem) {
    items.value = [
      item,
      ...items.value.filter(existing => existing.slug !== item.slug),
    ].sort((a, b) => a.slug.localeCompare(b.slug))
    return item
  }

  async function refreshRoutines() {
    loading.value = true
    lastError.value = null

    try {
      const result = await listRoutinesInvoke()
      items.value = result.items
      return items.value
    }
    catch (error) {
      setError(error, 'Failed to load routines')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function draftRoutine(text: string) {
    const trimmedText = text.trim()
    if (!trimmedText) {
      const error = new Error('Routine draft text cannot be empty')
      setError(error, 'Routine draft text cannot be empty')
      throw error
    }

    loading.value = true
    lastError.value = null

    try {
      const draft = await draftRoutineInvoke({ text: trimmedText })
      currentDraft.value = draft
      return draft
    }
    catch (error) {
      setError(error, 'Failed to draft routine')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function saveCurrentDraft() {
    if (!currentDraft.value)
      return null

    saving.value = true
    lastError.value = null

    try {
      const item = await saveRoutineInvoke(currentDraft.value)
      rememberRoutine(item)
      toast.success('Routine saved')
      return item
    }
    catch (error) {
      setError(error, 'Failed to save routine')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function deleteRoutine(slug: string) {
    saving.value = true
    lastError.value = null

    try {
      await deleteRoutineInvoke({ slug })
      items.value = items.value.filter(item => item.slug !== slug)
      if (currentDraft.value?.slug === slug)
        currentDraft.value = null

      toast.success('Routine deleted')
    }
    catch (error) {
      setError(error, 'Failed to delete routine')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  void refreshRoutines()

  return {
    items,
    currentDraft,
    loading,
    saving,
    lastError,
    refreshRoutines,
    draftRoutine,
    saveCurrentDraft,
    deleteRoutine,
  }
})
