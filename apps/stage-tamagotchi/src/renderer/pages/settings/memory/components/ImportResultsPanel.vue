<script setup lang="ts">
import type { ElectronMemoryImportChatRecordsResult, ElectronMemoryImportKnowledgeBaseResult } from '../../../../../shared/eventa'

import { Button } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  chatRecordsImportResult: ElectronMemoryImportChatRecordsResult | null
  knowledgeBaseImportResult: ElectronMemoryImportKnowledgeBaseResult | null
  reviewWorkbenchAvailable: boolean
  reviewWorkbenchTotal: number
}>()

const emit = defineEmits<{
  openReviewWorkbench: []
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="props.knowledgeBaseImportResult"
    :class="['mt-4 flex flex-col gap-3 rounded-lg border border-neutral-200/70 bg-neutral-500/5 p-3 dark:border-neutral-800/70']"
  >
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.knowledge-import.title') }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.knowledge-import.description', { created: props.knowledgeBaseImportResult.created.length, scanned: props.knowledgeBaseImportResult.filesScanned }) }}
        </p>
      </div>
      <span :class="['rounded-full bg-neutral-500/10 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300']">
        {{ t('settings.pages.memory.knowledge-import.empty-files', { count: props.knowledgeBaseImportResult.emptyFiles.length }) }}
      </span>
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
      <div :class="['font-medium']">
        {{ t('settings.pages.memory.knowledge-import.empty-file-title', { count: props.knowledgeBaseImportResult.emptyFiles.length }) }}
      </div>
      <p
        v-if="props.knowledgeBaseImportResult.emptyFiles.length === 0"
        :class="['mt-2 text-neutral-500 dark:text-neutral-400']"
      >
        {{ t('settings.pages.memory.knowledge-import.no-empty-files') }}
      </p>
      <ul
        v-else
        :class="['mt-2 space-y-1 text-neutral-600 dark:text-neutral-300']"
      >
        <li
          v-for="file in props.knowledgeBaseImportResult.emptyFiles"
          :key="file"
          :class="['font-mono break-all']"
        >
          {{ file }}
        </li>
      </ul>
    </div>

    <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs']">
      <div :class="['font-medium']">
        {{ t('settings.pages.memory.knowledge-import.generated-title', { count: props.knowledgeBaseImportResult.skippedGeneratedFiles.length }) }}
      </div>
      <p
        v-if="props.knowledgeBaseImportResult.skippedGeneratedFiles.length === 0"
        :class="['mt-2 text-neutral-500 dark:text-neutral-400']"
      >
        {{ t('settings.pages.memory.knowledge-import.empty-generated') }}
      </p>
      <ul
        v-else
        :class="['mt-2 space-y-1 text-neutral-600 dark:text-neutral-300']"
      >
        <li
          v-for="file in props.knowledgeBaseImportResult.skippedGeneratedFiles"
          :key="file"
          :class="['font-mono break-all']"
        >
          {{ file }}
        </li>
      </ul>
    </div>
  </div>

  <div
    v-if="props.chatRecordsImportResult"
    :class="['mt-4 flex flex-col gap-3 rounded-lg border border-neutral-200/70 bg-neutral-500/5 p-3 dark:border-neutral-800/70']"
  >
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.chat-import.title') }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.chat-import.description', { messages: props.chatRecordsImportResult.messagesImported, files: props.chatRecordsImportResult.filesScanned }) }}
        </p>
      </div>
      <span :class="['rounded-full bg-neutral-500/10 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300']">
        {{ t('settings.pages.memory.chat-import.created', { count: props.chatRecordsImportResult.created.length }) }}
      </span>
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

    <div :class="['grid gap-3 md:grid-cols-2']">
      <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs']">
        <div :class="['font-medium']">
          {{ t('settings.pages.memory.chat-import.empty-file-title', { count: props.chatRecordsImportResult.emptyFiles.length }) }}
        </div>
        <p
          v-if="props.chatRecordsImportResult.emptyFiles.length === 0"
          :class="['mt-2 text-neutral-500 dark:text-neutral-400']"
        >
          {{ t('settings.pages.memory.chat-import.no-empty-files') }}
        </p>
        <ul
          v-else
          :class="['mt-2 space-y-1 text-neutral-600 dark:text-neutral-300']"
        >
          <li
            v-for="file in props.chatRecordsImportResult.emptyFiles"
            :key="file"
            :class="['font-mono break-all']"
          >
            {{ file }}
          </li>
        </ul>
      </div>

      <div :class="['rounded-lg bg-neutral-500/5 p-3 text-xs']">
        <div :class="['font-medium']">
          {{ t('settings.pages.memory.chat-import.unsupported-file-title', { count: props.chatRecordsImportResult.unsupportedFiles.length }) }}
        </div>
        <p
          v-if="props.chatRecordsImportResult.unsupportedFiles.length === 0"
          :class="['mt-2 text-neutral-500 dark:text-neutral-400']"
        >
          {{ t('settings.pages.memory.chat-import.no-unsupported-files') }}
        </p>
        <ul
          v-else
          :class="['mt-2 space-y-1 text-neutral-600 dark:text-neutral-300']"
        >
          <li
            v-for="file in props.chatRecordsImportResult.unsupportedFiles"
            :key="file"
            :class="['font-mono break-all']"
          >
            {{ file }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
