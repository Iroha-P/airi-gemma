<script setup lang="ts">
import type {
  ElectronMemoryEvolutionAction,
  ElectronMemoryEvolutionPreviewResult,
  ElectronMemoryEvolutionPriority,
  ElectronMemoryEvolutionSuggestionKind,
} from '../../../../../shared/eventa'

import { Button, FieldCheckbox, FieldInput } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

defineProps<{
  actionLabel: (action: ElectronMemoryEvolutionAction) => string
  canPreview: boolean
  kindLabel: (kind: ElectronMemoryEvolutionSuggestionKind) => string
  loading: boolean
  priorityClass: (priority: ElectronMemoryEvolutionPriority) => string
  result: ElectronMemoryEvolutionPreviewResult | null
}>()

const staleBefore = defineModel<string>('staleBefore', { required: true })
const limit = defineModel<number>('limit', { required: true })
const includeLowPriority = defineModel<boolean>('includeLowPriority', { required: true })

const emit = defineEmits<{
  preview: []
}>()

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h2 :class="['text-base font-semibold']">
          {{ t('settings.pages.memory.evolution.title') }}
        </h2>
        <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.evolution.description') }}
        </p>
      </div>
      <Button
        icon="i-solar:refresh-circle-bold-duotone"
        :label="t('settings.pages.memory.evolution.preview')"
        :disabled="!canPreview"
        :loading="loading"
        @click="emit('preview')"
      />
    </div>

    <div :class="['grid gap-4 sm:grid-cols-[1fr_160px]']">
      <FieldInput
        v-model="staleBefore"
        :label="t('settings.pages.memory.evolution.stale-before-label')"
        type="date"
      />
      <FieldInput
        v-model="limit"
        :label="t('settings.pages.memory.evolution.limit-label')"
        type="number"
        placeholder="20"
      />
    </div>

    <FieldCheckbox
      v-model="includeLowPriority"
      :label="t('settings.pages.memory.evolution.include-low-priority')"
    />

    <div
      v-if="result"
      :class="['flex flex-col gap-3']"
    >
      <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.evolution.suggestions', { count: result.total }) }}
      </div>
      <div
        v-if="result.suggestions.length === 0"
        :class="['rounded-lg border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
      >
        {{ t('settings.pages.memory.evolution.empty') }}
      </div>
      <div
        v-for="suggestion in result.suggestions"
        :key="suggestion.id"
        :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
      >
        <div :class="['flex flex-wrap items-center gap-2']">
          <span :class="['rounded border px-2 py-0.5 text-xs font-medium', priorityClass(suggestion.priority)]">
            {{ t(`settings.pages.memory.evolution.priority.${suggestion.priority}`) }}
          </span>
          <span :class="['text-xs text-neutral-500 dark:text-neutral-400']">
            {{ kindLabel(suggestion.kind) }}
          </span>
        </div>
        <div :class="['mt-2 text-sm font-medium']">
          {{ suggestion.title }}
        </div>
        <p :class="['mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300']">
          {{ suggestion.reason }}
        </p>
        <div :class="['mt-2 flex flex-wrap gap-2 text-xs']">
          <span
            v-for="id in suggestion.memoryIds"
            :key="id"
            :class="['rounded bg-neutral-100 px-2 py-1 font-mono dark:bg-neutral-900']"
          >
            {{ id }}
          </span>
        </div>
        <div :class="['mt-2 flex flex-wrap gap-2']">
          <span
            v-for="action in suggestion.recommendedActions"
            :key="action"
            :class="['rounded border border-neutral-200/70 px-2 py-1 text-xs dark:border-neutral-800/70']"
          >
            {{ actionLabel(action) }}
          </span>
        </div>
      </div>
      <p :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.evolution.preview-note') }}
      </p>
    </div>
  </section>
</template>
