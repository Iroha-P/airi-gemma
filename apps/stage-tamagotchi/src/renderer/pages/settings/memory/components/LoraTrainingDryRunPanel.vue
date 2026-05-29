<script setup lang="ts">
import type { ElectronMemoryValidateLoraTrainingPackageCheck, ElectronMemoryValidateLoraTrainingPackageResult } from '../../../../../shared/eventa'

import { useI18n } from 'vue-i18n'

interface SummaryRow {
  label: string
  value: string
}

const props = defineProps<{
  artifactRows: SummaryRow[]
  contractRows: SummaryRow[]
  failedChecks: ElectronMemoryValidateLoraTrainingPackageCheck[]
  result: ElectronMemoryValidateLoraTrainingPackageResult | null
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="props.result"
    :class="[
      'mt-4 flex flex-col gap-3 rounded-lg border p-3',
      props.result.ok
        ? 'border-emerald-200/70 bg-emerald-500/5 dark:border-emerald-800/70'
        : 'border-rose-200/70 bg-rose-500/5 dark:border-rose-800/70',
    ]"
  >
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.lora-training-dry-run.title') }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.lora-training-dry-run.description') }}
        </p>
      </div>
      <span
        :class="[
          'rounded-full px-2 py-1 text-xs',
          props.result.ok
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
        ]"
      >
        {{ props.result.ok ? t('settings.pages.memory.lora-training-dry-run.passed') : t('settings.pages.memory.lora-training-dry-run.failed') }}
      </span>
    </div>

    <div :class="['grid gap-2 text-xs sm:grid-cols-4']">
      <div :class="['rounded-lg bg-neutral-500/5 p-3']">
        <div :class="['text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.lora-training-dry-run.candidates') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.result.counts.candidates }}
        </div>
      </div>
      <div :class="['rounded-lg bg-neutral-500/5 p-3']">
        <div :class="['text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.lora-training-dry-run.train') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.result.counts.train }}
        </div>
      </div>
      <div :class="['rounded-lg bg-neutral-500/5 p-3']">
        <div :class="['text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.lora-training-dry-run.eval') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.result.counts.eval }}
        </div>
      </div>
      <div :class="['rounded-lg bg-neutral-500/5 p-3']">
        <div :class="['text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.lora-training-dry-run.failed-checks') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.result.summary.failed }}
        </div>
      </div>
    </div>

    <div
      v-if="props.contractRows.length > 0"
      :class="['rounded-lg bg-neutral-500/5 p-3']"
    >
      <h4 :class="['text-xs font-semibold text-neutral-700 dark:text-neutral-200']">
        {{ t('settings.pages.memory.lora-training-dry-run.contract-title') }}
      </h4>
      <div :class="['mt-2 grid gap-2 text-xs sm:grid-cols-2']">
        <div
          v-for="row in props.contractRows"
          :key="row.label"
          :class="['min-w-0']"
        >
          <div :class="['text-neutral-500 dark:text-neutral-400']">
            {{ row.label }}
          </div>
          <div :class="['mt-1 break-words font-mono text-neutral-800 dark:text-neutral-100']">
            {{ row.value }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="props.artifactRows.length > 0"
      :class="['rounded-lg bg-neutral-500/5 p-3']"
    >
      <h4 :class="['text-xs font-semibold text-neutral-700 dark:text-neutral-200']">
        {{ t('settings.pages.memory.lora-training-dry-run.artifacts-title') }}
      </h4>
      <div :class="['mt-2 grid gap-2 text-xs sm:grid-cols-2']">
        <div
          v-for="row in props.artifactRows"
          :key="row.label"
          :class="['min-w-0']"
        >
          <div :class="['text-neutral-500 dark:text-neutral-400']">
            {{ row.label }}
          </div>
          <div :class="['mt-1 break-words font-mono text-neutral-800 dark:text-neutral-100']">
            {{ row.value }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="props.failedChecks.length === 0"
      :class="['rounded-lg border border-dashed border-emerald-300/70 p-3 text-xs leading-5 text-emerald-700 dark:border-emerald-800/70 dark:text-emerald-200']"
    >
      {{ t('settings.pages.memory.lora-training-dry-run.empty-failed') }}
    </div>

    <div
      v-else
      :class="['flex flex-col gap-2']"
    >
      <article
        v-for="check in props.failedChecks"
        :key="check.id"
        :class="['rounded-lg border border-rose-200/70 p-3 text-xs dark:border-rose-800/70']"
      >
        <div :class="['flex flex-wrap items-center justify-between gap-2']">
          <span :class="['font-mono text-neutral-700 dark:text-neutral-200']">{{ check.id }}</span>
          <span :class="['rounded-md bg-rose-500/10 px-2 py-1 text-rose-700 dark:text-rose-200']">
            {{ t('settings.pages.memory.lora-training-dry-run.failed') }}
          </span>
        </div>
        <p :class="['mt-2 text-neutral-500 dark:text-neutral-400']">
          {{ check.message }}
        </p>
      </article>
    </div>
  </div>
</template>
