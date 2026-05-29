<script setup lang="ts">
import type { ElectronAgentChatTarget, ElectronAgentContextFragment, ElectronComputerUseActionKind, ElectronMemoryEvolutionAction, ElectronMemoryEvolutionPriority, ElectronMemoryEvolutionSuggestionKind, ElectronMemoryExportPreflightReason, ElectronMemoryExportPreflightSurface, ElectronMemoryImportChatRecordsRequest, ElectronMemoryItem, ElectronMemoryPrivacy, ElectronMemoryReviewAction, ElectronMemoryReviewPriority, ElectronMemoryReviewReason, ElectronMemoryReviewWorkbenchEntry, ElectronMemoryType } from '../../../../shared/eventa'
import type { MigrationReadinessItem } from './components/migration-readiness'

import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AgentConsolePanel from './components/AgentConsolePanel.vue'
import AgentChatRuntimePanel from './components/AgentChatRuntimePanel.vue'
import ComputerUsePanel from './components/ComputerUsePanel.vue'
import DreamCyclePanel from './components/DreamCyclePanel.vue'
import EvolutionPreviewPanel from './components/EvolutionPreviewPanel.vue'
import LlmWikiSearchPanel from './components/LlmWikiSearchPanel.vue'
import MemoryEditorPanel from './components/MemoryEditorPanel.vue'
import MemoryListPanel from './components/MemoryListPanel.vue'
import MemoryResultsPanel from './components/MemoryResultsPanel.vue'
import MemoryStatusCards from './components/MemoryStatusCards.vue'
import RagPreviewPanel from './components/RagPreviewPanel.vue'
import RoutineLibraryPanel from './components/RoutineLibraryPanel.vue'
import { useAgentSettingsStore } from '../../../stores/settings/agent'
import {
  createAgentChatRuntimeFormState,
  isAgentChatRuntimeFormSubmittable,
  isAgentChatRuntimeFormTestable,
  toAgentChatRuntimeConfigPayload,
} from '../../../stores/settings/agent-chat-runtime-form'
import { useComputerUseSettingsStore } from '../../../stores/settings/computer-use'
import { useDreamSettingsStore } from '../../../stores/settings/dream'
import { useMemorySettingsStore } from '../../../stores/settings/memory'
import { useRoutineSettingsStore } from '../../../stores/settings/routines'

type ReviewWorkbenchFilter = 'all' | 'high_priority' | 'dream_candidate' | 'persona_candidate' | 'safety_risk' | 'conflict' | 'stale_active'

interface ReviewEvidenceRow {
  label: string
  value: string
}

interface PersonaCandidateMetadata {
  derivedFrom?: unknown
  reason?: unknown
}

interface SafetyFindingMetadata {
  kind?: unknown
  reason?: unknown
  severity?: unknown
}

const { t, te } = useI18n()
const memoryStore = useMemorySettingsStore()
const agentStore = useAgentSettingsStore()
const computerUseStore = useComputerUseSettingsStore()
const dreamStore = useDreamSettingsStore()
const routineStore = useRoutineSettingsStore()
const { items, status, loading, saving, query, lastError, backupPreview, backupExportResult, backupImportResult, reviewWorkbench, selectedBackupOriginalIds, agentChatRuntimeConfig, agentChatRuntimeTestResult, compactProfileResult, llmWikiExportResult, llmWikiSearchResult, ragContextPreviewResult, evolutionPreviewResult, exportPreflightResult, knowledgeBaseImportResult, chatRecordsImportResult, obsidianVaultExportResult, publicProfileExportResult, loraDatasetCandidatesExportResult, loraTrainingDryRunResult } = storeToRefs(memoryStore)
const { currentRun: agentCurrentRun, runs: agentRuns, tools: agentTools, loading: agentLoading, lastError: agentLastError } = storeToRefs(agentStore)
const { policy: computerUsePolicy, currentPreview: computerUsePreview, currentExecution: computerUseExecution, auditEntries: computerUseAuditEntries, loading: computerUseLoading, lastError: computerUseLastError } = storeToRefs(computerUseStore)
const { currentSession: dreamCurrentSession, loading: dreamLoading, lastError: dreamLastError, schedule: dreamSchedule } = storeToRefs(dreamStore)
const { items: routineItems, currentDraft: routineCurrentDraft, loading: routineLoading, saving: routineSaving, lastError: routineLastError } = storeToRefs(routineStore)

const content = ref('')
const summary = ref('')
const tagsInput = ref('')
const type = ref<ElectronMemoryType>('note')
const privacy = ref<ElectronMemoryPrivacy>('local')
const importance = ref(3)
const editingId = ref<string | null>(null)
const correctingId = ref<string | null>(null)
const correctionText = ref('')
const explainingId = ref<string | null>(null)
const usageExplanation = ref('')
const reviewFilter = ref<'all' | 'clean' | 'duplicate' | 'conflict' | 'needs_review'>('all')
const reviewWorkbenchFilter = ref<ReviewWorkbenchFilter>('all')
const chatRuntimeEnabled = ref(false)
const chatRuntimeTarget = ref<ElectronAgentChatTarget | undefined>()
const chatRuntimeBaseURL = ref('')
const chatRuntimeModel = ref('')
const chatRuntimeApiKey = ref('')
const agentInput = ref('')
const agentReflection = ref('')
const routineDraftText = ref('')
const computerUseKind = ref<ElectronComputerUseActionKind>('run_command')
const computerUseTarget = ref('')
const computerUseCommand = ref('')
const computerUseCwd = ref('')
const computerUseReason = ref('')
const llmWikiQuery = ref('')
const llmWikiLimit = ref(3)
const ragPreviewQuery = ref('')
const ragPreviewTarget = ref<ElectronAgentChatTarget>('local')
const ragPreviewMemoryLimit = ref(8)
const ragPreviewLlmWikiLimit = ref(5)
const evolutionStaleBefore = ref(new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10))
const evolutionIncludeLowPriority = ref(true)
const evolutionLimit = ref(20)
const dreamWindowHours = ref(4)
const dreamIncludeLoraCandidates = ref(true)
const dreamScheduleEnabled = ref(false)
const dreamScheduleIntervalHours = ref(6)
const dreamScheduleWindowHours = ref(4)
const dreamScheduleIncludeLoraCandidates = ref(true)
const reviewWorkbenchSection = useTemplateRef<HTMLElement>('reviewWorkbenchSection')

const chatRuntimeTargetOptions = computed<Array<{ description: string, label: string, value: ElectronAgentChatTarget }>>(() => [
  {
    description: t('settings.pages.memory.agent-chat-runtime.target.local.description'),
    label: t('settings.pages.memory.agent-chat-runtime.target.local.label'),
    value: 'local',
  },
  {
    description: t('settings.pages.memory.agent-chat-runtime.target.cloud.description'),
    label: t('settings.pages.memory.agent-chat-runtime.target.cloud.label'),
    value: 'cloud',
  },
])

const typeOptions: Array<{ label: string, value: ElectronMemoryType }> = [
  { label: t('settings.pages.memory.types.note'), value: 'note' },
  { label: t('settings.pages.memory.types.profile'), value: 'profile' },
  { label: t('settings.pages.memory.types.preference'), value: 'preference' },
  { label: t('settings.pages.memory.types.project'), value: 'project' },
  { label: t('settings.pages.memory.types.event'), value: 'event' },
  { label: t('settings.pages.memory.types.habit'), value: 'habit' },
  { label: t('settings.pages.memory.types.knowledge'), value: 'knowledge' },
]

