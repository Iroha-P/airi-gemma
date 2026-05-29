<script setup lang="ts">
import type { MigrationReadinessItem } from './migration-readiness'

import { useI18n } from 'vue-i18n'

defineProps<{
  items: MigrationReadinessItem[]
  readyCount: number
}>()

const { t } = useI18n()
</script>

<template>
  <div :class="['mt-4 rounded-lg border border-neutral-200/70 bg-neutral-500/5 p-3 dark:border-neutral-800/70']">
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.migration-readiness.title') }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.migration-readiness.description') }}
        </p>
      </div>
      <span :class="['rounded-full bg-primary-500/10 px-2 py-1 text-xs text-primary-700 dark:text-primary-200']">
        {{ t('settings.pages.memory.migration-readiness.ready-count', { ready: readyCount, total: items.length }) }}
      </span>
    </div>
    <div :class="['mt-3 grid gap-2 md:grid-cols-2']">
      <div
        v-for="item in items"
        :key="item.key"
        :class="[
          'rounded-lg border p-3 text-xs',
          item.ready
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-amber-500/20 bg-amber-500/5',
        ]"
      >
        <div :class="['flex items-start gap-2']">
          <span
            :class="[
              'mt-0.5 h-4 w-4 shrink-0',
              item.ready
                ? 'i-solar:check-circle-bold-duotone text-emerald-600 dark:text-emerald-300'
                : 'i-solar:clock-circle-bold-duotone text-amber-600 dark:text-amber-300',
            ]"
          />
          <div :class="['min-w-0 flex-1']">
            <div :class="['flex flex-wrap items-center gap-2']">
              <span :class="['font-semibold text-neutral-800 dark:text-neutral-100']">
                {{ t(item.titleKey) }}
              </span>
              <span :class="['rounded-full bg-neutral-500/10 px-2 py-0.5 text-[11px] text-neutral-600 dark:text-neutral-300']">
                {{ item.ready ? t('settings.pages.memory.migration-readiness.ready') : t('settings.pages.memory.migration-readiness.missing') }}
              </span>
            </div>
            <p :class="['mt-1 leading-5 text-neutral-500 dark:text-neutral-400']">
              {{ t(item.descriptionKey) }}
            </p>
            <p :class="['mt-2 break-words font-mono text-[11px] text-neutral-600 dark:text-neutral-300']">
              {{ item.detail || t('settings.pages.memory.migration-readiness.not-yet') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
