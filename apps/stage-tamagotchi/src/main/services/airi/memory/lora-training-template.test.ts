import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)

describe('lora training script template', () => {
  const templateDir = join(process.cwd(), 'scripts/training/gemma-qlora')
  const scriptPath = join(templateDir, 'train_gemma_qlora_unsloth.py')
  const readmePath = join(templateDir, 'README.zh-CN.md')
  const modelCardPath = join(templateDir, 'MODEL_CARD_TEMPLATE.zh-CN.md')
  const deploymentPath = join(templateDir, 'DEPLOYMENT.zh-CN.md')
  let outputDir: string

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'airi-lora-template-'))
  })

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true })
  })

  it('documents and guards the external Unsloth TRL QLoRA path', async () => {
    const script = await readFile(scriptPath, 'utf8')
    const readme = await readFile(readmePath, 'utf8')
    const modelCard = await readFile(modelCardPath, 'utf8')
    const deployment = await readFile(deploymentPath, 'utf8')

    expect(script).toContain('# /// script')
    expect(script).toContain('unsloth')
    expect(script).toContain('FastLanguageModel')
    expect(script).toContain('SFTTrainer')
    expect(script).toContain('SFTConfig')
    expect(script).toContain('Dataset.from_list')
    expect(script).toContain('lora-training-config.json')
    expect(script).toContain('processing_class=tokenizer')
    expect(script).toContain('assistant_only_loss=True')
    expect(script).toContain('--dry-run')
    expect(script).toContain('validate_privacy_flags')
    expect(script).toContain('validate_artifact_config')
    expect(script).toContain('validate_training_package')
    expect(script).toContain('containsRawChatImports')
    expect(script).toContain('containsBlockedMemoryContent')
    expect(script).toContain('containsSourceMetadataPaths')
    expect(script).toContain('requiresHumanApprovalBeforeTraining')
    expect(script).not.toMatch(/\nfrom datasets import/)
    expect(script).not.toMatch(/\nfrom trl import/)
    expect(script).not.toMatch(/\nfrom unsloth import/)
    expect(script).not.toContain('subprocess')

    expect(readme).toContain('uv run')
    expect(readme).toContain('validateLoraTrainingPackage')
    expect(readme).toContain('lora-training-config.json')
    expect(readme).toContain('lora-dataset-train.jsonl')
    expect(readme).toContain('lora-dataset-eval.jsonl')
    expect(readme).toContain('Unsloth')
    expect(readme).toContain('TRL')
    expect(readme).toContain('QLoRA')
    expect(readme).toContain('本地运行')
    expect(readme).toContain('隐私要求')
    expect(readme).toContain('recordSchemaVersion')
    expect(readme).toContain('schemaVersion')
    expect(readme).toContain('jsonl_records_parseable')
    expect(readme).toContain('record_schema_matches_config')
    expect(readme).toContain('lora-training-config.json.artifacts')
    expect(readme).toContain('artifacts.postTrainingChecklistPath')
    expect(readme).toContain('"artifacts": { "trainingRunbookPath": "lora-training-runbook.zh-CN.md", "postTrainingChecklistPath": "lora-post-training-checklist.zh-CN.md" }')
    expect(readme).toContain('MODEL_CARD_TEMPLATE.zh-CN.md')
    expect(readme).toContain('DEPLOYMENT.zh-CN.md')
    expect(readme).toContain('lora-post-training-checklist.zh-CN.md')
    expect(readme).not.toMatch(/[\uE000-\uF8FF]/u)

    expect(modelCard).toContain('lora-training-config.json')
    expect(modelCard).toContain('privacy gates')
    expect(modelCard).toContain('train/eval')
    expect(modelCard).toContain('评估')
    expect(modelCard).toContain('局限性')
    expect(modelCard).toContain('no raw chat imports')
    expect(modelCard).toContain('recordSchemaVersion')
    expect(modelCard).toContain('schemaVersion')
    expect(modelCard).toContain('jsonl_records_parseable')
    expect(modelCard).toContain('record_schema_matches_config')
    expect(modelCard).toContain('training_runbook_exists')
    expect(modelCard).toContain('post_training_checklist_exists')
    expect(modelCard).toContain('lora-post-training-checklist.zh-CN.md')
    expect(modelCard).not.toMatch(/[\uE000-\uF8FF]/u)

    expect(deployment).toContain('PEFT')
    expect(deployment).toContain('adapter')
    expect(deployment).toContain('GGUF')
    expect(deployment).toContain('Ollama')
    expect(deployment).toContain('LM Studio')
    expect(deployment).toContain('vLLM')
    expect(deployment).toContain('OpenAI-compatible')
    expect(deployment).toContain('agent-chat-runtime-config.json')
    expect(deployment).toContain('本地部署说明')
    expect(deployment).toContain('接回 AIRI')
    expect(deployment).toContain('MODEL_CARD_TEMPLATE.zh-CN.md')
    expect(deployment).toContain('recordSchemaVersion')
    expect(deployment).toContain('schemaVersion')
    expect(deployment).toContain('jsonl_records_parseable')
    expect(deployment).toContain('record_schema_matches_config')
    expect(deployment).toContain('training_runbook_exists')
    expect(deployment).toContain('post_training_checklist_exists')
    expect(deployment).toContain('lora-post-training-checklist.zh-CN.md')
    expect(deployment).not.toMatch(/[\uE000-\uF8FF]/u)
  })

  it('dry-runs a minimal exported package without importing training dependencies', async () => {
    await writeMinimalTrainingPackage(outputDir)

    const { stdout } = await execFileAsync('python', [
      scriptPath,
      '--config',
      join(outputDir, 'lora-training-config.json'),
      '--dry-run',
    ])
    const report = JSON.parse(stdout) as {
      schemaVersion: number
      ok: boolean
      checks: string[]
      counts: {
        candidates: number
        train: number
        eval: number
      }
      artifacts: {
        trainingRunbookPath: string
        postTrainingChecklistPath: string
      }
    }

    expect(report).toEqual({
      schemaVersion: 1,
      ok: true,
      checks: [
        'privacy_flags',
        'dataset_counts',
        'chat_record_safety',
        'training_runbook_exists',
        'post_training_checklist_exists',
      ],
      counts: {
        candidates: 1,
        train: 1,
        eval: 0,
      },
      artifacts: {
        trainingRunbookPath: 'lora-training-runbook.zh-CN.md',
        postTrainingChecklistPath: 'lora-post-training-checklist.zh-CN.md',
      },
    })
  })

  it('rejects local path leakage during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir, {
      assistantContent: 'User keeps private interview notes in F:/private/interview.md and this must not train.',
    })

    await expect(execFileAsync('python', [
      scriptPath,
      '--config',
      join(outputDir, 'lora-training-config.json'),
      '--dry-run',
    ])).rejects.toMatchObject({
      stderr: expect.stringContaining('possible local path'),
    })
  })

  it('rejects credentials during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir, {
      assistantContent: 'Reviewed candidate still contains api_key=sk-local-training-secret.',
    })

    await expect(execFileAsync('python', [
      scriptPath,
      '--config',
      join(outputDir, 'lora-training-config.json'),
      '--dry-run',
      '--error-format',
      'json',
    ])).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining('possible credential'),
    })
  })

  it('rejects raw chat markers during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir, {
      assistantContent: 'Reviewed candidate still contains [微信] raw chat material.',
    })

    await expect(execFileAsync('python', [
      scriptPath,
      '--config',
      join(outputDir, 'lora-training-config.json'),
      '--dry-run',
    ])).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining('raw chat archive marker'),
    })
  })

  it('reports malformed JSONL with file and line during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir)
    await writeFile(join(outputDir, 'lora-dataset-train.jsonl'), '{"messages": [}\n', 'utf8')

    const dryRun = execFileAsync('python', [
      scriptPath,
      '--config',
      join(outputDir, 'lora-training-config.json'),
      '--dry-run',
    ])

    await expect(dryRun).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining('ERROR: Invalid JSONL at'),
    })
    await expect(dryRun).rejects.toMatchObject({
      stderr: expect.not.stringContaining('Traceback'),
    })
  })

  it('can report validation errors as JSON for orchestrator parsing', async () => {
    await writeMinimalTrainingPackage(outputDir)
    await writeFile(join(outputDir, 'lora-dataset-train.jsonl'), '{"messages": [}\n', 'utf8')

    let error: { code?: number, stderr: string }
    try {
      await execFileAsync('python', [
        scriptPath,
        '--config',
        join(outputDir, 'lora-training-config.json'),
        '--dry-run',
        '--error-format',
        'json',
      ])
      throw new Error('Expected dry-run to reject malformed JSONL')
    }
    catch (caught) {
      error = caught as { code?: number, stderr: string }
    }

    expect(error.code).toBe(2)
    expect(error.stderr).not.toContain('Traceback')
    const report = JSON.parse(error.stderr) as {
      ok: boolean
      error: {
        type: string
        message: string
      }
    }
    expect(report).toEqual({
      ok: false,
      error: {
        type: 'validation_error',
        message: expect.stringContaining('Invalid JSONL at'),
      },
    })
  })

  it('rejects stale dry-run contract metadata during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir, {
      dryRunContract: {
        validationErrorExitCode: 1,
      },
    })

    let error: { code?: number, stderr: string }
    try {
      await execFileAsync('python', [
        scriptPath,
        '--config',
        join(outputDir, 'lora-training-config.json'),
        '--dry-run',
        '--error-format',
        'json',
      ])
      throw new Error('Expected dry-run to reject stale dry-run contract')
    }
    catch (caught) {
      error = caught as { code?: number, stderr: string }
    }

    expect(error.code).toBe(2)
    const report = JSON.parse(error.stderr) as {
      ok: boolean
      error: {
        type: string
        message: string
      }
    }
    expect(report).toEqual({
      ok: false,
      error: {
        type: 'validation_error',
        message: expect.stringContaining('dry-run contract'),
      },
    })
  })

  it('rejects unknown dry-run success checks during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir, {
      dryRunContract: {
        successChecks: [
          'privacy_flags',
          'dataset_counts',
          'chat_record_safety',
          'training_runbook_exists',
          'post_training_checklist_exists',
          'unknown_check',
        ],
      },
    })

    let error: { code?: number, stderr: string }
    try {
      await execFileAsync('python', [
        scriptPath,
        '--config',
        join(outputDir, 'lora-training-config.json'),
        '--dry-run',
        '--error-format',
        'json',
      ])
      throw new Error('Expected dry-run to reject unknown success checks')
    }
    catch (caught) {
      error = caught as { code?: number, stderr: string }
    }

    expect(error.code).toBe(2)
    const report = JSON.parse(error.stderr) as {
      ok: boolean
      error: {
        type: string
        message: string
      }
    }
    expect(report).toEqual({
      ok: false,
      error: {
        type: 'validation_error',
        message: expect.stringContaining('dry-run contract'),
      },
    })
  })

  it('rejects packages missing the training runbook during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir)
    await unlink(join(outputDir, 'lora-training-runbook.zh-CN.md'))

    let error: { code?: number, stderr: string }
    try {
      await execFileAsync('python', [
        scriptPath,
        '--config',
        join(outputDir, 'lora-training-config.json'),
        '--dry-run',
        '--error-format',
        'json',
      ])
      throw new Error('Expected dry-run to reject missing training runbook')
    }
    catch (caught) {
      error = caught as { code?: number, stderr: string }
    }

    expect(error.code).toBe(2)
    const report = JSON.parse(error.stderr) as {
      ok: boolean
      error: {
        type: string
        message: string
      }
    }
    expect(report).toEqual({
      ok: false,
      error: {
        type: 'validation_error',
        message: expect.stringContaining('training runbook'),
      },
    })
  })

  it('rejects stale LoRA record schema metadata during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir, {
      recordSchemaVersion: 0,
    })

    let error: { code?: number, stderr: string }
    try {
      await execFileAsync('python', [
        scriptPath,
        '--config',
        join(outputDir, 'lora-training-config.json'),
        '--dry-run',
        '--error-format',
        'json',
      ])
      throw new Error('Expected dry-run to reject stale record schema')
    }
    catch (caught) {
      error = caught as { code?: number, stderr: string }
    }

    expect(error.code).toBe(2)
    const report = JSON.parse(error.stderr) as {
      ok: boolean
      error: {
        type: string
        message: string
      }
    }
    expect(report).toEqual({
      ok: false,
      error: {
        type: 'validation_error',
        message: expect.stringContaining('record schema'),
      },
    })
  })

  it('rejects packages missing the post-training checklist during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir)
    await unlink(join(outputDir, 'lora-post-training-checklist.zh-CN.md'))

    let error: { code?: number, stderr: string }
    try {
      await execFileAsync('python', [
        scriptPath,
        '--config',
        join(outputDir, 'lora-training-config.json'),
        '--dry-run',
        '--error-format',
        'json',
      ])
      throw new Error('Expected dry-run to reject missing post-training checklist')
    }
    catch (caught) {
      error = caught as { code?: number, stderr: string }
    }

    expect(error.code).toBe(2)
    const report = JSON.parse(error.stderr) as {
      ok: boolean
      error: {
        type: string
        message: string
      }
    }
    expect(report).toEqual({
      ok: false,
      error: {
        type: 'validation_error',
        message: expect.stringContaining('post-training checklist'),
      },
    })
  })

  it('uses config artifact paths for the post-training checklist during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir, {
      artifacts: {
        trainingRunbookPath: 'handoff/lora-training-runbook.zh-CN.md',
        postTrainingChecklistPath: 'handoff/lora-post-training-checklist.zh-CN.md',
      },
    })
    await unlink(join(outputDir, 'lora-post-training-checklist.zh-CN.md'))

    const { stdout } = await execFileAsync('python', [
      scriptPath,
      '--config',
      join(outputDir, 'lora-training-config.json'),
      '--dry-run',
    ])

    const report = JSON.parse(stdout) as {
      ok: boolean
      checks: string[]
    }
    expect(report.ok).toBe(true)
    expect(report.checks).toContain('post_training_checklist_exists')
  })

  it('rejects unsafe artifact paths during script dry-run', async () => {
    await writeMinimalTrainingPackage(outputDir, {
      artifacts: {
        trainingRunbookPath: '../lora-training-runbook.zh-CN.md',
        postTrainingChecklistPath: 'lora-post-training-checklist.zh-CN.md',
      },
    })

    let error: { code?: number, stderr: string }
    try {
      await execFileAsync('python', [
        scriptPath,
        '--config',
        join(outputDir, 'lora-training-config.json'),
        '--dry-run',
        '--error-format',
        'json',
      ])
      throw new Error('Expected dry-run to reject unsafe artifact paths')
    }
    catch (caught) {
      error = caught as { code?: number, stderr: string }
    }

    expect(error.code).toBe(2)
    const report = JSON.parse(error.stderr) as {
      ok: boolean
      error: {
        type: string
        message: string
      }
    }
    expect(report).toEqual({
      ok: false,
      error: {
        type: 'validation_error',
        message: expect.stringContaining('artifact path'),
      },
    })
  })
})

