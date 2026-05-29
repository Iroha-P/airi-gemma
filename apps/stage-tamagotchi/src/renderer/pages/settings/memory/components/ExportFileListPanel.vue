<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface ExportFile {
  count: number
  path: string
  relativePath: string
}

interface ExportFileListResult {
  exportedAt: string
  files: ExportFile[]
  outputDir: string
}

const props = defineProps<{
  descriptionKey: string
  emptyFilesKey: string
  fileCountKey: string
  formatDate: (value: string) => string
  outputDirKey: string
  result: ExportFileListResult | null
  titleKey: string
  totalCount: number
  totalKey: string
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
          {{ t(props.titleKey) }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ t(props.descriptionKey, { total: props.result.files.length }) }}
        </p>
      </div>
      <span :class="['rounded-full bg-neutral-500/10 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300']">
        {{ props.formatDate(props.result.exportedAt) }}
      </span>
    </div>
    <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs']">
      <div :class="['text-neutral-500 dark:text-neutral-400']">
        {{ t(props.outputDirKey) }}
      </div>
      <div :class="['mt-1 break-words font-mono text-neutral-800 dark:text-neutral-100']">
        {{ props.result.outputDir }}
      </div>
    </div>
    <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs text-neutral-500 dark:text-neutral-400']">
      {{ t(props.totalKey, { count: props.totalCount }) }}
    </div>
    <div
      v-if="props.result.files.length === 0"
      :class="['rounded-lg border border-dashed border-neutral-300/70 p-3 text-xs text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400']"
    >
      {{ t(props.emptyFilesKey) }}
    </div>
    <div v-else :class="['flex max-h-52 flex-col gap-2 overflow-auto pr-1']">
      <div
        v-for="file in props.result.files"
        :key="file.relativePath"
        :class="['rounded-lg bg-neutral-500/5 p-3 text-xs']"
      >
        <div :class="['break-words font-mono text-neutral-800 dark:text-neutral-100']">
          {{ file.relativePath }}
        </div>
        <div :class="['mt-1 break-words font-mono text-neutral-500 dark:text-neutral-400']">
          {{ file.path }}
        </div>
        <div :class="['mt-2 text-neutral-500 dark:text-neutral-400']">
          {{ t(props.fileCountKey, { count: file.count }) }}
        </div>
      </div>
    </div>
  </div>
</template>
