import type { ElectronMemoryItem } from '../../../../shared/eventa'
import type { MemoryManager } from './index'

import { createContext, defineInvoke } from '@moeru/eventa'
import { describe, expect, it, vi } from 'vitest'

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
import { createMemoryService } from './index'

const memoryItem: ElectronMemoryItem = {
  id: 'memory-1',
  scope: 'user',
  type: 'note',
  content: 'AIRI remembers confirmed local facts.',
  summary: null,
  tags: [],
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

describe('memory service eventa adapter', () => {
  it('registers memory invokes against the provided manager', async () => {
    const context = createContext()
    const manager: MemoryManager = {
      path: ':memory:',
      close: vi.fn(),
      getStatus: vi.fn(async () => ({
        path: ':memory:',
        total: 1,
        active: 1,
        needsReview: 0,
        archived: 0,
        updatedAt: '2026-05-07T00:00:00.000Z',
      })),
      list: vi.fn(async () => [memoryItem]),
      create: vi.fn(async () => memoryItem),
      update: vi.fn(async () => ({ ...memoryItem, content: 'updated' })),
      delete: vi.fn(async () => {}),
      clear: vi.fn(async () => ({ deleted: 1 })),
      compactProfile: vi.fn(async () => ({
        generatedAt: '2026-05-07T00:00:00.000Z',
        markdown: '# AIRI Compact Profile',
        sections: [{
          key: 'profile' as const,
          title: 'Profile',
          items: [{
            id: 'memory-1',
            content: 'AIRI remembers confirmed local facts.',
            importance: 3,
            privacy: 'local' as const,
            tags: [],
            type: 'note' as const,
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
          priority: 'medium' as const,
          reasons: ['pending_candidate' as const],
          relatedItemIds: [],
          recommendedActions: ['approve' as const, 'reject' as const, 'edit' as const],
        }],
        total: 1,
      })),
      exportLlmWiki: vi.fn(async () => ({
        outputDir: 'F:/airi-brain/70-llmwiki',
        files: [{ relativePath: 'profile.md', path: 'F:/airi-brain/70-llmwiki/profile.md', count: 1 }],
        exportedAt: '2026-05-07T00:00:00.000Z',
      })),
      exportObsidianVault: vi.fn(async () => ({
        outputDir: 'F:/airi-brain',
        files: [{ relativePath: 'AIRI-Brain.md', path: 'F:/airi-brain/AIRI-Brain.md', count: 1 }],
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
        total: 1,
        items: [{
          index: 0,
          originalId: 'memory-1',
          type: 'note' as const,
          privacy: 'local' as const,
          status: 'active' as const,
          sourceType: 'manual',
          sourceId: null,
          createdAt: '2026-05-07T00:00:00.000Z',
          summary: null,
          contentPreview: 'AIRI remembers confirmed local facts.',
          tags: [],
          empty: false,
          safetyRisk: false,
          safetyFindings: [],
          conflicts: [],
        }],
      })),
      previewExportPreflight: vi.fn(async () => ({
        surface: 'lora_dataset' as const,
        summary: {
          total: 1,
          allowed: 1,
          blocked: 0,
        },
        items: [{
          id: 'memory-1',
          type: 'note' as const,
          privacy: 'local' as const,
          sourceType: 'manual',
          status: 'active' as const,
          allowed: true,
          reasons: [],
        }],
      })),
      validateLoraTrainingPackage: vi.fn(async () => ({
        schemaVersion: 1 as const,
        ok: true,
        outputDir: 'F:/airi-brain/90-lora-dataset-candidates',
        configPath: 'F:/airi-brain/90-lora-dataset-candidates/lora-training-config.json',
        checkedAt: '2026-05-07T00:00:00.000Z',
        summary: {
          passed: 17,
          failed: 0,
        },
        counts: {
          candidates: 1,
          train: 1,
          eval: 0,
          manifestRecords: 1,
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
          status: 'pass' as const,
          message: 'Train JSONL count matches training config.',
        }],
      })),
      searchLlmWiki: vi.fn(async () => ({
        inputDir: 'F:/airi-brain/70-llmwiki',
        scannedFiles: 1,
        snippets: [{ relativePath: 'profile.md', path: 'F:/airi-brain/70-llmwiki/profile.md', text: '用户画像', score: 2 }],
      })),
      previewRagContext: vi.fn(async () => ({
        fragments: [{ kind: 'memory' as const, id: 'memory-1', title: 'note', text: 'AIRI remembers confirmed local facts.', privacy: 'local' as const, score: 3 }],
        withheld: [{ id: 'secret-1', privacy: 'secret' as const, reason: 'secret_memory' as const }],
      })),
      previewEvolution: vi.fn(async () => ({
        generatedAt: '2026-05-13T00:00:00.000Z',
        total: 1,
        suggestions: [{
          id: 'evolve-memory-1-promote-candidate',
          kind: 'promote_candidate' as const,
          priority: 'medium' as const,
          title: 'Review candidate memory',
          reason: 'This candidate is waiting for user review.',
          memoryIds: ['memory-1'],
          recommendedActions: ['approve' as const, 'reject' as const, 'edit' as const],
          createdAt: '2026-05-07T00:00:00.000Z',
        }],
      })),
      ingest: vi.fn(async () => ({
        created: [memoryItem],
        skipped: [],
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
      applyAction: vi.fn(async () => ({
        action: 'correct' as const,
        item: memoryItem,
      })),
      detectConflicts: vi.fn(async () => ({
        findings: [{
          kind: 'duplicate' as const,
          item: memoryItem,
          score: 1,
          reason: 'duplicate',
        }],
      })),
    }

    createMemoryService({ context: context as never, manager })

    await expect(defineInvoke(context, electronMemoryGetStatus)()).resolves.toMatchObject({ total: 1 })
    await expect(defineInvoke(context, electronMemoryList)({ query: 'AIRI' })).resolves.toEqual({ items: [memoryItem] })
    await expect(defineInvoke(context, electronMemoryCreate)({ content: 'new' })).resolves.toEqual(memoryItem)
    await expect(defineInvoke(context, electronMemoryUpdate)({ id: 'memory-1', content: 'updated' })).resolves.toMatchObject({ content: 'updated' })
    await expect(defineInvoke(context, electronMemoryDelete)({ id: 'memory-1' })).resolves.toBeUndefined()
    await expect(defineInvoke(context, electronMemoryClear)()).resolves.toEqual({ deleted: 1 })
    await expect(defineInvoke(context, electronMemoryCompactProfile)({ maxItemsPerSection: 4 })).resolves.toMatchObject({
      markdown: '# AIRI Compact Profile',
      sourceIds: ['memory-1'],
    })
    await expect(defineInvoke(context, electronMemoryGetReviewWorkbench)({ staleBefore: '2026-02-01T00:00:00.000Z' })).resolves.toMatchObject({
      total: 1,
      entries: [{ id: 'memory-1', reasons: ['pending_candidate'] }],
    })
    await expect(defineInvoke(context, electronMemoryExportLlmWiki)(undefined)).resolves.toMatchObject({
      files: [{ relativePath: 'profile.md', path: 'F:/airi-brain/70-llmwiki/profile.md', count: 1 }],
    })
    await expect(defineInvoke(context, electronMemoryExportObsidianVault)(undefined)).resolves.toMatchObject({
      files: [{ relativePath: 'AIRI-Brain.md', path: 'F:/airi-brain/AIRI-Brain.md', count: 1 }],
    })
    await expect(defineInvoke(context, electronMemoryExportPublicProfile)(undefined)).resolves.toMatchObject({
      files: [{ relativePath: 'public-profile.md', path: 'F:/airi-brain/80-public-profile/public-profile.md', count: 1 }],
    })
    await expect(defineInvoke(context, electronMemoryExportLoraDatasetCandidates)(undefined)).resolves.toMatchObject({
      files: [{ relativePath: 'lora-dataset-candidates.jsonl', path: 'F:/airi-brain/90-lora-dataset-candidates/lora-dataset-candidates.jsonl', count: 1 }],
    })
    await expect(defineInvoke(context, electronMemoryExportBackup)(undefined)).resolves.toMatchObject({
      files: [{ relativePath: 'airi-memory-backup.json', path: 'F:/airi-brain/95-backups/airi-memory-backup.json', count: 1 }],
    })
    await expect(defineInvoke(context, electronMemoryImportBackup)({
      backupFile: 'F:/airi-brain/95-backups/airi-memory-backup.json',
      selectedOriginalIds: ['memory-1'],
    })).resolves.toMatchObject({
      imported: [memoryItem],
      skipped: [],
    })
    await expect(defineInvoke(context, electronMemoryPreviewBackup)({
      backupFile: 'F:/airi-brain/95-backups/airi-memory-backup.json',
    })).resolves.toMatchObject({
      total: 1,
      items: [{ originalId: 'memory-1', contentPreview: 'AIRI remembers confirmed local facts.' }],
    })
    await expect(defineInvoke(context, electronMemoryPreviewExportPreflight)({
      surface: 'lora_dataset',
    })).resolves.toMatchObject({
      surface: 'lora_dataset',
      summary: { total: 1, allowed: 1, blocked: 0 },
      items: [{ id: 'memory-1', allowed: true }],
    })
    await expect(defineInvoke(context, electronMemorySearchLlmWiki)({ query: '用户画像' })).resolves.toMatchObject({
      scannedFiles: 1,
      snippets: [{ relativePath: 'profile.md', path: 'F:/airi-brain/70-llmwiki/profile.md', text: '用户画像', score: 2 }],
    })
    await expect(defineInvoke(context, electronMemoryValidateLoraTrainingPackage)(undefined)).resolves.toMatchObject({
      ok: true,
      counts: {
        candidates: 1,
        train: 1,
        eval: 0,
        manifestRecords: 1,
      },
      dryRunContract: {
        successChecks: ['privacy_flags', 'dataset_counts', 'chat_record_safety', 'training_runbook_exists', 'post_training_checklist_exists'],
      },
      artifacts: {
        trainingRunbookPath: 'lora-training-runbook.zh-CN.md',
        postTrainingChecklistPath: 'lora-post-training-checklist.zh-CN.md',
      },
      checks: [{ id: 'train_count_matches_config', status: 'pass' }],
    })
    await expect(defineInvoke(context, electronMemoryPreviewRagContext)({ query: 'AIRI', target: 'local' })).resolves.toMatchObject({
      fragments: [{ id: 'memory-1', kind: 'memory' }],
      withheld: [{ id: 'secret-1', reason: 'secret_memory' }],
    })
    await expect(defineInvoke(context, electronMemoryPreviewEvolution)({
      staleBefore: '2026-02-01T00:00:00.000Z',
      includeLowPriority: false,
      limit: 10,
    })).resolves.toMatchObject({
      total: 1,
      suggestions: [{ id: 'evolve-memory-1-promote-candidate', kind: 'promote_candidate' }],
    })

    await expect(defineInvoke(context, electronMemoryIngest)({
      source: { type: 'knowledge_base', id: 'obsidian-vault' },
      entries: [{ content: 'AIRI project notes', type: 'knowledge' }],
    })).resolves.toEqual({
      created: [memoryItem],
      skipped: [],
    })
    await expect(defineInvoke(context, electronMemoryImportKnowledgeBase)({
      rootDir: 'F:/brain',
      defaults: { tags: ['obsidian'] },
    })).resolves.toEqual({
      created: [memoryItem],
      skipped: [],
      filesScanned: 1,
      emptyFiles: [],
      skippedGeneratedFiles: [],
    })
    await expect(defineInvoke(context, electronMemoryImportChatRecords)({
      rootDir: 'F:/wechat-export',
      sourceType: 'import_wechat',
      defaults: { tags: ['wechat'] },
    })).resolves.toEqual({
      created: [memoryItem],
      skipped: [],
      filesScanned: 1,
      messagesImported: 1,
      emptyFiles: [],
      unsupportedFiles: [],
    })
    await expect(defineInvoke(context, electronMemoryApplyAction)({
      action: 'correct',
      id: 'memory-1',
      correction: 'corrected',
    })).resolves.toEqual({
      action: 'correct',
      item: memoryItem,
    })
    await expect(defineInvoke(context, electronMemoryDetectConflicts)({
      content: 'AIRI remembers confirmed local facts.',
      type: 'note',
    })).resolves.toEqual({
      findings: [{
        kind: 'duplicate',
        item: memoryItem,
        score: 1,
        reason: 'duplicate',
      }],
    })

    expect(manager.list).toHaveBeenCalledWith({ query: 'AIRI' })
    expect(manager.delete).toHaveBeenCalledWith('memory-1')
    expect(manager.compactProfile).toHaveBeenCalledWith({ maxItemsPerSection: 4 })
    expect(manager.getReviewWorkbench).toHaveBeenCalledWith({ staleBefore: '2026-02-01T00:00:00.000Z' })
    expect(manager.exportLlmWiki).toHaveBeenCalled()
    expect(manager.exportObsidianVault).toHaveBeenCalled()
    expect(manager.exportPublicProfile).toHaveBeenCalled()
    expect(manager.exportLoraDatasetCandidates).toHaveBeenCalled()
    expect(manager.exportBackup).toHaveBeenCalled()
    expect(manager.importBackup).toHaveBeenCalledWith({
      backupFile: 'F:/airi-brain/95-backups/airi-memory-backup.json',
      selectedOriginalIds: ['memory-1'],
    })
    expect(manager.previewBackup).toHaveBeenCalledWith({
      backupFile: 'F:/airi-brain/95-backups/airi-memory-backup.json',
    })
    expect(manager.previewExportPreflight).toHaveBeenCalledWith({
      surface: 'lora_dataset',
    })
    expect(manager.validateLoraTrainingPackage).toHaveBeenCalledWith(undefined)
    expect(manager.ingest).toHaveBeenCalledWith({
      source: { type: 'knowledge_base', id: 'obsidian-vault' },
      entries: [{ content: 'AIRI project notes', type: 'knowledge' }],
    })
    expect(manager.importKnowledgeBase).toHaveBeenCalledWith({
      rootDir: 'F:/brain',
      defaults: { tags: ['obsidian'] },
    })
    expect(manager.importChatRecords).toHaveBeenCalledWith({
      rootDir: 'F:/wechat-export',
      sourceType: 'import_wechat',
      defaults: { tags: ['wechat'] },
    })
    expect(manager.applyAction).toHaveBeenCalledWith({
      action: 'correct',
      id: 'memory-1',
      correction: 'corrected',
    })
    expect(manager.detectConflicts).toHaveBeenCalledWith({
      content: 'AIRI remembers confirmed local facts.',
      type: 'note',
    })
    expect(manager.searchLlmWiki).toHaveBeenCalledWith({ query: '用户画像' })
    expect(manager.previewRagContext).toHaveBeenCalledWith({ query: 'AIRI', target: 'local' })
    expect(manager.previewEvolution).toHaveBeenCalledWith({
      staleBefore: '2026-02-01T00:00:00.000Z',
      includeLowPriority: false,
      limit: 10,
    })
  })
})
