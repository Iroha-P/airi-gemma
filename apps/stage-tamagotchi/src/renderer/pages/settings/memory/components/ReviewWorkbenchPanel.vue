<script setup lang="ts">
import type {
  ElectronMemoryReviewAction,
  ElectronMemoryReviewPriority,
  ElectronMemoryReviewReason,
  ElectronMemoryReviewWorkbenchEntry,
  ElectronMemoryReviewWorkbenchResult,
} from '../../../../../shared/eventa'

import { Button } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

type ReviewWorkbenchFilter = 'all' | 'high_priority' | 'dream_candidate' | 'persona_candidate' | 'safety_risk' | 'conflict' | 'stale_active'

interface ReviewEvidenceRow {
  label: string
  value: string
}

interface ReviewWorkbenchFilterOption {
  icon: string
  label: string
  value: ReviewWorkbenchFilter
}

const props = defineProps<{
  canApplyAction: (entry: ElectronMemoryReviewWorkbenchEntry, action: ElectronMemoryReviewAction) => boolean
  entries: ElectronMemoryReviewWorkbenchEntry[]
  filteredEntries: ElectronMemoryReviewWorkbenchEntry[]
  filterLabel: (option: ReviewWorkbenchFilterOption) => string
  filterOptions: ReviewWorkbenchFilterOption[]
  formatDate: (value: string) => string
  hasHiddenEntries: boolean
  hasHighPriorityItems: boolean
  isFiltered: boolean
  loading: boolean
  priorityClass: (priority: ElectronMemoryReviewPriority) => string
  priorityCounts: Record<ElectronMemoryReviewPriority, number>
  reasonLabel: (reason: ElectronMemoryReviewReason) => string
  result: ElectronMemoryReviewWorkbenchResult
  reviewActionIcon: (action: ElectronMemoryReviewAction) => string
  reviewActionLabel: (action: ElectronMemoryReviewAction) => string
  reviewEvidenceRows: (entry: ElectronMemoryReviewWorkbenchEntry) => ReviewEvidenceRow[]
  saving: boolean
  sourceLabel: (sourceType: string) => string
}>()

const emit = defineEmits<{
  applyAction: [entry: ElectronMemoryReviewWorkbenchEntry, action: ElectronMemoryReviewAction]
  refresh: []
}>()

const filter = defineModel<ReviewWorkbenchFilter>('filter', { required: true })

const { t } = useI18n()
</script>

