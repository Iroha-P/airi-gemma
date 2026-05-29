<script setup lang="ts">
import type {
  ElectronAgentChatTarget,
  ElectronMemoryPreviewRagContextResult,
} from '../../../../../shared/eventa'

import { Button, FieldInput, FieldSelect } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

defineProps<{
  canPreview: boolean
  loading: boolean
  result: ElectronMemoryPreviewRagContextResult | null
  targetOptions: Array<{ description: string, label: string, value: ElectronAgentChatTarget }>
}>()

const emit = defineEmits<{
  preview: []
}>()

const query = defineModel<string>('query', { required: true })
const target = defineModel<ElectronAgentChatTarget>('target', { required: true })
const memoryLimit = defineModel<number>('memoryLimit', { required: true })
const llmWikiLimit = defineModel<number>('llmWikiLimit', { required: true })

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div>
      <h2 :class="['text-base font-semibold']">
        {{ t('settings.pages.memory.rag-preview.title') }}
      </h2>
      <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.rag-preview.description') }}
      </p>
    </div>

    <div :class="['grid gap-4 sm:grid-cols-[1fr_180px]']">
      <FieldInput
        v-model="query"
        :label="t('settings.pages.memory.rag-preview.query-label')"
        :placeholder="t('settings.pages.memory.rag-preview.query-placeholder')"
        @keyup.enter="emit('preview')"
      />
      <FieldSelect
        v-model="target"
        :label="t('settings.pages.memory.rag-preview.target-label')"
        :options="targetOptions"
        layout="vertical"
      />
    </div>

    <div :class="['grid gap-4 sm:grid-cols-2']">
      <FieldInput
        v-model="memoryLimit"
        :label="t('settings.pages.memory.rag-preview.memory-limit-label')"
        type="number"
        placeholder="8"
      />
      <FieldInput
        v-model="llmWikiLimit"
        :label="t('settings.pages.memory.rag-preview.llmwiki-limit-label')"
        type="number"
        placeholder="5"
      />
    </div>

    <div :class="['flex justify-end']">
      <Button
        icon="i-solar:filter-bold-duotone"
        :label="t('settings.pages.memory.rag-preview.preview')"
        :disabled="!canPreview"
        :loading="loading"
        @click="emit('preview')"
      />
    </div>

    <div
      v-if="result"
      :class="['grid gap-4 lg:grid-cols-2']"
    >
      <div :class="['flex flex-col gap-2']">
        <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.rag-preview.fragments', { count: result.fragments.length }) }}
        </div>
        <div
          v-if="result.fragments.length === 0"
          :class="['rounded-lg border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
        >
          {{ t('settings.pages.memory.rag-preview.empty-fragments') }}
        </div>
        <div
          v-for="fragment in result.fragments"
          :key="`${fragment.kind}:${fragment.id}`"
          :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
        >
          <div :class="['flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400']">
            <span :class="['font-mono']">{{ fragment.kind }}:{{ fragment.id }}</span>
            <span>{{ t('settings.pages.memory.rag-preview.score', { score: fragment.score ?? 0 }) }}</span>
          </div>
          <div
            v-if="fragment.title"
            :class="['mt-1 text-sm font-medium']"
          >
            {{ fragment.title }}
          </div>
          <p :class="['mt-2 whitespace-pre-wrap text-sm leading-6']">
            {{ fragment.text }}
          </p>
        </div>
      </div>

      <div :class="['flex flex-col gap-2']">
        <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.rag-preview.withheld', { count: result.withheld.length }) }}
        </div>
        <div
          v-if="result.withheld.length === 0"
          :class="['rounded-lg border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
        >
          {{ t('settings.pages.memory.rag-preview.empty-withheld') }}
        </div>
        <div
          v-for="item in result.withheld"
          :key="`${item.id}:${item.reason}`"
          :class="['rounded-lg border border-rose-200/70 bg-rose-500/10 p-3 text-sm dark:border-rose-800/70']"
        >
          <div :class="['font-mono text-xs']">
            {{ item.id }}
          </div>
          <div :class="['mt-1']">
            {{ item.privacy }} - {{ t(`settings.pages.memory.rag-preview.withheld-reason.${item.reason}`) }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