async function writeMinimalTrainingPackage(outputDir: string, options: {
  assistantContent?: string
  recordSchemaVersion?: number
  artifacts?: Partial<{
    trainingRunbookPath: string
    postTrainingChecklistPath: string
  }>
  dryRunContract?: Partial<{
    successSchemaVersion: number
    successChecks: string[]
    errorFormat: string
    validationErrorType: string
    validationErrorExitCode: number
  }>
} = {}) {
  const record = {
    id: 'lora-memory-1',
    schemaVersion: options.recordSchemaVersion ?? 1,
    kind: 'memory_recall',
    sourceMemoryId: 'memory-1',
    sourceType: 'manual',
    memoryType: 'note',
    tags: [],
    messages: [
      { role: 'system', content: 'You are AIRI.' },
      { role: 'user', content: 'Remember this approved memory.' },
      { role: 'assistant', content: options.assistantContent ?? 'AIRI should ask before risky desktop actions.' },
    ],
  }
  const config = {
    dataset: {
      candidatesPath: 'lora-dataset-candidates.jsonl',
      trainPath: 'lora-dataset-train.jsonl',
      evalPath: 'lora-dataset-eval.jsonl',
      recordSchemaVersion: 1,
      candidateCount: 1,
      trainCount: 1,
      evalCount: 0,
    },
    privacy: {
      containsRawChatImports: false,
      containsBlockedMemoryContent: false,
      containsSourceMetadataPaths: false,
      requiresHumanApprovalBeforeTraining: true,
    },
    dryRunContract: {
      successSchemaVersion: 1,
      successChecks: [
        'privacy_flags',
        'dataset_counts',
        'chat_record_safety',
        'training_runbook_exists',
        'post_training_checklist_exists',
      ],
      errorFormat: 'json',
      validationErrorType: 'validation_error',
      validationErrorExitCode: 2,
      ...options.dryRunContract,
    },
    artifacts: {
      trainingRunbookPath: 'lora-training-runbook.zh-CN.md',
      postTrainingChecklistPath: 'lora-post-training-checklist.zh-CN.md',
      ...options.artifacts,
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
  }

  await writeFile(join(outputDir, 'lora-training-config.json'), JSON.stringify(config, null, 2), 'utf8')
  await writeFile(join(outputDir, 'lora-dataset-candidates.jsonl'), `${JSON.stringify(record)}\n`, 'utf8')
  await writeFile(join(outputDir, 'lora-dataset-train.jsonl'), `${JSON.stringify(record)}\n`, 'utf8')
  await writeFile(join(outputDir, 'lora-dataset-eval.jsonl'), '', 'utf8')
  await writeFile(join(outputDir, 'lora-post-training-checklist.zh-CN.md'), '# AIRI-Gemma LoRA post-training checklist\n', 'utf8')
  await writeFile(join(outputDir, 'lora-training-runbook.zh-CN.md'), '# AIRI-Gemma LoRA training runbook\n', 'utf8')

  if (options.artifacts?.postTrainingChecklistPath?.startsWith('handoff/')) {
    await mkdir(join(outputDir, 'handoff'), { recursive: true })
    await writeFile(join(outputDir, options.artifacts.postTrainingChecklistPath), '# AIRI-Gemma LoRA post-training checklist\n', 'utf8')
  }

  if (options.artifacts?.trainingRunbookPath?.startsWith('handoff/')) {
    await mkdir(join(outputDir, 'handoff'), { recursive: true })
    await writeFile(join(outputDir, options.artifacts.trainingRunbookPath), '# AIRI-Gemma LoRA training runbook\n', 'utf8')
  }
}
