<script setup lang="ts">
import type { ElectronMemoryItem } from '../../../../../shared/eventa'

import { Button, DoubleCheckButton, FieldInput, FieldTextArea } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

type ReviewFilter = 'all' | 'clean' | 'duplicate' | 'conflict' | 'needs_review'

interface MemoryConflictMetadata {
  itemId?: string
  kind?: 'duplicate' | 'conflict'
  reason?: string
  score?: number
}

defineProps<{
  conflictClass: (kind: MemoryConflictMetadata['kind']) => string
  conflictLabel: (kind: MemoryConflictMetadata['kind']) => string
  correctingId: string | null
  explainingId: string | null
  filteredItems: ElectronMemoryItem[]
  formatConflictScore: (score: number | undefined) => string
  formatDate: (value: string) => string
  formatOptionalDate: (value: string | null | undefined) => string
  getMemoryConflicts: (item: ElectronMemoryItem) => MemoryConflictMetadata[]
  items: ElectronMemoryItem[]
  lastError: string | null | undefined
  loading: boolean
  pendingFilteredCount: number
  reviewFilterOptions: Array<{ label: string, value: ReviewFilter }>
  saving: boolean
  sourceLabel: (sourceType: string) => string
  usageExplanation: string
}>()

const query = defineModel<string>('query', { required: true })
const reviewFilter = defineModel<ReviewFilter>('reviewFilter', { required: true })
const correctionText = defineModel<string>('correctionText', { required: true })

