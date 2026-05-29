import type { createContext } from '@moeru/eventa/adapters/electron/main'

import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { defineInvokeHandler } from '@moeru/eventa'
import { createContext as createElectronMainContext } from '@moeru/eventa/adapters/electron/main'
import { app, ipcMain } from 'electron'

import {
  electronMemoryApplyAction,
  electronMemoryClear,
  electronMemoryCompactProfile,
  electronMemoryCreate,
  electronMemoryDelete,
  electronMemoryDetectConflicts,
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
  electronMemoryIngest,
  electronMemoryList,
  electronMemoryPreviewBackup,
  electronMemoryPreviewEvolution,
  electronMemoryPreviewExportPreflight,
  electronMemoryPreviewRagContext,
  electronMemorySearchLlmWiki,
  electronMemoryUpdate,
  electronMemoryValidateLoraTrainingPackage,
} from '../../../../shared/eventa'
import { onAppBeforeQuit } from '../../../libs/bootkit/lifecycle'
import { applyMemoryAction } from './actions'
import { exportMemoryBackup, importMemoryBackup, previewMemoryBackup } from './backup'
import { importChatRecordArchive } from './chat-records'
import { detectMemoryConflicts } from './conflicts'
import { createMemoryDatabase } from './database'
import { createMemoryEvolutionPreview } from './evolution'
import { createMemoryExportPreflightReport } from './export-preflight'
import { createMemoryIngestionPipeline } from './ingestion'
import { importMarkdownKnowledgeBase } from './knowledge-base'
import { exportMemoryLlmWiki, searchMemoryLlmWiki } from './llmwiki'
import { exportLoraDatasetCandidates } from './lora-dataset'
import { validateLoraTrainingPackage } from './lora-training-dry-run'
import { exportMemoryObsidianVault } from './obsidian-vault'
import { compactMemoryProfile } from './profile-compactor'
import { exportPublicProfile } from './public-profile'
import { composeMemoryRagContext } from './rag-context'
import { createMemoryRepository } from './repository'
import { createMemoryReviewWorkbenchSnapshot } from './review-workbench'

