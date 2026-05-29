import type { Locale } from '@intlify/core'
import type { ServerOptions } from '@proj-airi/server-runtime/server'
import type { ServerChannelQrPayload } from '@proj-airi/stage-shared/server-channel-qr'
import type {
  ThreeHitTestReadTracePayload,
  ThreeSceneRenderInfoTracePayload,
  VrmDisposeEndTracePayload,
  VrmDisposeStartTracePayload,
  VrmLoadEndTracePayload,
  VrmLoadErrorTracePayload,
  VrmLoadStartTracePayload,
  VrmUpdateFrameTracePayload,
} from '@proj-airi/stage-ui-three/trace'

import { defineEventa, defineInvokeEventa } from '@moeru/eventa'

export const electronStartTrackMousePosition = defineInvokeEventa('eventa:invoke:electron:start-tracking-mouse-position')
export const electronStartDraggingWindow = defineInvokeEventa('eventa:invoke:electron:start-dragging-window')

export const electronOpenMainDevtools = defineInvokeEventa('eventa:invoke:electron:windows:main:devtools:open')
export const electronOpenSettings = defineInvokeEventa<void, { route?: string }>('eventa:invoke:electron:windows:settings:open')
export const electronSettingsNavigate = defineEventa<{ route: string }>('eventa:event:electron:windows:settings:navigate')
export const electronOpenChat = defineInvokeEventa('eventa:invoke:electron:windows:chat:open')
export const electronOpenSettingsDevtools = defineInvokeEventa('eventa:invoke:electron:windows:settings:devtools:open')
export const electronOpenDevtoolsWindow = defineInvokeEventa<void, { route?: string }>('eventa:invoke:electron:windows:devtools:open')

export interface ElectronServerChannelConfig {
  tlsConfig?: ServerOptions['tlsConfig'] | null
  authToken: string
  hostname: string
}
export const electronGetServerChannelConfig = defineInvokeEventa<ElectronServerChannelConfig>('eventa:invoke:electron:server-channel:get-config')
export const electronApplyServerChannelConfig = defineInvokeEventa<ElectronServerChannelConfig, Partial<ElectronServerChannelConfig>>('eventa:invoke:electron:server-channel:apply-config')
export const electronGetServerChannelQrPayload = defineInvokeEventa<ServerChannelQrPayload>('eventa:invoke:electron:server-channel:get-qr-payload')

export type ElectronUpdaterChannel = 'stable' | 'alpha' | 'beta' | 'nightly' | 'canary'

export interface ElectronUpdaterPreferences {
  channel?: ElectronUpdaterChannel
}

export const electronGetUpdaterPreferences = defineInvokeEventa<ElectronUpdaterPreferences>('eventa:invoke:electron:auto-updater:get-preferences')
export const electronSetUpdaterPreferences = defineInvokeEventa<ElectronUpdaterPreferences, ElectronUpdaterPreferences>('eventa:invoke:electron:auto-updater:set-preferences')

export const electronPluginList = defineInvokeEventa<PluginRegistrySnapshot>('eventa:invoke:electron:plugins:list')
export const electronPluginSetEnabled = defineInvokeEventa<PluginRegistrySnapshot, { name: string, enabled: boolean, path?: string }>('eventa:invoke:electron:plugins:set-enabled')
export const electronPluginLoadEnabled = defineInvokeEventa<PluginRegistrySnapshot>('eventa:invoke:electron:plugins:load-enabled')
export const electronPluginLoad = defineInvokeEventa<PluginRegistrySnapshot, { name: string }>('eventa:invoke:electron:plugins:load')
export const electronPluginUnload = defineInvokeEventa<PluginRegistrySnapshot, { name: string }>('eventa:invoke:electron:plugins:unload')
export const electronPluginInspect = defineInvokeEventa<PluginHostDebugSnapshot>('eventa:invoke:electron:plugins:inspect')
export const electronPluginUpdateCapability = defineInvokeEventa<PluginCapabilityState, PluginCapabilityPayload>('eventa:invoke:electron:plugins:capability:update')

export const pluginProtocolListProvidersEventName = 'proj-airi:plugin-sdk:apis:protocol:resources:providers:list-providers'
export const pluginProtocolListProviders = defineInvokeEventa<Array<{ name: string }>>(pluginProtocolListProvidersEventName)

export const captionIsFollowingWindowChanged = defineEventa<boolean>('eventa:event:electron:windows:caption-overlay:is-following-window-changed')
export const captionGetIsFollowingWindow = defineInvokeEventa<boolean>('eventa:invoke:electron:windows:caption-overlay:get-is-following-window')

export type RequestWindowActionDefault = 'confirm' | 'cancel' | 'close'
export interface RequestWindowPayload {
  id?: string
  route: string
  type?: string
  payload?: Record<string, any>
}
export interface RequestWindowPending {
  id: string
  type?: string
  payload?: Record<string, any>
}

// Reference window helpers are generic; callers can alias for clarity
export type NoticeAction = 'confirm' | 'cancel' | 'close'

export function createRequestWindowEventa(namespace: string) {
  const prefix = (name: string) => `eventa:${name}:electron:windows:${namespace}`
  return {
    openWindow: defineInvokeEventa<boolean, RequestWindowPayload>(prefix('invoke:open')),
    windowAction: defineInvokeEventa<void, { id: string, action: RequestWindowActionDefault }>(prefix('invoke:action')),
    pageMounted: defineInvokeEventa<RequestWindowPending | undefined, { id?: string }>(prefix('invoke:page-mounted')),
    pageUnmounted: defineInvokeEventa<void, { id?: string }>(prefix('invoke:page-unmounted')),
  }
}

// Notice window events built from generic factory
export const noticeWindowEventa = createRequestWindowEventa('notice')