const privacyOptions: Array<{ label: string, value: ElectronMemoryPrivacy }> = [
  { label: t('settings.pages.memory.privacy.local'), value: 'local' },
  { label: t('settings.pages.memory.privacy.sensitive'), value: 'sensitive' },
  { label: t('settings.pages.memory.privacy.secret'), value: 'secret' },
  { label: t('settings.pages.memory.privacy.public'), value: 'public' },
]

const canSave = computed(() => content.value.trim().length > 0 && !saving.value)
const isEditingMemory = computed(() => Boolean(editingId.value))
const canSearchLlmWiki = computed(() => llmWikiQuery.value.trim().length > 0 && !loading.value)
const llmWikiNavigationExportFiles = computed(() =>
  llmWikiExportResult.value?.files.filter(file => file.relativePath === 'index.md' || file.relativePath === 'log.md') ?? [])
const llmWikiContentExportFiles = computed(() =>
  llmWikiExportResult.value?.files.filter(file => file.relativePath !== 'index.md' && file.relativePath !== 'log.md') ?? [])
const llmWikiExportMemoryCount = computed(() =>
  llmWikiContentExportFiles.value.reduce((total, file) => total + file.count, 0))
const publicProfileExportMemoryCount = computed(() =>
  publicProfileExportResult.value?.files.reduce((total, file) => total + file.count, 0) ?? 0)
const loraDatasetCandidatesExportRecordCount = computed(() =>
  loraDatasetCandidatesExportResult.value?.files.reduce((total, file) => total + file.count, 0) ?? 0)
const backupExportMemoryCount = computed(() =>
  backupExportResult.value?.files.reduce((total, file) => total + file.count, 0) ?? 0)
const migrationReadinessItems = computed<MigrationReadinessItem[]>(() => [
  {
    descriptionKey: 'settings.pages.memory.migration-readiness.items.active-memory.description',
    detail: `${status.value?.active ?? 0}/${status.value?.total ?? 0}`,
    key: 'active-memory',
    ready: (status.value?.active ?? 0) > 0,
    titleKey: 'settings.pages.memory.migration-readiness.items.active-memory.title',
  },
  {
    descriptionKey: 'settings.pages.memory.migration-readiness.items.memory-backup.description',
    detail: backupExportResult.value?.outputDir ?? '',
    key: 'memory-backup',
    ready: Boolean(backupExportResult.value?.files.length),
    titleKey: 'settings.pages.memory.migration-readiness.items.memory-backup.title',
  },
  {
    descriptionKey: 'settings.pages.memory.migration-readiness.items.llmwiki.description',
    detail: llmWikiExportResult.value?.outputDir ?? '',
    key: 'llmwiki',
    ready: Boolean(llmWikiExportResult.value?.files.length),
    titleKey: 'settings.pages.memory.migration-readiness.items.llmwiki.title',
  },
  {
    descriptionKey: 'settings.pages.memory.migration-readiness.items.obsidian.description',
    detail: obsidianVaultExportResult.value?.outputDir ?? '',
    key: 'obsidian',
    ready: Boolean(obsidianVaultExportResult.value?.files.length),
    titleKey: 'settings.pages.memory.migration-readiness.items.obsidian.title',
  },
])
const migrationReadinessReadyCount = computed(() =>
  migrationReadinessItems.value.filter(item => item.ready).length)
const backupImportImportedCount = computed(() => backupImportResult.value?.imported.length ?? 0)
const backupImportSkippedCount = computed(() => backupImportResult.value?.skipped.length ?? 0)
const llmWikiSearchSnippetCount = computed(() => llmWikiSearchResult.value?.snippets.length ?? 0)
const llmWikiSearchEmptyMessageKey = computed(() => {
  if (!llmWikiSearchResult.value || llmWikiSearchResult.value.snippets.length > 0)
    return null

  return llmWikiSearchResult.value.scannedFiles === 0
    ? 'settings.pages.memory.llmwiki-search.empty-no-files'
    : 'settings.pages.memory.llmwiki-search.empty-no-match'
})
const canPreviewRagContext = computed(() => ragPreviewQuery.value.trim().length > 0 && !loading.value)
const canPreviewEvolution = computed(() => !loading.value)
const canStartLocalDream = computed(() => !dreamLoading.value && dreamCurrentSession.value?.status !== 'running')
const canCancelLocalDream = computed(() => dreamCurrentSession.value?.status === 'running' && !dreamLoading.value)
const dreamReport = computed(() => dreamCurrentSession.value?.report ?? null)
const dreamSanitizedMemoryCandidates = computed(() => dreamReport.value?.sanitizedReport?.memoryCandidates ?? [])
const dreamSanitizedRoutineCandidates = computed(() => dreamReport.value?.sanitizedReport?.routineCandidates ?? [])
const dreamSanitizedLoraDatasetCandidates = computed(() => dreamReport.value?.sanitizedReport?.loraDatasetCandidates ?? [])
const canImportDreamMemoryCandidates = computed(() => dreamSanitizedMemoryCandidates.value.length > 0 && !dreamLoading.value)
const canSaveDreamRoutineCandidates = computed(() => dreamSanitizedRoutineCandidates.value.length > 0 && !dreamLoading.value)
const canImportDreamLoraCandidates = computed(() => dreamSanitizedLoraDatasetCandidates.value.length > 0 && !dreamLoading.value)
const canSaveDreamSchedule = computed(() => !dreamLoading.value)
const canTriggerScheduledDream = computed(() => !dreamLoading.value && dreamCurrentSession.value?.status !== 'running')
const computerUseKindOptions = computed<Array<{ label: string, value: ElectronComputerUseActionKind }>>(() => [
  'observe_screen',
  'read_file',
  'search_files',
  'open_url',
  'open_path',
  'write_file',
  'delete_path',
  'move_path',
  'run_command',
].map(kind => ({
  label: t(`settings.pages.memory.computer-use.kind.${kind}`),
  value: kind as ElectronComputerUseActionKind,
})))
const computerUseNeedsCommand = computed(() => computerUseKind.value === 'run_command')
const computerUseNeedsTarget = computed(() => !['observe_screen', 'run_command'].includes(computerUseKind.value))
const canPreviewComputerUseAction = computed(() => {
  if (computerUseLoading.value)
    return false
  if (computerUseNeedsCommand.value)
    return computerUseCommand.value.trim().length > 0
  if (computerUseNeedsTarget.value)
    return computerUseTarget.value.trim().length > 0

  return true
})
const canExecuteComputerUseAction = computed(() => {
  if (!computerUsePreview.value || computerUseLoading.value)
    return false

  return computerUsePreview.value.canExecute
})
const canDraftRoutine = computed(() => routineDraftText.value.trim().length > 0 && !routineLoading.value)
const canSaveRoutineDraft = computed(() => Boolean(routineCurrentDraft.value) && !routineSaving.value)
const canRunAgent = computed(() => agentInput.value.trim().length > 0 && !agentLoading.value)
const canCancelAgentRun = computed(() => {
  if (!agentCurrentRun.value)
    return false

  return !['cancelled', 'completed', 'failed'].includes(agentCurrentRun.value.status) && !agentLoading.value
})
const canReflectAgentRun = computed(() => agentCurrentRun.value?.status === 'completed' && !agentLoading.value)
const agentContextIds = computed(() => agentCurrentRun.value?.context.map(fragment => fragment.id) ?? [])
const agentUsedContextIds = computed(() => agentCurrentRun.value?.usedContextIds ?? [])
const agentWithheldContextIds = computed(() => agentCurrentRun.value?.withheldContextIds ?? [])
const recentAgentRuns = computed(() => agentRuns.value.slice(0, 3))
const chatRuntimeFormState = computed(() => ({
  apiKey: chatRuntimeApiKey.value,
  baseURL: chatRuntimeBaseURL.value,
  enabled: chatRuntimeEnabled.value,
  model: chatRuntimeModel.value,
  target: chatRuntimeTarget.value,
}))
const canSaveChatRuntimeConfig = computed(() => isAgentChatRuntimeFormSubmittable(chatRuntimeFormState.value) && !saving.value)
const canTestChatRuntimeConfig = computed(() => isAgentChatRuntimeFormTestable(chatRuntimeFormState.value) && !saving.value)
const chatRuntimeStatusLabel = computed(() => {
  if (!agentChatRuntimeConfig.value?.enabled)
    return t('settings.pages.memory.agent-chat-runtime.status.disabled')
  if (agentChatRuntimeConfig.value.target === 'local')
    return t('settings.pages.memory.agent-chat-runtime.status.enabled-local')
  if (agentChatRuntimeConfig.value.target === 'cloud')
    return t('settings.pages.memory.agent-chat-runtime.status.enabled-cloud')
  return t('settings.pages.memory.agent-chat-runtime.status.enabled')
})
const chatRuntimeTestStatusLabel = computed(() => {
  const result = agentChatRuntimeTestResult.value
  if (!result)
    return ''
  if (result.ok) {
    return t('settings.pages.memory.agent-chat-runtime.test-success', {
      response: result.responsePreview || 'OK',
    })
  }
  return t('settings.pages.memory.agent-chat-runtime.test-failure', {
    error: result.errorMessage || t('settings.pages.memory.agent-chat-runtime.test-unknown-error'),
  })
})

