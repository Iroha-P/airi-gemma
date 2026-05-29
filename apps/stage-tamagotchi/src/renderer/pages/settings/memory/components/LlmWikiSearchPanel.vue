<script setup lang="ts">
import type { ElectronMemorySearchLlmWikiResult } from '../../../../../shared/eventa'

import { Button, FieldInput } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

defineProps<{
  canSearch: boolean
  emptyMessageKey: string | null
  loading: boolean
  result: ElectronMemorySearchLlmWikiResult | null
  snippetCount: number
}>()

const emit = defineEmits<{
  search: []
}>()

const query = defineModel<string>('query', { required: true })
const limit = defineModel<number>('limit', { required: true })

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div>
      <h2 :class="['text-base font-semibold']">
        {{ t('settings.pages.memory.llmwiki-search.title') }}
      </h2>
      <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.llmwiki-search.description') }}
      </p>
    </div>

    <div :class="['grid gap-4 sm:grid-cols-[1fr_160px]']">
      <FieldInput
        v-model="query"
        :label="t('settings.pages.memory.llmwiki-search.query-label')"
        :placeholder="t('settings.pages.memory.llmwiki-search.query-placeholder')"
        @keyup.enter="emit('search')"
      />
      <FieldInput
        v-model="limit"
        :label="t('settings.pages.memory.llmwiki-search.limit-label')"
        type="number"
        placeholder="3"
      />
    </div>

    <div :class="['flex justify-end']">
      <Button
        icon="i-solar:magnifer-bold-duotone"
        :label="t('settings.pages.memory.llmwiki-search.search')"
        :disabled="!canSearch"
        :loading="loading"
        @click="emit('search')"
      />
    </div>

    <div
      v-if="result"
      :class="['flex flex-col gap-2']"
    >
      <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.llmwiki-search.input-dir') }}:
        <span :class="['font-mono']">{{ result.inputDir }}</span>
      </div>
      <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.llmwiki-search.result-summary', { files: result.scannedFiles, snippets: snippetCount }) }}
      </div>
      <div
        v-if="result.snippets.length === 0"
        :class="['rounded-lg border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
      >
        {{ t(emptyMessageKey ?? 'settings.pages.memory.llmwiki-search.empty-no-match') }}
      </div>
      <div
        v-for="snippet in result.snippets"
        :key="`${snippet.relativePath}:${snippet.score}:${snippet.text}`"
        :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
      >
        <div :class="['flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400']">
          <span :class="['font-mono']">{{ snippet.relativePath }}</span>
          <span>{{ t('settings.pages.memory.llmwiki-search.score', { score: snippet.score }) }}</span>
        </div>
        <p :class="['mt-2 whitespace-pre-wrap text-sm leading-6']">
          {{ snippet.text }}
        </p>
      </div>
    </div>
  </section>
</template>
