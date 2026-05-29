import type { ElectronAgentChatRuntimeConfig, ElectronAgentChatRuntimeTestResult, ElectronMemoryEvolutionPreviewResult, ElectronMemoryItem, ElectronMemoryPreviewExportPreflightResult, ElectronMemoryPreviewRagContextResult, ElectronMemorySearchLlmWikiResult, ElectronMemoryValidateLoraTrainingPackageResult } from '../../../shared/eventa'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMocks = vi.hoisted(() => {
  const memoryItem: ElectronMemoryItem = {
    id: 'memory-1',
    scope: 'user',
    type: 'note',
    content: 'Remember the AIRI memory plan.',
    summary: null,
    tags: ['airi'],
    importance: 3,
    privacy: 'local',
    sourceType: 'manual',
    sourceId: null,
    status: 'active',
    createdAt: '2026-05-07T00:00:00.000Z',
    updatedAt: '2026-05-07T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
  }
  const agentChatRuntimeConfig: ElectronAgentChatRuntimeConfig = {
    enabled: false,
    provider: 'openai-compatible',
  }
  const agentChatRuntimeTestResult: ElectronAgentChatRuntimeTestResult = {
    ok: true,
    responsePreview: 'pong',
  }
  const searchLlmWikiResult: ElectronMemorySearchLlmWikiResult = {
    inputDir: 'F:/airi-brain/70-llmwiki',
    scannedFiles: 1,
    snippets: [{
      relativePath: 'profile.md',
      path: 'F:/airi-brain/70-llmwiki/profile.md',
      text: '用户正在准备大厂算法岗面试。',
      score: 3,
    }],
  }
  const previewRagContextResult: ElectronMemoryPreviewRagContextResult = {
    fragments: [{
      kind: 'memory',
      id: 'memory-1',
      title: 'note',
      text: 'Remember the AIRI memory plan.',
      privacy: 'local',
      score: 3,
    }],
    withheld: [{
      id: 'secret-1',
      privacy: 'secret',
      reason: 'secret_memory',
    }],
  }
  const evolutionPreviewResult: ElectronMemoryEvolutionPreviewResult = {
    generatedAt: '2026-05-13T00:00:00.000Z',
    total: 1,
    suggestions: [{
      id: 'evolve-memory-1-promote-candidate',
      kind: 'promote_candidate',
      priority: 'medium',
      title: 'Review candidate memory',
      reason: 'This candidate is waiting for user review.',
      memoryIds: ['memory-1'],
      recommendedActions: ['approve', 'reject', 'edit'],
      createdAt: '2026-05-07T00:00:00.000Z',
    }],
  }
  const exportPreflightResult: ElectronMemoryPreviewExportPreflightResult = {
    surface: 'lora_dataset',
    summary: {
      total: 1,
      allowed: 1,
      blocked: 0,
    },
    items: [{
      id: 'memory-1',
      type: 'note',
      privacy: 'local',
      sourceType: 'manual',
      status: 'active',
      allowed: true,
      reasons: [],
    }],
  }
  const loraTrainingDryRunResult: ElectronMemoryValidateLoraTrainingPackageResult = {
    schemaVersion: 1,
    ok: true,
    outputDir: 'F:/airi-brain/90-lora-dataset-candidates',
    configPath: 'F:/airi-brain/90-lora-dataset-candidates/lora-training-config.json',
    checkedAt: '2026-05-07T00:00:00.000Z',
    summary: {
      passed: 17,
      failed: 0,
    },
    counts: {
      candidates: 5,
      train: 4,
      eval: 1,
      manifestRecords: 5,
    },
    dryRunContract: {
      successSchemaVersion: 1,
      successChecks: ['privacy_flags', 'dataset_counts', 'chat_record_safety', 'training_runbook_exists', 'post_training_checklist_exists'],
      errorFormat: 'json',
      validationErrorType: 'validation_error',
      validationErrorExitCode: 2,
    },
    artifacts: {
      trainingRunbookPath: 'lora-training-runbook.zh-CN.md',
      postTrainingChecklistPath: 'lora-post-training-checklist.zh-CN.md',
    },
    checks: [{
      id: 'train_count_matches_config',
      status: 'pass',
      message: 'Train JSONL count matches training config.',
    }],
  }

  return {
    memoryItem,
    agentChatRuntimeConfig,
    agentChatRuntimeTestResult,
    searchLlmWikiResult,
    previewRagContextResult,
    evolutionPreviewResult,
    exportPreflightResult,
    loraTrainingDryRunResult,
    getAgentChatRuntimeConfig: vi.fn(async () => agentChatRuntimeConfig),
    applyAgentChatRuntimeConfig: vi.fn(async (payload: ElectronAgentChatRuntimeConfig) => payload),
    testAgentChatRuntimeConfig: vi.fn(async () => agentChatRuntimeTestResult),
    getStatus: vi.fn(async () => ({
      path: ':memory:',
      total: 1,
      active: 1,
      needsReview: 0,
      archived: 0,
      updatedAt: '2026-05-07T00:00:00.000Z',
    })),
    list: vi.fn(async () => ({ items: [] })),
    applyAction: vi.fn(async () => ({
      action: 'correct',
      item: {
        ...memoryItem,
        id: 'memory-correction',
        content: 'Corrected memory',
        tags: ['correction'],
        sourceType: 'memory_action',
        sourceId: 'memory-1',
      },
      explanation: 'This memory was used because it matches the current request.',
    })),
    create: vi.fn(async () => memoryItem),
    update: vi.fn(async (payload: { content?: string, id: string, status?: ElectronMemoryItem['status'] }) => ({
      ...memoryItem,
      id: payload.id,
      content: payload.content ?? memoryItem.content,
      status: payload.status ?? memoryItem.status,
    })),
    delete: vi.fn(async () => {}),
    clear: vi.fn(async () => ({ deleted: 1 })),
    compactProfile: vi.fn(async () => ({
      generatedAt: '2026-05-07T00:00:00.000Z',
      markdown: '# AIRI Compact Profile',
      sections: [{
        key: 'profile',
        title: 'Profile',
        items: [{
          id: 'memory-1',
          content: 'Remember the AIRI memory plan.',
          importance: 3,
          privacy: 'local',
          tags: ['airi'],
          type: 'note',
          updatedAt: '2026-05-07T00:00:00.000Z',
        }],
      }],
      sourceIds: ['memory-1'],
      withheld: [],
    })),
    getReviewWorkbench: vi.fn(async () => ({
      generatedAt: '2026-05-07T00:00:00.000Z',
      entries: [{
        id: 'memory-1',
        item: memoryItem,
        priority: 'medium',
        reasons: ['pending_candidate'],
        relatedItemIds: [],
        recommendedActions: ['approve', 'reject', 'edit'],
      }],
      total: 1,
    })),
    exportLlmWiki: vi.fn(async () => ({
      outputDir: 'F:/airi-brain/70-llmwiki',
      files: [{ relativePath: 'profile.md', path: 'F:/airi-brain/70-llmwiki/profile.md', count: 1 }],
      exportedAt: '2026-05-07T00:00:00.000Z',
    })),
    searchLlmWiki: vi.fn(async () => searchLlmWikiResult),
    previewRagContext: vi.fn(async () => previewRagContextResult),
    previewEvolution: vi.fn(async () => evolutionPreviewResult),
    previewExportPreflight: vi.fn(async () => exportPreflightResult),
    validateLoraTrainingPackage: vi.fn(async () => loraTrainingDryRunResult),
    exportObsidianVault: vi.fn(async () => ({
      outputDir: 'F:/airi-brain',
      files: [
        { relativePath: 'AIRI-Brain.md', path: 'F:/airi-brain/AIRI-Brain.md', count: 1 },
        { relativePath: '00-inbox/dream-candidates.md', path: 'F:/airi-brain/00-inbox/dream-candidates.md', count: 2 },
        { relativePath: '00-inbox/persona-candidates.md', path: 'F:/airi-brain/00-inbox/persona-candidates.md', count: 1 },
      ],
      exportedAt: '2026-05-07T00:00:00.000Z',
    })),
    exportPublicProfile: vi.fn(async () => ({
      outputDir: 'F:/airi-brain/80-public-profile',
      files: [{ relativePath: 'public-profile.md', path: 'F:/airi-brain/80-public-profile/public-profile.md', count: 1 }],
      exportedAt: '2026-05-07T00:00:00.000Z',
    })),
    exportLoraDatasetCandidates: vi.fn(async () => ({
      outputDir: 'F:/airi-brain/90-lora-dataset-candidates',
      files: [{ relativePath: 'lora-dataset-candidates.jsonl', path: 'F:/airi-brain/90-lora-dataset-candidates/lora-dataset-candidates.jsonl', count: 1 }],
      exportedAt: '2026-05-07T00:00:00.000Z',
    })),
    exportBackup: vi.fn(async () => ({
      outputDir: 'F:/airi-brain/95-backups',
      files: [{ relativePath: 'airi-memory-backup.json', path: 'F:/airi-brain/95-backups/airi-memory-backup.json', count: 1 }],
      exportedAt: '2026-05-07T00:00:00.000Z',
    })),
    importBackup: vi.fn(async () => ({
      backupFile: 'F:/airi-brain/95-backups/airi-memory-backup.json',
      imported: [memoryItem],
      skipped: [],
      importedAt: '2026-05-07T00:00:00.000Z',
    })),
    previewBackup: vi.fn(async () => ({
      backupFile: 'F:/airi-brain/95-backups/airi-memory-backup.json',
      schemaVersion: 1,
      exportedAt: '2026-05-07T00:00:00.000Z',
      total: 2,
      items: [
        {
          index: 0,
          originalId: 'memory-1',
          type: 'note',
          privacy: 'local',
          status: 'active',
          sourceType: 'manual',
          sourceId: null,
          createdAt: '2026-05-07T00:00:00.000Z',
          summary: null,
          contentPreview: 'Remember the AIRI memory plan.',
          tags: ['airi'],
          empty: false,
          safetyRisk: false,
          safetyFindings: [],
          conflicts: [],
        },
        {
          index: 1,
          originalId: 'empty-memory',
          type: 'note',
          privacy: 'local',
          status: 'active',
          sourceType: 'manual',
          sourceId: null,
          createdAt: '2026-05-07T00:00:00.000Z',
          summary: null,
          contentPreview: '',
          tags: [],
          empty: true,
          safetyRisk: false,
          safetyFindings: [],
          conflicts: [],
        },
      ],
    })),
    importKnowledgeBase: vi.fn(async () => ({
      created: [memoryItem],
      skipped: [],
      filesScanned: 1,
      emptyFiles: [],
      skippedGeneratedFiles: [],
    })),
    importChatRecords: vi.fn(async () => ({
      created: [memoryItem],
      skipped: [],
      filesScanned: 1,
      messagesImported: 1,
      emptyFiles: [],
      unsupportedFiles: [],
    })),
    showOpenDialog: vi.fn(async () => ({
      canceled: false,
      filePaths: ['F:/airi-brain'],
    })),
  }
})

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaInvoke: (event: { receiveEvent?: { id?: string } }) => {
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent-chat-runtime:get-config-receive')
      return invokeMocks.getAgentChatRuntimeConfig
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent-chat-runtime:apply-config-receive')
      return invokeMocks.applyAgentChatRuntimeConfig
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:agent-chat-runtime:test-config-receive')
      return invokeMocks.testAgentChatRuntimeConfig
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:get-status-receive')
      return invokeMocks.getStatus
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:list-receive')
      return invokeMocks.list
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:apply-action-receive')
      return invokeMocks.applyAction
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:create-receive')
      return invokeMocks.create
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:update-receive')
      return invokeMocks.update
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:delete-receive')
      return invokeMocks.delete
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:clear-receive')
      return invokeMocks.clear
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:compact-profile-receive')
      return invokeMocks.compactProfile
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:get-review-workbench-receive')
      return invokeMocks.getReviewWorkbench
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:export-llmwiki-receive')
      return invokeMocks.exportLlmWiki
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:search-llmwiki-receive')
      return invokeMocks.searchLlmWiki
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:preview-rag-context-receive')
      return invokeMocks.previewRagContext
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:preview-evolution-receive')
      return invokeMocks.previewEvolution
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:preview-export-preflight-receive')
      return invokeMocks.previewExportPreflight
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:export-obsidian-vault-receive')
      return invokeMocks.exportObsidianVault
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:export-public-profile-receive')
      return invokeMocks.exportPublicProfile
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:export-lora-dataset-candidates-receive')
      return invokeMocks.exportLoraDatasetCandidates
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:validate-lora-training-package-receive')
      return invokeMocks.validateLoraTrainingPackage
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:export-backup-receive')
      return invokeMocks.exportBackup
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:import-backup-receive')
      return invokeMocks.importBackup
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:preview-backup-receive')
      return invokeMocks.previewBackup
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:import-knowledge-base-receive')
      return invokeMocks.importKnowledgeBase
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:memory:import-chat-records-receive')
      return invokeMocks.importChatRecords
    if (event?.receiveEvent?.id === 'eventa:invoke:electron:dialog:show-open-dialog-receive')
      return invokeMocks.showOpenDialog

    throw new Error(`Unexpected eventa invoke: ${JSON.stringify(event)}`)
  },
}))