<template>
  <div :class="['mt-4 flex flex-col gap-3 rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
    <div :class="['flex flex-wrap items-center justify-between gap-2']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.review-workbench.title') }}
        </h3>
        <p :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.review-workbench.description', { total: props.result.total }) }}
        </p>
        <p :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.review-workbench.generated-at', { time: props.formatDate(props.result.generatedAt) }) }}
        </p>
      </div>
      <Button
        size="sm"
        icon="i-solar:refresh-bold-duotone"
        :label="t('settings.pages.memory.actions.refresh-review-workbench')"
        :disabled="props.loading"
        :loading="props.loading"
        variant="secondary"
        @click="emit('refresh')"
      />
    </div>

    <div
      v-if="props.entries.length > 0"
      :class="['flex flex-col gap-2 rounded-lg bg-neutral-500/5 p-2']"
    >
      <div :class="['flex flex-wrap gap-2']">
        <Button
          v-for="option in props.filterOptions"
          :key="option.value"
          size="sm"
          :icon="option.icon"
          :label="props.filterLabel(option)"
          :variant="filter === option.value ? 'primary' : 'secondary'"
          @click="filter = option.value"
        />
      </div>
      <div :class="['flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400']">
        <span>
          {{ t('settings.pages.memory.review-workbench.filtered-description', { shown: props.filteredEntries.length, total: props.entries.length }) }}
        </span>
        <Button
          v-if="props.isFiltered"
          size="sm"
          icon="i-solar:list-check-bold-duotone"
          :label="t('settings.pages.memory.review-workbench.show-all')"
          variant="secondary"
          @click="filter = 'all'"
        />
      </div>
      <p :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.review-workbench.priority-summary', props.priorityCounts) }}
      </p>
      <p
        v-if="props.hasHighPriorityItems"
        :class="['rounded-md border border-amber-300/70 bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:border-amber-400/30 dark:text-amber-200']"
      >
        {{ t('settings.pages.memory.review-workbench.high-priority-notice', { count: props.priorityCounts.high }) }}
      </p>
    </div>

    <div
      v-if="props.hasHiddenEntries"
      :class="['flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-neutral-300/70 p-3 text-xs text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400']"
    >
      <span>
        {{ t('settings.pages.memory.review-workbench.filtered-empty') }}
      </span>
      <Button
        size="sm"
        icon="i-solar:list-check-bold-duotone"
        :label="t('settings.pages.memory.review-workbench.show-all')"
        variant="secondary"
        @click="filter = 'all'"
      />
    </div>

    <div
      v-else-if="props.filteredEntries.length === 0"
      :class="['rounded-lg border border-dashed border-neutral-300/70 p-3 text-xs text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400']"
    >
      {{ t('settings.pages.memory.review-workbench.empty') }}
    </div>

    <div v-else :class="['grid gap-2']">
      <article
        v-for="entry in props.filteredEntries"
        :key="entry.id"
        :class="['rounded-lg border border-neutral-200/70 p-3 text-sm dark:border-neutral-800/70']"
      >
        <div :class="['flex flex-wrap items-start justify-between gap-2']">
          <div :class="['min-w-0 flex-1']">
            <div :class="['line-clamp-2 text-neutral-800 dark:text-neutral-100']">
              {{ entry.item.content }}
            </div>
            <div :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
              {{ props.sourceLabel(entry.item.sourceType) }} - {{ props.formatDate(entry.item.updatedAt) }}
            </div>
            <div :class="['mt-2 flex flex-wrap gap-2 text-xs']">
              <span :class="['rounded-md bg-primary-500/10 px-2 py-1 text-primary-700 dark:text-primary-200']">
                {{ t(`settings.pages.memory.types.${entry.item.type}`) }}
              </span>
              <span :class="['rounded-md bg-neutral-500/10 px-2 py-1 text-neutral-600 dark:text-neutral-300']">
                {{ t(`settings.pages.memory.privacy.${entry.item.privacy}`) }}
              </span>
              <span :class="['rounded-md bg-neutral-500/10 px-2 py-1 text-neutral-600 dark:text-neutral-300']">
                {{ t('settings.pages.memory.status.importance', { value: entry.item.importance }) }}
              </span>
            </div>
          </div>
          <span :class="['rounded-full border px-2 py-1 text-xs', props.priorityClass(entry.priority)]">
            {{ t(`settings.pages.memory.review-workbench.priority.${entry.priority}`) }}
          </span>
        </div>
        <div :class="['mt-3 flex flex-wrap gap-2']">
          <span
            v-for="reason in entry.reasons"
            :key="reason"
            :class="['rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300']"
          >
            {{ props.reasonLabel(reason) }}
          </span>
        </div>
        <div
          v-if="entry.item.tags.length > 0"
          :class="['mt-2 flex flex-wrap gap-2']"
        >
          <span
            v-for="tag in entry.item.tags"
            :key="`${entry.id}-tag-${tag}`"
            :class="['rounded-full bg-primary-500/10 px-2 py-1 text-xs text-primary-700 dark:text-primary-200']"
          >
            #{{ tag }}
          </span>
        </div>
        <div :class="['mt-2 text-xs text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.review-workbench.suggested-actions') }}
          {{ entry.recommendedActions.map(props.reviewActionLabel).join(' / ') }}
        </div>
        <div
          v-if="props.reviewEvidenceRows(entry).length > 0"
          :class="['mt-3 rounded-lg bg-neutral-500/5 p-3']"
        >
          <div :class="['text-xs font-semibold text-neutral-700 dark:text-neutral-200']">
            {{ t('settings.pages.memory.review-workbench.evidence.title') }}
          </div>
          <div :class="['mt-2 grid gap-2 text-xs sm:grid-cols-2']">
            <div
              v-for="row in props.reviewEvidenceRows(entry)"
              :key="`${entry.id}-${row.label}`"
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
        <div :class="['mt-3 flex flex-wrap gap-2']">
          <Button
            v-for="action in entry.recommendedActions"
            :key="`${entry.id}-${action}`"
            size="sm"
            :icon="props.reviewActionIcon(action)"
            :label="props.reviewActionLabel(action)"
            :disabled="props.saving || !props.canApplyAction(entry, action)"
            :loading="props.saving"
            variant="secondary"
            @click="emit('applyAction', entry, action)"
          />
        </div>
      </article>
    </div>
  </div>
</template>
