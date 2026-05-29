<script setup lang="ts">
import type {
  ElectronMemoryBackupPreviewConflict,
  ElectronMemoryCompactProfileResult,
  ElectronMemoryExportBackupResult,
  ElectronMemoryExportLlmWikiResult,
  ElectronMemoryExportLoraDatasetCandidatesResult,
  ElectronMemoryExportObsidianVaultResult,
  ElectronMemoryExportPreflightReason,
  ElectronMemoryExportPreflightSurface,
  ElectronMemoryExportPublicProfileResult,
  ElectronMemoryImportBackupResult,
  ElectronMemoryImportChatRecordsRequest,
  ElectronMemoryImportChatRecordsResult,
  ElectronMemoryImportKnowledgeBaseResult,
  ElectronMemoryPreviewBackupResult,
  ElectronMemoryPreviewExportPreflightResult,
  ElectronMemoryReviewAction,
  ElectronMemoryReviewPriority,
  ElectronMemoryReviewReason,
  ElectronMemoryReviewWorkbenchEntry,
  ElectronMemoryReviewWorkbenchResult,
  ElectronMemoryValidateLoraTrainingPackageCheck,
  ElectronMemoryValidateLoraTrainingPackageResult,
} from '../../../../../shared/eventa'
import type { MigrationReadinessItem } from './migration-readiness'

import BackupImportResultPanel from './BackupImportResultPanel.vue'
import BackupPreviewPanel from './BackupPreviewPanel.vue'
import CompactProfilePanel from './CompactProfilePanel.vue'
import ExportFileListPanel from './ExportFileListPanel.vue'
import ExportPreflightPanel from './ExportPreflightPanel.vue'
import ImportResultsPanel from './ImportResultsPanel.vue'
import LlmWikiExportPanel from './LlmWikiExportPanel.vue'
import LoraTrainingDryRunPanel from './LoraTrainingDryRunPanel.vue'
import MemoryActionsPanel from './MemoryActionsPanel.vue'
import ObsidianExportPanel from './ObsidianExportPanel.vue'
import ReviewWorkbenchPanel from './ReviewWorkbenchPanel.vue'

type ReviewWorkbenchFilter = 'all' | 'high_priority' | 'dream_candidate' | 'persona_candidate' | 'safety_risk' | 'conflict' | 'stale_active'

type ExportFile
  = | ElectronMemoryExportBackupResult['files'][number]
    | ElectronMemoryExportLlmWikiResult['files'][number]
    | ElectronMemoryExportLoraDatasetCandidatesResult['files'][number]
    | ElectronMemoryExportObsidianVaultResult['files'][number]
    | ElectronMemoryExportPublicProfileResult['files'][number]

interface ReviewEvidenceRow {
  label: string
  value: string
}

interface SummaryRow {
  label: string
  value: string
}