const emit = defineEmits<{
  approveFiltered: []
  approveItem: [id: string]
  archiveFiltered: []
  cancelCorrection: []
  explain: [id: string]
  keepCandidateArchiveRelated: [payload: { candidateId: string, relatedId: string }]
  refresh: []
  rejectCandidate: [id: string]
  rejectFiltered: []
  remove: [id: string]
  search: []
  startCorrection: [id: string]
  submitCorrection: [id: string]
}>()

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4']">
    <div :class="['flex flex-col gap-3 sm:flex-row sm:items-end']">
      <FieldInput
        v-model="query"
        :label="t('settings.pages.memory.fields.search')"
        :placeholder="t('settings.pages.memory.fields.search-placeholder')"
        input-class="w-full"
        :class="['flex-1']"
        @keyup.enter="emit('search')"
      />
      <div :class="['flex gap-2']">
        <Button
          icon="i-solar:magnifer-bold-duotone"
          :label="t('settings.pages.memory.actions.search')"
          :loading="loading"
          variant="secondary"
          @click="emit('search')"
        />
        <Button
          icon="i-solar:refresh-bold-duotone"
          :label="t('settings.pages.memory.actions.refresh')"
          :loading="loading"
          variant="secondary"
          @click="emit('refresh')"
        />
      </div>
    </div>

    <div v-if="lastError" :class="['rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300']">
      {{ lastError }}
    </div>

    <div v-if="items.length === 0" :class="['rounded-lg border border-dashed border-neutral-300/80 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']">
      {{ t('settings.pages.memory.empty') }}
    </div>

    <div v-else :class="['flex flex-col gap-3']">
      <div :class="['flex flex-wrap gap-2']">
        <Button
          v-for="option in reviewFilterOptions"
          :key="option.value"
          size="sm"
          :label="option.label"
          :variant="reviewFilter === option.value ? 'primary' : 'secondary'"
          @click="reviewFilter = option.value"
        />
        <Button
          size="sm"
          icon="i-solar:checklist-minimalistic-bold-duotone"
          :label="t('settings.pages.memory.actions.approve-filtered')"
          :disabled="saving || pendingFilteredCount === 0"
          :loading="saving"
          variant="secondary"
          @click="emit('approveFiltered')"
        />
        <Button
          size="sm"
          icon="i-solar:close-circle-bold-duotone"
          :label="t('settings.pages.memory.actions.reject-filtered')"
          :disabled="saving || pendingFilteredCount === 0"
          :loading="saving"
          variant="secondary"
          @click="emit('rejectFiltered')"
        />
        <Button
          size="sm"
          icon="i-solar:archive-minimalistic-bold-duotone"
          :label="t('settings.pages.memory.actions.archive-filtered')"
          :disabled="saving || pendingFilteredCount === 0"
          :loading="saving"
          variant="secondary"
          @click="emit('archiveFiltered')"
        />
      </div>

      <div v-if="filteredItems.length === 0" :class="['rounded-lg border border-dashed border-neutral-300/80 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']">
        {{ t('settings.pages.memory.filters.empty') }}
      </div>

      <article
        v-for="item in filteredItems"
        :key="item.id"
        :class="['rounded-lg border border-neutral-200/70 p-4 dark:border-neutral-800/70']"
      >
        <div :class="['flex flex-wrap items-center justify-between gap-2']">
          <div :class="['flex flex-wrap gap-2 text-xs']">
            <span :class="['rounded-md bg-primary-500/10 px-2 py-1 text-primary-700 dark:text-primary-200']">
              {{ t(`settings.pages.memory.types.${item.type}`) }}
            </span>
            <span :class="['rounded-md bg-neutral-500/10 px-2 py-1 text-neutral-600 dark:text-neutral-300']">
              {{ t(`settings.pages.memory.privacy.${item.privacy}`) }}
            </span>
            <span :class="['rounded-md bg-neutral-500/10 px-2 py-1 text-neutral-600 dark:text-neutral-300']">
              {{ t('settings.pages.memory.status.importance', { value: item.importance }) }}
            </span>
          </div>
          <div :class="['flex flex-wrap gap-2']">
            <Button
              v-if="item.status === 'needs_review'"
              size="sm"
              icon="i-solar:check-circle-bold-duotone"
              :label="t('settings.pages.memory.actions.approve')"
              :disabled="saving"
              :loading="saving"
              variant="secondary"
              @click="emit('approveItem', item.id)"
            />
            <Button
              size="sm"
              icon="i-solar:pen-new-square-bold-duotone"
              :label="t('settings.pages.memory.actions.correct')"
              :disabled="saving"
              variant="secondary"
              @click="emit('startCorrection', item.id)"
            />
            <Button
              size="sm"
              icon="i-solar:question-circle-bold-duotone"
              :label="t('settings.pages.memory.actions.explain')"
              :disabled="saving"
              :loading="saving && explainingId === item.id"
              variant="secondary"
              @click="emit('explain', item.id)"
            />
            <DoubleCheckButton
              size="sm"
              :disabled="saving"
              :loading="saving"
              @confirm="emit('remove', item.id)"
            >
              {{ t('settings.pages.memory.actions.delete') }}
              <template #confirm>
                {{ t('settings.pages.memory.actions.confirm-delete') }}
              </template>
            </DoubleCheckButton>
          </div>
        </div>
        <p :class="['mt-3 whitespace-pre-wrap text-sm leading-6']">
          {{ item.content }}
        </p>
        <p v-if="item.summary" :class="['mt-2 text-xs text-neutral-500 dark:text-neutral-400']">
          {{ item.summary }}
        </p>
        <div
          v-if="getMemoryConflicts(item).length > 0"
          :class="['mt-3 flex flex-col gap-2']"
        >
          <div
            v-for="conflict in getMemoryConflicts(item)"
            :key="`${conflict.kind}-${conflict.itemId}-${conflict.score}`"
            :class="['rounded-lg border px-3 py-2 text-xs leading-5', conflictClass(conflict.kind)]"
          >
            <div :class="['font-medium']">
              {{ conflictLabel(conflict.kind) }}
              <span v-if="formatConflictScore(conflict.score)">
                · {{ formatConflictScore(conflict.score) }}
              </span>
            </div>
            <div v-if="conflict.reason">
              {{ conflict.reason }}
            </div>
            <div v-if="conflict.itemId" :class="['opacity-80']">
              {{ t('settings.pages.memory.conflicts.related') }}: {{ conflict.itemId }}
            </div>
            <div
              v-if="item.status === 'needs_review' && conflict.itemId"
              :class="['mt-2 flex flex-wrap gap-2']"
            >
              <Button
                size="sm"
                icon="i-solar:archive-check-bold-duotone"
                :label="t('settings.pages.memory.actions.keep-candidate-archive-related')"
                :disabled="saving"
                :loading="saving"
                variant="secondary"
                @click="emit('keepCandidateArchiveRelated', { candidateId: item.id, relatedId: conflict.itemId })"
              />
              <Button
                size="sm"
                icon="i-solar:close-circle-bold-duotone"
                :label="t('settings.pages.memory.actions.reject-candidate')"
                :disabled="saving"
                :loading="saving"
                variant="secondary"
                @click="emit('rejectCandidate', item.id)"
              />
            </div>
          </div>
        </div>
        <div :class="['mt-3 grid gap-2 text-xs text-neutral-500 dark:text-neutral-400 sm:grid-cols-2']">
          <span>
            {{ t('settings.pages.memory.fields.source') }}:
            {{ sourceLabel(item.sourceType) }}
          </span>
          <span>
            {{ t('settings.pages.memory.status.access-count', { value: item.accessCount }) }}
          </span>
          <span>
            {{ t('settings.pages.memory.fields.last-used') }}:
            {{ formatOptionalDate(item.lastAccessedAt) }}
          </span>
          <span>
            {{ t('settings.pages.memory.fields.updated') }}:
            {{ formatDate(item.updatedAt) }}
          </span>
        </div>
        <div :class="['mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400']">
          <span v-for="tag in item.tags" :key="tag" :class="['rounded bg-neutral-500/10 px-2 py-0.5']">
            #{{ tag }}
          </span>
        </div>
        <div
          v-if="correctingId === item.id"
          :class="['mt-4 flex flex-col gap-3 rounded-lg bg-neutral-500/5 p-3']"
        >
          <FieldTextArea
            v-model="correctionText"
            :label="t('settings.pages.memory.fields.correction')"
            :placeholder="t('settings.pages.memory.fields.correction-placeholder')"
          />
          <div :class="['flex justify-end gap-2']">
            <Button
              size="sm"
              :label="t('settings.pages.memory.actions.cancel')"
              :disabled="saving"
              variant="secondary"
              @click="emit('cancelCorrection')"
            />
            <Button
              size="sm"
              icon="i-solar:check-circle-bold-duotone"
              :label="t('settings.pages.memory.actions.submit-correction')"
              :disabled="saving || correctionText.trim().length === 0"
              :loading="saving"
              @click="emit('submitCorrection', item.id)"
            />
          </div>
        </div>
        <div
          v-if="explainingId === item.id && usageExplanation"
          :class="['mt-4 whitespace-pre-wrap rounded-lg bg-primary-500/5 p-3 text-xs leading-5 text-neutral-600 dark:text-neutral-300']"
        >
          {{ usageExplanation }}
        </div>
      </article>
    </div>
  </section>
</template>
