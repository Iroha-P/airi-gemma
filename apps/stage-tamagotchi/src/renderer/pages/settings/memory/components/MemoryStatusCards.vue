<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  active: number
  needsReview: number
  total: number
}>()

const { t } = useI18n()
</script>

<template>
  <section :class="['grid grid-cols-3 gap-3']">
    <div :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
      <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.status.total') }}
      </div>
      <div :class="['mt-1 text-2xl font-semibold']">
        {{ total }}
      </div>
    </div>
    <div :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
      <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.status.active') }}
      </div>
      <div :class="['mt-1 text-2xl font-semibold']">
        {{ active }}
      </div>
    </div>
    <div :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
      <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.status.needs-review') }}
      </div>
      <div :class="['mt-1 text-2xl font-semibold']">
        {{ needsReview }}
      </div>
    </div>
  </section>
</template>
