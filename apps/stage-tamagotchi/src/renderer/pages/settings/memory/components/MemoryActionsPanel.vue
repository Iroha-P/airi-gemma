<script setup lang="ts">
import type { ElectronMemoryImportChatRecordsRequest } from '../../../../../shared/eventa'
import type { MigrationReadinessItem } from './migration-readiness'

import { Button, DoubleCheckButton } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

import MigrationReadinessChecklist from './MigrationReadinessChecklist.vue'

interface ChatImportAction {
  icon: string
  label: string
  sourceType: ElectronMemoryImportChatRecordsRequest['sourceType']
}

const props = defineProps<{
  activeCount: number
  chatImportActions: ChatImportAction[]
  itemCount: number
  loading: boolean
  migrationReadinessItems: MigrationReadinessItem[]
  migrationReadinessReadyCount: number
  path?: string
  saving: boolean
  totalCount: number
}>()

const emit = defineEmits<{
  clear: []
  compactProfile: []
  exportBackup: []
  exportLlmWiki: []
  exportLoraDatasetCandidates: []
  exportObsidianVault: []
  exportPublicProfile: []
  importChatRecords: [sourceType: ElectronMemoryImportChatRecordsRequest['sourceType']]
  importKnowledgeBase: []
  previewBackup: []
  previewLoraDatasetCandidates: []
  previewPublicProfile: []
  refreshReviewWorkbench: []
  validateLoraTrainingPackage: []
}>()

const { t } = useI18n()
</script>

<template>
  <div :class="['flex flex-wrap gap-2']">
    <DoubleCheckButton
      variant="danger"
      :disabled="props.saving || props.itemCount === 0"
      :loading="props.saving"
      @confirm="emit('clear')"
    >
      {{ t('settings.pages.memory.actions.clear') }}
      <template #confirm>
        {{ t('settings.pages.memory.actions.confirm-clear') }}
      </template>
    </DoubleCheckButton>
    <Button
      icon="i-solar:archive-down-bold-duotone"
      :label="t('settings.pages.memory.actions.export-llmwiki')"
      :disabled="props.saving || props.activeCount === 0"
      :loading="props.saving"
      variant="secondary"
      @click="emit('exportLlmWiki')"
    />
    <Button
      icon="i-solar:notebook-bookmark-bold-duotone"
      :label="t('settings.pages.memory.actions.export-obsidian-vault')"
      :disabled="props.saving || props.totalCount === 0"
      :loading="props.saving"
      variant="secondary"
      @click="emit('exportObsidianVault')"
    />
    <Button
      icon="i-solar:document-text-bold-duotone"
      :label="t('settings.pages.memory.actions.compact-profile')"
      :disabled="props.saving || props.activeCount === 0"
      :loading="props.saving"
      variant="secondary"
      @click="emit('compactProfile')"
    />
    <Button
      icon="i-solar:checklist-minimalistic-bold-duotone"
      :label="t('settings.pages.memory.actions.refresh-review-workbench')"
      :disabled="props.loading"
      :loading="props.loading"
      variant="secondary"
      @click="emit('refreshReviewWorkbench')"
    />
    <Button
      icon="i-solar:shield-warning-bold-duotone"
      :label="t('settings.pages.memory.actions.preview-public-profile')"
      :disabled="props.loading || props.activeCount === 0"
      :loading="props.loading"
      variant="secondary"
      @click="emit('previewPublicProfile')"
    />
    <Button
      icon="i-solar:shield-check-bold-duotone"
      :label="t('settings.pages.memory.actions.export-public-profile')"
      :disabled="props.saving || props.activeCount === 0"
      :loading="props.saving"
      variant="secondary"
      @click="emit('exportPublicProfile')"
    />
    <Button
      icon="i-solar:document-medicine-bold-duotone"
      :label="t('settings.pages.memory.actions.preview-lora-dataset-candidates')"
      :disabled="props.loading || props.activeCount === 0"
      :loading="props.loading"
      variant="secondary"
      @click="emit('previewLoraDatasetCandidates')"
    />
    <Button
      icon="i-solar:document-add-bold-duotone"
      :label="t('settings.pages.memory.actions.export-lora-dataset-candidates')"
      :disabled="props.saving || props.activeCount === 0"
      :loading="props.saving"
      variant="secondary"
      @click="emit('exportLoraDatasetCandidates')"
    />
    <Button
      icon="i-solar:clipboard-check-bold-duotone"
      :label="t('settings.pages.memory.actions.validate-lora-training-package')"
      :disabled="props.loading"
      :loading="props.loading"
      variant="secondary"
      @click="emit('validateLoraTrainingPackage')"
    />
    <Button
      icon="i-solar:archive-up-bold-duotone"
      :label="t('settings.pages.memory.actions.export-backup')"
      :disabled="props.saving || props.totalCount === 0"
      :loading="props.saving"
      variant="secondary"
      @click="emit('exportBackup')"
    />
    <Button
      icon="i-solar:archive-check-bold-duotone"
      :label="t('settings.pages.memory.actions.preview-backup')"
      :disabled="props.saving"
      :loading="props.saving"
      variant="secondary"
      @click="emit('previewBackup')"
    />
    <Button
      icon="i-solar:folder-with-files-bold-duotone"
      :label="t('settings.pages.memory.actions.import-knowledge-base')"
      :disabled="props.saving"
      :loading="props.saving"
      variant="secondary"
      @click="emit('importKnowledgeBase')"
    />
    <Button
      v-for="action in props.chatImportActions"
      :key="action.sourceType"
      :icon="action.icon"
      :label="action.label"
      :disabled="props.saving"
      :loading="props.saving"
      variant="secondary"
      @click="emit('importChatRecords', action.sourceType)"
    />
  </div>
  <p :class="['mt-2 text-xs text-neutral-500 dark:text-neutral-400']">
    {{ props.path }}
  </p>
  <MigrationReadinessChecklist
    :items="props.migrationReadinessItems"
    :ready-count="props.migrationReadinessReadyCount"
  />
</template>