// Widgets / Adhoc window events
export interface WidgetsAddPayload {
  id?: string
  componentName: string
  componentProps?: Record<string, any>
  // size presets or explicit spans; renderer decides mapping
  size?: 's' | 'm' | 'l' | { cols?: number, rows?: number }
  // auto-dismiss in ms; if omitted, persistent until closed by user
  ttlMs?: number
}

export interface WidgetSnapshot {
  id: string
  componentName: string
  componentProps: Record<string, any>
  size: 's' | 'm' | 'l' | { cols?: number, rows?: number }
  ttlMs: number
}

export interface PluginManifestSummary {
  name: string
  entrypoints: Record<string, string | undefined>
  path: string
  enabled: boolean
  loaded: boolean
  isNew: boolean
}

export interface PluginRegistrySnapshot {
  root: string
  plugins: PluginManifestSummary[]
}

// TODO: Replace these manually duplicated IPC types with re-exports from
// @proj-airi/plugin-sdk (CapabilityDescriptor) once stage-ui and the shared
// eventa layer can depend on the SDK without introducing unwanted coupling.
export interface PluginCapabilityPayload {
  key: string
  state: 'announced' | 'ready' | 'degraded' | 'withdrawn'
  metadata?: Record<string, unknown>
}

export interface PluginCapabilityState {
  key: string
  state: 'announced' | 'ready' | 'degraded' | 'withdrawn'
  metadata?: Record<string, unknown>
  updatedAt: number
}

export interface PluginHostSessionSummary {
  id: string
  manifestName: string
  phase: string
  runtime: 'electron' | 'node' | 'web'
  moduleId: string
}

export interface PluginHostDebugSnapshot {
  registry: PluginRegistrySnapshot
  sessions: PluginHostSessionSummary[]
  capabilities: PluginCapabilityState[]
  refreshedAt: number
}

export interface ElectronMcpStdioServerConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  enabled?: boolean
}

export interface ElectronMcpStdioConfigFile {
  mcpServers: Record<string, ElectronMcpStdioServerConfig>
}

export interface ElectronMcpStdioApplyResult {
  path: string
  started: Array<{ name: string }>
  failed: Array<{ name: string, error: string }>
  skipped: Array<{ name: string, reason: string }>
}

export interface ElectronMcpStdioServerRuntimeStatus {
  name: string
  state: 'running' | 'stopped' | 'error'
  command: string
  args: string[]
  pid: number | null
  lastError?: string
}

export interface ElectronMcpStdioRuntimeStatus {
  path: string
  servers: ElectronMcpStdioServerRuntimeStatus[]
  updatedAt: number
}

export interface ElectronMcpToolDescriptor {
  serverName: string
  name: string
  toolName: string
  description?: string
  inputSchema: Record<string, unknown>
}

export interface ElectronMcpCallToolPayload {
  name: string
  arguments?: Record<string, unknown>
}

export interface ElectronMcpCallToolResult {
  content?: Array<Record<string, unknown>>
  structuredContent?: Record<string, unknown>
  toolResult?: unknown
  isError?: boolean
}

export const electronMcpOpenConfigFile = defineInvokeEventa<{ path: string }>('eventa:invoke:electron:mcp:open-config-file')
export const electronMcpApplyAndRestart = defineInvokeEventa<ElectronMcpStdioApplyResult>('eventa:invoke:electron:mcp:apply-and-restart')
export const electronMcpGetRuntimeStatus = defineInvokeEventa<ElectronMcpStdioRuntimeStatus>('eventa:invoke:electron:mcp:get-runtime-status')
export const electronMcpListTools = defineInvokeEventa<ElectronMcpToolDescriptor[]>('eventa:invoke:electron:mcp:list-tools')
export const electronMcpCallTool = defineInvokeEventa<ElectronMcpCallToolResult, ElectronMcpCallToolPayload>('eventa:invoke:electron:mcp:call-tool')

export const widgetsOpenWindow = defineInvokeEventa<void, { id?: string }>('eventa:invoke:electron:windows:widgets:open')
export const widgetsAdd = defineInvokeEventa<string | undefined, WidgetsAddPayload>('eventa:invoke:electron:windows:widgets:add')
export const widgetsRemove = defineInvokeEventa<void, { id: string }>('eventa:invoke:electron:windows:widgets:remove')
export const widgetsClear = defineInvokeEventa('eventa:invoke:electron:windows:widgets:clear')
export const widgetsUpdate = defineInvokeEventa<void, { id: string, componentProps?: Record<string, any> }>('eventa:invoke:electron:windows:widgets:update')
export const widgetsFetch = defineInvokeEventa<WidgetSnapshot | void, { id: string }>('eventa:invoke:electron:windows:widgets:fetch')
export const widgetsPrepareWindow = defineInvokeEventa<string | undefined, { id?: string }>('eventa:invoke:electron:windows:widgets:prepare')

export const electronWindowClose = defineInvokeEventa<void>('eventa:invoke:electron:window:close')
export type ElectronWindowLifecycleReason
  = | 'initial'
    | 'snapshot'
    | 'show'
    | 'hide'
    | 'minimize'
    | 'restore'
    | 'focus'
    | 'blur'

export interface ElectronWindowLifecycleState {
  focused: boolean
  minimized: boolean
  reason: ElectronWindowLifecycleReason
  updatedAt: number
  visible: boolean
}

export const electronWindowLifecycleChanged = defineEventa<ElectronWindowLifecycleState>('eventa:event:electron:window:lifecycle-changed')
export const electronGetWindowLifecycleState = defineInvokeEventa<ElectronWindowLifecycleState>('eventa:invoke:electron:window:get-lifecycle-state')
export const electronWindowSetAlwaysOnTop = defineInvokeEventa<void, boolean>('eventa:invoke:electron:window:set-always-on-top')
export const electronAppOpenUserDataFolder = defineInvokeEventa<{ path: string }>('eventa:invoke:electron:app:open-user-data-folder')
export const electronAppQuit = defineInvokeEventa<void>('eventa:invoke:electron:app:quit')