watch(agentChatRuntimeConfig, (config) => {
  const form = createAgentChatRuntimeFormState(config)
  chatRuntimeEnabled.value = form.enabled
  chatRuntimeTarget.value = form.target
  chatRuntimeBaseURL.value = form.baseURL
  chatRuntimeModel.value = form.model
  chatRuntimeApiKey.value = form.apiKey
}, { immediate: true })

watch(dreamSchedule, (state) => {
  const config = state?.config
  if (!config)
    return

  dreamScheduleEnabled.value = config.enabled
  dreamScheduleIntervalHours.value = config.intervalHours
  dreamScheduleWindowHours.value = config.windowHours
  dreamScheduleIncludeLoraCandidates.value = config.includeLoraCandidates
}, { immediate: true })

const reviewFilterOptions = computed(() => [
  { label: t('settings.pages.memory.filters.all'), value: 'all' as const },
  { label: t('settings.pages.memory.filters.clean'), value: 'clean' as const },
  { label: t('settings.pages.memory.filters.duplicate'), value: 'duplicate' as const },
  { label: t('settings.pages.memory.filters.conflict'), value: 'conflict' as const },
  { label: t('settings.pages.memory.filters.needs-review'), value: 'needs_review' as const },
])

const reviewWorkbenchFilterOptions = computed<Array<{ icon: string, label: string, value: ReviewWorkbenchFilter }>>(() => [
  {
    icon: 'i-solar:inbox-line-bold-duotone',
    label: t('settings.pages.memory.review-workbench.filters.all'),
    value: 'all',
  },
  {
    icon: 'i-solar:fire-bold-duotone',
    label: t('settings.pages.memory.review-workbench.filters.high-priority'),
    value: 'high_priority',
  },
  {
    icon: 'i-solar:moon-stars-bold-duotone',
    label: t('settings.pages.memory.review-workbench.filters.dream-candidates'),
    value: 'dream_candidate',
  },
  {
    icon: 'i-solar:user-heart-bold-duotone',
    label: t('settings.pages.memory.review-workbench.filters.persona-candidates'),
    value: 'persona_candidate',
  },
  {
    icon: 'i-solar:shield-warning-bold-duotone',
    label: t('settings.pages.memory.review-workbench.filters.safety-risks'),
    value: 'safety_risk',
  },
  {
    icon: 'i-solar:danger-triangle-bold-duotone',
    label: t('settings.pages.memory.review-workbench.filters.conflicts'),
    value: 'conflict',
  },
  {
    icon: 'i-solar:history-bold-duotone',
    label: t('settings.pages.memory.review-workbench.filters.stale-active'),
    value: 'stale_active',
  },
])

const chatImportActions: Array<{
  icon: string
  label: string
  sourceType: ElectronMemoryImportChatRecordsRequest['sourceType']
}> = [
  {
    icon: 'i-solar:chat-round-dots-bold-duotone',
    label: t('settings.pages.memory.actions.import-wechat-records'),
    sourceType: 'import_wechat',
  },
  {
    icon: 'i-solar:chat-square-like-bold-duotone',
    label: t('settings.pages.memory.actions.import-feishu-records'),
    sourceType: 'import_lark',
  },
  {
    icon: 'i-solar:chat-line-bold-duotone',
    label: t('settings.pages.memory.actions.import-qq-records'),
    sourceType: 'import_qq',
  },
]

interface MemoryConflictMetadata {
  itemId?: string
  kind?: 'duplicate' | 'conflict'
  reason?: string
  score?: number
}

function getMemoryConflicts(item: ElectronMemoryItem): MemoryConflictMetadata[] {
  const conflicts = item.metadata?.conflicts
  if (!Array.isArray(conflicts))
    return []

  return conflicts.filter((conflict): conflict is MemoryConflictMetadata => {
    if (!conflict || typeof conflict !== 'object')
      return false

    const kind = (conflict as MemoryConflictMetadata).kind
    return kind === 'duplicate' || kind === 'conflict'
  })
}

function conflictLabel(kind: MemoryConflictMetadata['kind']) {
  if (kind === 'duplicate')
    return t('settings.pages.memory.conflicts.duplicate')
  if (kind === 'conflict')
    return t('settings.pages.memory.conflicts.conflict')
  return t('settings.pages.memory.conflicts.unknown')
}

function conflictClass(kind: MemoryConflictMetadata['kind']) {
  if (kind === 'conflict')
    return 'border-red-300/70 bg-red-500/10 text-red-700 dark:border-red-700/70 dark:text-red-200'

  return 'border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-700/70 dark:text-amber-200'
}

function reviewPriorityClass(priority: ElectronMemoryReviewPriority) {
  if (priority === 'high')
    return 'border-red-300/70 bg-red-500/10 text-red-700 dark:border-red-700/70 dark:text-red-200'
  if (priority === 'medium')
    return 'border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-700/70 dark:text-amber-200'

  return 'border-neutral-300/70 bg-neutral-500/10 text-neutral-600 dark:border-neutral-700/70 dark:text-neutral-300'
}

function reviewReasonLabel(reason: ElectronMemoryReviewReason) {
  return t(`settings.pages.memory.review-workbench.reasons.${reason}`)
}

function reviewActionLabel(action: ElectronMemoryReviewAction) {
  return t(`settings.pages.memory.review-workbench.actions.${action}`)
}

function exportPreflightSurfaceLabel(surface: ElectronMemoryExportPreflightSurface) {
  return t(`settings.pages.memory.export-preflight.surface.${surface}`)
}