export async function createMemoryManager(options: { dataDir?: string, llmWikiDir?: string } = {}) {
  const database = await createMemoryDatabase({ dataDir: options.dataDir })
  const repository = createMemoryRepository(database)
  const ingestionPipeline = createMemoryIngestionPipeline({
    createMemory: repository.create,
    detectConflicts: payload => detectMemoryConflicts(repository, payload),
  })

  return {
    path: database.path,
    close: database.close,
    getStatus: repository.getStatus,
    list: repository.list,
    create: repository.create,
    update: repository.update,
    delete: repository.delete,
    clear: repository.clear,
    async compactProfile(payload: { maxItemsPerSection?: number } = {}) {
      const memories = await repository.list({ limit: 200 })

      return compactMemoryProfile({
        memories,
        maxItemsPerSection: payload.maxItemsPerSection,
      })
    },
    async getReviewWorkbench(payload: { staleBefore?: string } = {}) {
      const memories = await repository.list({ limit: 200 })

      return createMemoryReviewWorkbenchSnapshot({
        memories,
        staleBefore: payload.staleBefore ? new Date(payload.staleBefore) : undefined,
      })
    },
    async previewEvolution(payload: { staleBefore?: string, includeLowPriority?: boolean, limit?: number } = {}) {
      const memories = await repository.list({ limit: 200 })

      return createMemoryEvolutionPreview({
        memories,
        staleBefore: payload.staleBefore ? new Date(payload.staleBefore) : undefined,
        includeLowPriority: payload.includeLowPriority,
        limit: payload.limit,
      })
    },
    ingest: ingestionPipeline.ingest,
    applyAction: (payload: Parameters<typeof applyMemoryAction>[1]) => applyMemoryAction(repository, payload),
    detectConflicts: (payload: Parameters<typeof detectMemoryConflicts>[1]) => detectMemoryConflicts(repository, payload),
    importKnowledgeBase(payload: {
      rootDir: string
      sourceId?: string
      sourceLabel?: string
      defaults?: Parameters<typeof importMarkdownKnowledgeBase>[0]['defaults']
    }) {
      return importMarkdownKnowledgeBase({
        rootDir: payload.rootDir,
        sourceId: payload.sourceId,
        sourceLabel: payload.sourceLabel,
        defaults: payload.defaults,
        ingest: ingestionPipeline.ingest,
      })
    },
    importChatRecords(payload: {
      rootDir: string
      sourceType: Parameters<typeof importChatRecordArchive>[0]['sourceType']
      sourceId?: string
      sourceLabel?: string
      defaults?: Parameters<typeof importChatRecordArchive>[0]['defaults']
    }) {
      return importChatRecordArchive({
        rootDir: payload.rootDir,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        sourceLabel: payload.sourceLabel,
        defaults: payload.defaults,
        ingest: ingestionPipeline.ingest,
      })
    },
    async exportLlmWiki(payload: { outputDir?: string } = {}) {
      const memories = await repository.list({ limit: 200 })
      const outputDir = payload.outputDir
        ?? options.llmWikiDir
        ?? join(database.path === ':memory:' ? tmpdir() : join(database.path, '..', '..'), 'airi-brain', '70-llmwiki')

      return exportMemoryLlmWiki({
        memories,
        outputDir,
      })
    },
    async exportObsidianVault(payload: { outputDir?: string } = {}) {
      const memories = await repository.list({ limit: 200 })
      const outputDir = payload.outputDir
        ?? join(database.path === ':memory:' ? tmpdir() : join(database.path, '..', '..'), 'airi-brain')

      return exportMemoryObsidianVault({
        memories,
        outputDir,
      })
    },
    async exportPublicProfile(payload: { outputDir?: string } = {}) {
      const memories = await repository.list({ limit: 200 })
      const outputDir = payload.outputDir
        ?? join(database.path === ':memory:' ? tmpdir() : join(database.path, '..', '..'), 'airi-brain', '80-public-profile')

      return exportPublicProfile({
        memories,
        outputDir,
      })
    },
    async exportLoraDatasetCandidates(payload: { outputDir?: string } = {}) {
      const memories = await repository.list({ limit: 200 })
      const outputDir = payload.outputDir
        ?? join(database.path === ':memory:' ? tmpdir() : join(database.path, '..', '..'), 'airi-brain', '90-lora-dataset-candidates')

      return exportLoraDatasetCandidates({
        memories,
        outputDir,
      })
    },
    validateLoraTrainingPackage(payload: { outputDir?: string, configRelativePath?: string } = {}) {
      const outputDir = payload.outputDir
        ?? join(database.path === ':memory:' ? tmpdir() : join(database.path, '..', '..'), 'airi-brain', '90-lora-dataset-candidates')

      return validateLoraTrainingPackage({
        outputDir,
        configRelativePath: payload.configRelativePath,
      })
    },
    async previewExportPreflight(payload: { surface: 'public_profile' | 'lora_dataset' }) {
      const memories = await repository.list({ limit: 200 })

      return createMemoryExportPreflightReport({
        memories,
        surface: payload.surface,
      })
    },
    async exportBackup(payload: { outputDir?: string } = {}) {
      const memories = await repository.listAll()
      const outputDir = payload.outputDir
        ?? join(database.path === ':memory:' ? tmpdir() : join(database.path, '..', '..'), 'airi-brain', '95-backups')

      return exportMemoryBackup({
        memories,
        outputDir,
      })
    },
    importBackup(payload: { backupFile: string, selectedOriginalIds?: string[] }) {
      return importMemoryBackup({
        backupFile: payload.backupFile,
        selectedOriginalIds: payload.selectedOriginalIds,
        createMemory: repository.create,
      })
    },
    previewBackup(payload: { backupFile: string }) {
      return previewMemoryBackup({
        backupFile: payload.backupFile,
        detectConflicts: candidate => detectMemoryConflicts(repository, candidate),
      })
    },
    async searchLlmWiki(payload: { query: string, limit?: number }) {
      const inputDir = options.llmWikiDir
        ?? join(database.path === ':memory:' ? tmpdir() : join(database.path, '..', '..'), 'airi-brain', '70-llmwiki')

      return searchMemoryLlmWiki({
        inputDir,
        query: payload.query,
        limit: payload.limit,
      })
    },
    async previewRagContext(payload: { query: string, target?: 'local' | 'cloud', memoryLimit?: number, llmWikiLimit?: number }) {
      const inputDir = options.llmWikiDir
        ?? join(database.path === ':memory:' ? tmpdir() : join(database.path, '..', '..'), 'airi-brain', '70-llmwiki')

      return composeMemoryRagContext({
        query: payload.query,
        target: payload.target,
        memoryLimit: payload.memoryLimit,
        llmWikiLimit: payload.llmWikiLimit,
        listMemories: request => repository.list(request),
        searchLlmWiki: request => searchMemoryLlmWiki({
          inputDir,
          query: request.query,
          limit: request.limit,
        }),
      })
    },
  }
}