export interface ElectronShowOpenDialogOptions {
  title?: string
  defaultPath?: string
  filters?: Array<{ name: string, extensions: string[] }>
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>
}
export const electronShowOpenDialog = defineInvokeEventa<{ filePaths: string[], canceled: boolean }, ElectronShowOpenDialogOptions>('eventa:invoke:electron:dialog:show-open-dialog')

export type ElectronMemoryType = 'profile' | 'preference' | 'project' | 'event' | 'conversation' | 'habit' | 'knowledge' | 'note'
export type ElectronMemoryPrivacy = 'public' | 'local' | 'sensitive' | 'secret'
export type ElectronMemoryStatus = 'active' | 'needs_review' | 'archived' | 'rejected' | 'expired'
export type ElectronMemorySourceType = 'manual' | 'chat_turn' | 'import_wechat' | 'import_lark' | 'import_qq' | 'knowledge_base' | 'llmwiki'

export interface ElectronMemoryItem {
  id: string
  scope: string
  type: ElectronMemoryType
  content: string
  summary?: string | null
  tags: string[]
  importance: number
  privacy: ElectronMemoryPrivacy
  sourceType: string
  sourceId?: string | null
  status: ElectronMemoryStatus
  createdAt: string
  updatedAt: string
  lastAccessedAt?: string | null
  accessCount: number
  archivedAt?: string | null
  metadata?: Record<string, unknown> | null
}

export interface ElectronMemoryListRequest {
  query?: string
  type?: ElectronMemoryType
  privacy?: ElectronMemoryPrivacy
  status?: ElectronMemoryStatus
  limit?: number
  trackAccess?: boolean
}

export interface ElectronMemoryListResult {
  items: ElectronMemoryItem[]
}

export interface ElectronMemoryCreateRequest {
  scope?: string
  type?: ElectronMemoryType
  content: string
  summary?: string | null
  tags?: string[]
  importance?: number
  privacy?: ElectronMemoryPrivacy
  sourceType?: string
  sourceId?: string | null
  status?: ElectronMemoryStatus
  metadata?: Record<string, unknown> | null
}

export interface ElectronMemoryUpdateRequest {
  id: string
  scope?: string
  type?: ElectronMemoryType
  content?: string
  summary?: string | null
  tags?: string[]
  importance?: number
  privacy?: ElectronMemoryPrivacy
  sourceType?: string
  sourceId?: string | null
  status?: ElectronMemoryStatus
  metadata?: Record<string, unknown> | null
}

export interface ElectronMemoryDeleteRequest {
  id: string
}

export interface ElectronMemoryStatusResult {
  path: string
  total: number
  active: number
  needsReview: number
  archived: number
  updatedAt: string
}

export interface ElectronMemoryClearResult {
  deleted: number
}

export type ElectronMemoryCompactProfileSectionKey = 'profile' | 'preferences' | 'habits' | 'boundaries' | 'projects' | 'knowledge'
export type ElectronMemoryCompactProfileWithheldReason = 'not_active' | 'secret_memory' | 'safety_risk'

export interface ElectronMemoryCompactProfileRequest {
  maxItemsPerSection?: number
}

export interface ElectronMemoryCompactProfileMemory {
  id: string
  content: string
  importance: number
  privacy: ElectronMemoryPrivacy
  tags: string[]
  type: ElectronMemoryType
  updatedAt: string
}

export interface ElectronMemoryCompactProfileSection {
  key: ElectronMemoryCompactProfileSectionKey
  title: string
  items: ElectronMemoryCompactProfileMemory[]
}

export interface ElectronMemoryCompactProfileResult {
  generatedAt: string
  markdown: string
  sections: ElectronMemoryCompactProfileSection[]
  sourceIds: string[]
  withheld: Array<{
    id: string
    reason: ElectronMemoryCompactProfileWithheldReason
  }>
}

export type ElectronMemoryReviewReason = 'persona_candidate' | 'dream_candidate' | 'pending_candidate' | 'conflict' | 'safety_risk' | 'stale_active'
export type ElectronMemoryReviewPriority = 'high' | 'medium' | 'low'
export type ElectronMemoryReviewAction = 'approve' | 'archive' | 'archive_related' | 'edit' | 'keep' | 'reclassify' | 'reject'

export interface ElectronMemoryReviewWorkbenchRequest {
  staleBefore?: string
}

export interface ElectronMemoryReviewWorkbenchEntry {
  id: string
  item: ElectronMemoryItem
  priority: ElectronMemoryReviewPriority
  reasons: ElectronMemoryReviewReason[]
  relatedItemIds: string[]
  recommendedActions: ElectronMemoryReviewAction[]
}

export interface ElectronMemoryReviewWorkbenchResult {
  generatedAt: string
  entries: ElectronMemoryReviewWorkbenchEntry[]
  total: number
}

export interface ElectronMemoryIngestionSource {
  type: ElectronMemorySourceType
  id?: string
  label?: string
}

export interface ElectronMemoryIngestionDefaults {
  privacy?: ElectronMemoryPrivacy
  tags?: string[]
  status?: ElectronMemoryStatus
}

export interface ElectronMemoryIngestionEntry {
  externalId?: string
  content: string
  summary?: string | null
  type?: ElectronMemoryType
  tags?: string[]
  importance?: number
  privacy?: ElectronMemoryPrivacy
  status?: ElectronMemoryStatus
  occurredAt?: string
  metadata?: Record<string, unknown> | null
}

export interface ElectronMemoryIngestRequest {
  source: ElectronMemoryIngestionSource
  defaults?: ElectronMemoryIngestionDefaults
  entries: ElectronMemoryIngestionEntry[]
}