defineProps<{
  activeCount: number
  backupExportMemoryCount: number
  backupExportResult: ElectronMemoryExportBackupResult | null
  backupImportImportedCount: number
  backupImportResult: ElectronMemoryImportBackupResult | null
  backupImportSkippedCount: number
  backupPreviewConflictCount: number
  backupPreviewEmptyCount: number
  backupPreviewResult: ElectronMemoryPreviewBackupResult | null
  backupPreviewSafetyRiskCount: number
  canApplyReviewAction: (entry: ElectronMemoryReviewWorkbenchEntry, action: ElectronMemoryReviewAction) => boolean
  canImportSelectedBackup: boolean
  canSelectAllBackupItems: boolean
  chatImportActions: Array<{
    icon: string
    label: string
    sourceType: ElectronMemoryImportChatRecordsRequest['sourceType']
  }>
  chatRecordsImportResult: ElectronMemoryImportChatRecordsResult | null
  compactProfileResult: ElectronMemoryCompactProfileResult | null
  conflictClass: (kind: ElectronMemoryBackupPreviewConflict['kind']) => string
  conflictLabel: (kind: ElectronMemoryBackupPreviewConflict['kind']) => string
  exportPreflightAllowedItems: ElectronMemoryPreviewExportPreflightResult['items']
  exportPreflightBlockedItems: ElectronMemoryPreviewExportPreflightResult['items']
  exportPreflightResult: ElectronMemoryPreviewExportPreflightResult | null
  formatConflictScore: (score: number | undefined) => string
  formatDate: (value: string) => string
  formatOptionalDate: (value: string | null | undefined) => string
  formatPreflightReason: (reason: ElectronMemoryExportPreflightReason) => string
  formatPreflightSurface: (surface: ElectronMemoryExportPreflightSurface) => string
  formatSource: (sourceType: string) => string
  hasHiddenReviewWorkbenchEntries: boolean
  hasHighPriorityReviewItems: boolean
  isBackupItemSelected: (originalId: string) => boolean
  isReviewWorkbenchFiltered: boolean
  itemCount: number
  knowledgeBaseImportResult: ElectronMemoryImportKnowledgeBaseResult | null
  llmWikiContentExportFiles: ExportFile[]
  llmWikiExportMemoryCount: number
  llmWikiExportResult: ElectronMemoryExportLlmWikiResult | null
  llmWikiNavigationExportFiles: ExportFile[]
  loading: boolean
  loraDatasetCandidatesExportRecordCount: number
  loraDatasetCandidatesExportResult: ElectronMemoryExportLoraDatasetCandidatesResult | null
  loraTrainingDryRunArtifactRows: SummaryRow[]
  loraTrainingDryRunContractRows: SummaryRow[]
  loraTrainingDryRunFailedChecks: ElectronMemoryValidateLoraTrainingPackageCheck[]
  loraTrainingDryRunResult: ElectronMemoryValidateLoraTrainingPackageResult | null
  migrationReadinessItems: MigrationReadinessItem[]
  migrationReadinessReadyCount: number
  obsidianInboxExportFiles: ExportFile[]
  obsidianManifestExportFile: ExportFile | null
  obsidianNavigationExportFiles: ExportFile[]
  obsidianVaultExportResult: ElectronMemoryExportObsidianVaultResult | null
  path: string | undefined
  publicProfileExportMemoryCount: number
  publicProfileExportResult: ElectronMemoryExportPublicProfileResult | null
  reviewActionIcon: (action: ElectronMemoryReviewAction) => string
  reviewActionLabel: (action: ElectronMemoryReviewAction) => string
  reviewEvidenceRows: (entry: ElectronMemoryReviewWorkbenchEntry) => ReviewEvidenceRow[]
  reviewPriorityClass: (priority: ElectronMemoryReviewPriority) => string
  reviewReasonLabel: (reason: ElectronMemoryReviewReason) => string
  reviewWorkbenchEntries: ElectronMemoryReviewWorkbenchEntry[]
  reviewWorkbenchFilterLabel: (option: { label: string, value: ReviewWorkbenchFilter }) => string
  reviewWorkbenchFilterOptions: Array<{ icon: string, label: string, value: ReviewWorkbenchFilter }>
  reviewWorkbenchFilteredEntries: ElectronMemoryReviewWorkbenchEntry[]
  reviewWorkbenchPriorityCounts: Record<ElectronMemoryReviewPriority, number>
  reviewWorkbenchResult: ElectronMemoryReviewWorkbenchResult | null
  reviewWorkbenchTotal: number
  saving: boolean
  selectedBackupConflictCount: number
  selectedBackupCount: number
  selectedBackupSafetyRiskCount: number
  totalCount: number
}>()

const reviewWorkbenchFilter = defineModel<ReviewWorkbenchFilter>('reviewWorkbenchFilter', { required: true })