const toastError = vi.fn()
const toastSuccess = vi.fn()

vi.mock('vue-sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

describe('useMemorySettingsStore', async () => {
  const { useMemorySettingsStore } = await import('./memory')

  beforeEach(() => {
    setActivePinia(createPinia())
    invokeMocks.getAgentChatRuntimeConfig.mockClear()
    invokeMocks.applyAgentChatRuntimeConfig.mockClear()
    invokeMocks.testAgentChatRuntimeConfig.mockClear()
    invokeMocks.getStatus.mockClear()
    invokeMocks.list.mockClear()
    invokeMocks.applyAction.mockClear()
    invokeMocks.create.mockClear()
    invokeMocks.update.mockClear()
    invokeMocks.delete.mockClear()
    invokeMocks.clear.mockClear()
    invokeMocks.compactProfile.mockClear()
    invokeMocks.getReviewWorkbench.mockClear()
    invokeMocks.exportLlmWiki.mockClear()
    invokeMocks.searchLlmWiki.mockClear()
    invokeMocks.previewRagContext.mockClear()
    invokeMocks.previewEvolution.mockClear()
    invokeMocks.previewExportPreflight.mockClear()
    invokeMocks.exportObsidianVault.mockClear()
    invokeMocks.exportPublicProfile.mockClear()
    invokeMocks.exportLoraDatasetCandidates.mockClear()
    invokeMocks.exportBackup.mockClear()
    invokeMocks.importBackup.mockClear()
    invokeMocks.previewBackup.mockClear()
    invokeMocks.importKnowledgeBase.mockClear()
    invokeMocks.importChatRecords.mockClear()
    invokeMocks.showOpenDialog.mockClear()
    toastError.mockClear()
    toastSuccess.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refreshes, creates, updates, deletes, and clears memories through eventa invokes', async () => {
    const store = useMemorySettingsStore()

    await vi.waitFor(() => {
      expect(invokeMocks.getAgentChatRuntimeConfig).toHaveBeenCalled()
      expect(invokeMocks.getStatus).toHaveBeenCalled()
      expect(invokeMocks.list).toHaveBeenCalled()
    })
    expect(store.agentChatRuntimeConfig).toEqual(invokeMocks.agentChatRuntimeConfig)
    expect(invokeMocks.list).toHaveBeenLastCalledWith({ query: undefined })

    const savedConfig = await store.saveAgentChatRuntimeConfig({
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible',
      target: 'local',
    })
    expect(invokeMocks.applyAgentChatRuntimeConfig).toHaveBeenCalledWith({
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible',
      target: 'local',
    })
    expect(store.agentChatRuntimeConfig).toEqual(savedConfig)
    expect(toastSuccess).toHaveBeenCalledWith('Agent chat runtime config saved')

    const testResult = await store.testAgentChatRuntimeConfig({
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible',
      target: 'local',
    })
    expect(invokeMocks.testAgentChatRuntimeConfig).toHaveBeenCalledWith({
      enabled: true,
      openAICompatible: {
        baseURL: 'http://localhost:11434/v1',
        model: 'gemma3:4b',
      },
      provider: 'openai-compatible',
      target: 'local',
    })
    expect(testResult).toEqual(invokeMocks.agentChatRuntimeTestResult)
    expect(store.agentChatRuntimeTestResult).toEqual(invokeMocks.agentChatRuntimeTestResult)
    expect(toastSuccess).toHaveBeenCalledWith('Agent chat runtime connection test passed')

    store.query = 'AIRI'
    await store.refreshItems()
    expect(invokeMocks.list).toHaveBeenLastCalledWith({ query: 'AIRI' })

    await store.addMemory({ content: 'Remember the AIRI memory plan.', tags: ['airi'] })
    expect(invokeMocks.create).toHaveBeenCalledWith({ content: 'Remember the AIRI memory plan.', tags: ['airi'] })
    expect(store.items).toEqual([invokeMocks.memoryItem])

    await store.editMemory({ id: 'memory-1', content: 'updated' })
    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'memory-1', content: 'updated' })
    expect(store.items[0].content).toBe('updated')

    await store.correctMemory({ id: 'memory-1', correction: 'Corrected memory', reason: 'User correction' })
    expect(invokeMocks.applyAction).toHaveBeenCalledWith({
      action: 'correct',
      id: 'memory-1',
      correction: 'Corrected memory',
      reason: 'User correction',
    })
    expect(store.items[0].id).toBe('memory-correction')
    expect(toastSuccess).toHaveBeenCalledWith('Memory corrected')

    await store.explainMemoryUsage({ id: 'memory-correction', query: 'AIRI memory' })
    expect(invokeMocks.applyAction).toHaveBeenCalledWith({
      action: 'explain_usage',
      id: 'memory-correction',
      query: 'AIRI memory',
    })

    await store.findSimilarMemories({ query: 'AIRI memory', status: 'active', limit: 10 })
    expect(invokeMocks.list).toHaveBeenCalledWith({ query: 'AIRI memory', status: 'active', limit: 10 })

    await store.removeMemory('memory-correction')
    expect(invokeMocks.delete).toHaveBeenCalledWith({ id: 'memory-correction' })
    expect(store.items).toEqual([])

    await store.clearAll()
    expect(invokeMocks.clear).toHaveBeenCalled()

    const compactProfile = await store.compactProfile()
    expect(invokeMocks.compactProfile).toHaveBeenCalledWith(undefined)
    expect(compactProfile.sourceIds).toEqual(['memory-1'])
    expect(toastSuccess).toHaveBeenCalledWith('Compacted profile from 1 memories')

    const reviewWorkbench = await store.refreshReviewWorkbench()
    expect(invokeMocks.getReviewWorkbench).toHaveBeenCalledWith(undefined)
    expect(reviewWorkbench.total).toBe(1)
    expect(store.reviewWorkbench?.entries[0]?.id).toBe('memory-1')

    const exported = await store.exportLlmWiki()
    expect(invokeMocks.exportLlmWiki).toHaveBeenCalled()
    expect(exported.outputDir).toBe('F:/airi-brain/70-llmwiki')
    expect(store.llmWikiExportResult).toEqual(exported)
    expect(toastSuccess).toHaveBeenCalledWith('Exported LLMWiki to F:/airi-brain/70-llmwiki')

    const searchResult = await store.searchLlmWiki({ query: '算法岗面试', limit: 5 })
    expect(invokeMocks.searchLlmWiki).toHaveBeenCalledWith({ query: '算法岗面试', limit: 5 })
    expect(searchResult).toEqual(invokeMocks.searchLlmWikiResult)
    expect(store.llmWikiSearchResult).toEqual(invokeMocks.searchLlmWikiResult)

    await expect(store.searchLlmWiki({ query: '   ' })).rejects.toThrow('LLMWiki search query cannot be empty')
    expect(toastError).toHaveBeenCalledWith('LLMWiki search query cannot be empty')

    const ragPreview = await store.previewRagContext({
      query: 'AIRI memory',
      target: 'local',
      memoryLimit: 4,
      llmWikiLimit: 2,
    })
    expect(invokeMocks.previewRagContext).toHaveBeenCalledWith({
      query: 'AIRI memory',
      target: 'local',
      memoryLimit: 4,
      llmWikiLimit: 2,
    })
    expect(ragPreview).toEqual(invokeMocks.previewRagContextResult)
    expect(store.ragContextPreviewResult).toEqual(invokeMocks.previewRagContextResult)

    await expect(store.previewRagContext({ query: '   ', target: 'cloud' })).rejects.toThrow('RAG preview query cannot be empty')
    expect(toastError).toHaveBeenCalledWith('RAG preview query cannot be empty')

    const evolutionPreview = await store.previewEvolution({
      staleBefore: '2026-02-01T00:00:00.000Z',
      includeLowPriority: false,
      limit: 10,
    })
    expect(invokeMocks.previewEvolution).toHaveBeenCalledWith({
      staleBefore: '2026-02-01T00:00:00.000Z',
      includeLowPriority: false,
      limit: 10,
    })
    expect(evolutionPreview).toEqual(invokeMocks.evolutionPreviewResult)
    expect(store.evolutionPreviewResult).toEqual(invokeMocks.evolutionPreviewResult)

    const exportPreflight = await store.previewExportPreflight('lora_dataset')
    expect(invokeMocks.previewExportPreflight).toHaveBeenCalledWith({
      surface: 'lora_dataset',
    })
    expect(exportPreflight).toEqual(invokeMocks.exportPreflightResult)
    expect(store.exportPreflightResult).toEqual(invokeMocks.exportPreflightResult)

    invokeMocks.previewExportPreflight.mockClear()
    await store.previewPublicProfileExport()
    expect(invokeMocks.previewExportPreflight).toHaveBeenCalledWith({
      surface: 'public_profile',
    })

    invokeMocks.previewExportPreflight.mockClear()
    await store.previewLoraDatasetExport()
    expect(invokeMocks.previewExportPreflight).toHaveBeenCalledWith({
      surface: 'lora_dataset',
    })

    const obsidianVault = await store.exportObsidianVault()
    expect(invokeMocks.exportObsidianVault).toHaveBeenCalled()
    expect(obsidianVault.outputDir).toBe('F:/airi-brain')
    expect(store.obsidianVaultExportResult?.files.map(file => file.relativePath)).toEqual([
      'AIRI-Brain.md',
      '00-inbox/dream-candidates.md',
      '00-inbox/persona-candidates.md',
    ])
    expect(toastSuccess).toHaveBeenCalledWith('Exported Obsidian vault to F:/airi-brain')

    const knowledgeBaseImport = await store.importMarkdownKnowledgeBase('F:/airi-brain')
    expect(knowledgeBaseImport.skippedGeneratedFiles).toEqual([])
    expect(store.knowledgeBaseImportResult?.skippedGeneratedFiles).toEqual([])

    const publicProfile = await store.exportPublicProfile()
    expect(invokeMocks.exportPublicProfile).toHaveBeenCalled()
    expect(publicProfile.outputDir).toBe('F:/airi-brain/80-public-profile')
    expect(store.publicProfileExportResult?.files.map(file => file.relativePath)).toEqual(['public-profile.md'])
    expect(toastSuccess).toHaveBeenCalledWith('Exported public profile to F:/airi-brain/80-public-profile')

    const loraCandidates = await store.exportLoraDatasetCandidates()
    expect(invokeMocks.exportLoraDatasetCandidates).toHaveBeenCalled()
    expect(loraCandidates.outputDir).toBe('F:/airi-brain/90-lora-dataset-candidates')
    expect(store.loraDatasetCandidatesExportResult?.files.map(file => file.relativePath)).toEqual(['lora-dataset-candidates.jsonl'])
    expect(toastSuccess).toHaveBeenCalledWith('Exported LoRA dataset candidates to F:/airi-brain/90-lora-dataset-candidates')

    const loraDryRun = await store.validateLoraTrainingPackage()
    expect(invokeMocks.validateLoraTrainingPackage).toHaveBeenCalled()
    expect(loraDryRun).toEqual(invokeMocks.loraTrainingDryRunResult)
    expect(store.loraTrainingDryRunResult).toEqual(invokeMocks.loraTrainingDryRunResult)
    expect(loraDryRun.dryRunContract?.successChecks).toContain('post_training_checklist_exists')
    expect(loraDryRun.artifacts).toEqual({
      trainingRunbookPath: 'lora-training-runbook.zh-CN.md',
      postTrainingChecklistPath: 'lora-post-training-checklist.zh-CN.md',
    })
    expect(toastSuccess).toHaveBeenCalledWith('LoRA training package dry-run passed: 17 checks')

    const backup = await store.exportBackup()
    expect(invokeMocks.exportBackup).toHaveBeenCalled()
    expect(backup.outputDir).toBe('F:/airi-brain/95-backups')
    expect(store.backupExportResult?.files.map(file => file.relativePath)).toEqual(['airi-memory-backup.json'])
    expect(toastSuccess).toHaveBeenCalledWith('Exported memory backup to F:/airi-brain/95-backups')

    const backupImported = await store.chooseAndImportBackup()
    expect(invokeMocks.showOpenDialog).toHaveBeenCalledWith({
      title: 'Select AIRI memory backup JSON',
      filters: [{ name: 'AIRI Memory Backup', extensions: ['json'] }],
      properties: ['openFile'],
    })
    expect(invokeMocks.importBackup).toHaveBeenCalledWith({
      backupFile: 'F:/airi-brain',
    })
    expect(backupImported?.imported).toEqual([invokeMocks.memoryItem])
    expect(store.backupImportResult?.imported).toEqual([invokeMocks.memoryItem])
    expect(invokeMocks.getReviewWorkbench).toHaveBeenLastCalledWith(undefined)
    expect(store.reviewWorkbench?.entries[0]?.id).toBe('memory-1')

    const backupPreview = await store.chooseAndPreviewBackup()
    expect(invokeMocks.previewBackup).toHaveBeenCalledWith({
      backupFile: 'F:/airi-brain',
    })
    expect(backupPreview?.total).toBe(2)
    expect(store.selectedBackupOriginalIds).toEqual(['memory-1'])

    store.toggleBackupSelection('memory-1', false)
    expect(store.selectedBackupOriginalIds).toEqual([])
    store.toggleBackupSelection('memory-1', true)
    expect(store.selectedBackupOriginalIds).toEqual(['memory-1'])
    store.clearBackupSelection()
    expect(store.selectedBackupOriginalIds).toEqual([])
    store.selectAllBackupItems()
    expect(store.selectedBackupOriginalIds).toEqual(['memory-1'])

    await store.importSelectedBackup()
    expect(invokeMocks.importBackup).toHaveBeenLastCalledWith({
      backupFile: 'F:/airi-brain/95-backups/airi-memory-backup.json',
      selectedOriginalIds: ['memory-1'],
    })
    expect(store.backupImportResult?.backupFile).toBe('F:/airi-brain/95-backups/airi-memory-backup.json')
    expect(invokeMocks.getReviewWorkbench).toHaveBeenLastCalledWith(undefined)
    expect(store.reviewWorkbench?.entries[0]?.id).toBe('memory-1')
    expect(store.backupPreview).toBeNull()

    const imported = await store.chooseAndImportMarkdownKnowledgeBase()
    expect(invokeMocks.showOpenDialog).toHaveBeenCalledWith({
      title: 'Select Markdown or Obsidian knowledge base folder',
      properties: ['openDirectory'],
    })
    expect(invokeMocks.importKnowledgeBase).toHaveBeenCalledWith({
      rootDir: 'F:/airi-brain',
      defaults: {
        privacy: 'local',
        tags: ['knowledge-base'],
      },
    })
    expect(imported?.filesScanned).toBe(1)
    expect(invokeMocks.getReviewWorkbench).toHaveBeenLastCalledWith(undefined)
    expect(store.reviewWorkbench?.entries[0]?.id).toBe('memory-1')

    const chatImported = await store.chooseAndImportChatRecords('import_wechat')
    expect(invokeMocks.showOpenDialog).toHaveBeenCalledWith({
      title: 'Select WeChat chat record export folder',
      properties: ['openDirectory'],
    })
    expect(invokeMocks.importChatRecords).toHaveBeenCalledWith({
      rootDir: 'F:/airi-brain',
      sourceType: 'import_wechat',
      sourceLabel: 'WeChat chat archive',
      defaults: {
        privacy: 'sensitive',
        tags: ['wechat'],
      },
    })
    expect(chatImported?.messagesImported).toBe(1)
    expect(store.chatRecordsImportResult?.messagesImported).toBe(1)
    expect(invokeMocks.getReviewWorkbench).toHaveBeenLastCalledWith(undefined)
    expect(store.reviewWorkbench?.entries[0]?.id).toBe('memory-1')
  })

  it('approves unique pending memories in a batch', async () => {
    const store = useMemorySettingsStore()

    await vi.waitFor(() => {
      expect(invokeMocks.getStatus).toHaveBeenCalled()
    })

    store.items = [
      { ...invokeMocks.memoryItem, id: 'pending-1', status: 'needs_review' },
      { ...invokeMocks.memoryItem, id: 'pending-2', status: 'needs_review' },
    ]

    const approved = await store.approveMemories(['pending-1', 'pending-2', 'pending-1'])

    expect(invokeMocks.update).toHaveBeenCalledTimes(2)
    expect(invokeMocks.update).toHaveBeenNthCalledWith(1, { id: 'pending-1', status: 'active' })
    expect(invokeMocks.update).toHaveBeenNthCalledWith(2, { id: 'pending-2', status: 'active' })
    expect(approved).toHaveLength(2)
    expect(store.items.map(item => item.status)).toEqual(['active', 'active'])
    expect(toastSuccess).toHaveBeenCalledWith('Approved 2 memories')
  })

  it('rejects and archives unique pending memories in batches', async () => {
    const store = useMemorySettingsStore()

    await vi.waitFor(() => {
      expect(invokeMocks.getStatus).toHaveBeenCalled()
    })

    store.items = [
      { ...invokeMocks.memoryItem, id: 'pending-1', status: 'needs_review' },
      { ...invokeMocks.memoryItem, id: 'pending-2', status: 'needs_review' },
      { ...invokeMocks.memoryItem, id: 'active-1', status: 'active' },
    ]

    const rejected = await store.rejectMemories(['pending-1', 'pending-2', 'pending-1'])

    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'pending-1', status: 'rejected' })
    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'pending-2', status: 'rejected' })
    expect(rejected).toHaveLength(2)
    expect(store.items.slice(0, 2).map(item => item.status)).toEqual(['rejected', 'rejected'])
    expect(toastSuccess).toHaveBeenCalledWith('Rejected 2 memories')

    const archived = await store.archiveMemories(['pending-1', 'active-1'])

    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'pending-1', status: 'archived' })
    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'active-1', status: 'archived' })
    expect(archived).toHaveLength(2)
    expect(store.items.map(item => item.status)).toEqual(['archived', 'rejected', 'archived'])
    expect(toastSuccess).toHaveBeenCalledWith('Archived 2 memories')
  })

  it('applies review workbench status actions through one dispatcher', async () => {
    const store = useMemorySettingsStore()

    await vi.waitFor(() => {
      expect(invokeMocks.getStatus).toHaveBeenCalled()
    })

    store.items = [
      { ...invokeMocks.memoryItem, id: 'persona-1', status: 'needs_review' },
      { ...invokeMocks.memoryItem, id: 'persona-2', status: 'needs_review' },
      { ...invokeMocks.memoryItem, id: 'stale-1', status: 'active' },
    ]

    const approved = await store.applyReviewWorkbenchAction({
      action: 'approve',
      id: 'persona-1',
    })
    const rejected = await store.applyReviewWorkbenchAction({
      action: 'reject',
      id: 'persona-2',
    })
    const archived = await store.applyReviewWorkbenchAction({
      action: 'archive',
      id: 'stale-1',
    })

    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'persona-1', status: 'active' })
    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'persona-2', status: 'rejected' })
    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'stale-1', status: 'archived' })
    expect(approved.status).toBe('active')
    expect(rejected.status).toBe('rejected')
    expect(archived.status).toBe('archived')
    expect(store.items.map(item => item.status)).toEqual(['active', 'rejected', 'archived'])
    expect(toastSuccess).toHaveBeenCalledWith('Applied review action: approve')
    expect(toastSuccess).toHaveBeenCalledWith('Applied review action: reject')
    expect(toastSuccess).toHaveBeenCalledWith('Applied review action: archive')
  })

  it('refreshes derived review, compact profile, and RAG previews after review actions', async () => {
    const store = useMemorySettingsStore()

    await vi.waitFor(() => {
      expect(invokeMocks.getStatus).toHaveBeenCalled()
    })

    await store.previewRagContext({
      query: '  AIRI persona  ',
      target: 'local',
    })

    invokeMocks.getStatus.mockClear()
    invokeMocks.getReviewWorkbench.mockClear()
    invokeMocks.compactProfile.mockClear()
    invokeMocks.previewRagContext.mockClear()

    await store.applyReviewWorkbenchAction({
      action: 'approve',
      id: 'persona-1',
    })

    expect(invokeMocks.getStatus).toHaveBeenCalled()
    expect(invokeMocks.getReviewWorkbench).toHaveBeenCalledWith(undefined)
    expect(invokeMocks.compactProfile).toHaveBeenCalledWith(undefined)
    expect(invokeMocks.previewRagContext).toHaveBeenCalledWith({
      query: 'AIRI persona',
      target: 'local',
    })
    expect(store.reviewWorkbench?.total).toBe(1)
    expect(store.compactProfileResult?.sourceIds).toEqual(['memory-1'])
    expect(store.ragContextPreviewResult).toEqual(invokeMocks.previewRagContextResult)
  })

  it('resolves one conflict by rejecting the candidate or keeping it and archiving the related memory', async () => {
    const store = useMemorySettingsStore()

    await vi.waitFor(() => {
      expect(invokeMocks.getStatus).toHaveBeenCalled()
    })

    store.items = [
      { ...invokeMocks.memoryItem, id: 'candidate-1', status: 'needs_review' },
      { ...invokeMocks.memoryItem, id: 'related-1', status: 'active' },
    ]

    const rejected = await store.rejectMemory('candidate-1')

    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'candidate-1', status: 'rejected' })
    expect(rejected.status).toBe('rejected')
    expect(store.items[0].status).toBe('rejected')
    expect(toastSuccess).toHaveBeenCalledWith('Rejected memory')

    const result = await store.keepMemoryAndArchiveRelated({
      candidateId: 'candidate-1',
      relatedId: 'related-1',
    })

    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'related-1', status: 'archived' })
    expect(invokeMocks.update).toHaveBeenCalledWith({ id: 'candidate-1', status: 'active' })
    expect(result.candidate.status).toBe('active')
    expect(result.related.status).toBe('archived')
    expect(store.items.map(item => item.status)).toEqual(['active', 'archived'])
    expect(toastSuccess).toHaveBeenCalledWith('Kept candidate memory and archived related memory')
  })

  it('clears cached evolution suggestions after memory mutations', async () => {
    const store = useMemorySettingsStore()

    await vi.waitFor(() => {
      expect(invokeMocks.getStatus).toHaveBeenCalled()
    })

    await store.previewEvolution()
    expect(store.evolutionPreviewResult).toEqual(invokeMocks.evolutionPreviewResult)

    await store.editMemory({ id: 'memory-1', content: 'updated' })
    expect(store.evolutionPreviewResult).toBeNull()

    await store.previewEvolution()
    expect(store.evolutionPreviewResult).toEqual(invokeMocks.evolutionPreviewResult)

    await store.removeMemory('memory-1')
    expect(store.evolutionPreviewResult).toBeNull()
  })
})