export interface ElectronMemoryIngestResult {
  created: ElectronMemoryItem[]
  skipped: Array<{
    index: number
    reason: 'empty_content'
  }>
}

export interface ElectronMemoryImportKnowledgeBaseRequest {
  rootDir: string
  sourceId?: string
  sourceLabel?: string
  defaults?: ElectronMemoryIngestionDefaults
}

export interface ElectronMemoryImportKnowledgeBaseResult extends ElectronMemoryIngestResult {
  filesScanned: number
  emptyFiles: string[]
  skippedGeneratedFiles: string[]
}

export interface ElectronMemoryImportChatRecordsRequest {
  rootDir: string
  sourceType: Extract<ElectronMemorySourceType, 'import_wechat' | 'import_lark' | 'import_qq'>
  sourceId?: string
  sourceLabel?: string
  defaults?: ElectronMemoryIngestionDefaults
}

export interface ElectronMemoryImportChatRecordsResult extends ElectronMemoryIngestResult {
  filesScanned: number
  messagesImported: number
  emptyFiles: string[]
  unsupportedFiles: string[]
}

export type ElectronMemoryActionRequest
  = | {
    action: 'replace'
    id: string
    content: string
    summary?: string | null
    reason?: string
  }
  | {
    action: 'archive'
    id: string
    reason?: string
  }
  | {
    action: 'reclassify'
    id: string
    privacy?: ElectronMemoryPrivacy
    importance?: number
    tags?: string[]
    reason?: string
  }
  | {
    action: 'correct'
    id: string
    correction: string
    reason?: string
  }
  | {
    action: 'explain_usage'
    id: string
    query?: string
  }

export interface ElectronMemoryActionResult {
  action: ElectronMemoryActionRequest['action']
  item: ElectronMemoryItem
  explanation?: string
}

export interface ElectronMemoryDetectConflictsRequest extends ElectronMemoryCreateRequest {}

export interface ElectronMemoryConflictFinding {
  kind: 'duplicate' | 'conflict'
  item: ElectronMemoryItem
  score: number
  reason: string
}

export interface ElectronMemoryDetectConflictsResult {
  findings: ElectronMemoryConflictFinding[]
}

export interface ElectronMemoryExportLlmWikiRequest {
  outputDir?: string
}

export interface ElectronMemoryExportLlmWikiResult {
  outputDir: string
  files: Array<{
    relativePath: string
    path: string
    count: number
  }>
  exportedAt: string
}

export interface ElectronMemoryExportObsidianVaultRequest {
  outputDir?: string
}

export interface ElectronMemoryExportObsidianVaultResult {
  outputDir: string
  files: Array<{
    relativePath: string
    path: string
    count: number
  }>
  exportedAt: string
}

export interface ElectronMemoryExportPublicProfileRequest {
  outputDir?: string
}

export interface ElectronMemoryExportPublicProfileResult {
  outputDir: string
  files: Array<{
    relativePath: string
    path: string
    count: number
  }>
  exportedAt: string
}

export interface ElectronMemoryExportLoraDatasetCandidatesRequest {
  outputDir?: string
}

export interface ElectronMemoryExportLoraDatasetCandidatesResult {
  outputDir: string
  files: Array<{
    relativePath: string
    path: string
    count: number
  }>
  exportedAt: string
}

export interface ElectronMemoryValidateLoraTrainingPackageRequest {
  outputDir?: string
  configRelativePath?: string
}

export interface ElectronMemoryValidateLoraTrainingPackageCheck {
  id: string
  status: 'fail' | 'pass'
  message: string
}

export interface ElectronMemoryValidateLoraTrainingPackageDryRunContract {
  successSchemaVersion: number
  successChecks: string[]
  errorFormat: string
  validationErrorType: string
  validationErrorExitCode: number
}

export interface ElectronMemoryValidateLoraTrainingPackageArtifacts {
  trainingRunbookPath: string
  postTrainingChecklistPath: string
}

export interface ElectronMemoryValidateLoraTrainingPackageResult {
  schemaVersion: 1
  ok: boolean
  outputDir: string
  configPath: string
  checkedAt: string
  summary: {
    passed: number
    failed: number
  }
  counts: {
    candidates: number
    train: number
    eval: number
    manifestRecords: number
  }
  dryRunContract: ElectronMemoryValidateLoraTrainingPackageDryRunContract | null
  artifacts: ElectronMemoryValidateLoraTrainingPackageArtifacts | null
  checks: ElectronMemoryValidateLoraTrainingPackageCheck[]
}

export type ElectronMemoryExportPreflightSurface = 'public_profile' | 'lora_dataset'

export type ElectronMemoryExportPreflightReason
  = | 'not_active'
    | 'sensitive_or_secret'
    | 'raw_chat_import'
    | 'unsafe_content'
    | 'missing_public_visibility'
    | 'missing_training_visibility'
    | 'demo_only'

export interface ElectronMemoryPreviewExportPreflightRequest {
  surface: ElectronMemoryExportPreflightSurface
}

export interface ElectronMemoryPreviewExportPreflightResult {
  surface: ElectronMemoryExportPreflightSurface
  summary: {
    total: number
    allowed: number
    blocked: number
  }
  items: Array<{
    id: string
    type: ElectronMemoryType
    privacy: ElectronMemoryPrivacy
    sourceType: string
    status: ElectronMemoryStatus
    allowed: boolean
    reasons: ElectronMemoryExportPreflightReason[]
  }>
}

export interface ElectronMemoryExportBackupRequest {
  outputDir?: string
}

export interface ElectronMemoryExportBackupResult {
  outputDir: string
  files: Array<{
    relativePath: string
    path: string
    count: number
  }>
  exportedAt: string
}

export interface ElectronMemoryImportBackupRequest {
  backupFile: string
  selectedOriginalIds?: string[]
}

