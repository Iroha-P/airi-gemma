<script setup lang="ts">
import type { ElectronMemoryBackupPreviewConflict, ElectronMemoryPreviewBackupResult } from '../../../../../shared/eventa'

import { Button, Checkbox } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  canImportSelected: boolean
  canSelectAll: boolean
  conflictCount: number
  conflictClass: (kind: ElectronMemoryBackupPreviewConflict['kind']) => string
  conflictLabel: (kind: ElectronMemoryBackupPreviewConflict['kind']) => string
  emptyCount: number
  formatConflictScore: (score: number | undefined) => string
  formatDate: (value: string) => string
  isSelected: (originalId: string) => boolean
  result: ElectronMemoryPreviewBackupResult | null
  safetyRiskCount: number
  saving: boolean
  selectedConflictCount: number
  selectedCount: number
  selectedSafetyRiskCount: number
}>()

const emit = defineEmits<{
  clearSelection: []
  importSelected: []
  selectAll: []
  toggleSelection: [originalId: string, selected: boolean]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="props.result"
    :class="['mt-4 flex flex-col gap-3 rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
  >
    <div :class="['flex flex-wrap items-center justify-between gap-2']">
      <div>
        <h3 :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.backup-preview.title') }}
        </h3>
        <p :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.backup-preview.description', { total: props.result.total, selected: props.selectedCount }) }}
        </p>
      </div>
      <div :class="['flex flex-wrap items-center gap-2']">
        <Button
          size="sm"
          icon="i-solar:checklist-bold-duotone"
          :label="t('settings.pages.memory.backup-preview.select-all')"
          :disabled="props.saving || !props.canSelectAll"
          variant="secondary"
          @click="emit('selectAll')"
        />
        <Button
          size="sm"
          icon="i-solar:close-circle-bold-duotone"
          :label="t('settings.pages.memory.backup-preview.clear-selection')"
          :disabled="props.saving || props.selectedCount === 0"
          variant="secondary"
          @click="emit('clearSelection')"
        />
        <Button
          size="sm"
          icon="i-solar:archive-check-bold-duotone"
          :label="t('settings.pages.memory.actions.import-selected-backup')"
          :disabled="!props.canImportSelected"
          :loading="props.saving"
          variant="secondary"
          @click="emit('importSelected')"
        />
      </div>
    </div>

    <div :class="['grid gap-2 text-xs sm:grid-cols-3']">
      <div :class="['rounded-lg bg-primary-500/5 p-3 text-primary-700 dark:text-primary-200']">
        <div>
          {{ t('settings.pages.memory.backup-preview.selected') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.selectedCount }}
        </div>
      </div>
      <div :class="['rounded-lg bg-amber-500/10 p-3 text-amber-700 dark:text-amber-200']">
        <div>
          {{ t('settings.pages.memory.backup-preview.empty-items') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.emptyCount }}
        </div>
      </div>
      <div :class="['rounded-lg bg-rose-500/10 p-3 text-rose-700 dark:text-rose-200']">
        <div>
          {{ t('settings.pages.memory.backup-preview.conflict-items') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.conflictCount }}
        </div>
      </div>
      <div :class="['rounded-lg bg-red-500/10 p-3 text-red-700 dark:text-red-200']">
        <div>
          {{ t('settings.pages.memory.backup-preview.safety-risk-items') }}
        </div>
        <div :class="['mt-1 text-lg font-semibold']">
          {{ props.safetyRiskCount }}
        </div>
      </div>
    </div>

    <div :class="['grid gap-2 text-xs md:grid-cols-[1fr_140px_180px]']">
      <div :class="['rounded-lg bg-neutral-500/5 p-3']">
        <div :class="['text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.backup-preview.backup-file') }}
        </div>
        <div :class="['mt-1 break-words font-mono text-neutral-800 dark:text-neutral-100']">
          {{ props.result.backupFile }}
        </div>
      </div>
      <div :class="['rounded-lg bg-neutral-500/5 p-3']">
        <div :class="['text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.backup-preview.schema-version') }}
        </div>
        <div :class="['mt-1 font-mono text-neutral-800 dark:text-neutral-100']">
          {{ props.result.schemaVersion }}
        </div>
      </div>
      <div :class="['rounded-lg bg-neutral-500/5 p-3']">
        <div :class="['text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.backup-preview.exported-at') }}
        </div>
        <div :class="['mt-1 font-mono text-neutral-800 dark:text-neutral-100']">
          {{ props.formatDate(props.result.exportedAt) }}
        </div>
      </div>
    </div>

    <div
      v-if="props.selectedConflictCount > 0"
      :class="['rounded-lg border border-amber-300/70 bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:border-amber-800/70 dark:text-amber-100']"
    >
      {{ t('settings.pages.memory.backup-preview.selected-conflict-warning', { count: props.selectedConflictCount }) }}
    </div>

    <div
      v-if="props.selectedSafetyRiskCount > 0"
      :class="['rounded-lg border border-red-300/70 bg-red-500/10 p-3 text-xs leading-5 text-red-800 dark:border-red-800/70 dark:text-red-100']"
    >
      {{ t('settings.pages.memory.backup-preview.selected-safety-risk-warning', { count: props.selectedSafetyRiskCount }) }}
    </div>

    <div
      v-if="props.result.items.length === 0"
      :class="['rounded-lg border border-dashed border-neutral-300/70 p-3 text-xs text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400']"
    >
      {{ t('settings.pages.memory.backup-preview.empty-backup') }}
    </div>
    <div v-else :class="['flex max-h-80 flex-col gap-2 overflow-auto pr-1']">
      <article
        v-for="item in props.result.items"
        :key="item.originalId"
        :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
      >
        <div :class="['flex items-start gap-3']">
          <Checkbox
            :model-value="props.isSelected(item.originalId)"
            :disabled="item.empty || props.saving"
            @update:model-value="value => emit('toggleSelection', item.originalId, value)"
          />
          <div :class="['min-w-0 flex-1']">
            <div :class="['flex flex-wrap items-center gap-2 text-xs']">
              <span :class="['rounded-md bg-primary-500/10 px-2 py-1 text-primary-700 dark:text-primary-200']">
                {{ t(`settings.pages.memory.types.${item.type}`) }}
              </span>
              <span :class="['rounded-md bg-neutral-500/10 px-2 py-1 text-neutral-600 dark:text-neutral-300']">
                {{ t(`settings.pages.memory.privacy.${item.privacy}`) }}
              </span>
              <span v-if="item.empty" :class="['rounded-md bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-200']">
                {{ t('settings.pages.memory.backup-preview.empty') }}
              </span>
              <span v-if="item.safetyRisk" :class="['rounded-md bg-red-500/10 px-2 py-1 text-red-700 dark:text-red-200']">
                {{ t('settings.pages.memory.backup-preview.safety-risk') }}
              </span>
            </div>
            <p :class="['mt-2 break-words text-sm leading-6']">
              {{ item.contentPreview || t('settings.pages.memory.backup-preview.no-preview') }}
            </p>
            <div
              v-if="item.safetyFindings.length > 0"
              :class="['mt-2 flex flex-wrap gap-2 text-xs']"
            >
              <span
                v-for="finding in item.safetyFindings"
                :key="`${item.originalId}-${finding.kind}-${finding.severity}`"
                :class="['rounded-md bg-red-500/10 px-2 py-1 text-red-700 dark:text-red-200']"
              >
                {{ t(`settings.pages.memory.safety-findings.${finding.kind}`) }}
              </span>
            </div>
            <div
              v-if="item.conflicts.length > 0"
              :class="['mt-2 flex flex-col gap-2']"
            >
              <div
                v-for="conflict in item.conflicts"
                :key="`${item.originalId}-${conflict.kind}-${conflict.itemId}`"
                :class="['rounded-lg border px-3 py-2 text-xs leading-5', props.conflictClass(conflict.kind)]"
              >
                <div :class="['font-medium']">
                  {{ props.conflictLabel(conflict.kind) }}
                  <span v-if="props.formatConflictScore(conflict.score)">
                    - {{ props.formatConflictScore(conflict.score) }}
                  </span>
                </div>
                <div>
                  {{ conflict.reason }}
                </div>
                <div :class="['opacity-80']">
                  {{ t('settings.pages.memory.conflicts.related') }}: {{ conflict.itemId }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