function exportPreflightReasonLabel(reason: ElectronMemoryExportPreflightReason) {
  return t(`settings.pages.memory.export-preflight.reasons.${reason}`)
}

function reviewActionIcon(action: ElectronMemoryReviewAction) {
  if (action === 'approve')
    return 'i-solar:check-circle-bold-duotone'
  if (action === 'reject')
    return 'i-solar:close-circle-bold-duotone'
  if (action === 'archive' || action === 'archive_related')
    return 'i-solar:archive-bold-duotone'
  if (action === 'edit' || action === 'reclassify')
    return 'i-solar:pen-new-square-bold-duotone'

  return 'i-solar:shield-check-bold-duotone'
}

function canApplyReviewAction(entry: ElectronMemoryReviewWorkbenchEntry, action: ElectronMemoryReviewAction) {
  if (action === 'archive_related')
    return entry.relatedItemIds.length > 0

  return action === 'approve'
    || action === 'archive'
    || action === 'edit'
    || action === 'reject'
}

function booleanLabel(value: boolean) {
  return value
    ? t('settings.pages.memory.review-workbench.evidence.yes')
    : t('settings.pages.memory.review-workbench.evidence.no')
}

function metadataStringValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function getSafetyFindings(metadata: Record<string, unknown> | null | undefined): SafetyFindingMetadata[] {
  const safety = metadata?.safety
  if (!safety || typeof safety !== 'object')
    return []

  const findings = (safety as { findings?: unknown }).findings
  return Array.isArray(findings)
    ? findings.filter((finding): finding is SafetyFindingMetadata => Boolean(finding) && typeof finding === 'object')
    : []
}

function reviewEvidenceRows(entry: ElectronMemoryReviewWorkbenchEntry): ReviewEvidenceRow[] {
  const metadata = entry.item.metadata
  const rows: ReviewEvidenceRow[] = []

  if (entry.reasons.includes('safety_risk')) {
    getSafetyFindings(metadata).forEach((finding, index) => {
      const findingIndex = index + 1
      if (typeof finding.kind === 'string' && finding.kind.trim().length > 0) {
        rows.push({
          label: t('settings.pages.memory.review-workbench.evidence.safety-kind', { index: findingIndex }),
          value: finding.kind,
        })
      }
      if (typeof finding.severity === 'string' && finding.severity.trim().length > 0) {
        rows.push({
          label: t('settings.pages.memory.review-workbench.evidence.safety-severity', { index: findingIndex }),
          value: finding.severity,
        })
      }
      if (typeof finding.reason === 'string' && finding.reason.trim().length > 0) {
        rows.push({
          label: t('settings.pages.memory.review-workbench.evidence.safety-reason', { index: findingIndex }),
          value: finding.reason,
        })
      }
    })
  }

  if (entry.reasons.includes('dream_candidate')) {
    const dreamSessionId = metadataStringValue(metadata, 'dreamSessionId')
    if (dreamSessionId) {
      rows.push({
        label: t('settings.pages.memory.review-workbench.evidence.dream-session'),
        value: dreamSessionId,
      })
    }

    rows.push({
      label: t('settings.pages.memory.review-workbench.evidence.requires-review'),
      value: booleanLabel(metadata?.requiresReview === true),
    })

    rows.push({
      label: t('settings.pages.memory.review-workbench.evidence.lora-dataset-candidate'),
      value: booleanLabel(metadata?.loraDatasetCandidate === true),
    })
  }

  if (entry.reasons.includes('persona_candidate')) {
    const personaCandidate = metadata?.personaCandidate as PersonaCandidateMetadata | undefined
    if (typeof personaCandidate?.derivedFrom === 'string' && personaCandidate.derivedFrom.trim().length > 0) {
      rows.push({
        label: t('settings.pages.memory.review-workbench.evidence.persona-derived-from'),
        value: personaCandidate.derivedFrom,
      })
    }
    if (typeof personaCandidate?.reason === 'string' && personaCandidate.reason.trim().length > 0) {
      rows.push({
        label: t('settings.pages.memory.review-workbench.evidence.persona-reason'),
        value: personaCandidate.reason,
      })
    }
  }

  if (entry.reasons.includes('conflict')) {
    getMemoryConflicts(entry.item).forEach((conflict, index) => {
      const conflictIndex = index + 1
      if (conflict.itemId) {
        rows.push({
          label: t('settings.pages.memory.review-workbench.evidence.conflict-related', { index: conflictIndex }),
          value: conflict.itemId,
        })
      }
      if (conflict.reason) {
        rows.push({
          label: t('settings.pages.memory.review-workbench.evidence.conflict-reason', { index: conflictIndex }),
          value: conflict.reason,
        })
      }
      const score = formatConflictScore(conflict.score)
      if (score) {
        rows.push({
          label: t('settings.pages.memory.review-workbench.evidence.conflict-score', { index: conflictIndex }),
          value: score,
        })
      }
    })
  }

  if (entry.reasons.includes('stale_active')) {
    rows.push({
      label: t('settings.pages.memory.review-workbench.evidence.stale-updated'),
      value: formatDate(entry.item.updatedAt),
    })
    rows.push({
      label: t('settings.pages.memory.review-workbench.evidence.stale-last-accessed'),
      value: formatOptionalDate(entry.item.lastAccessedAt),
    })
    rows.push({
      label: t('settings.pages.memory.review-workbench.evidence.stale-access-count'),
      value: String(entry.item.accessCount),
    })
  }

  return rows
}

function evolutionKindLabel(kind: ElectronMemoryEvolutionSuggestionKind) {
  return t(`settings.pages.memory.evolution.kind.${kind}`)
}

function evolutionActionLabel(action: ElectronMemoryEvolutionAction) {
  return t(`settings.pages.memory.evolution.actions.${action}`)
}

function evolutionPriorityClass(priority: ElectronMemoryEvolutionPriority) {
  if (priority === 'high')
    return 'border-rose-200/70 bg-rose-500/10 text-rose-700 dark:border-rose-800/70 dark:text-rose-300'
  if (priority === 'medium')
    return 'border-amber-200/70 bg-amber-500/10 text-amber-700 dark:border-amber-800/70 dark:text-amber-300'

  return 'border-sky-200/70 bg-sky-500/10 text-sky-700 dark:border-sky-800/70 dark:text-sky-300'
}

function formatConflictScore(score: number | undefined) {
  if (typeof score !== 'number')
    return ''

  return `${Math.round(score * 100)}%`
}

function hasConflictKind(item: ElectronMemoryItem, kind: MemoryConflictMetadata['kind']) {
  return getMemoryConflicts(item).some(conflict => conflict.kind === kind)
}

const filteredItems = computed(() => {
  if (reviewFilter.value === 'clean')
    return items.value.filter(item => getMemoryConflicts(item).length === 0)
  if (reviewFilter.value === 'duplicate')
    return items.value.filter(item => hasConflictKind(item, 'duplicate'))
  if (reviewFilter.value === 'conflict')
    return items.value.filter(item => hasConflictKind(item, 'conflict'))
  if (reviewFilter.value === 'needs_review')
    return items.value.filter(item => item.status === 'needs_review')

  return items.value
})