export interface ElectronMemoryImportBackupResult {
  backupFile: string
  imported: ElectronMemoryItem[]
  skipped: Array<{
    index: number
    reason: 'empty_content' | 'not_selected'
  }>
  importedAt: string
}

export interface ElectronMemoryBackupPreviewConflict {
  kind: 'duplicate' | 'conflict'
  itemId: string
  score: number
  reason: string
}

export interface ElectronMemoryBackupPreviewItem {
  index: number
  originalId: string
  type: ElectronMemoryType
  privacy: ElectronMemoryPrivacy
  status: ElectronMemoryStatus
  sourceType: string
  sourceId?: string | null
  createdAt: string
  summary?: string | null
  contentPreview: string
  tags: string[]
  empty: boolean
  safetyRisk: boolean
  safetyFindings: Array<{
    kind: 'prompt_injection' | 'credential' | 'invisible_unicode' | 'local_path'
    severity: 'medium' | 'high'
    reason: string
  }>
  conflicts: ElectronMemoryBackupPreviewConflict[]
}

export interface ElectronMemoryPreviewBackupRequest {
  backupFile: string
}

export interface ElectronMemoryPreviewBackupResult {
  backupFile: string
  schemaVersion: number
  exportedAt: string
  total: number
  items: ElectronMemoryBackupPreviewItem[]
}

export interface ElectronMemorySearchLlmWikiRequest {
  query: string
  limit?: number
}

export interface ElectronMemorySearchLlmWikiResult {
  inputDir: string
  scannedFiles: number
  snippets: Array<{
    relativePath: string
    path: string
    text: string
    score: number
  }>
}

export interface ElectronMemoryRagContextWithheld {
  id: string
  privacy: ElectronMemoryPrivacy
  reason: 'secret_memory' | 'safety_risk' | 'cloud_target_requires_public_memory'
}

export interface ElectronMemoryPreviewRagContextRequest {
  query: string
  target?: ElectronAgentChatTarget
  memoryLimit?: number
  llmWikiLimit?: number
}

export interface ElectronMemoryPreviewRagContextResult {
  fragments: ElectronAgentContextFragment[]
  withheld: ElectronMemoryRagContextWithheld[]
}

export type ElectronMemoryEvolutionSuggestionKind = 'archive_stale' | 'merge_duplicate' | 'promote_candidate' | 'review_conflict' | 'tighten_privacy'
export type ElectronMemoryEvolutionPriority = 'high' | 'medium' | 'low'
export type ElectronMemoryEvolutionAction = 'approve' | 'archive' | 'edit' | 'keep' | 'merge' | 'reclassify_secret' | 'reject'

export interface ElectronMemoryEvolutionPreviewRequest {
  staleBefore?: string
  includeLowPriority?: boolean
  limit?: number
}

export interface ElectronMemoryEvolutionSuggestion {
  id: string
  kind: ElectronMemoryEvolutionSuggestionKind
  priority: ElectronMemoryEvolutionPriority
  title: string
  reason: string
  memoryIds: string[]
  recommendedActions: ElectronMemoryEvolutionAction[]
  createdAt: string
}

export interface ElectronMemoryEvolutionPreviewResult {
  generatedAt: string
  suggestions: ElectronMemoryEvolutionSuggestion[]
  total: number
}