export async function setupMemoryManager() {
  const userDataDir = app.getPath('userData')
  const dataDir = join(userDataDir, 'memory', 'pglite')
  const llmWikiDir = join(userDataDir, 'airi-brain', '70-llmwiki')
  const manager = await createMemoryManager({ dataDir, llmWikiDir })

  onAppBeforeQuit(async () => {
    await manager.close()
  })

  return manager
}

export type MemoryManager = Awaited<ReturnType<typeof createMemoryManager>>

let memoryServiceRegistered = false

export function createMemoryService(params: {
  context: ReturnType<typeof createContext>['context']
  manager: MemoryManager
}) {
  defineInvokeHandler(params.context, electronMemoryGetStatus, () => {
    return params.manager.getStatus()
  })

  defineInvokeHandler(params.context, electronMemoryList, async (payload) => {
    return { items: await params.manager.list(payload) }
  })

  defineInvokeHandler(params.context, electronMemoryCreate, (payload) => {
    return params.manager.create(payload)
  })

  defineInvokeHandler(params.context, electronMemoryUpdate, (payload) => {
    return params.manager.update(payload)
  })

  defineInvokeHandler(params.context, electronMemoryDelete, async (payload) => {
    await params.manager.delete(payload.id)
  })

  defineInvokeHandler(params.context, electronMemoryClear, () => {
    return params.manager.clear()
  })

  defineInvokeHandler(params.context, electronMemoryCompactProfile, (payload) => {
    return params.manager.compactProfile(payload)
  })

  defineInvokeHandler(params.context, electronMemoryGetReviewWorkbench, (payload) => {
    return params.manager.getReviewWorkbench(payload)
  })

  defineInvokeHandler(params.context, electronMemoryIngest, (payload) => {
    return params.manager.ingest(payload)
  })

  defineInvokeHandler(params.context, electronMemoryImportKnowledgeBase, (payload) => {
    return params.manager.importKnowledgeBase(payload)
  })

  defineInvokeHandler(params.context, electronMemoryImportChatRecords, (payload) => {
    return params.manager.importChatRecords(payload)
  })

  defineInvokeHandler(params.context, electronMemoryApplyAction, (payload) => {
    return params.manager.applyAction(payload)
  })

  defineInvokeHandler(params.context, electronMemoryDetectConflicts, (payload) => {
    return params.manager.detectConflicts(payload)
  })

  defineInvokeHandler(params.context, electronMemoryExportLlmWiki, (payload) => {
    return params.manager.exportLlmWiki(payload)
  })

  defineInvokeHandler(params.context, electronMemoryExportObsidianVault, (payload) => {
    return params.manager.exportObsidianVault(payload)
  })

  defineInvokeHandler(params.context, electronMemoryExportPublicProfile, (payload) => {
    return params.manager.exportPublicProfile(payload)
  })

  defineInvokeHandler(params.context, electronMemoryExportLoraDatasetCandidates, (payload) => {
    return params.manager.exportLoraDatasetCandidates(payload)
  })

  defineInvokeHandler(params.context, electronMemoryValidateLoraTrainingPackage, (payload) => {
    return params.manager.validateLoraTrainingPackage(payload)
  })

  defineInvokeHandler(params.context, electronMemoryPreviewExportPreflight, (payload) => {
    return params.manager.previewExportPreflight(payload)
  })

  defineInvokeHandler(params.context, electronMemoryExportBackup, (payload) => {
    return params.manager.exportBackup(payload)
  })

  defineInvokeHandler(params.context, electronMemoryImportBackup, (payload) => {
    return params.manager.importBackup(payload)
  })

  defineInvokeHandler(params.context, electronMemoryPreviewBackup, (payload) => {
    return params.manager.previewBackup(payload)
  })

  defineInvokeHandler(params.context, electronMemorySearchLlmWiki, (payload) => {
    return params.manager.searchLlmWiki(payload)
  })

  defineInvokeHandler(params.context, electronMemoryPreviewRagContext, (payload) => {
    return params.manager.previewRagContext(payload)
  })

  defineInvokeHandler(params.context, electronMemoryPreviewEvolution, (payload) => {
    return params.manager.previewEvolution(payload)
  })
}

export function registerGlobalMemoryService(params: { manager: MemoryManager }) {
  if (memoryServiceRegistered)
    return

  memoryServiceRegistered = true
  const { context } = createElectronMainContext(ipcMain)
  createMemoryService({ context, manager: params.manager })
}