const pendingFilteredItems = computed(() => filteredItems.value.filter(item => item.status === 'needs_review'))
const selectedBackupCount = computed(() => selectedBackupOriginalIds.value.length)
const selectableBackupCount = computed(() => backupPreview.value?.items.filter(item => !item.empty).length ?? 0)
const canSelectAllBackupItems = computed(() => selectableBackupCount.value > 0 && selectedBackupCount.value < selectableBackupCount.value)
const backupPreviewEmptyCount = computed(() => backupPreview.value?.items.filter(item => item.empty).length ?? 0)
const backupPreviewConflictCount = computed(() =>
  backupPreview.value?.items.filter(item => item.conflicts.length > 0).length ?? 0)
const backupPreviewSafetyRiskCount = computed(() =>
  backupPreview.value?.items.filter(item => item.safetyRisk).length ?? 0)
const selectedBackupConflictCount = computed(() => {
  if (!backupPreview.value)
    return 0

  return backupPreview.value.items.filter(item =>
    selectedBackupOriginalIds.value.includes(item.originalId) && item.conflicts.length > 0,
  ).length
})
const selectedBackupSafetyRiskCount = computed(() => {
  if (!backupPreview.value)
    return 0

  return backupPreview.value.items.filter(item =>
    selectedBackupOriginalIds.value.includes(item.originalId) && item.safetyRisk,
  ).length
})
const reviewWorkbenchEntries = computed(() => reviewWorkbench.value?.entries ?? [])
const reviewWorkbenchTotal = computed(() => reviewWorkbench.value?.total ?? 0)
const filteredReviewWorkbenchEntries = computed(() => {
  const filter = reviewWorkbenchFilter.value
  if (filter === 'all')
    return reviewWorkbenchEntries.value
  if (filter === 'high_priority')
    return reviewWorkbenchEntries.value.filter(entry => entry.priority === 'high')

  return reviewWorkbenchEntries.value.filter(entry => entry.reasons.includes(filter))
})
const reviewWorkbenchFilterCounts = computed<Record<ReviewWorkbenchFilter, number>>(() => ({
  all: reviewWorkbenchEntries.value.length,
  high_priority: reviewWorkbenchEntries.value.filter(entry => entry.priority === 'high').length,
  dream_candidate: reviewWorkbenchEntries.value.filter(entry => entry.reasons.includes('dream_candidate')).length,
  persona_candidate: reviewWorkbenchEntries.value.filter(entry => entry.reasons.includes('persona_candidate')).length,
  safety_risk: reviewWorkbenchEntries.value.filter(entry => entry.reasons.includes('safety_risk')).length,
  conflict: reviewWorkbenchEntries.value.filter(entry => entry.reasons.includes('conflict')).length,
  stale_active: reviewWorkbenchEntries.value.filter(entry => entry.reasons.includes('stale_active')).length,
}))
const reviewWorkbenchPriorityCounts = computed<Record<ElectronMemoryReviewPriority, number>>(() => ({
  high: reviewWorkbenchEntries.value.filter(entry => entry.priority === 'high').length,
  medium: reviewWorkbenchEntries.value.filter(entry => entry.priority === 'medium').length,
  low: reviewWorkbenchEntries.value.filter(entry => entry.priority === 'low').length,
}))
const hasHighPriorityReviewItems = computed(() => reviewWorkbenchPriorityCounts.value.high > 0)
const isReviewWorkbenchFiltered = computed(() => reviewWorkbenchFilter.value !== 'all')
const hasHiddenReviewWorkbenchEntries = computed(() =>
  reviewWorkbenchEntries.value.length > 0 && filteredReviewWorkbenchEntries.value.length === 0)
const obsidianInboxExportFiles = computed(() =>
  obsidianVaultExportResult.value?.files.filter(file => file.relativePath.startsWith('00-inbox/')) ?? [])
const obsidianManifestExportFile = computed(() =>
  obsidianVaultExportResult.value?.files.find(file => file.relativePath === '.airi/manifest.json') ?? null)
const obsidianNavigationExportFiles = computed(() =>
  obsidianVaultExportResult.value?.files.filter(file => file.relativePath === 'index.md' || file.relativePath === 'log.md') ?? [])
