<script setup lang="ts">
import type { ElectronMemoryImportBackupResult } from '../../../../../shared/eventa'

import { Button } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  formatDate: (value: string) => string
  importedCount: number
  result: ElectronMemoryImportBackupResult | null
  reviewWorkbenchAvailable: boolean
  reviewWorkbenchTotal: number
  skippedCount: number
}>()

const emit = defineEmits<{
  openReviewWorkbench: []
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="props.result"
    :class="['mt-4 flex flex-col gap-3 rounded-lg border border-neutral-200/70 bg-neutral-500/5 p-3 dark:border-neutral-800/70']"
  >
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.backup-import.title') }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.backup-import.description', { imported: props.importedCount, skipped: props.skippedCount }) }}
        </p>
      </div>
      <span :class="['rounded-full bg-neutral-500/10 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300']">
        {{ props.formatDate(props.result.importedAt) }}
      </span>
    </div>

    <div :class="['grid gap-2 text-xs sm:grid-cols-2']">
      <div :class="['rounded-lg bg-primary-500/5 p-3 text-primary-700 dark:text-primary-200']">
        <div>
          {{ t('settings.pages.memory.backup-import.imported-items') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.importedCount }}
        </div>
      </div>
      <div :class="['rounded-lg bg-amber-500/10 p-3 text-amber-700 dark:text-amber-200']">
        <div>
          {{ t('settings.pages.memory.backup-import.skipped-items') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.skippedCount }}
        </div>
      </div>
    </div>

    <div :class="['flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary-500/5 p-3 text-xs text-primary-700 dark:text-primary-200']">
      <span>
        {{ t('settings.pages.memory.import-review.updated', { count: props.reviewWorkbenchTotal }) }}
      </span>
      <Button
        size="sm"
        icon="i-solar:checklist-minimalistic-bold-duotone"
        :label="t('settings.pages.memory.import-review.open-review-workbench')"
        :disabled="!props.reviewWorkbenchAvailable"
        variant="secondary"
        @click="emit('openReviewWorkbench')"
      />
    </div>

    <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs']">
      <div :class="['text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.backup-import.backup-file') }}
      </div>
      <div :class="['mt-1 break-words font-mono text-neutral-800 dark:text-neutral-100']">
        {{ props.result.backupFile }}
      </div>
    </div>

    <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs']">
      <div :class="['font-medium']">
        {{ t('settings.pages.memory.backup-import.skipped-title', { count: props.result.skipped.length }) }}
      </div>
      <p
        v-if="props.result.skipped.length === 0"
        :class="['mt-2 text-neutral-500 dark:text-neutral-400']"
      >
        {{ t('settings.pages.memory.backup-import.no-skipped') }}
      </p>
      <ul
        v-else
        :class="['mt-2 space-y-1 text-neutral-600 dark:text-neutral-300']"
      >
        <li
          v-for="item in props.result.skipped"
          :key="`${item.index}-${item.reason}`"
          :class="['font-mono']"
        >
          {{ t('settings.pages.memory.backup-import.skipped-item', { index: item.index, reason: t(`settings.pages.memory.backup-import.reason.${item.reason}`) }) }}
        </li>
      </ul>
    </div>
  </div>
</template>
