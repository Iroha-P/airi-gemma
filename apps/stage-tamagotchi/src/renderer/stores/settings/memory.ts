import type {
  ElectronAgentChatRuntimeConfig,
  ElectronAgentChatRuntimeTestResult,
  ElectronMemoryActionResult,
  ElectronMemoryCompactProfileResult,
  ElectronMemoryCreateRequest,
  ElectronMemoryEvolutionPreviewRequest,
  ElectronMemoryEvolutionPreviewResult,
  ElectronMemoryExportBackupResult,
  ElectronMemoryExportLlmWikiResult,
  ElectronMemoryExportLoraDatasetCandidatesResult,
  ElectronMemoryExportObsidianVaultResult,
  ElectronMemoryExportPreflightSurface,
  ElectronMemoryExportPublicProfileResult,
  ElectronMemoryImportBackupResult,
  ElectronMemoryImportChatRecordsRequest,
  ElectronMemoryImportChatRecordsResult,
  ElectronMemoryImportKnowledgeBaseResult,
  ElectronMemoryItem,
  ElectronMemoryListRequest,
  ElectronMemoryPreviewBackupResult,
  ElectronMemoryPreviewExportPreflightResult,
  ElectronMemoryPreviewRagContextRequest,
  ElectronMemoryPreviewRagContextResult,
  ElectronMemoryReviewAction,
  ElectronMemoryReviewWorkbenchResult,
  ElectronMemorySearchLlmWikiRequest,
  ElectronMemorySearchLlmWikiResult,
  ElectronMemoryStatusResult,
  ElectronMemoryUpdateRequest,
  ElectronMemoryValidateLoraTrainingPackageResult,
} from '../../../shared/eventa'

