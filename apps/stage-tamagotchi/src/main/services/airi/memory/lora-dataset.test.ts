import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { exportLoraDatasetCandidates } from './lora-dataset'

describe('lora dataset candidate export', () => {
  let outputDir: string

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'airi-lora-candidates-'))
  })

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true })
  })

  it('exports only explicitly approved sanitized memories as chat-style JSONL candidates', async () => {
    const result = await exportLoraDatasetCandidates({
      outputDir,
      memories: [
        memory({
          id: 'training-profile',
          content: 'User is preparing for algorithm interviews and wants rigorous feedback.',
          type: 'profile',
          privacy: 'local',
          metadata: { profileVisibility: 'training_sanitized', file: { path: 'F:/private/source.md' } },
        }),
        memory({
          id: 'candidate-preference',
          content: 'AIRI should ask for confirmation before risky desktop actions.',
          type: 'preference',
          privacy: 'public',
          metadata: { loraDatasetCandidate: true },
        }),
        memory({
          id: 'short-candidate',
          content: 'OK.',
          type: 'conversation',
          privacy: 'public',
          metadata: { loraDatasetCandidate: true },
        }),
        memory({
          id: 'path-candidate',
          content: 'User keeps private interview notes in F:/private/interview-notes.md.',
          type: 'profile',
          privacy: 'local',
          metadata: { profileVisibility: 'training_sanitized' },
        }),
        memory({
          id: 'demo-only',
          content: 'Demo-only public profile content should not become training data.',
          privacy: 'public',
          metadata: { profileVisibility: 'demo' },
        }),
        memory({
          id: 'raw-chat',
          content: 'Raw imported chat must not become a training sample.',
          privacy: 'local',
          sourceType: 'import_qq',
          metadata: { loraDatasetCandidate: true },
        }),
        memory({
          id: 'sensitive-candidate',
          content: 'Sensitive candidate must not be exported.',
          privacy: 'sensitive',
          metadata: { loraDatasetCandidate: true },
        }),
      ],
    })

    expect(result.files).toEqual([
      expect.objectContaining({ relativePath: 'lora-dataset-candidates.jsonl', count: 2 }),
      expect.objectContaining({ relativePath: 'lora-dataset-train.jsonl', count: 2 }),
      expect.objectContaining({ relativePath: 'lora-dataset-eval.jsonl', count: 0 }),
      expect.objectContaining({ relativePath: 'lora-dataset-manifest.json', count: 2 }),
      expect.objectContaining({ relativePath: 'lora-training-config.json', count: 2 }),
      expect.objectContaining({ relativePath: 'lora-training-runbook.zh-CN.md', count: 2 }),
      expect.objectContaining({ relativePath: 'lora-post-training-checklist.zh-CN.md', count: 2 }),
    ])

    const jsonl = await readFile(join(outputDir, 'lora-dataset-candidates.jsonl'), 'utf8')
    const trainJsonl = await readFile(join(outputDir, 'lora-dataset-train.jsonl'), 'utf8')
    const evalJsonl = await readFile(join(outputDir, 'lora-dataset-eval.jsonl'), 'utf8')
    const trainingRunbook = await readFile(join(outputDir, 'lora-training-runbook.zh-CN.md'), 'utf8')
    const postTrainingChecklist = await readFile(join(outputDir, 'lora-post-training-checklist.zh-CN.md'), 'utf8')
    const trainingConfig = JSON.parse(await readFile(join(outputDir, 'lora-training-config.json'), 'utf8')) as {
      schemaVersion: number
      task: string
      exportedAt: string
      dataset: {
        format: string
        recordSchemaVersion: number
        candidatesPath: string
        trainPath: string
        evalPath: string
        manifestPath: string
        candidateCount: number
        trainCount: number
        evalCount: number
      }
      split: {
        strategy: string
      }
      artifacts: {
        trainingRunbookPath: string
        postTrainingChecklistPath: string
      }
      model: {
        baseModelFamily: string
        finetuningMethod: string
      }
      qloraDefaults: {
        loadIn4bit: boolean
        loraRank: number
        loraAlpha: number
        loraDropout: number
        sequenceLength: number
        learningRate: number
        epochs: number
      }
      gates: {
        exportPreflight: string[]
        quality: string[]
      }
      dryRunContract: {
        successSchemaVersion: number
        successChecks: string[]
        errorFormat: string
        validationErrorType: string
        validationErrorExitCode: number
      }
      privacy: {
        containsRawChatImports: boolean
        containsBlockedMemoryContent: boolean
        containsSourceMetadataPaths: boolean
        requiresHumanApprovalBeforeTraining: boolean
      }
    }
    const records = jsonl.trim().split('\n').map(line => JSON.parse(line)) as Array<{
      id: string
      schemaVersion: number
      sourceMemoryId: string
      messages: Array<{ role: string, content: string }>
      metadata?: unknown
    }>

    expect(records.map(record => record.schemaVersion)).toEqual([1, 1])
    expect(records.map(record => record.sourceMemoryId)).toEqual(['training-profile', 'candidate-preference'])
    expect(records[0].messages).toEqual([
      { role: 'system', content: 'You are AIRI, a local companion and desktop assistant. Use only approved sanitized memory.' },
      { role: 'user', content: 'Update your understanding of the user from this approved memory.' },
      { role: 'assistant', content: 'User is preparing for algorithm interviews and wants rigorous feedback.' },
    ])
    expect(jsonl).not.toContain('F:/private/source.md')
    expect(jsonl).not.toContain('Raw imported chat')
    expect(jsonl).not.toContain('Sensitive candidate')
    expect(records[0]).not.toHaveProperty('metadata')

    const manifest = JSON.parse(await readFile(join(outputDir, 'lora-dataset-manifest.json'), 'utf8')) as {
      recordCount: number
      records: Array<{
        sourceMemoryId: string
        metadata?: unknown
      }>
      preflight: {
        summary: {
          total: number
          allowed: number
          blocked: number
        }
        blocked: Array<{
          id: string
          reasons: string[]
          content?: string
        }>
      }
      quality: {
        summary: {
          allowedByPreflight: number
          ready: number
          needsReview: number
        }
        needsReview: Array<{
          sourceMemoryId: string
          reasons: string[]
          content?: string
        }>
      }
      split: {
        strategy: string
        trainCount: number
        evalCount: number
        trainSourceMemoryIds: string[]
        evalSourceMemoryIds: string[]
      }
    }

    expect(manifest.recordCount).toBe(2)
    expect(manifest.records.map(record => record.sourceMemoryId)).toEqual(['training-profile', 'candidate-preference'])
    expect(manifest.records[0]).not.toHaveProperty('metadata')
    expect(manifest.preflight.summary).toEqual({
      total: 7,
      allowed: 3,
      blocked: 4,
    })
    expect(manifest.preflight.blocked).toEqual([
      expect.objectContaining({ id: 'path-candidate', reasons: ['unsafe_content'] }),
      expect.objectContaining({ id: 'demo-only', reasons: ['demo_only', 'missing_training_visibility'] }),
      expect.objectContaining({ id: 'raw-chat', reasons: ['raw_chat_import'] }),
      expect.objectContaining({ id: 'sensitive-candidate', reasons: ['sensitive_or_secret'] }),
    ])
    expect(manifest.preflight.blocked[0]).not.toHaveProperty('content')
    expect(manifest.quality.summary).toEqual({
      allowedByPreflight: 3,
      ready: 2,
      needsReview: 1,
    })
    expect(manifest.quality.needsReview).toEqual([
      expect.objectContaining({ sourceMemoryId: 'short-candidate', reasons: ['too_short'] }),
    ])
    expect(manifest.quality.needsReview[0]).not.toHaveProperty('content')
    expect(manifest.split).toEqual({
      strategy: 'deterministic_tail_eval_v1',
      trainCount: 2,
      evalCount: 0,
      trainSourceMemoryIds: ['training-profile', 'candidate-preference'],
      evalSourceMemoryIds: [],
    })
    expect(JSON.stringify(manifest)).not.toContain('F:/private/source.md')
    expect(JSON.stringify(manifest)).not.toContain('F:/private/interview-notes.md')
    expect(JSON.stringify(manifest)).not.toContain('Raw imported chat')
    expect(JSON.stringify(manifest)).not.toContain('Sensitive candidate')
    expect(jsonl).not.toContain('OK.')
    expect(jsonl).not.toContain('F:/private/interview-notes.md')
    expect(trainJsonl.trim().split('\n').map(line => JSON.parse(line).sourceMemoryId)).toEqual(['training-profile', 'candidate-preference'])
    expect(evalJsonl).toBe('')
    expect(trainingConfig).toMatchObject({
      schemaVersion: 1,
      task: 'chat_companion_memory_sft',
      dataset: {
        format: 'chat_messages_jsonl',
        recordSchemaVersion: 1,
        candidatesPath: 'lora-dataset-candidates.jsonl',
        trainPath: 'lora-dataset-train.jsonl',
        evalPath: 'lora-dataset-eval.jsonl',
        manifestPath: 'lora-dataset-manifest.json',
        candidateCount: 2,
        trainCount: 2,
        evalCount: 0,
      },
      split: {
        strategy: 'deterministic_tail_eval_v1',
      },
      artifacts: {
        trainingRunbookPath: 'lora-training-runbook.zh-CN.md',
        postTrainingChecklistPath: 'lora-post-training-checklist.zh-CN.md',
      },
      model: {
        baseModelFamily: 'gemma',
        finetuningMethod: 'qlora',
      },
      qloraDefaults: {
        loadIn4bit: true,
        loraRank: 16,
        loraAlpha: 32,
        loraDropout: 0.05,
        sequenceLength: 2048,
        learningRate: 0.0002,
        epochs: 3,
      },
      privacy: {
        containsRawChatImports: false,
        containsBlockedMemoryContent: false,
        containsSourceMetadataPaths: false,
        requiresHumanApprovalBeforeTraining: true,
      },
      dryRunContract: {
        successSchemaVersion: 1,
        successChecks: ['privacy_flags', 'dataset_counts', 'chat_record_safety', 'training_runbook_exists', 'post_training_checklist_exists'],
        errorFormat: 'json',
        validationErrorType: 'validation_error',
        validationErrorExitCode: 2,
      },
    })
    expect(trainingConfig.gates.exportPreflight).toEqual([
      'active_status',
      'non_sensitive_privacy',
      'no_raw_chat_imports',
      'explicit_training_visibility',
      'no_demo_only_profile',
    ])
    expect(trainingConfig.gates.quality).toEqual([
      'assistant_content_required',
      'minimum_assistant_content_length',
      'no_local_path_leakage',
    ])
    expect(JSON.stringify(trainingConfig)).not.toContain('User is preparing for algorithm interviews')
    expect(JSON.stringify(trainingConfig)).not.toContain('F:/private')
    expect(JSON.stringify(trainingConfig)).not.toContain('Raw imported chat')
    expect(trainingRunbook).toContain('lora-training-config.json')
    expect(trainingRunbook).toContain('lora-dataset-train.jsonl')
    expect(trainingRunbook).toContain('lora-dataset-eval.jsonl')
    expect(trainingRunbook).toContain('validateLoraTrainingPackage')
    expect(trainingRunbook).toContain('Unsloth')
    expect(trainingRunbook).toContain('TRL')
    expect(trainingRunbook).toContain('QLoRA')
    expect(trainingRunbook).toContain('隐私门禁')
    expect(trainingRunbook).toContain('训练前检查')
    expect(trainingRunbook).toContain('后续训练脚本接入方式')
    expect(trainingRunbook).toContain('scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py')
    expect(trainingRunbook).toContain('scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md')
    expect(trainingRunbook).toContain('scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md')
    expect(trainingRunbook).toContain('uv run')
    expect(trainingRunbook).toContain('--error-format json')
    expect(trainingRunbook).toContain('schemaVersion')
    expect(trainingRunbook).toContain('recordSchemaVersion')
    expect(trainingRunbook).toContain('jsonl_records_parseable')
    expect(trainingRunbook).toContain('record_schema_matches_config')
    expect(trainingRunbook).toContain('validateLoraTrainingPackage` 返回值会包含 `artifacts')
    expect(trainingRunbook).toContain('chat_record_safety')
    expect(trainingRunbook).toContain('training_runbook_exists')
    expect(trainingRunbook).toContain('post_training_checklist_exists')
    expect(trainingRunbook).toContain('trainingRunbookPath')
    expect(trainingRunbook).toContain('postTrainingChecklistPath')
    expect(trainingRunbook).toContain('validation_error')
    expect(trainingRunbook).toContain('agent-chat-runtime-config.json')
    expect(trainingRunbook).not.toMatch(/[\uE000-\uF8FF]/u)
    expect(trainingRunbook).not.toContain('User is preparing for algorithm interviews')
    expect(trainingRunbook).not.toContain('F:/private')
    expect(trainingRunbook).not.toContain('Raw imported chat')
    expect(postTrainingChecklist).toContain('MODEL_CARD_TEMPLATE.zh-CN.md')
    expect(postTrainingChecklist).toContain('DEPLOYMENT.zh-CN.md')
    expect(postTrainingChecklist).toContain('recordSchemaVersion')
    expect(postTrainingChecklist).toContain('schemaVersion')
    expect(postTrainingChecklist).toContain('jsonl_records_parseable')
    expect(postTrainingChecklist).toContain('record_schema_matches_config')
    expect(postTrainingChecklist).toContain('dryRunContract.successChecks')
    expect(postTrainingChecklist).toContain('AIRI app-side artifacts')
    expect(postTrainingChecklist).toContain('privacy_flags')
    expect(postTrainingChecklist).toContain('dataset_counts')
    expect(postTrainingChecklist).toContain('chat_record_safety')
    expect(postTrainingChecklist).toContain('training_runbook_exists')
    expect(postTrainingChecklist).toContain('post_training_checklist_exists')
    expect(postTrainingChecklist).toContain('unknown success check')
    expect(postTrainingChecklist).toContain('agent-chat-runtime-config.json')
    expect(postTrainingChecklist).toContain('public-safe')
    expect(postTrainingChecklist).not.toMatch(/[\uE000-\uF8FF]/u)
    expect(postTrainingChecklist).not.toContain('User is preparing for algorithm interviews')
    expect(postTrainingChecklist).not.toContain('F:/private')
    expect(postTrainingChecklist).not.toContain('Raw imported chat')
  })

  it('creates a deterministic eval split when enough ready records exist', async () => {
    await exportLoraDatasetCandidates({
      outputDir,
      memories: [
        readyMemory('ready-1'),
        readyMemory('ready-2'),
        readyMemory('ready-3'),
        readyMemory('ready-4'),
        readyMemory('ready-5'),
      ],
    })

    const trainJsonl = await readFile(join(outputDir, 'lora-dataset-train.jsonl'), 'utf8')
    const evalJsonl = await readFile(join(outputDir, 'lora-dataset-eval.jsonl'), 'utf8')
    const trainIds = trainJsonl.trim().split('\n').map(line => JSON.parse(line).sourceMemoryId)
    const evalIds = evalJsonl.trim().split('\n').map(line => JSON.parse(line).sourceMemoryId)
    const manifest = JSON.parse(await readFile(join(outputDir, 'lora-dataset-manifest.json'), 'utf8')) as {
      split: {
        trainCount: number
        evalCount: number
        trainSourceMemoryIds: string[]
        evalSourceMemoryIds: string[]
      }
    }

    expect(trainIds).toEqual(['ready-1', 'ready-2', 'ready-3', 'ready-4'])
    expect(evalIds).toEqual(['ready-5'])
    expect(manifest.split).toMatchObject({
      trainCount: 4,
      evalCount: 1,
      trainSourceMemoryIds: ['ready-1', 'ready-2', 'ready-3', 'ready-4'],
      evalSourceMemoryIds: ['ready-5'],
    })

    const trainingConfig = JSON.parse(await readFile(join(outputDir, 'lora-training-config.json'), 'utf8')) as {
      dataset: {
        candidateCount: number
        trainCount: number
        evalCount: number
      }
    }

    expect(trainingConfig.dataset).toMatchObject({
      candidateCount: 5,
      trainCount: 4,
      evalCount: 1,
    })
  })
})

function readyMemory(id: string): ElectronMemoryItem {
  return memory({
    id,
    content: `This is a sanitized LoRA training candidate for ${id}, with enough detail for AIRI style learning.`,
    privacy: 'public',
    metadata: { loraDatasetCandidate: true },
  })
}

function memory(overrides: Partial<ElectronMemoryItem>): ElectronMemoryItem {
  return {
    id: 'memory-1',
    scope: 'user',
    type: 'note',
    content: 'memory content',
    summary: null,
    tags: [],
    importance: 3,
    privacy: 'local',
    sourceType: 'manual',
    sourceId: null,
    status: 'active',
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
    ...overrides,
  }
}