defineEmits<{
  applyReviewWorkbenchAction: [entry: ElectronMemoryReviewWorkbenchEntry, action: ElectronMemoryReviewAction]
  clear: []
  clearBackupSelection: []
  compactProfile: []
  exportBackup: []
  exportLlmWiki: []
  exportLoraDatasetCandidates: []
  exportObsidianVault: []
  exportPublicProfile: []
  importChatRecords: [sourceType: ElectronMemoryImportChatRecordsRequest['sourceType']]
  importKnowledgeBase: []
  importSelectedBackup: []
  openReviewWorkbench: []
  previewBackup: []
  previewLoraDatasetCandidates: []
  previewPublicProfile: []
  refreshReviewWorkbench: []
  selectAllBackupItems: []
  toggleBackupSelection: [originalId: string, selected: boolean]
  validateLoraTrainingPackage: []
}>()
</script>

<template>
  <section :class="['border-t border-neutral-200/70 pt-4 dark:border-neutral-800/70']">
    <MemoryActionsPanel
      :active-count="activeCount"
      :chat-import-actions="chatImportActions"
      :item-count="itemCount"
      :loading="loading"
      :migration-readiness-items="migrationReadinessItems"
      :migration-readiness-ready-count="migrationReadinessReadyCount"
      :path="path"
      :saving="saving"
      :total-count="totalCount"
      @clear="$emit('clear')"
      @compact-profile="$emit('compactProfile')"
      @export-backup="$emit('exportBackup')"
      @export-llm-wiki="$emit('exportLlmWiki')"
      @export-lora-dataset-candidates="$emit('exportLoraDatasetCandidates')"
      @export-obsidian-vault="$emit('exportObsidianVault')"
      @export-public-profile="$emit('exportPublicProfile')"
      @import-chat-records="$emit('importChatRecords', $event)"
      @import-knowledge-base="$emit('importKnowledgeBase')"
      @preview-backup="$emit('previewBackup')"
      @preview-lora-dataset-candidates="$emit('previewLoraDatasetCandidates')"
      @preview-public-profile="$emit('previewPublicProfile')"
      @refresh-review-workbench="$emit('refreshReviewWorkbench')"
      @validate-lora-training-package="$emit('validateLoraTrainingPackage')"
    />
    <ImportResultsPanel
      :chat-records-import-result="chatRecordsImportResult"
      :knowledge-base-import-result="knowledgeBaseImportResult"
      :review-workbench-available="Boolean(reviewWorkbenchResult)"
      :review-workbench-total="reviewWorkbenchTotal"
      @open-review-workbench="$emit('openReviewWorkbench')"
    />
    <LoraTrainingDryRunPanel
      :artifact-rows="loraTrainingDryRunArtifactRows"
      :contract-rows="loraTrainingDryRunContractRows"
      :failed-checks="loraTrainingDryRunFailedChecks"
      :result="loraTrainingDryRunResult"
    />
    <ExportPreflightPanel
      :allowed-items="exportPreflightAllowedItems"
      :blocked-items="exportPreflightBlockedItems"
      :format-reason="formatPreflightReason"
      :format-source="formatSource"
      :format-surface="formatPreflightSurface"
      :result="exportPreflightResult"
    />
    <ExportFileListPanel
      description-key="settings.pages.memory.backup-export.description"
      empty-files-key="settings.pages.memory.backup-export.empty-files"
      file-count-key="settings.pages.memory.backup-export.memory-count"
      :format-date="formatDate"
      output-dir-key="settings.pages.memory.backup-export.output-dir"
      :result="backupExportResult"
      title-key="settings.pages.memory.backup-export.title"
      :total-count="backupExportMemoryCount"
      total-key="settings.pages.memory.backup-export.total-memories"
    />
    <LlmWikiExportPanel
      :content-files="llmWikiContentExportFiles"
      :format-date="formatDate"
      :memory-count="llmWikiExportMemoryCount"
      :navigation-files="llmWikiNavigationExportFiles"
      :result="llmWikiExportResult"
    />
    <ExportFileListPanel
      description-key="settings.pages.memory.public-profile-export.description"
      empty-files-key="settings.pages.memory.public-profile-export.empty-files"
      file-count-key="settings.pages.memory.public-profile-export.memory-count"
      :format-date="formatDate"
      output-dir-key="settings.pages.memory.public-profile-export.output-dir"
      :result="publicProfileExportResult"
      title-key="settings.pages.memory.public-profile-export.title"
      :total-count="publicProfileExportMemoryCount"
      total-key="settings.pages.memory.public-profile-export.total-memories"
    />
    <ExportFileListPanel
      description-key="settings.pages.memory.lora-dataset-export.description"
      empty-files-key="settings.pages.memory.lora-dataset-export.empty-files"
      file-count-key="settings.pages.memory.lora-dataset-export.record-count"
      :format-date="formatDate"
      output-dir-key="settings.pages.memory.lora-dataset-export.output-dir"
      :result="loraDatasetCandidatesExportResult"
      title-key="settings.pages.memory.lora-dataset-export.title"
      :total-count="loraDatasetCandidatesExportRecordCount"
      total-key="settings.pages.memory.lora-dataset-export.total-records"
    />
    <ObsidianExportPanel
      :format-date="formatDate"
      :inbox-files="obsidianInboxExportFiles"
      :manifest-file="obsidianManifestExportFile"
      :navigation-files="obsidianNavigationExportFiles"
      :result="obsidianVaultExportResult"
    />
    <CompactProfilePanel
      :format-date="formatDate"
      :result="compactProfileResult"
    />
    <div
      v-if="reviewWorkbenchResult"
      ref="reviewWorkbenchSection"
    >
      <ReviewWorkbenchPanel
        v-model:filter="reviewWorkbenchFilter"
        :can-apply-action="canApplyReviewAction"
        :entries="reviewWorkbenchEntries"
        :filtered-entries="reviewWorkbenchFilteredEntries"
        :filter-label="reviewWorkbenchFilterLabel"
        :filter-options="reviewWorkbenchFilterOptions"
        :format-date="formatDate"
        :has-hidden-entries="hasHiddenReviewWorkbenchEntries"
        :has-high-priority-items="hasHighPriorityReviewItems"
        :is-filtered="isReviewWorkbenchFiltered"
        :loading="loading"
        :priority-class="reviewPriorityClass"
        :priority-counts="reviewWorkbenchPriorityCounts"
        :reason-label="reviewReasonLabel"
        :result="reviewWorkbenchResult"
        :review-action-icon="reviewActionIcon"
        :review-action-label="reviewActionLabel"
        :review-evidence-rows="reviewEvidenceRows"
        :saving="saving"
        :source-label="formatSource"
        @apply-action="(entry, action) => $emit('applyReviewWorkbenchAction', entry, action)"
        @refresh="$emit('refreshReviewWorkbench')"
      />
    </div>
    <BackupPreviewPanel
      :can-import-selected="canImportSelectedBackup"
      :can-select-all="canSelectAllBackupItems"
      :conflict-class="conflictClass"
      :conflict-count="backupPreviewConflictCount"
      :conflict-label="conflictLabel"
      :empty-count="backupPreviewEmptyCount"
      :format-conflict-score="formatConflictScore"
      :format-date="formatDate"
      :is-selected="isBackupItemSelected"
      :result="backupPreviewResult"
      :safety-risk-count="backupPreviewSafetyRiskCount"
      :saving="saving"
      :selected-conflict-count="selectedBackupConflictCount"
      :selected-count="selectedBackupCount"
      :selected-safety-risk-count="selectedBackupSafetyRiskCount"
      @clear-selection="$emit('clearBackupSelection')"
      @import-selected="$emit('importSelectedBackup')"
      @select-all="$emit('selectAllBackupItems')"
      @toggle-selection="(originalId, selected) => $emit('toggleBackupSelection', originalId, selected)"
    />
    <BackupImportResultPanel
      :format-date="formatDate"
      :imported-count="backupImportImportedCount"
      :result="backupImportResult"
      :review-workbench-available="Boolean(reviewWorkbenchResult)"
      :review-workbench-total="reviewWorkbenchTotal"
      :skipped-count="backupImportSkippedCount"
      @open-review-workbench="$emit('openReviewWorkbench')"
    />
  </section>
</template>
