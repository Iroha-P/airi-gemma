<script setup lang="ts">
import type { ElectronMemoryExportLlmWikiResult } from '../../../../../shared/eventa'

import { useI18n } from 'vue-i18n'

type LlmWikiExportFile = ElectronMemoryExportLlmWikiResult['files'][number]

const props = defineProps<{
  contentFiles: LlmWikiExportFile[]
  formatDate: (value: string) => string
  memoryCount: number
  navigationFiles: LlmWikiExportFile[]
  result: ElectronMemoryExportLlmWikiResult | null
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
          {{ t('settings.pages.memory.llmwiki-export.title') }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.llmwiki-export.description', { total: props.result.files.length }) }}
        </p>
      </div>
      <span :class="['rounded-full bg-neutral-500/10 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300']">
        {{ props.formatDate(props.result.exportedAt) }}
      </span>
    </div>
    <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs']">
      <div :class="['text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.llmwiki-export.output-dir') }}
      </div>
      <div :class="['mt-1 break-words font-mono text-neutral-800 dark:text-neutral-100']">
        {{ props.result.outputDir }}
      </div>
    </div>
    <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs text-neutral-500 dark:text-neutral-400']">
      {{ t('settings.pages.memory.llmwiki-export.total-memories', { count: props.memoryCount }) }}
    </div>
    <div :class="['rounded-lg bg-neutral-500/5 p-3']">
      <div>
        <h4 :class="['text-xs font-semibold text-neutral-700 dark:text-neutral-200']">
          {{ t('settings.pages.memory.llmwiki-export.navigation-title') }}
        </h4>
        <p :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.llmwiki-export.navigation-description') }}
        </p>
      </div>
      <div
        v-if="props.navigationFiles.length === 0"
        :class="['mt-2 rounded-lg border border-dashed border-neutral-300/70 p-3 text-xs text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400']"
      >
        {{ t('settings.pages.memory.llmwiki-export.empty-navigation') }}
      </div>
      <div
        v-else
        :class="['mt-2 grid gap-2 sm:grid-cols-2']"
      >
        <div
          v-for="file in props.navigationFiles"
          :key="file.relativePath"
          :class="['rounded-lg border border-neutral-200/70 p-3 text-xs dark:border-neutral-800/70']"
        >
          <div :class="['flex flex-wrap items-center justify-between gap-2']">
            <span :class="['font-mono text-neutral-800 dark:text-neutral-100']">
              {{ file.relativePath }}
            </span>
            <span :class="['rounded-md bg-neutral-500/10 px-2 py-1 text-neutral-600 dark:text-neutral-300']">
              {{ t('settings.pages.memory.llmwiki-export.memory-count', { count: file.count }) }}
            </span>
          </div>
          <div :class="['mt-2 break-words font-mono text-neutral-500 dark:text-neutral-400']">
            {{ file.path }}
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="props.contentFiles.length === 0"
      :class="['rounded-lg border border-dashed border-neutral-300/70 p-3 text-xs text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400']"
    >
      {{ t('settings.pages.memory.llmwiki-export.empty-files') }}
    </div>
    <div v-else :class="['flex max-h-52 flex-col gap-2 overflow-auto pr-1']">
      <div
        v-for="file in props.contentFiles"
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
          {{ t('settings.pages.memory.llmwiki-export.memory-count', { count: file.count }) }}
        </div>
      </div>
    </div>
  </div>
</template>
