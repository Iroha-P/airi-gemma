import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { exportLoraDatasetCandidates } from './lora-dataset'
import { validateLoraTrainingPackage } from './lora-training-dry-run'

describe('lora training package dry run', () => {
  let outputDir: string

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'airi-lora-dry-run-'))
  })

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true })
  })

  it('accepts a freshly exported privacy-gated package without exposing sample content', async () => {
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

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.schemaVersion).toBe(1)
    expect(report.ok).toBe(true)
    expect(report.summary).toEqual({
      passed: report.checks.length,
      failed: 0,
    })
    expect(report.counts).toEqual({
      candidates: 5,
      train: 4,
      eval: 1,
      manifestRecords: 5,
    })
    expect(report.dryRunContract).toEqual({
      successSchemaVersion: 1,
      successChecks: ['privacy_flags', 'dataset_counts', 'chat_record_safety', 'training_runbook_exists', 'post_training_checklist_exists'],
      errorFormat: 'json',
      validationErrorType: 'validation_error',
      validationErrorExitCode: 2,
    })
    expect(report.artifacts).toEqual({
      trainingRunbookPath: 'lora-training-runbook.zh-CN.md',
      postTrainingChecklistPath: 'lora-post-training-checklist.zh-CN.md',
    })
    expect(report.checks.map(check => check.id)).toContain('train_count_matches_config')
    expect(report.checks.map(check => check.id)).toContain('dry_run_contract_matches_script')
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'artifact_paths_are_safe_relative',
      status: 'pass',
    }))
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'record_schema_version_declared',
      status: 'pass',
    }))
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'record_schema_matches_config',
      status: 'pass',
    }))
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'jsonl_records_parseable',
      status: 'pass',
    }))
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'jsonl_records_safe',
      status: 'pass',
    }))
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'training_runbook_exists',
      status: 'pass',
    }))
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'post_training_checklist_exists',
      status: 'pass',
    }))
    expect(JSON.stringify(report)).not.toContain('AIRI style learning')
  })

  it('rejects a package when the training runbook is missing', async () => {
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
    await unlink(join(outputDir, 'lora-training-runbook.zh-CN.md'))

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'training_runbook_exists',
      status: 'fail',
    }))
    expect(JSON.stringify(report)).not.toContain('AIRI style learning')
  })

  it('rejects a package when the post-training checklist is missing', async () => {
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
    await unlink(join(outputDir, 'lora-post-training-checklist.zh-CN.md'))

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'post_training_checklist_exists',
      status: 'fail',
    }))
    expect(JSON.stringify(report)).not.toContain('AIRI style learning')
  })

  it('rejects a package when train count no longer matches the config', async () => {
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
    const configPath = join(outputDir, 'lora-training-config.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      dataset: {
        trainCount: number
      }
    }

    config.dataset.trainCount = 99
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'train_count_matches_config',
      status: 'fail',
    }))
  })

  it('rejects a package when the external script dry-run contract is stale', async () => {
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
    const configPath = join(outputDir, 'lora-training-config.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      dryRunContract: {
        validationErrorExitCode: number
      }
    }

    config.dryRunContract.validationErrorExitCode = 1
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.dryRunContract?.validationErrorExitCode).toBe(1)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'dry_run_contract_matches_script',
      status: 'fail',
    }))
  })

  it('rejects a package when the external script dry-run contract contains unknown success checks', async () => {
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
    const configPath = join(outputDir, 'lora-training-config.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      dryRunContract: {
        successChecks: string[]
      }
    }

    config.dryRunContract.successChecks.push('unknown_check')
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'dry_run_contract_matches_script',
      status: 'fail',
    }))
  })

  it('rejects a package when artifact paths escape the export directory', async () => {
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
    const configPath = join(outputDir, 'lora-training-config.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      artifacts: {
        postTrainingChecklistPath: string
      }
    }

    config.artifacts.postTrainingChecklistPath = '../lora-post-training-checklist.zh-CN.md'
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'artifact_paths_are_safe_relative',
      status: 'fail',
    }))
  })

  it('rejects a package when the LoRA record schema version is stale', async () => {
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
    const configPath = join(outputDir, 'lora-training-config.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      dataset: {
        recordSchemaVersion: number
      }
    }

    config.dataset.recordSchemaVersion = 0
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'record_schema_version_declared',
      status: 'fail',
    }))
  })

  it('rejects a package when JSONL records do not match the configured record schema', async () => {
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
    const trainPath = join(outputDir, 'lora-dataset-train.jsonl')
    const lines = (await readFile(trainPath, 'utf8')).trim().split('\n')
    const firstRecord = JSON.parse(lines[0]) as { schemaVersion: number }
    firstRecord.schemaVersion = 0
    lines[0] = JSON.stringify(firstRecord)
    await writeFile(trainPath, `${lines.join('\n')}\n`, 'utf8')

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'record_schema_matches_config',
      status: 'fail',
    }))
    expect(JSON.stringify(report)).not.toContain('AIRI style learning')
  })

  it('rejects a package when JSONL records are malformed', async () => {
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
    await writeFile(join(outputDir, 'lora-dataset-train.jsonl'), '{"messages": [}\n', 'utf8')

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'jsonl_records_parseable',
      status: 'fail',
    }))
    expect(JSON.stringify(report)).not.toContain('AIRI style learning')
  })

  it('rejects a package when JSONL records contain unsafe chat content', async () => {
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
    const trainPath = join(outputDir, 'lora-dataset-train.jsonl')
    const lines = (await readFile(trainPath, 'utf8')).trim().split('\n')
    const firstRecord = JSON.parse(lines[0]) as { messages: Array<{ role: string, content: string }> }
    firstRecord.messages[2]!.content = 'Reviewed candidate mentions [微信] and api_key=sk-local-training-secret.'
    lines[0] = JSON.stringify(firstRecord)
    await writeFile(trainPath, `${lines.join('\n')}\n`, 'utf8')

    const report = await validateLoraTrainingPackage({ outputDir })

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'jsonl_records_safe',
      status: 'fail',
    }))
    expect(JSON.stringify(report)).not.toContain('sk-local-training-secret')
  })
})

function readyMemory(id: string): ElectronMemoryItem {
  return {
    id,
    scope: 'user',
    type: 'note',
    content: `This is a sanitized LoRA training candidate for ${id}, with enough detail for AIRI style learning.`,
    summary: null,
    tags: [],
    importance: 3,
    privacy: 'public',
    sourceType: 'manual',
    sourceId: null,
    status: 'active',
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: { loraDatasetCandidate: true },
  }
}
