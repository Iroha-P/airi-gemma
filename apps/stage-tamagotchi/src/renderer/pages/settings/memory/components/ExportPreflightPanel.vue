<script setup lang="ts">
import type { ElectronMemoryExportPreflightReason, ElectronMemoryPreviewExportPreflightResult } from '../../../../../shared/eventa'

import { useI18n } from 'vue-i18n'

type ExportPreflightItem = ElectronMemoryPreviewExportPreflightResult['items'][number]

const props = defineProps<{
  allowedItems: ExportPreflightItem[]
  blockedItems: ExportPreflightItem[]
  formatReason: (reason: ElectronMemoryExportPreflightReason) => string
  formatSource: (sourceType: string) => string
  formatSurface: (surface: ElectronMemoryPreviewExportPreflightResult['surface']) => string
  result: ElectronMemoryPreviewExportPreflightResult | null
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="props.result"
    :class="['mt-4 flex flex-col gap-3 rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
  >
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.export-preflight.title') }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.export-preflight.description', { surface: props.formatSurface(props.result.surface) }) }}
        </p>
      </div>
      <span :class="['rounded-full bg-neutral-500/10 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300']">
        {{ props.formatSurface(props.result.surface) }}
      </span>
    </div>

    <div :class="['grid gap-2 text-xs sm:grid-cols-4']">
      <div :class="['rounded-lg bg-neutral-500/5 p-3']">
        <div :class="['text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.export-preflight.total') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.result.summary.total }}
        </div>
      </div>
      <div :class="['rounded-lg bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-200']">
        <div>
          {{ t('settings.pages.memory.export-preflight.allowed') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.allowedItems.length }}
        </div>
      </div>
      <div :class="['rounded-lg bg-amber-500/10 p-3 text-amber-700 dark:text-amber-200']">
        <div>
          {{ t('settings.pages.memory.export-preflight.blocked') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.blockedItems.length }}
        </div>
      </div>
    </div>

    <div
      v-if="props.blockedItems.length === 0"
      :class="['rounded-lg border border-dashed border-emerald-300/70 p-3 text-xs leading-5 text-emerald-700 dark:border-emerald-800/70 dark:text-emerald-200']"
    >
      {{ t('settings.pages.memory.export-preflight.empty-blocked') }}
    </div>

    <div
      v-else
      :class="['flex max-h-72 flex-col gap-2 overflow-auto pr-1']"
    >
      <article
        v-for="item in props.blockedItems"
        :key="item.id"
        :class="['rounded-lg border border-amber-200/70 p-3 text-xs dark:border-amber-800/70']"
      >
        <div :class="['flex flex-wrap items-center justify-between gap-2']">
          <span :class="['font-mono text-neutral-700 dark:text-neutral-200']">{{ item.id }}</span>
          <span :class="['rounded-md bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-200']">
            {{ t('settings.pages.memory.export-preflight.blocked-item') }}
          </span>
        </div>
        <div :class="['mt-2 flex flex-wrap gap-2 text-neutral-500 dark:text-neutral-400']">
          <span>{{ t(`settings.pages.memory.types.${item.type}`) }}</span>
          <span>{{ t(`settings.pages.memory.privacy.${item.privacy}`) }}</span>
          <span>{{ props.formatSource(item.sourceType) }}</span>
          <span>{{ item.status }}</span>
        </div>
        <div :class="['mt-2 flex flex-wrap gap-2']">
          <span
            v-for="reason in item.reasons"
            :key="`${item.id}-${reason}`"
            :class="['rounded-full bg-rose-500/10 px-2 py-1 text-rose-700 dark:text-rose-200']"
          >
            {{ props.formatReason(reason) }}
          </span>
        </div>
      </article>
    </div>
  </div>
</template>