export const electronMemoryGetStatus = defineInvokeEventa<ElectronMemoryStatusResult>('eventa:invoke:electron:memory:get-status')
export const electronMemoryList = defineInvokeEventa<ElectronMemoryListResult, ElectronMemoryListRequest | undefined>('eventa:invoke:electron:memory:list')
export const electronMemoryCreate = defineInvokeEventa<ElectronMemoryItem, ElectronMemoryCreateRequest>('eventa:invoke:electron:memory:create')
export const electronMemoryUpdate = defineInvokeEventa<ElectronMemoryItem, ElectronMemoryUpdateRequest>('eventa:invoke:electron:memory:update')
export const electronMemoryDelete = defineInvokeEventa<void, ElectronMemoryDeleteRequest>('eventa:invoke:electron:memory:delete')
export const electronMemoryClear = defineInvokeEventa<ElectronMemoryClearResult>('eventa:invoke:electron:memory:clear')
export const electronMemoryCompactProfile = defineInvokeEventa<ElectronMemoryCompactProfileResult, ElectronMemoryCompactProfileRequest | undefined>('eventa:invoke:electron:memory:compact-profile')
export const electronMemoryGetReviewWorkbench = defineInvokeEventa<ElectronMemoryReviewWorkbenchResult, ElectronMemoryReviewWorkbenchRequest | undefined>('eventa:invoke:electron:memory:get-review-workbench')
export const electronMemoryIngest = defineInvokeEventa<ElectronMemoryIngestResult, ElectronMemoryIngestRequest>('eventa:invoke:electron:memory:ingest')
export const electronMemoryImportKnowledgeBase = defineInvokeEventa<ElectronMemoryImportKnowledgeBaseResult, ElectronMemoryImportKnowledgeBaseRequest>('eventa:invoke:electron:memory:import-knowledge-base')
export const electronMemoryImportChatRecords = defineInvokeEventa<ElectronMemoryImportChatRecordsResult, ElectronMemoryImportChatRecordsRequest>('eventa:invoke:electron:memory:import-chat-records')
export const electronMemoryApplyAction = defineInvokeEventa<ElectronMemoryActionResult, ElectronMemoryActionRequest>('eventa:invoke:electron:memory:apply-action')
export const electronMemoryDetectConflicts = defineInvokeEventa<ElectronMemoryDetectConflictsResult, ElectronMemoryDetectConflictsRequest>('eventa:invoke:electron:memory:detect-conflicts')
export const electronMemoryExportLlmWiki = defineInvokeEventa<ElectronMemoryExportLlmWikiResult, ElectronMemoryExportLlmWikiRequest | undefined>('eventa:invoke:electron:memory:export-llmwiki')
export const electronMemoryExportObsidianVault = defineInvokeEventa<ElectronMemoryExportObsidianVaultResult, ElectronMemoryExportObsidianVaultRequest | undefined>('eventa:invoke:electron:memory:export-obsidian-vault')
export const electronMemoryExportPublicProfile = defineInvokeEventa<ElectronMemoryExportPublicProfileResult, ElectronMemoryExportPublicProfileRequest | undefined>('eventa:invoke:electron:memory:export-public-profile')
export const electronMemoryExportLoraDatasetCandidates = defineInvokeEventa<ElectronMemoryExportLoraDatasetCandidatesResult, ElectronMemoryExportLoraDatasetCandidatesRequest | undefined>('eventa:invoke:electron:memory:export-lora-dataset-candidates')
export const electronMemoryValidateLoraTrainingPackage = defineInvokeEventa<ElectronMemoryValidateLoraTrainingPackageResult, ElectronMemoryValidateLoraTrainingPackageRequest | undefined>('eventa:invoke:electron:memory:validate-lora-training-package')
export const electronMemoryPreviewExportPreflight = defineInvokeEventa<ElectronMemoryPreviewExportPreflightResult, ElectronMemoryPreviewExportPreflightRequest>('eventa:invoke:electron:memory:preview-export-preflight')
export const electronMemoryExportBackup = defineInvokeEventa<ElectronMemoryExportBackupResult, ElectronMemoryExportBackupRequest | undefined>('eventa:invoke:electron:memory:export-backup')
export const electronMemoryImportBackup = defineInvokeEventa<ElectronMemoryImportBackupResult, ElectronMemoryImportBackupRequest>('eventa:invoke:electron:memory:import-backup')
export const electronMemoryPreviewBackup = defineInvokeEventa<ElectronMemoryPreviewBackupResult, ElectronMemoryPreviewBackupRequest>('eventa:invoke:electron:memory:preview-backup')
export const electronMemorySearchLlmWiki = defineInvokeEventa<ElectronMemorySearchLlmWikiResult, ElectronMemorySearchLlmWikiRequest>('eventa:invoke:electron:memory:search-llmwiki')
export const electronMemoryPreviewRagContext = defineInvokeEventa<ElectronMemoryPreviewRagContextResult, ElectronMemoryPreviewRagContextRequest>('eventa:invoke:electron:memory:preview-rag-context')
export const electronMemoryPreviewEvolution = defineInvokeEventa<ElectronMemoryEvolutionPreviewResult, ElectronMemoryEvolutionPreviewRequest | undefined>('eventa:invoke:electron:memory:preview-evolution')

export type ElectronDreamStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
export type ElectronDreamRedactionReason = 'private_identity' | 'credential' | 'raw_chat' | 'local_path' | 'secret_memory' | 'sensitive_relationship' | 'unpublished_project'

export interface ElectronDreamStartRequest {
  windowHours?: number
  includeLoraCandidates?: boolean
}

export interface ElectronDreamScheduleConfig {
  enabled: boolean
  intervalHours: number
  windowHours: number
  includeLoraCandidates: boolean
}

export interface ElectronDreamScheduleState {
  active: boolean
  config: ElectronDreamScheduleConfig
  lastError: string | null
  lastRunAt: string | null
  nextRunAt: string | null
}

export interface ElectronDreamMemoryCandidate {
  content: string
  type: ElectronMemoryType
  privacy: ElectronMemoryPrivacy
  importance: number
  tags: string[]
}

export interface ElectronDreamRoutineCandidate {
  title: string
  steps: string[]
}

export interface ElectronDreamLlmWikiDraft {
  title: string
  content: string
}

export interface ElectronDreamLoraDatasetCandidate {
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
  tags: string[]
}

export interface ElectronDreamWithheldContext {
  sourceId: string
  reason: 'secret_memory' | 'safety_risk'
}

export interface ElectronDreamRedaction {
  field: string
  reason: ElectronDreamRedactionReason
}

export interface ElectronSanitizedDreamReport {
  id: string
  generatedAt: string
  summary: string
  memoryCandidates: ElectronDreamMemoryCandidate[]
  routineCandidates: ElectronDreamRoutineCandidate[]
  llmWikiDrafts: ElectronDreamLlmWikiDraft[]
  loraDatasetCandidates: ElectronDreamLoraDatasetCandidate[]
  visibility: 'demo' | 'training_sanitized'
}

export interface ElectronDreamReport {
  id: string
  generatedAt: string
  summary: string
  memoryCandidates: ElectronDreamMemoryCandidate[]
  routineCandidates: ElectronDreamRoutineCandidate[]
  llmWikiDrafts: ElectronDreamLlmWikiDraft[]
  loraDatasetCandidates: ElectronDreamLoraDatasetCandidate[]
  evolutionSuggestionIds: string[]
  withheld: ElectronDreamWithheldContext[]
  rawModelOutput?: string
  sanitizedReport?: ElectronSanitizedDreamReport
  redactionLog?: ElectronDreamRedaction[]
}

export interface ElectronDreamSession {
  id: string
  status: ElectronDreamStatus
  startedAt: string
  completedAt?: string
  windowHours: number
  localModel?: string
  report?: ElectronDreamReport
  errorMessage?: string
}

export const electronDreamStartLocal = defineInvokeEventa<ElectronDreamSession, ElectronDreamStartRequest | undefined>('eventa:invoke:electron:dream:start-local')
export const electronDreamGetCurrent = defineInvokeEventa<ElectronDreamSession | null>('eventa:invoke:electron:dream:get-current')
export const electronDreamCancelCurrent = defineInvokeEventa<ElectronDreamSession | null>('eventa:invoke:electron:dream:cancel-current')
export const electronDreamGetSchedule = defineInvokeEventa<ElectronDreamScheduleState>('eventa:invoke:electron:dream:get-schedule')
export const electronDreamApplySchedule = defineInvokeEventa<ElectronDreamScheduleState, ElectronDreamScheduleConfig>('eventa:invoke:electron:dream:apply-schedule')
export const electronDreamTriggerScheduledNow = defineInvokeEventa<ElectronDreamScheduleState>('eventa:invoke:electron:dream:trigger-scheduled-now')