import { errorMessageFrom } from '@moeru/std'
import { useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import {
  electronAgentChatRuntimeApplyConfig,
  electronAgentChatRuntimeGetConfig,
  electronAgentChatRuntimeTestConfig,
  electronMemoryApplyAction,
  electronMemoryClear,
  electronMemoryCompactProfile,
  electronMemoryCreate,
  electronMemoryDelete,
  electronMemoryExportBackup,
  electronMemoryExportLlmWiki,
  electronMemoryExportLoraDatasetCandidates,
  electronMemoryExportObsidianVault,
  electronMemoryExportPublicProfile,
  electronMemoryGetReviewWorkbench,
  electronMemoryGetStatus,
  electronMemoryImportBackup,
  electronMemoryImportChatRecords,
  electronMemoryImportKnowledgeBase,
  electronMemoryList,
  electronMemoryPreviewBackup,
  electronMemoryPreviewEvolution,
  electronMemoryPreviewExportPreflight,
  electronMemoryPreviewRagContext,
  electronMemorySearchLlmWiki,
  electronMemoryUpdate,
  electronMemoryValidateLoraTrainingPackage,
  electronShowOpenDialog,
} from '../../../shared/eventa'

export const useMemorySettingsStore = defineStore('tamagotchi-memory-settings', () => {
  const items = ref<ElectronMemoryItem[]>([])
  const status = ref<ElectronMemoryStatusResult | null>(null)
  const lastError = ref<string | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const query = ref('')
  const backupPreview = ref<ElectronMemoryPreviewBackupResult | null>(null)
  const backupExportResult = ref<ElectronMemoryExportBackupResult | null>(null)
  const backupImportResult = ref<ElectronMemoryImportBackupResult | null>(null)
  const reviewWorkbench = ref<ElectronMemoryReviewWorkbenchResult | null>(null)
  const selectedBackupOriginalIds = ref<string[]>([])
  const agentChatRuntimeConfig = ref<ElectronAgentChatRuntimeConfig | null>(null)
  const agentChatRuntimeTestResult = ref<ElectronAgentChatRuntimeTestResult | null>(null)
  const compactProfileResult = ref<ElectronMemoryCompactProfileResult | null>(null)
  const llmWikiExportResult = ref<ElectronMemoryExportLlmWikiResult | null>(null)
  const llmWikiSearchResult = ref<ElectronMemorySearchLlmWikiResult | null>(null)
  const lastRagContextPreviewRequest = ref<ElectronMemoryPreviewRagContextRequest | null>(null)
  const ragContextPreviewResult = ref<ElectronMemoryPreviewRagContextResult | null>(null)
  const evolutionPreviewResult = ref<ElectronMemoryEvolutionPreviewResult | null>(null)
  const exportPreflightResult = ref<ElectronMemoryPreviewExportPreflightResult | null>(null)
  const knowledgeBaseImportResult = ref<ElectronMemoryImportKnowledgeBaseResult | null>(null)
  const chatRecordsImportResult = ref<ElectronMemoryImportChatRecordsResult | null>(null)
  const obsidianVaultExportResult = ref<ElectronMemoryExportObsidianVaultResult | null>(null)
  const publicProfileExportResult = ref<ElectronMemoryExportPublicProfileResult | null>(null)
  const loraDatasetCandidatesExportResult = ref<ElectronMemoryExportLoraDatasetCandidatesResult | null>(null)
  const loraTrainingDryRunResult = ref<ElectronMemoryValidateLoraTrainingPackageResult | null>(null)

  const getAgentChatRuntimeConfig = useElectronEventaInvoke(electronAgentChatRuntimeGetConfig)
  const applyAgentChatRuntimeConfig = useElectronEventaInvoke(electronAgentChatRuntimeApplyConfig)
  const testAgentChatRuntime = useElectronEventaInvoke(electronAgentChatRuntimeTestConfig)
  const getStatus = useElectronEventaInvoke(electronMemoryGetStatus)
  const listMemories = useElectronEventaInvoke(electronMemoryList)
  const applyMemoryAction = useElectronEventaInvoke(electronMemoryApplyAction)
  const createMemory = useElectronEventaInvoke(electronMemoryCreate)
  const updateMemory = useElectronEventaInvoke(electronMemoryUpdate)
  const deleteMemory = useElectronEventaInvoke(electronMemoryDelete)
  const clearMemories = useElectronEventaInvoke(electronMemoryClear)
  const compactMemoriesProfile = useElectronEventaInvoke(electronMemoryCompactProfile)
  const exportMemoriesToBackup = useElectronEventaInvoke(electronMemoryExportBackup)
  const exportMemoriesToLoraDatasetCandidates = useElectronEventaInvoke(electronMemoryExportLoraDatasetCandidates)
  const exportMemoriesToLlmWiki = useElectronEventaInvoke(electronMemoryExportLlmWiki)
  const exportMemoriesToObsidianVault = useElectronEventaInvoke(electronMemoryExportObsidianVault)
  const exportMemoriesToPublicProfile = useElectronEventaInvoke(electronMemoryExportPublicProfile)
  const importBackup = useElectronEventaInvoke(electronMemoryImportBackup)
  const importChatRecords = useElectronEventaInvoke(electronMemoryImportChatRecords)
  const importKnowledgeBase = useElectronEventaInvoke(electronMemoryImportKnowledgeBase)
  const previewBackup = useElectronEventaInvoke(electronMemoryPreviewBackup)
  const previewMemoriesExportPreflight = useElectronEventaInvoke(electronMemoryPreviewExportPreflight)
  const previewMemoryEvolution = useElectronEventaInvoke(electronMemoryPreviewEvolution)
  const previewMemoryRagContext = useElectronEventaInvoke(electronMemoryPreviewRagContext)
  const validateMemoriesLoraTrainingPackage = useElectronEventaInvoke(electronMemoryValidateLoraTrainingPackage)
  const searchMemoriesLlmWiki = useElectronEventaInvoke(electronMemorySearchLlmWiki)
  const getReviewWorkbench = useElectronEventaInvoke(electronMemoryGetReviewWorkbench)
  const showOpenDialog = useElectronEventaInvoke(electronShowOpenDialog)

  function setError(error: unknown, fallback: string) {
    const message = errorMessageFrom(error) ?? fallback
    lastError.value = message
    toast.error(message)
  }

  function clearDerivedMemoryPreviews() {
    evolutionPreviewResult.value = null
  }

  async function refreshReviewWorkbenchSnapshot() {
    const result = await getReviewWorkbench(undefined)
    reviewWorkbench.value = result
    return result
  }

  async function refreshCompactProfileSnapshot() {
    const result = await compactMemoriesProfile(undefined)
    compactProfileResult.value = result
    return result
  }

  async function refreshCurrentRagContextPreview() {
    if (!lastRagContextPreviewRequest.value || !ragContextPreviewResult.value)
      return null

    const result = await previewMemoryRagContext(lastRagContextPreviewRequest.value)
    ragContextPreviewResult.value = result
    return result
  }

  async function refreshDerivedAfterReviewAction() {
    await Promise.all([
      refreshStatus(),
      refreshReviewWorkbenchSnapshot(),
      refreshCompactProfileSnapshot(),
      refreshCurrentRagContextPreview(),
    ])
  }

  async function refreshStatus() {
    status.value = await getStatus()
    return status.value
  }

  async function refreshAgentChatRuntimeConfig() {
    agentChatRuntimeConfig.value = await getAgentChatRuntimeConfig()
    return agentChatRuntimeConfig.value
  }

  async function refreshItems(request: ElectronMemoryListRequest = {}) {
    const result = await listMemories({
      ...request,
      query: query.value || request.query,
    })
    items.value = result.items
    return items.value
  }

  async function findSimilarMemories(request: ElectronMemoryListRequest) {
    const result = await listMemories(request)
    return result.items
  }

  async function refresh() {
    loading.value = true
    lastError.value = null

    try {
      await Promise.all([
        refreshAgentChatRuntimeConfig(),
        refreshStatus(),
        refreshItems(),
      ])
    }
    catch (error) {
      setError(error, 'Failed to refresh memories')
    }
    finally {
      loading.value = false
    }
  }

  async function addMemory(payload: ElectronMemoryCreateRequest) {
    saving.value = true
    lastError.value = null

    try {
      const item = await createMemory(payload)
      items.value = [item, ...items.value.filter(existing => existing.id !== item.id)]
      clearDerivedMemoryPreviews()
      await refreshStatus()
      return item
    }
    catch (error) {
      setError(error, 'Failed to save memory')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function saveAgentChatRuntimeConfig(payload: ElectronAgentChatRuntimeConfig): Promise<ElectronAgentChatRuntimeConfig> {
    saving.value = true
    lastError.value = null

    try {
      const config = await applyAgentChatRuntimeConfig(payload)
      agentChatRuntimeConfig.value = config
      toast.success('Agent chat runtime config saved')
      return config
    }
    catch (error) {
      setError(error, 'Failed to save agent chat runtime config')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function testAgentChatRuntimeConfig(payload: ElectronAgentChatRuntimeConfig): Promise<ElectronAgentChatRuntimeTestResult> {
    saving.value = true
    lastError.value = null
    agentChatRuntimeTestResult.value = null

    try {
      const result = await testAgentChatRuntime(payload)
      agentChatRuntimeTestResult.value = result

      if (result.ok)
        toast.success('Agent chat runtime connection test passed')
      else
        toast.error(result.errorMessage ?? 'Agent chat runtime connection test failed')

      return result
    }
    catch (error) {
      setError(error, 'Failed to test agent chat runtime config')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function editMemory(payload: ElectronMemoryUpdateRequest) {
    saving.value = true
    lastError.value = null

    try {
      const item = await updateMemory(payload)
      items.value = items.value.map(existing => existing.id === item.id ? item : existing)
      clearDerivedMemoryPreviews()
      await refreshStatus()
      return item
    }
    catch (error) {
      setError(error, 'Failed to update memory')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function updateMemoriesStatus(ids: string[], status: ElectronMemoryItem['status'], successMessage: (count: number) => string) {
    const uniqueIds = [...new Set(ids)].filter(Boolean)
    if (uniqueIds.length === 0)
      return []

    saving.value = true
    lastError.value = null

    try {
      const updated = await Promise.all(
        uniqueIds.map(id => updateMemory({ id, status })),
      )
      const updatedById = new Map(updated.map(item => [item.id, item]))
      items.value = items.value.map(item => updatedById.get(item.id) ?? item)
      clearDerivedMemoryPreviews()
      await refreshStatus()
      toast.success(successMessage(updated.length))
      return updated
    }
    catch (error) {
      setError(error, `Failed to update memories to ${status}`)
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function approveMemories(ids: string[]) {
    return updateMemoriesStatus(ids, 'active', count => `Approved ${count} memories`)
  }

  async function rejectMemories(ids: string[]) {
    return updateMemoriesStatus(ids, 'rejected', count => `Rejected ${count} memories`)
  }

  async function archiveMemories(ids: string[]) {
    return updateMemoriesStatus(ids, 'archived', count => `Archived ${count} memories`)
  }

  async function applyReviewWorkbenchAction(payload: { action: ElectronMemoryReviewAction, id: string }) {
    const statusByAction: Partial<Record<ElectronMemoryReviewAction, ElectronMemoryItem['status']>> = {
      approve: 'active',
      archive: 'archived',
      reject: 'rejected',
    }
    const status = statusByAction[payload.action]
    if (!status)
      throw new Error(`Review action must be handled in the UI: ${payload.action}`)

    saving.value = true
    lastError.value = null

    try {
      const item = await updateMemory({ id: payload.id, status })
      items.value = items.value.map(existing => existing.id === item.id ? item : existing)
      clearDerivedMemoryPreviews()
      await refreshDerivedAfterReviewAction()
      toast.success(`Applied review action: ${payload.action}`)
      return item
    }
    catch (error) {
      setError(error, `Failed to apply review action: ${payload.action}`)
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function rejectMemory(id: string) {
    saving.value = true
    lastError.value = null

    try {
      const item = await updateMemory({ id, status: 'rejected' })
      items.value = items.value.map(existing => existing.id === item.id ? item : existing)
      clearDerivedMemoryPreviews()
      await refreshStatus()
      toast.success('Rejected memory')
      return item
    }
    catch (error) {
      setError(error, 'Failed to reject memory')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function keepMemoryAndArchiveRelated(payload: { candidateId: string, relatedId: string }) {
    saving.value = true
    lastError.value = null

    try {
      const [related, candidate] = await Promise.all([
        updateMemory({ id: payload.relatedId, status: 'archived' }),
        updateMemory({ id: payload.candidateId, status: 'active' }),
      ])
      const updatedById = new Map([
        [related.id, related],
        [candidate.id, candidate],
      ])
      items.value = items.value.map(item => updatedById.get(item.id) ?? item)
      clearDerivedMemoryPreviews()
      await refreshStatus()
      toast.success('Kept candidate memory and archived related memory')
      return { candidate, related }
    }
    catch (error) {
      setError(error, 'Failed to resolve memory conflict')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function removeMemory(id: string) {
    saving.value = true
    lastError.value = null

    try {
      await deleteMemory({ id })
      items.value = items.value.filter(item => item.id !== id)
      clearDerivedMemoryPreviews()
      await refreshStatus()
    }
    catch (error) {
      setError(error, 'Failed to delete memory')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function correctMemory(payload: { id: string, correction: string, reason?: string }): Promise<ElectronMemoryActionResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await applyMemoryAction({
        action: 'correct',
        id: payload.id,
        correction: payload.correction,
        reason: payload.reason,
      })
      items.value = [
        result.item,
        ...items.value.filter(item => item.id !== payload.id && item.id !== result.item.id),
      ]
      clearDerivedMemoryPreviews()
      await refreshStatus()
      toast.success('Memory corrected')
      return result
    }
    catch (error) {
      setError(error, 'Failed to correct memory')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function explainMemoryUsage(payload: { id: string, query?: string }): Promise<ElectronMemoryActionResult> {
    saving.value = true
    lastError.value = null

    try {
      return await applyMemoryAction({
        action: 'explain_usage',
        id: payload.id,
        query: payload.query,
      })
    }
    catch (error) {
      setError(error, 'Failed to explain memory usage')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function clearAll() {
    saving.value = true
    lastError.value = null

    try {
      const result = await clearMemories()
      items.value = []
      clearDerivedMemoryPreviews()
      await refreshStatus()
      return result
    }
    catch (error) {
      setError(error, 'Failed to clear memories')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function compactProfile(): Promise<ElectronMemoryCompactProfileResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await compactMemoriesProfile(undefined)
      compactProfileResult.value = result
      toast.success(`Compacted profile from ${result.sourceIds.length} memories`)
      return result
    }
    catch (error) {
      setError(error, 'Failed to compact profile')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function refreshReviewWorkbench(): Promise<ElectronMemoryReviewWorkbenchResult> {
    loading.value = true
    lastError.value = null

    try {
      return await refreshReviewWorkbenchSnapshot()
    }
    catch (error) {
      setError(error, 'Failed to refresh memory review workbench')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function exportLlmWiki(): Promise<ElectronMemoryExportLlmWikiResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await exportMemoriesToLlmWiki(undefined)
      llmWikiExportResult.value = result
      toast.success(`Exported LLMWiki to ${result.outputDir}`)
      return result
    }
    catch (error) {
      setError(error, 'Failed to export LLMWiki')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function searchLlmWiki(payload: ElectronMemorySearchLlmWikiRequest): Promise<ElectronMemorySearchLlmWikiResult> {
    const query = payload.query.trim()
    if (!query) {
      const error = new Error('LLMWiki search query cannot be empty')
      setError(error, 'LLMWiki search query cannot be empty')
      throw error
    }

    loading.value = true
    lastError.value = null

    try {
      const result = await searchMemoriesLlmWiki({
        ...payload,
        query,
      })
      llmWikiSearchResult.value = result
      return result
    }
    catch (error) {
      setError(error, 'Failed to search LLMWiki')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function previewRagContext(payload: ElectronMemoryPreviewRagContextRequest): Promise<ElectronMemoryPreviewRagContextResult> {
    const query = payload.query.trim()
    if (!query) {
      const error = new Error('RAG preview query cannot be empty')
      setError(error, 'RAG preview query cannot be empty')
      throw error
    }

    loading.value = true
    lastError.value = null

    try {
      const result = await previewMemoryRagContext({
        ...payload,
        query,
      })
      lastRagContextPreviewRequest.value = {
        ...payload,
        query,
      }
      ragContextPreviewResult.value = result
      return result
    }
    catch (error) {
      setError(error, 'Failed to preview RAG context')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function previewEvolution(payload: ElectronMemoryEvolutionPreviewRequest = {}): Promise<ElectronMemoryEvolutionPreviewResult> {
    loading.value = true
    lastError.value = null

    try {
      const result = await previewMemoryEvolution(payload)
      evolutionPreviewResult.value = result
      return result
    }
    catch (error) {
      setError(error, 'Failed to preview memory evolution')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function previewExportPreflight(surface: ElectronMemoryExportPreflightSurface): Promise<ElectronMemoryPreviewExportPreflightResult> {
    loading.value = true
    lastError.value = null

    try {
      const result = await previewMemoriesExportPreflight({ surface })
      exportPreflightResult.value = result
      return result
    }
    catch (error) {
      setError(error, 'Failed to preview memory export preflight')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  function previewPublicProfileExport(): Promise<ElectronMemoryPreviewExportPreflightResult> {
    return previewExportPreflight('public_profile')
  }

  function previewLoraDatasetExport(): Promise<ElectronMemoryPreviewExportPreflightResult> {
    return previewExportPreflight('lora_dataset')
  }

  async function exportObsidianVault(): Promise<ElectronMemoryExportObsidianVaultResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await exportMemoriesToObsidianVault(undefined)
      obsidianVaultExportResult.value = result
      toast.success(`Exported Obsidian vault to ${result.outputDir}`)
      return result
    }
    catch (error) {
      setError(error, 'Failed to export Obsidian vault')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function exportBackup(): Promise<ElectronMemoryExportBackupResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await exportMemoriesToBackup(undefined)
      backupExportResult.value = result
      toast.success(`Exported memory backup to ${result.outputDir}`)
      return result
    }
    catch (error) {
      setError(error, 'Failed to export memory backup')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function previewBackupFile(backupFile: string): Promise<ElectronMemoryPreviewBackupResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await previewBackup({ backupFile })
      backupPreview.value = result
      selectedBackupOriginalIds.value = result.items
        .filter(item => !item.empty)
        .map(item => item.originalId)
      toast.success(`Previewed ${result.total} memories from backup`)
      return result
    }
    catch (error) {
      setError(error, 'Failed to preview memory backup')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function chooseAndPreviewBackup(): Promise<ElectronMemoryPreviewBackupResult | null> {
    const result = await showOpenDialog({
      title: 'Select AIRI memory backup JSON',
      filters: [{ name: 'AIRI Memory Backup', extensions: ['json'] }],
      properties: ['openFile'],
    })

    const backupFile = result.filePaths[0]
    if (result.canceled || !backupFile)
      return null

    return previewBackupFile(backupFile)
  }

  function toggleBackupSelection(originalId: string, selected: boolean) {
    const current = new Set(selectedBackupOriginalIds.value)
    if (selected)
      current.add(originalId)
    else
      current.delete(originalId)

    selectedBackupOriginalIds.value = [...current]
  }

  function selectAllBackupItems() {
    selectedBackupOriginalIds.value = backupPreview.value?.items
      .filter(item => !item.empty)
      .map(item => item.originalId) ?? []
  }

  function clearBackupSelection() {
    selectedBackupOriginalIds.value = []
  }

  async function importBackupFile(backupFile: string, selectedOriginalIds?: string[]): Promise<ElectronMemoryImportBackupResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await importBackup({ backupFile, selectedOriginalIds })
      backupImportResult.value = result
      toast.success(`Imported ${result.imported.length} memories from backup`)
      clearDerivedMemoryPreviews()
      await refresh()
      await refreshReviewWorkbenchSnapshot()
      return result
    }
    catch (error) {
      setError(error, 'Failed to import memory backup')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function chooseAndImportBackup(): Promise<ElectronMemoryImportBackupResult | null> {
    const result = await showOpenDialog({
      title: 'Select AIRI memory backup JSON',
      filters: [{ name: 'AIRI Memory Backup', extensions: ['json'] }],
      properties: ['openFile'],
    })

    const backupFile = result.filePaths[0]
    if (result.canceled || !backupFile)
      return null

    return importBackupFile(backupFile)
  }

  async function importSelectedBackup(): Promise<ElectronMemoryImportBackupResult | null> {
    if (!backupPreview.value)
      return null

    const result = await importBackupFile(backupPreview.value.backupFile, selectedBackupOriginalIds.value)
    backupPreview.value = null
    selectedBackupOriginalIds.value = []
    return result
  }

  async function exportPublicProfile(): Promise<ElectronMemoryExportPublicProfileResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await exportMemoriesToPublicProfile(undefined)
      publicProfileExportResult.value = result
      toast.success(`Exported public profile to ${result.outputDir}`)
      return result
    }
    catch (error) {
      setError(error, 'Failed to export public profile')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function exportLoraDatasetCandidates(): Promise<ElectronMemoryExportLoraDatasetCandidatesResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await exportMemoriesToLoraDatasetCandidates(undefined)
      loraDatasetCandidatesExportResult.value = result
      toast.success(`Exported LoRA dataset candidates to ${result.outputDir}`)
      return result
    }
    catch (error) {
      setError(error, 'Failed to export LoRA dataset candidates')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function validateLoraTrainingPackage(): Promise<ElectronMemoryValidateLoraTrainingPackageResult> {
    loading.value = true
    lastError.value = null

    try {
      const result = await validateMemoriesLoraTrainingPackage(undefined)
      loraTrainingDryRunResult.value = result

      if (result.ok)
        toast.success(`LoRA training package dry-run passed: ${result.summary.passed} checks`)
      else
        toast.error(`LoRA training package dry-run failed: ${result.summary.failed} checks`)

      return result
    }
    catch (error) {
      setError(error, 'Failed to validate LoRA training package')
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function importMarkdownKnowledgeBase(rootDir: string): Promise<ElectronMemoryImportKnowledgeBaseResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await importKnowledgeBase({
        rootDir,
        defaults: {
          privacy: 'local',
          tags: ['knowledge-base'],
        },
      })
      knowledgeBaseImportResult.value = result
      toast.success(`Imported ${result.created.length} memories from ${result.filesScanned} Markdown files`)
      clearDerivedMemoryPreviews()
      await refresh()
      await refreshReviewWorkbenchSnapshot()
      return result
    }
    catch (error) {
      setError(error, 'Failed to import knowledge base')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function chooseAndImportMarkdownKnowledgeBase(): Promise<ElectronMemoryImportKnowledgeBaseResult | null> {
    const result = await showOpenDialog({
      title: 'Select Markdown or Obsidian knowledge base folder',
      properties: ['openDirectory'],
    })

    const rootDir = result.filePaths[0]
    if (result.canceled || !rootDir)
      return null

    return importMarkdownKnowledgeBase(rootDir)
  }

  function chatImportConfig(sourceType: ElectronMemoryImportChatRecordsRequest['sourceType']) {
    if (sourceType === 'import_lark') {
      return {
        title: 'Select Feishu chat record export folder',
        sourceLabel: 'Feishu chat archive',
        tag: 'feishu',
      }
    }
    if (sourceType === 'import_qq') {
      return {
        title: 'Select QQ chat record export folder',
        sourceLabel: 'QQ chat archive',
        tag: 'qq',
      }
    }
    return {
      title: 'Select WeChat chat record export folder',
      sourceLabel: 'WeChat chat archive',
      tag: 'wechat',
    }
  }

  async function importChatRecordArchive(payload: ElectronMemoryImportChatRecordsRequest): Promise<ElectronMemoryImportChatRecordsResult> {
    saving.value = true
    lastError.value = null

    try {
      const result = await importChatRecords(payload)
      chatRecordsImportResult.value = result
      toast.success(`Imported ${result.messagesImported} messages from ${result.filesScanned} chat record files`)
      clearDerivedMemoryPreviews()
      await refresh()
      await refreshReviewWorkbenchSnapshot()
      return result
    }
    catch (error) {
      setError(error, 'Failed to import chat records')
      throw error
    }
    finally {
      saving.value = false
    }
  }

  async function chooseAndImportChatRecords(sourceType: ElectronMemoryImportChatRecordsRequest['sourceType']): Promise<ElectronMemoryImportChatRecordsResult | null> {
    const config = chatImportConfig(sourceType)
    const result = await showOpenDialog({
      title: config.title,
      properties: ['openDirectory'],
    })

    const rootDir = result.filePaths[0]
    if (result.canceled || !rootDir)
      return null

    return importChatRecordArchive({
      rootDir,
      sourceType,
      sourceLabel: config.sourceLabel,
      defaults: {
        privacy: 'sensitive',
        tags: [config.tag],
      },
    })
  }

  void refresh()

  return {
    items,
    status,
    lastError,
    loading,
    saving,
    query,
    backupPreview,
    backupExportResult,
    backupImportResult,
    reviewWorkbench,
    selectedBackupOriginalIds,
    agentChatRuntimeConfig,
    agentChatRuntimeTestResult,
    compactProfileResult,
    llmWikiExportResult,
    llmWikiSearchResult,
    ragContextPreviewResult,
    evolutionPreviewResult,
    exportPreflightResult,
    knowledgeBaseImportResult,
    chatRecordsImportResult,
    obsidianVaultExportResult,
    publicProfileExportResult,
    loraDatasetCandidatesExportResult,
    loraTrainingDryRunResult,
    refresh,
    refreshItems,
    refreshStatus,
    refreshAgentChatRuntimeConfig,
    saveAgentChatRuntimeConfig,
    testAgentChatRuntimeConfig,
    findSimilarMemories,
    addMemory,
    editMemory,
    approveMemories,
    rejectMemories,
    archiveMemories,
    applyReviewWorkbenchAction,
    rejectMemory,
    keepMemoryAndArchiveRelated,
    correctMemory,
    explainMemoryUsage,
    removeMemory,
    clearAll,
    compactProfile,
    refreshReviewWorkbench,
    exportBackup,
    exportLlmWiki,
    searchLlmWiki,
    previewRagContext,
    previewEvolution,
    previewExportPreflight,
    previewPublicProfileExport,
    previewLoraDatasetExport,
    exportObsidianVault,
    exportPublicProfile,
    exportLoraDatasetCandidates,
    validateLoraTrainingPackage,
    previewBackupFile,
    chooseAndPreviewBackup,
    toggleBackupSelection,
    selectAllBackupItems,
    clearBackupSelection,
    importBackupFile,
    chooseAndImportBackup,
    importSelectedBackup,
    importMarkdownKnowledgeBase,
    chooseAndImportMarkdownKnowledgeBase,
    importChatRecordArchive,
    chooseAndImportChatRecords,
  }
})
