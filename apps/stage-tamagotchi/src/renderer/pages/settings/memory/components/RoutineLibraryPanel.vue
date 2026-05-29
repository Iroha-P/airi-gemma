<script setup lang="ts">
import type { ElectronRoutineDraft, ElectronRoutineItem } from '../../../../../shared/eventa'

import { Button, FieldTextArea } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

defineProps<{
  canDraft: boolean
  canSaveDraft: boolean
  currentDraft: ElectronRoutineDraft | null
  formatDate: (value: string) => string
  items: ElectronRoutineItem[]
  lastError: string | null
  loading: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  deleteRoutine: [slug: string]
  draft: []
  refresh: []
  saveDraft: []
}>()

const draftText = defineModel<string>('draftText', { required: true })

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h2 :class="['text-base font-semibold']">
          {{ t('settings.pages.memory.routine-library.title') }}
        </h2>
        <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.routine-library.description') }}
        </p>
      </div>
      <Button
        icon="i-solar:refresh-circle-bold-duotone"
        :label="t('settings.pages.memory.routine-library.refresh')"
        :disabled="loading"
        :loading="loading"
        @click="emit('refresh')"
      />
    </div>

    <FieldTextArea
      v-model="draftText"
      :label="t('settings.pages.memory.routine-library.draft-label')"
      :placeholder="t('settings.pages.memory.routine-library.draft-placeholder')"
      required
    />

    <div :class="['flex justify-end']">
      <Button
        icon="i-solar:document-add-bold-duotone"
        :label="t('settings.pages.memory.routine-library.draft')"
        :disabled="!canDraft"
        :loading="loading"
        @click="emit('draft')"
      />
    </div>

    <p
      v-if="lastError"
      :class="['text-xs leading-5 text-rose-600 dark:text-rose-300']"
    >
      {{ lastError }}
    </p>

    <div
      v-if="currentDraft"
      :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
    >
      <div :class="['flex flex-wrap items-start justify-between gap-3']">
        <div>
          <div :class="['text-sm font-semibold']">
            {{ currentDraft.title }}
          </div>
          <div :class="['mt-1 font-mono text-xs text-neutral-500 dark:text-neutral-400']">
            {{ currentDraft.slug }}
          </div>
        </div>
        <Button
          icon="i-solar:diskette-bold-duotone"
          :label="t('settings.pages.memory.routine-library.save')"
          :disabled="!canSaveDraft"
          :loading="saving"
          @click="emit('saveDraft')"
        />
      </div>
      <ol :class="['mt-3 list-decimal space-y-1 pl-5 text-sm leading-6']">
        <li
          v-for="step in currentDraft.steps"
          :key="step"
        >
          {{ step }}
        </li>
      </ol>
    </div>

    <div :class="['flex flex-col gap-2']">
      <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.routine-library.saved', { count: items.length }) }}
      </div>
      <div
        v-if="items.length === 0"
        :class="['rounded-lg border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
      >
        {{ t('settings.pages.memory.routine-library.empty') }}
      </div>
      <div
        v-for="routine in items"
        :key="routine.slug"
        :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
      >
        <div :class="['flex flex-wrap items-start justify-between gap-3']">
          <div>
            <div :class="['text-sm font-medium']">
              {{ routine.title }}
            </div>
            <div :class="['mt-1 font-mono text-xs text-neutral-500 dark:text-neutral-400']">
              routine.{{ routine.slug }}
            </div>
            <div :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
              {{ t('settings.pages.memory.routine-library.steps', { count: routine.steps.length }) }}
              <span v-if="routine.updatedAt">
                - {{ formatDate(routine.updatedAt) }}
              </span>
            </div>
          </div>
          <Button
            icon="i-solar:trash-bin-trash-bold-duotone"
            :label="t('settings.pages.memory.routine-library.delete')"
            :disabled="saving"
            :loading="saving"
            @click="emit('deleteRoutine', routine.slug)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