export type ElectronRoutineStatus = 'draft'

export interface ElectronRoutineDraftRequest {
  text: string
}

export interface ElectronRoutineDraft {
  slug: string
  title: string
  status: ElectronRoutineStatus
  steps: string[]
  content: string
}

export interface ElectronRoutineItem extends ElectronRoutineDraft {
  path: string
  updatedAt: string
}

export interface ElectronRoutineSaveRequest extends ElectronRoutineDraft {}

export interface ElectronRoutineListResult {
  items: ElectronRoutineItem[]
}

export interface ElectronRoutineDeleteRequest {
  slug: string
}

export const electronRoutineDraft = defineInvokeEventa<ElectronRoutineDraft, ElectronRoutineDraftRequest>('eventa:invoke:electron:routine:draft')
export const electronRoutineSave = defineInvokeEventa<ElectronRoutineItem, ElectronRoutineSaveRequest>('eventa:invoke:electron:routine:save')
export const electronRoutineList = defineInvokeEventa<ElectronRoutineListResult>('eventa:invoke:electron:routine:list')
export const electronRoutineDelete = defineInvokeEventa<void, ElectronRoutineDeleteRequest>('eventa:invoke:electron:routine:delete')

export type ElectronComputerUseActionKind
  = | 'observe_screen'
    | 'read_file'
    | 'search_files'
    | 'open_url'
    | 'open_path'
    | 'write_file'
    | 'delete_path'
    | 'move_path'
    | 'run_command'

export type ElectronComputerUseActionRisk = 'low' | 'medium' | 'high'
export type ElectronComputerUseDecision = 'allow' | 'confirm' | 'deny'
export type ElectronComputerUseMode = 'controlled_execution' | 'preview_only'

export interface ElectronComputerUseActionPreviewRequest {
  kind: ElectronComputerUseActionKind
  target?: string
  command?: string
  cwd?: string
  reason?: string
}

export interface ElectronComputerUseActionPreview extends ElectronComputerUseActionPreviewRequest {
  id: string
  risk: ElectronComputerUseActionRisk
  decision: ElectronComputerUseDecision
  reasons: string[]
  requiresConfirmation: boolean
  canExecute: boolean
  createdAt: string
}

export interface ElectronComputerUseExecuteActionRequest {
  id: string
  approved: boolean
}

export interface ElectronComputerUseExecutionResult {
  id: string
  previewId: string
  kind: ElectronComputerUseActionKind
  status: 'completed' | 'failed'
  output?: string
  errorMessage?: string
  executedAt: string
}

export interface ElectronComputerUsePolicySnapshot {
  mode: ElectronComputerUseMode
  allowedReadRoots: string[]
  allowedWriteRoots: string[]
  deniedRoots: string[]
  requireConfirmationRoots: string[]
  highRiskKinds: ElectronComputerUseActionKind[]
}

export interface ElectronComputerUseAuditEntry extends ElectronComputerUseActionPreview {}

export interface ElectronComputerUseAuditListResult {
  items: ElectronComputerUseAuditEntry[]
}

export const electronComputerUseGetPolicy = defineInvokeEventa<ElectronComputerUsePolicySnapshot>('eventa:invoke:electron:computer-use:get-policy')
export const electronComputerUsePreviewAction = defineInvokeEventa<ElectronComputerUseActionPreview, ElectronComputerUseActionPreviewRequest>('eventa:invoke:electron:computer-use:preview-action')
export const electronComputerUseExecuteAction = defineInvokeEventa<ElectronComputerUseExecutionResult, ElectronComputerUseExecuteActionRequest>('eventa:invoke:electron:computer-use:execute-action')
export const electronComputerUseListAuditLogs = defineInvokeEventa<ElectronComputerUseAuditListResult>('eventa:invoke:electron:computer-use:list-audit-logs')

export type ElectronAgentRunStatus = 'running' | 'awaiting_confirmation' | 'completed' | 'cancelled' | 'failed'
export type ElectronAgentRunMode = 'direct_answer' | 'tool_call' | 'confirmation' | 'reflect_and_store'
export type ElectronAgentChatTarget = 'local' | 'cloud'
export type ElectronAgentChatRuntimeProvider = 'openai-compatible'
export type ElectronAgentToolRisk = 'low' | 'high'

export interface ElectronAgentOpenAICompatibleChatRuntimeConfig {
  apiKey?: string
  baseURL: string
  headers?: Record<string, string>
  model: string
}

export interface ElectronAgentChatRuntimeConfig {
  enabled: boolean
  openAICompatible?: ElectronAgentOpenAICompatibleChatRuntimeConfig
  provider: ElectronAgentChatRuntimeProvider
  target?: ElectronAgentChatTarget
}

export interface ElectronAgentChatRuntimeTestResult {
  errorMessage?: string
  ok: boolean
  responsePreview?: string
}

export interface ElectronAgentToolDescriptor {
  name: string
  title: string
  description: string
  risk: ElectronAgentToolRisk
  requiresConfirmation: boolean
}

export interface ElectronAgentContextFragment {
  kind: 'memory' | 'llmwiki'
  id: string
  title?: string
  text: string
  privacy?: ElectronMemoryPrivacy
  score?: number
}

export interface ElectronAgentPendingAction {
  id: string
  toolName: string
  title: string
  risk: ElectronAgentToolRisk
  requiresConfirmation: boolean
  arguments?: Record<string, unknown>
}