const exportPreflightAllowedItems = computed(() => exportPreflightResult.value?.items.filter(item => item.allowed) ?? [])
const exportPreflightBlockedItems = computed(() => exportPreflightResult.value?.items.filter(item => !item.allowed) ?? [])
const loraTrainingDryRunFailedChecks = computed(() => loraTrainingDryRunResult.value?.checks.filter(check => check.status === 'fail') ?? [])
const loraTrainingDryRunContractRows = computed(() => {
  const contract = loraTrainingDryRunResult.value?.dryRunContract
  if (!contract)
    return []

  return [
    { label: t('settings.pages.memory.lora-training-dry-run.success-schema'), value: String(contract.successSchemaVersion) },
    { label: t('settings.pages.memory.lora-training-dry-run.success-checks'), value: contract.successChecks.join(', ') },
    { label: t('settings.pages.memory.lora-training-dry-run.error-format'), value: contract.errorFormat },
    { label: t('settings.pages.memory.lora-training-dry-run.validation-error-type'), value: contract.validationErrorType },
    { label: t('settings.pages.memory.lora-training-dry-run.validation-error-exit-code'), value: String(contract.validationErrorExitCode) },
  ]
})
const loraTrainingDryRunArtifactRows = computed(() => {
  const artifacts = loraTrainingDryRunResult.value?.artifacts
  if (!artifacts)
    return []

  return [
    { label: t('settings.pages.memory.lora-training-dry-run.training-runbook-path'), value: artifacts.trainingRunbookPath },
    { label: t('settings.pages.memory.lora-training-dry-run.post-training-checklist-path'), value: artifacts.postTrainingChecklistPath },
  ]
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatOptionalDate(value: string | null | undefined) {
  if (!value)
    return t('settings.pages.memory.status.never-used')

  return formatDate(value)
}

function formatAgentArguments(value: Record<string, unknown> | undefined) {
  if (!value)
    return '{}'

  return JSON.stringify(value, null, 2)
}

function agentContextLabel(fragment: ElectronAgentContextFragment) {
  return fragment.title ? `${fragment.title} (${fragment.id})` : fragment.id
}

function sourceLabel(sourceType: string) {
  const key = `settings.pages.memory.source.${sourceType}`
  if (te(key))
    return t(key)

  return sourceType
}

function approveFilteredPendingMemories() {
  void memoryStore.approveMemories(pendingFilteredItems.value.map(item => item.id))
}

function rejectFilteredPendingMemories() {
  void memoryStore.rejectMemories(pendingFilteredItems.value.map(item => item.id))
}

function archiveFilteredPendingMemories() {
  void memoryStore.archiveMemories(pendingFilteredItems.value.map(item => item.id))
}

function isBackupItemSelected(originalId: string) {
  return selectedBackupOriginalIds.value.includes(originalId)
}

async function handleCreate() {
  if (!canSave.value)
    return

  if (editingId.value) {
    await memoryStore.editMemory({
      id: editingId.value,
      content: content.value,
      summary: summary.value || null,
      tags: tagsInput.value.split(','),
      type: type.value,
      privacy: privacy.value,
      importance: importance.value,
    })
  }
  else {
    await memoryStore.addMemory({
      content: content.value,
      summary: summary.value || null,
      tags: tagsInput.value.split(','),
      type: type.value,
      privacy: privacy.value,
      importance: importance.value,
      sourceType: 'manual',
    })
  }

  editingId.value = null
  content.value = ''
  summary.value = ''
  tagsInput.value = ''
  type.value = 'note'
  privacy.value = 'local'
  importance.value = 3
}

function startMemoryEdit(item: ElectronMemoryItem) {
  editingId.value = item.id
  content.value = item.content
  summary.value = item.summary ?? ''
  tagsInput.value = item.tags.join(', ')
  type.value = item.type
  privacy.value = item.privacy
  importance.value = item.importance
}

function cancelMemoryEdit() {
  editingId.value = null
  content.value = ''
  summary.value = ''
  tagsInput.value = ''
  type.value = 'note'
  privacy.value = 'local'
  importance.value = 3
}

function handleReviewWorkbenchAction(entry: ElectronMemoryReviewWorkbenchEntry, action: ElectronMemoryReviewAction) {
  if (action === 'edit') {
    startMemoryEdit(entry.item)
    return
  }

  if (action === 'archive_related' && entry.relatedItemIds[0]) {
    void memoryStore.keepMemoryAndArchiveRelated({
      candidateId: entry.item.id,
      relatedId: entry.relatedItemIds[0],
    })
    return
  }

  if (action === 'approve' || action === 'archive' || action === 'reject')
    void memoryStore.applyReviewWorkbenchAction({ action, id: entry.item.id })
}

function handleSearch() {
  void memoryStore.refreshItems()
}

function saveChatRuntimeConfig() {
  if (!canSaveChatRuntimeConfig.value)
    return

  void memoryStore.saveAgentChatRuntimeConfig(toAgentChatRuntimeConfigPayload(chatRuntimeFormState.value))
}

function testChatRuntimeConfig() {
  if (!canTestChatRuntimeConfig.value)
    return

  void memoryStore.testAgentChatRuntimeConfig(toAgentChatRuntimeConfigPayload(chatRuntimeFormState.value))
}

async function searchLlmWikiConsole() {
  if (!canSearchLlmWiki.value)
    return

  await memoryStore.searchLlmWiki({
    query: llmWikiQuery.value,
    limit: Number(llmWikiLimit.value) || 3,
  })
}

async function previewRagContextConsole() {
  if (!canPreviewRagContext.value)
    return

  await memoryStore.previewRagContext({
    query: ragPreviewQuery.value,
    target: ragPreviewTarget.value,
    memoryLimit: Number(ragPreviewMemoryLimit.value) || 8,
    llmWikiLimit: Number(ragPreviewLlmWikiLimit.value) || 5,
  })
}

async function previewEvolutionConsole() {
  if (!canPreviewEvolution.value)
    return

  await memoryStore.previewEvolution({
    staleBefore: evolutionStaleBefore.value
      ? new Date(`${evolutionStaleBefore.value}T00:00:00.000Z`).toISOString()
      : undefined,
    includeLowPriority: evolutionIncludeLowPriority.value,
    limit: Number(evolutionLimit.value) || 20,
  })
}

async function previewPublicProfileExport() {
  await memoryStore.previewPublicProfileExport()
}

async function previewLoraDatasetExport() {
  await memoryStore.previewLoraDatasetExport()
}

async function previewComputerUseAction() {
  if (!canPreviewComputerUseAction.value)
    return

  await computerUseStore.previewAction({
    kind: computerUseKind.value,
    target: computerUseTarget.value || undefined,
    command: computerUseCommand.value || undefined,
    cwd: computerUseCwd.value || undefined,
    reason: computerUseReason.value || undefined,
  })
}

async function executeComputerUseAction() {
  if (!canExecuteComputerUseAction.value)
    return

  await computerUseStore.executeCurrentPreview(true)
  void computerUseStore.refreshAuditLogs()
}

async function startLocalDream() {
  if (!canStartLocalDream.value)
    return

  await dreamStore.startLocalDream({
    includeLoraCandidates: dreamIncludeLoraCandidates.value,
    windowHours: Number(dreamWindowHours.value) || 4,
  })
}

async function cancelLocalDream() {
  if (!canCancelLocalDream.value)
    return

  await dreamStore.cancelCurrent()
}

async function importDreamMemoryCandidates() {
  if (!canImportDreamMemoryCandidates.value)
    return

  await dreamStore.importMemoryCandidatesToReview()
  void memoryStore.refresh()
}

async function saveDreamRoutineCandidates() {
  if (!canSaveDreamRoutineCandidates.value)
    return

  await dreamStore.saveRoutineCandidates()
  void routineStore.refreshRoutines()
  void agentStore.refreshTools()
}

async function importDreamLoraCandidates() {
  if (!canImportDreamLoraCandidates.value)
    return

  await dreamStore.importLoraCandidatesToReview()
  void memoryStore.refresh()
}

async function saveDreamSchedule() {
  if (!canSaveDreamSchedule.value)
    return

  await dreamStore.saveSchedule({
    enabled: dreamScheduleEnabled.value,
    includeLoraCandidates: dreamScheduleIncludeLoraCandidates.value,
    intervalHours: Number(dreamScheduleIntervalHours.value) || 6,
    windowHours: Number(dreamScheduleWindowHours.value) || 4,
  })
}

async function triggerScheduledDreamNow() {
  if (!canTriggerScheduledDream.value)
    return

  await dreamStore.triggerScheduledDreamNow()
}

function scrollToReviewWorkbench() {
  reviewWorkbenchFilter.value = 'all'
  void nextTick(() => {
    reviewWorkbenchSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function reviewWorkbenchFilterLabel(option: { label: string, value: ReviewWorkbenchFilter }) {
  return `${option.label} (${reviewWorkbenchFilterCounts.value[option.value]})`
}

function computerUseListLabel(values: string[] | undefined) {
  if (!values || values.length === 0)
    return t('settings.pages.memory.computer-use.none')

  return values.join(', ')
}

async function draftRoutineLibraryItem() {
  if (!canDraftRoutine.value)
    return

  await routineStore.draftRoutine(routineDraftText.value)
}

async function saveRoutineDraft() {
  if (!canSaveRoutineDraft.value)
    return

  await routineStore.saveCurrentDraft()
  void agentStore.refreshTools()
}

async function deleteRoutineItem(slug: string) {
  await routineStore.deleteRoutine(slug)
  void agentStore.refreshTools()
}

async function runAgentConsole() {
  if (!canRunAgent.value)
    return

  const run = await agentStore.runAgent({ input: agentInput.value })
  agentReflection.value = run.response ?? agentInput.value
}

async function cancelAgentRun() {
  const run = await agentStore.cancelCurrentRun()
  if (run?.response)
    agentReflection.value = run.response
}

async function confirmAgentAction(approved: boolean) {
  const run = await agentStore.confirmCurrentAction(approved)
  if (run)
    agentReflection.value = run.response ?? agentReflection.value
}

async function reflectAgentRun() {
  if (!canReflectAgentRun.value)
    return

  const run = await agentStore.reflectCurrentRun(agentReflection.value)
  if (!run)
    return

  agentReflection.value = run.response ?? agentReflection.value
  void memoryStore.refresh()
}

function startCorrection(id: string) {
  correctingId.value = id
  correctionText.value = ''
}

function cancelCorrection() {
  correctingId.value = null
  correctionText.value = ''
}

async function submitCorrection(id: string) {
  const correction = correctionText.value.trim()
  if (!correction)
    return

  await memoryStore.correctMemory({
    id,
    correction,
    reason: 'User corrected memory from settings page',
  })
  cancelCorrection()
}

async function explainUsage(id: string) {
  const result = await memoryStore.explainMemoryUsage({
    id,
    query: query.value || undefined,
  })
  explainingId.value = id
  usageExplanation.value = result.explanation ?? ''
}

void agentStore.refreshTools()
void dreamStore.refreshCurrent()
void dreamStore.refreshSchedule()
</script>

<template>
  <div :class="['flex flex-col gap-5 pb-6']">
    <MemoryStatusCards
      :active="status?.active ?? 0"
      :needs-review="status?.needsReview ?? 0"
      :total="status?.total ?? 0"
    />

    <DreamCyclePanel
      v-model:dream-window-hours="dreamWindowHours"
      v-model:include-lora-candidates="dreamIncludeLoraCandidates"
      v-model:schedule-enabled="dreamScheduleEnabled"
      v-model:schedule-include-lora-candidates="dreamScheduleIncludeLoraCandidates"
      v-model:schedule-interval-hours="dreamScheduleIntervalHours"
      v-model:schedule-window-hours="dreamScheduleWindowHours"
      :can-cancel-local-dream="canCancelLocalDream"
      :can-import-dream-lora-candidates="canImportDreamLoraCandidates"
      :can-import-dream-memory-candidates="canImportDreamMemoryCandidates"
      :can-save-dream-routine-candidates="canSaveDreamRoutineCandidates"
      :can-save-dream-schedule="canSaveDreamSchedule"
      :can-start-local-dream="canStartLocalDream"
      :can-trigger-scheduled-dream="canTriggerScheduledDream"
      :current-session="dreamCurrentSession"
      :format-date="formatDate"
      :last-error="dreamLastError"
      :loading="dreamLoading"
      :lora-dataset-candidates="dreamSanitizedLoraDatasetCandidates"
      :memory-candidates="dreamSanitizedMemoryCandidates"
      :routine-candidates="dreamSanitizedRoutineCandidates"
      :schedule="dreamSchedule"
      @cancel-local-dream="cancelLocalDream"
      @import-dream-lora-candidates="importDreamLoraCandidates"
      @import-dream-memory-candidates="importDreamMemoryCandidates"
      @save-dream-routine-candidates="saveDreamRoutineCandidates"
      @save-dream-schedule="saveDreamSchedule"
      @start-local-dream="startLocalDream"
      @trigger-scheduled-dream-now="triggerScheduledDreamNow"
    />

    <RagPreviewPanel
      v-model:llm-wiki-limit="ragPreviewLlmWikiLimit"
      v-model:memory-limit="ragPreviewMemoryLimit"
      v-model:query="ragPreviewQuery"
      v-model:target="ragPreviewTarget"
      :can-preview="canPreviewRagContext"
      :loading="loading"
      :result="ragContextPreviewResult"
      :target-options="chatRuntimeTargetOptions"
      @preview="previewRagContextConsole"
    />

    <EvolutionPreviewPanel
      v-model:include-low-priority="evolutionIncludeLowPriority"
      v-model:limit="evolutionLimit"
      v-model:stale-before="evolutionStaleBefore"
      :action-label="evolutionActionLabel"
      :can-preview="canPreviewEvolution"
      :kind-label="evolutionKindLabel"
      :loading="loading"
      :priority-class="evolutionPriorityClass"
      :result="evolutionPreviewResult"
      @preview="previewEvolutionConsole"
    />

    <ComputerUsePanel
      v-model:command="computerUseCommand"
      v-model:cwd="computerUseCwd"
      v-model:kind="computerUseKind"
      v-model:reason="computerUseReason"
      v-model:target="computerUseTarget"
      :audit-entries="computerUseAuditEntries"
      :can-execute="canExecuteComputerUseAction"
      :can-preview="canPreviewComputerUseAction"
      :execution="computerUseExecution"
      :format-date="formatDate"
      :kind-options="computerUseKindOptions"
      :last-error="computerUseLastError"
      :list-label="computerUseListLabel"
      :loading="computerUseLoading"
      :needs-command="computerUseNeedsCommand"
      :needs-target="computerUseNeedsTarget"
      :policy="computerUsePolicy"
      :preview="computerUsePreview"
      @execute="executeComputerUseAction"
      @preview="previewComputerUseAction"
      @refresh-audit="computerUseStore.refreshAuditLogs"
      @refresh-policy="computerUseStore.refreshPolicy"
    />

    <AgentChatRuntimePanel
      v-model:api-key="chatRuntimeApiKey"
      v-model:base-u-r-l="chatRuntimeBaseURL"
      v-model:enabled="chatRuntimeEnabled"
      v-model:model="chatRuntimeModel"
      v-model:target="chatRuntimeTarget"
      :can-save="canSaveChatRuntimeConfig"
      :can-test="canTestChatRuntimeConfig"
      :saving="saving"
      :status-label="chatRuntimeStatusLabel"
      :target-options="chatRuntimeTargetOptions"
      :test-ok="agentChatRuntimeTestResult?.ok ?? null"
      :test-status-label="chatRuntimeTestStatusLabel"
      @save="saveChatRuntimeConfig"
      @test="testChatRuntimeConfig"
    />

    <LlmWikiSearchPanel
      v-model:limit="llmWikiLimit"
      v-model:query="llmWikiQuery"
      :can-search="canSearchLlmWiki"
      :empty-message-key="llmWikiSearchEmptyMessageKey"
      :loading="loading"
      :result="llmWikiSearchResult"
      :snippet-count="llmWikiSearchSnippetCount"
      @search="searchLlmWikiConsole"
    />

    <RoutineLibraryPanel
      v-model:draft-text="routineDraftText"
      :can-draft="canDraftRoutine"
      :can-save-draft="canSaveRoutineDraft"
      :current-draft="routineCurrentDraft"
      :format-date="formatDate"
      :items="routineItems"
      :last-error="routineLastError"
      :loading="routineLoading"
      :saving="routineSaving"
      @delete-routine="deleteRoutineItem"
      @draft="draftRoutineLibraryItem"
      @refresh="routineStore.refreshRoutines"
      @save-draft="saveRoutineDraft"
    />

    <AgentConsolePanel
      v-model:input="agentInput"
      v-model:reflection="agentReflection"
      :can-cancel="canCancelAgentRun"
      :can-reflect="canReflectAgentRun"
      :can-run="canRunAgent"
      :context-ids="agentContextIds"
      :current-run="agentCurrentRun"
      :format-arguments="formatAgentArguments"
      :format-context-label="agentContextLabel"
      :last-error="agentLastError"
      :loading="agentLoading"
      :recent-runs="recentAgentRuns"
      :tools="agentTools"
      :used-context-ids="agentUsedContextIds"
      :withheld-context-ids="agentWithheldContextIds"
      @cancel="cancelAgentRun"
      @confirm-action="confirmAgentAction"
      @reflect="reflectAgentRun"
      @refresh-run="agentStore.refreshRun"
      @run="runAgentConsole"
    />

    <MemoryEditorPanel
      v-model:content="content"
      v-model:importance="importance"
      v-model:privacy="privacy"
      v-model:summary="summary"
      v-model:tags-input="tagsInput"
      v-model:type="type"
      :can-save="canSave"
      :is-editing="isEditingMemory"
      :privacy-options="privacyOptions"
      :saving="saving"
      :type-options="typeOptions"
      @cancel="cancelMemoryEdit"
      @save="handleCreate"
    />

    <MemoryListPanel
      v-model:correction-text="correctionText"
      v-model:query="query"
      v-model:review-filter="reviewFilter"
      :conflict-class="conflictClass"
      :conflict-label="conflictLabel"
      :correcting-id="correctingId"
      :explaining-id="explainingId"
      :filtered-items="filteredItems"
      :format-conflict-score="formatConflictScore"
      :format-date="formatDate"
      :format-optional-date="formatOptionalDate"
      :get-memory-conflicts="getMemoryConflicts"
      :items="items"
      :last-error="lastError"
      :loading="loading"
      :pending-filtered-count="pendingFilteredItems.length"
      :review-filter-options="reviewFilterOptions"
      :saving="saving"
      :source-label="sourceLabel"
      :usage-explanation="usageExplanation"
      @approve-filtered="approveFilteredPendingMemories"
      @approve-item="id => memoryStore.editMemory({ id, status: 'active' })"
      @archive-filtered="archiveFilteredPendingMemories"
      @cancel-correction="cancelCorrection"
      @explain="explainUsage"
      @keep-candidate-archive-related="memoryStore.keepMemoryAndArchiveRelated"
      @refresh="memoryStore.refresh"
      @reject-candidate="memoryStore.rejectMemory"
      @reject-filtered="rejectFilteredPendingMemories"
      @remove="memoryStore.removeMemory"
      @search="handleSearch"
      @start-correction="startCorrection"
      @submit-correction="submitCorrection"
    />

    <div ref="reviewWorkbenchSection">
      <MemoryResultsPanel
        v-model:review-workbench-filter="reviewWorkbenchFilter"
        :active-count="status?.active ?? 0"
        :backup-export-memory-count="backupExportMemoryCount"
        :backup-export-result="backupExportResult"
        :backup-import-imported-count="backupImportImportedCount"
        :backup-import-result="backupImportResult"
        :backup-import-skipped-count="backupImportSkippedCount"
        :backup-preview-conflict-count="backupPreviewConflictCount"
        :backup-preview-empty-count="backupPreviewEmptyCount"
        :backup-preview-result="backupPreview"
        :backup-preview-safety-risk-count="backupPreviewSafetyRiskCount"
        :can-apply-review-action="canApplyReviewAction"
        :can-import-selected-backup="!saving && selectedBackupCount > 0"
        :can-select-all-backup-items="canSelectAllBackupItems"
        :chat-import-actions="chatImportActions"
        :chat-records-import-result="chatRecordsImportResult"
        :compact-profile-result="compactProfileResult"
        :conflict-class="conflictClass"
        :conflict-label="conflictLabel"
        :export-preflight-allowed-items="exportPreflightAllowedItems"
        :export-preflight-blocked-items="exportPreflightBlockedItems"
        :export-preflight-result="exportPreflightResult"
        :format-conflict-score="formatConflictScore"
        :format-date="formatDate"
        :format-optional-date="formatOptionalDate"
        :format-preflight-reason="exportPreflightReasonLabel"
        :format-preflight-surface="exportPreflightSurfaceLabel"
        :format-source="sourceLabel"
        :has-hidden-review-workbench-entries="hasHiddenReviewWorkbenchEntries"
        :has-high-priority-review-items="hasHighPriorityReviewItems"
        :is-backup-item-selected="isBackupItemSelected"
        :is-review-workbench-filtered="isReviewWorkbenchFiltered"
        :item-count="items.length"
        :knowledge-base-import-result="knowledgeBaseImportResult"
        :llm-wiki-content-export-files="llmWikiContentExportFiles"
        :llm-wiki-export-memory-count="llmWikiExportMemoryCount"
        :llm-wiki-export-result="llmWikiExportResult"
        :llm-wiki-navigation-export-files="llmWikiNavigationExportFiles"
        :loading="loading"
        :lora-dataset-candidates-export-record-count="loraDatasetCandidatesExportRecordCount"
        :lora-dataset-candidates-export-result="loraDatasetCandidatesExportResult"
        :lora-training-dry-run-artifact-rows="loraTrainingDryRunArtifactRows"
        :lora-training-dry-run-contract-rows="loraTrainingDryRunContractRows"
        :lora-training-dry-run-failed-checks="loraTrainingDryRunFailedChecks"
        :lora-training-dry-run-result="loraTrainingDryRunResult"
        :migration-readiness-items="migrationReadinessItems"
        :migration-readiness-ready-count="migrationReadinessReadyCount"
        :obsidian-inbox-export-files="obsidianInboxExportFiles"
        :obsidian-manifest-export-file="obsidianManifestExportFile"
        :obsidian-navigation-export-files="obsidianNavigationExportFiles"
        :obsidian-vault-export-result="obsidianVaultExportResult"
        :path="status?.path"
        :public-profile-export-memory-count="publicProfileExportMemoryCount"
        :public-profile-export-result="publicProfileExportResult"
        :review-action-icon="reviewActionIcon"
        :review-action-label="reviewActionLabel"
        :review-evidence-rows="reviewEvidenceRows"
        :review-priority-class="reviewPriorityClass"
        :review-reason-label="reviewReasonLabel"
        :review-workbench-entries="reviewWorkbenchEntries"
        :review-workbench-filter-label="reviewWorkbenchFilterLabel"
        :review-workbench-filter-options="reviewWorkbenchFilterOptions"
        :review-workbench-filtered-entries="filteredReviewWorkbenchEntries"
        :review-workbench-priority-counts="reviewWorkbenchPriorityCounts"
        :review-workbench-result="reviewWorkbench"
        :review-workbench-total="reviewWorkbenchTotal"
        :saving="saving"
        :selected-backup-conflict-count="selectedBackupConflictCount"
        :selected-backup-count="selectedBackupCount"
        :selected-backup-safety-risk-count="selectedBackupSafetyRiskCount"
        :total-count="status?.total ?? 0"
        @apply-review-workbench-action="handleReviewWorkbenchAction"
        @clear="memoryStore.clearAll"
        @clear-backup-selection="memoryStore.clearBackupSelection"
        @compact-profile="memoryStore.compactProfile"
        @export-backup="memoryStore.exportBackup"
        @export-llm-wiki="memoryStore.exportLlmWiki"
        @export-lora-dataset-candidates="memoryStore.exportLoraDatasetCandidates"
        @export-obsidian-vault="memoryStore.exportObsidianVault"
        @export-public-profile="memoryStore.exportPublicProfile"
        @import-chat-records="memoryStore.chooseAndImportChatRecords"
        @import-knowledge-base="memoryStore.chooseAndImportMarkdownKnowledgeBase"
        @import-selected-backup="memoryStore.importSelectedBackup"
        @open-review-workbench="scrollToReviewWorkbench"
        @preview-backup="memoryStore.chooseAndPreviewBackup"
        @preview-lora-dataset-candidates="previewLoraDatasetExport"
        @preview-public-profile="previewPublicProfileExport"
        @refresh-review-workbench="memoryStore.refreshReviewWorkbench"
        @select-all-backup-items="memoryStore.selectAllBackupItems"
        @toggle-backup-selection="memoryStore.toggleBackupSelection"
        @validate-lora-training-package="memoryStore.validateLoraTrainingPackage"
      />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.memory.title
  subtitleKey: settings.title
  descriptionKey: settings.pages.memory.description
  icon: i-solar:leaf-bold-duotone
  settingsEntry: true
  order: 5
  stageTransition:
    name: slide
</route>
