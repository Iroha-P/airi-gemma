<script setup lang="ts">
import type { ElectronMemoryCompactProfileResult } from '../../../../../shared/eventa'

import { useI18n } from 'vue-i18n'

const props = defineProps<{
  formatDate: (value: string) => string
  result: ElectronMemoryCompactProfileResult | null
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="props.result"
    :class="['mt-4 rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
  >
    <div :class="['flex flex-wrap items-center justify-between gap-2']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.compact-profile-preview.title') }}
        </h3>
        <p :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.compact-profile-preview.description', { count: props.result.sourceIds.length }) }}
        </p>
      </div>
      <span :class="['rounded-full bg-neutral-500/10 px-2 py-1 text-xs text-neutral-500 dark:text-neutral-400']">
        {{ props.formatDate(props.result.generatedAt) }}
      </span>
    </div>
    <pre :class="['mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-950 p-3 text-xs leading-5 text-neutral-100']">{{ props.result.markdown }}</pre>
  </div>
</template>