export interface ElectronAgentRunRequest {
  input: string
  conversationId?: string
  mode?: ElectronAgentRunMode
  allowHighRiskTools?: boolean
  reflect?: boolean
}

export interface ElectronAgentRun {
  id: string
  input: string
  conversationId?: string
  mode: ElectronAgentRunMode
  status: ElectronAgentRunStatus
  createdAt: string
  updatedAt: string
  context: ElectronAgentContextFragment[]
  response?: string
  usedContextIds?: string[]
  withheldContextIds?: string[]
  pendingAction?: ElectronAgentPendingAction
  memoryId?: string
  error?: string
}

export interface ElectronAgentConfirmActionRequest {
  id: string
  approved: boolean
}

export interface ElectronAgentReflectAndStoreRequest {
  id: string
  content?: string
}

export const electronAgentRun = defineInvokeEventa<ElectronAgentRun, ElectronAgentRunRequest>('eventa:invoke:electron:agent:run')
export const electronAgentGetRun = defineInvokeEventa<ElectronAgentRun | null, { id: string }>('eventa:invoke:electron:agent:get-run')
export const electronAgentCancelRun = defineInvokeEventa<ElectronAgentRun, { id: string }>('eventa:invoke:electron:agent:cancel-run')
export const electronAgentListTools = defineInvokeEventa<ElectronAgentToolDescriptor[]>('eventa:invoke:electron:agent:list-tools')
export const electronAgentConfirmAction = defineInvokeEventa<ElectronAgentRun, ElectronAgentConfirmActionRequest>('eventa:invoke:electron:agent:confirm-action')
export const electronAgentReflectAndStore = defineInvokeEventa<ElectronAgentRun, ElectronAgentReflectAndStoreRequest>('eventa:invoke:electron:agent:reflect-and-store')
export const electronAgentChatRuntimeGetConfig = defineInvokeEventa<ElectronAgentChatRuntimeConfig>('eventa:invoke:electron:agent-chat-runtime:get-config')
export const electronAgentChatRuntimeApplyConfig = defineInvokeEventa<ElectronAgentChatRuntimeConfig, ElectronAgentChatRuntimeConfig>('eventa:invoke:electron:agent-chat-runtime:apply-config')
export const electronAgentChatRuntimeTestConfig = defineInvokeEventa<ElectronAgentChatRuntimeTestResult, ElectronAgentChatRuntimeConfig>('eventa:invoke:electron:agent-chat-runtime:test-config')

export type StageThreeRuntimeTraceEnvelope
  = | { type: 'three-render-info', payload: ThreeSceneRenderInfoTracePayload }
    | { type: 'three-hit-test-read', payload: ThreeHitTestReadTracePayload }
    | { type: 'vrm-update-frame', payload: VrmUpdateFrameTracePayload }
    | { type: 'vrm-load-start', payload: VrmLoadStartTracePayload }
    | { type: 'vrm-load-end', payload: VrmLoadEndTracePayload }
    | { type: 'vrm-load-error', payload: VrmLoadErrorTracePayload }
    | { type: 'vrm-dispose-start', payload: VrmDisposeStartTracePayload }
    | { type: 'vrm-dispose-end', payload: VrmDisposeEndTracePayload }

export interface StageThreeRuntimeTraceForwardedPayload {
  envelope: StageThreeRuntimeTraceEnvelope
  origin: string
}

export interface StageThreeRuntimeTraceRemoteControlPayload {
  origin: string
}

export const stageThreeRuntimeTraceForwardedEvent = defineEventa<StageThreeRuntimeTraceForwardedPayload>('eventa:event:stage-three-runtime-trace:forwarded')
export const stageThreeRuntimeTraceRemoteEnableEvent = defineEventa<StageThreeRuntimeTraceRemoteControlPayload>('eventa:event:stage-three-runtime-trace:remote-enable')
export const stageThreeRuntimeTraceRemoteDisableEvent = defineEventa<StageThreeRuntimeTraceRemoteControlPayload>('eventa:event:stage-three-runtime-trace:remote-disable')

// Internal event from main -> widgets renderer when a widget should render
export const widgetsRenderEvent = defineEventa<WidgetSnapshot>('eventa:event:electron:windows:widgets:render')
export const widgetsRemoveEvent = defineEventa<{ id: string }>('eventa:event:electron:windows:widgets:remove')
export const widgetsClearEvent = defineEventa('eventa:event:electron:windows:widgets:clear')
export const widgetsUpdateEvent = defineEventa<{ id: string, componentProps?: Record<string, any> }>('eventa:event:electron:windows:widgets:update')

// Onboarding window events
export const electronOnboardingClose = defineInvokeEventa('eventa:invoke:electron:windows:onboarding:close')
export const electronOpenOnboarding = defineInvokeEventa('eventa:invoke:electron:windows:onboarding:open')

// Auth — OIDC Authorization Code + PKCE flow via system browser
export interface ElectronAuthTokens {
  accessToken: string
  refreshToken?: string
  idToken?: string
  expiresIn: number
}
export const electronAuthStartLogin = defineInvokeEventa<void>('eventa:invoke:electron:auth:start-login')
export const electronAuthCallback = defineEventa<ElectronAuthTokens>('eventa:event:electron:auth:callback')
export const electronAuthCallbackError = defineEventa<{ error: string }>('eventa:event:electron:auth:callback-error')
export const electronAuthLogout = defineInvokeEventa<void>('eventa:invoke:electron:auth:logout')

export const i18nSetLocale = defineInvokeEventa<void, Locale>('eventa:invoke:electron:i18n:set-locale')
export const i18nGetLocale = defineInvokeEventa<Locale>('eventa:invoke:electron:i18n:get-locale')

export { electron } from '@proj-airi/electron-eventa'
export * from '@proj-airi/electron-eventa/electron-updater'
