import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { createMemoryExportPreflightReport, isMemoryAllowedForExport } from './export-preflight'

export interface LoraDatasetCandidateExportRequest {
  memories: ElectronMemoryItem[]
  outputDir: string
}

export interface LoraDatasetCandidateExportResult {
  outputDir: string
  files: Array<{
    relativePath: string
    path: string
    count: number
  }>
  exportedAt: string
}

interface LoraDatasetCandidateRecord {
  id: string
  schemaVersion: 1
  kind: 'memory_recall'
  sourceMemoryId: string
  sourceType: string
  memoryType: ElectronMemoryItem['type']
  tags: string[]
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
}

type LoraDatasetQualityReason = 'missing_assistant_content' | 'possible_local_path' | 'too_short'

interface LoraDatasetCandidateManifest {
  exportedAt: string
  recordCount: number
  records: Array<{
    id: string
    sourceMemoryId: string
    sourceType: string
    memoryType: ElectronMemoryItem['type']
    tags: string[]
    quality: {
      status: 'ready'
      reasons: []
    }
  }>
  preflight: {
    summary: {
      total: number
      allowed: number
      blocked: number
    }
    blocked: Array<{
      id: string
      type: ElectronMemoryItem['type']
      privacy: ElectronMemoryItem['privacy']
      sourceType: string
      status: ElectronMemoryItem['status']
      reasons: string[]
    }>
  }
  quality: {
    summary: {
      allowedByPreflight: number
      ready: number
      needsReview: number
    }
    needsReview: Array<{
      id: string
      sourceMemoryId: string
      sourceType: string
      memoryType: ElectronMemoryItem['type']
      tags: string[]
      reasons: LoraDatasetQualityReason[]
    }>
  }
  split: {
    strategy: 'deterministic_tail_eval_v1'
    trainCount: number
    evalCount: number
    trainSourceMemoryIds: string[]
    evalSourceMemoryIds: string[]
  }
}

interface LoraTrainingConfig {
  schemaVersion: 1
  task: 'chat_companion_memory_sft'
  exportedAt: string
  dataset: {
    format: 'chat_messages_jsonl'
    recordSchemaVersion: 1
    candidatesPath: string
    trainPath: string
    evalPath: string
    manifestPath: string
    candidateCount: number
    trainCount: number
    evalCount: number
  }
  split: {
    strategy: LoraDatasetCandidateManifest['split']['strategy']
  }
  artifacts: {
    trainingRunbookPath: string
    postTrainingChecklistPath: string
  }
  model: {
    baseModelFamily: 'gemma'
    finetuningMethod: 'qlora'
  }
  qloraDefaults: {
    loadIn4bit: true
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
    successSchemaVersion: 1
    successChecks: string[]
    errorFormat: 'json'
    validationErrorType: 'validation_error'
    validationErrorExitCode: 2
  }
  privacy: {
    containsRawChatImports: false
    containsBlockedMemoryContent: false
    containsSourceMetadataPaths: false
    requiresHumanApprovalBeforeTraining: true
  }
}

interface QualityCheckedRecord {
  record: LoraDatasetCandidateRecord
  quality: {
    status: 'needs_review' | 'ready'
    reasons: LoraDatasetQualityReason[]
  }
}

interface LoraDatasetSplit {
  train: LoraDatasetCandidateRecord[]
  eval: LoraDatasetCandidateRecord[]
}

const localPathPattern = /[A-Za-z]:[\\/]|\/(?:Users|home|mnt|private|var|tmp)\//

function toCandidateRecord(memory: ElectronMemoryItem): LoraDatasetCandidateRecord {
  return {
    id: `lora-${memory.id}`,
    schemaVersion: 1,
    kind: 'memory_recall',
    sourceMemoryId: memory.id,
    sourceType: memory.sourceType,
    memoryType: memory.type,
    tags: memory.tags,
    messages: [
      {
        role: 'system',
        content: 'You are AIRI, a local companion and desktop assistant. Use only approved sanitized memory.',
      },
      {
        role: 'user',
        content: 'Update your understanding of the user from this approved memory.',
      },
      {
        role: 'assistant',
        content: memory.content,
      },
    ],
  }
}

function getAssistantContent(record: LoraDatasetCandidateRecord) {
  return record.messages.find(message => message.role === 'assistant')?.content.trim() ?? ''
}

function assessCandidateRecordQuality(record: LoraDatasetCandidateRecord): QualityCheckedRecord['quality'] {
  const assistantContent = getAssistantContent(record)
  const reasons: LoraDatasetQualityReason[] = []

  if (!assistantContent)
    reasons.push('missing_assistant_content')
  else if (assistantContent.length < 40)
    reasons.push('too_short')

  if (localPathPattern.test(assistantContent))
    reasons.push('possible_local_path')

  return {
    status: reasons.length === 0 ? 'ready' : 'needs_review',
    reasons,
  }
}

function splitReadyRecords(records: LoraDatasetCandidateRecord[]): LoraDatasetSplit {
  if (records.length < 5) {
    return {
      train: records,
      eval: [],
    }
  }

  const evalCount = Math.max(1, Math.floor(records.length * 0.2))
  const trainCount = records.length - evalCount

  return {
    train: records.slice(0, trainCount),
    eval: records.slice(trainCount),
  }
}

function toTrainingConfig(params: {
  exportedAt: string
  readyRecordCount: number
  split: LoraDatasetSplit
  candidatesRelativePath: string
  trainRelativePath: string
  evalRelativePath: string
  manifestRelativePath: string
  trainingRunbookRelativePath: string
  postTrainingChecklistRelativePath: string
}): LoraTrainingConfig {
  return {
    schemaVersion: 1,
    task: 'chat_companion_memory_sft',
    exportedAt: params.exportedAt,
    dataset: {
      format: 'chat_messages_jsonl',
      recordSchemaVersion: 1,
      candidatesPath: params.candidatesRelativePath,
      trainPath: params.trainRelativePath,
      evalPath: params.evalRelativePath,
      manifestPath: params.manifestRelativePath,
      candidateCount: params.readyRecordCount,
      trainCount: params.split.train.length,
      evalCount: params.split.eval.length,
    },
    split: {
      strategy: 'deterministic_tail_eval_v1',
    },
    artifacts: {
      trainingRunbookPath: params.trainingRunbookRelativePath,
      postTrainingChecklistPath: params.postTrainingChecklistRelativePath,
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
    gates: {
      exportPreflight: [
        'active_status',
        'non_sensitive_privacy',
        'no_raw_chat_imports',
        'explicit_training_visibility',
        'no_demo_only_profile',
      ],
      quality: [
        'assistant_content_required',
        'minimum_assistant_content_length',
        'no_local_path_leakage',
      ],
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
    },
    privacy: {
      containsRawChatImports: false,
      containsBlockedMemoryContent: false,
      containsSourceMetadataPaths: false,
      requiresHumanApprovalBeforeTraining: true,
    },
  }
}

function toTrainingRunbook(config: LoraTrainingConfig): string {
  return [
    '# AIRI-Gemma LoRA 训练交接说明',
    '',
    '这份文件说明如何把当前导出的 LoRA 数据包交给后续训练脚本使用。AIRI 桌面端只负责导出、预检和 dry-run，不会在桌面端直接启动训练。',
    '',
    '## 产物清单',
    '',
    '- 配置文件：`lora-training-config.json`',
    `- 完整候选池：\`${config.dataset.candidatesPath}\`，共 ${config.dataset.candidateCount} 条 ready 样本`,
    `- 训练集：\`${config.dataset.trainPath}\`，共 ${config.dataset.trainCount} 条`,
    `- 验证集：\`${config.dataset.evalPath}\`，共 ${config.dataset.evalCount} 条`,
    `- 治理清单：\`${config.dataset.manifestPath}\``,
    '',
    '## 训练前检查',
    '',
    '在任何 Unsloth / TRL 训练脚本读取数据前，先运行 AIRI 的 `validateLoraTrainingPackage` dry-run。它会检查：',
    '',
    '- dataset 路径是否是安全相对路径',
    '- candidates/train/eval/manifest 文件是否存在',
    '- JSONL 行数是否与 `lora-training-config.json` 一致',
    '- manifest split 是否与 config 一致',
    '- 隐私门禁和质量门禁是否满足训练前要求',
    '',
    'dry-run 报告只展示检查项、数量、状态和训练交接文件路径，不展示样本正文。',
    `- \`validateLoraTrainingPackage\` 返回值会包含 \`artifacts.trainingRunbookPath = ${config.artifacts.trainingRunbookPath}\`。`,
    `- \`validateLoraTrainingPackage\` 返回值会包含 \`artifacts.postTrainingChecklistPath = ${config.artifacts.postTrainingChecklistPath}\`。`,
    '',
    '### 记录格式版本',
    '',
    `- config 声明：\`dataset.recordSchemaVersion = ${config.dataset.recordSchemaVersion}\``,
    '- 每条 JSONL 训练记录都必须声明 `schemaVersion`，并与 config 中的 `recordSchemaVersion` 一致。',
    '- AIRI dry-run 会用 `jsonl_records_parseable` 检查 JSONL 行是否能解析为 JSON object。',
    '- AIRI dry-run 会用 `record_schema_matches_config` 检查记录版本是否与 config 一致。',
    '',
    '## QLoRA 默认建议',
    '',
    `- base model family：${config.model.baseModelFamily}`,
    `- fine-tuning method：${config.model.finetuningMethod}`,
    `- 4bit：${config.qloraDefaults.loadIn4bit ? 'true' : 'false'}`,
    `- LoRA rank：${config.qloraDefaults.loraRank}`,
    `- LoRA alpha：${config.qloraDefaults.loraAlpha}`,
    `- LoRA dropout：${config.qloraDefaults.loraDropout}`,
    `- sequence length：${config.qloraDefaults.sequenceLength}`,
    `- learning rate：${config.qloraDefaults.learningRate}`,
    `- epochs：${config.qloraDefaults.epochs}`,
    '',
    '这些参数是保守起点，不是最终最佳参数。正式训练前应根据显存、样本规模和目标 Gemma 版本调整。',
    '',
    '## 后续训练脚本接入方式',
    '',
    '推荐单独准备一个训练环境，然后让脚本读取 `lora-training-config.json`：',
    '',
    '```bash',
    'python train_gemma_qlora.py --config lora-training-config.json',
    '```',
    '',
    '训练脚本可以选择 Unsloth 或 Hugging Face TRL。脚本应读取 config 中的 train/eval 路径，不要硬编码数据文件名。',
    '',
    '## 仓库模板',
    '',
    '如果你在 AIRI-Gemma 仓库内继续训练，可以从这些模板开始：',
    '',
    '- 训练脚本：`scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`',
    '- 模型卡模板：`scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md`',
    '- 本地部署说明：`scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md`',
    '',
    '示例命令：',
    '',
    '```bash',
    'uv run scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py --config lora-training-config.json',
    '```',
    '',
    '脚本侧 dry-run 可以先验证导出包，并输出机器可读结果：',
    '',
    '```bash',
    'uv run scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py --config lora-training-config.json --dry-run --error-format json',
    '```',
    '',
    '成功时 stdout 形如：',
    '',
    '```json',
    '{"schemaVersion":1,"ok":true,"checks":["privacy_flags","dataset_counts","chat_record_safety","training_runbook_exists","post_training_checklist_exists"],"counts":{"candidates":2,"train":2,"eval":0},"artifacts":{"trainingRunbookPath":"lora-training-runbook.zh-CN.md","postTrainingChecklistPath":"lora-post-training-checklist.zh-CN.md"}}',
    '```',
    '',
    '预期内的数据错误会以退出码 2 结束，并向 stderr 写入：',
    '',
    '```json',
    '{"ok":false,"error":{"type":"validation_error","message":"..."}}',
    '```',
    '',
    '同一契约也写入 `lora-training-config.json` 的 `dryRunContract` 字段，便于前端或编排器直接读取。',
    '',
    '训练完成后，先填写模型卡，再按部署说明把 PEFT adapter / GGUF 接到 Ollama、LM Studio 或 vLLM，最后在 AIRI 的 `agent-chat-runtime-config.json` 中配置本地 OpenAI-compatible endpoint。',
    '',
    '## 隐私门禁',
    '',
    '当前导出包声明：',
    '',
    `- containsRawChatImports：${config.privacy.containsRawChatImports}`,
    `- containsBlockedMemoryContent：${config.privacy.containsBlockedMemoryContent}`,
    `- containsSourceMetadataPaths：${config.privacy.containsSourceMetadataPaths}`,
    `- requiresHumanApprovalBeforeTraining：${config.privacy.requiresHumanApprovalBeforeTraining}`,
    '',
    '如果任一隐私状态不符合预期，应停止训练，回到 Memory Review / export preflight / quality gate 流程重新处理数据。',
    '',
  ].join('\n')
}

function toPostTrainingChecklist(config: LoraTrainingConfig): string {
  return [
    '# AIRI-Gemma LoRA 训练后检查清单',
    '',
    '这份清单跟随当前 LoRA 导出包一起生成，用于训练完成后的模型卡、部署和公开发布审计。它只记录文件契约、检查项和数量，不包含任何训练样本正文。',
    '',
    '## 需要填写的仓库模板',
    '',
    '- `scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md`：记录 base model、adapter 路径、训练数据版本、schema 版本和评估结果。',
    '- `scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md`：记录 PEFT adapter、GGUF、Ollama、LM Studio、vLLM 或 OpenAI-compatible endpoint 的部署检查。',
    '',
    '## 当前导出包契约',
    '',
    `- dataset format: \`${config.dataset.format}\``,
    `- recordSchemaVersion: \`${config.dataset.recordSchemaVersion}\``,
    '- 每条 JSONL 训练记录必须包含同版本 `schemaVersion`。',
    `- train records: \`${config.dataset.trainCount}\``,
    `- eval records: \`${config.dataset.evalCount}\``,
    `- candidates records: \`${config.dataset.candidateCount}\``,
    `- dryRunContract.successChecks: \`${config.dryRunContract.successChecks.join(', ')}\``,
    '- `successChecks` must exactly match the external script contract. If an unknown success check appears, regenerate the package from AIRI instead of editing JSON by hand.',
    '',
    '## 必须保留的 dry-run 证据',
    '',
    '- AIRI app-side: `validateLoraTrainingPackage`。',
    '- AIRI app-side check: `jsonl_records_parseable`。',
    '- AIRI app-side check: `record_schema_matches_config`。',
    `- AIRI app-side artifacts: \`${config.artifacts.trainingRunbookPath}\`, \`${config.artifacts.postTrainingChecklistPath}\`。`,
    '- External script: `uv run scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py --config lora-training-config.json --dry-run --error-format json`。',
    '- External script check: `chat_record_safety`。',
    '- External script check: `training_runbook_exists`。',
    '- External script check: `post_training_checklist_exists`。',
    '',
    '## 部署前门禁',
    '',
    '- 模型卡必须说明数据来源为 approved/sanitized local memory，不允许包含原始微信、飞书、QQ 或私有知识库正文。',
    '- 公开发布前必须标记为 `public-safe`，并再次确认 adapter、README、模型卡和示例配置不会泄露本地路径或聊天原文。',
    '- AIRI 本地接入时，在 `agent-chat-runtime-config.json` 中配置 OpenAI-compatible endpoint 或本地 runtime，不把训练包路径写入公开配置。',
    '',
  ].join('\n')
}

function toManifest(qualityCheckedRecords: QualityCheckedRecord[], memories: ElectronMemoryItem[], exportedAt: string, split: LoraDatasetSplit): LoraDatasetCandidateManifest {
  const preflight = createMemoryExportPreflightReport({
    memories,
    surface: 'lora_dataset',
  })
  const readyRecords = qualityCheckedRecords.filter(item => item.quality.status === 'ready')
  const needsReviewRecords = qualityCheckedRecords.filter(item => item.quality.status === 'needs_review')

  return {
    exportedAt,
    recordCount: readyRecords.length,
    records: readyRecords.map(({ record }) => ({
      id: record.id,
      sourceMemoryId: record.sourceMemoryId,
      sourceType: record.sourceType,
      memoryType: record.memoryType,
      tags: record.tags,
      quality: {
        status: 'ready',
        reasons: [],
      },
    })),
    preflight: {
      summary: preflight.summary,
      blocked: preflight.items
        .filter(item => !item.allowed)
        .map(item => ({
          id: item.id,
          type: item.type,
          privacy: item.privacy,
          sourceType: item.sourceType,
          status: item.status,
          reasons: item.reasons,
        })),
    },
    quality: {
      summary: {
        allowedByPreflight: qualityCheckedRecords.length,
        ready: readyRecords.length,
        needsReview: needsReviewRecords.length,
      },
      needsReview: needsReviewRecords.map(({ quality, record }) => ({
        id: record.id,
        sourceMemoryId: record.sourceMemoryId,
        sourceType: record.sourceType,
        memoryType: record.memoryType,
        tags: record.tags,
        reasons: quality.reasons,
      })),
    },
    split: {
      strategy: 'deterministic_tail_eval_v1',
      trainCount: split.train.length,
      evalCount: split.eval.length,
      trainSourceMemoryIds: split.train.map(record => record.sourceMemoryId),
      evalSourceMemoryIds: split.eval.map(record => record.sourceMemoryId),
    },
  }
}

export async function exportLoraDatasetCandidates(request: LoraDatasetCandidateExportRequest): Promise<LoraDatasetCandidateExportResult> {
  const exportedAt = new Date().toISOString()
  const qualityCheckedRecords = request.memories
    .filter(memory => isMemoryAllowedForExport(memory, 'lora_dataset'))
    .map(toCandidateRecord)
    .map(record => ({
      record,
      quality: assessCandidateRecordQuality(record),
    }))
  const readyRecords = qualityCheckedRecords
    .filter(item => item.quality.status === 'ready')
    .map(item => item.record)
  const split = splitReadyRecords(readyRecords)
  const manifest = toManifest(qualityCheckedRecords, request.memories, exportedAt, split)

  await mkdir(request.outputDir, { recursive: true })

  const relativePath = 'lora-dataset-candidates.jsonl'
  const path = join(request.outputDir, relativePath)
  const trainRelativePath = 'lora-dataset-train.jsonl'
  const trainPath = join(request.outputDir, trainRelativePath)
  const evalRelativePath = 'lora-dataset-eval.jsonl'
  const evalPath = join(request.outputDir, evalRelativePath)
  const manifestRelativePath = 'lora-dataset-manifest.json'
  const manifestPath = join(request.outputDir, manifestRelativePath)
  const trainingConfigRelativePath = 'lora-training-config.json'
  const trainingConfigPath = join(request.outputDir, trainingConfigRelativePath)
  const trainingRunbookRelativePath = 'lora-training-runbook.zh-CN.md'
  const trainingRunbookPath = join(request.outputDir, trainingRunbookRelativePath)
  const postTrainingChecklistRelativePath = 'lora-post-training-checklist.zh-CN.md'
  const postTrainingChecklistPath = join(request.outputDir, postTrainingChecklistRelativePath)
  const trainingConfig = toTrainingConfig({
    exportedAt,
    readyRecordCount: readyRecords.length,
    split,
    candidatesRelativePath: relativePath,
    trainRelativePath,
    evalRelativePath,
    manifestRelativePath,
    trainingRunbookRelativePath,
    postTrainingChecklistRelativePath,
  })
  const trainingRunbook = toTrainingRunbook(trainingConfig)
  const postTrainingChecklist = toPostTrainingChecklist(trainingConfig)
  const body = readyRecords.map(record => JSON.stringify(record)).join('\n')
  const trainBody = split.train.map(record => JSON.stringify(record)).join('\n')
  const evalBody = split.eval.map(record => JSON.stringify(record)).join('\n')

  await writeFile(path, body ? `${body}\n` : '', 'utf8')
  await writeFile(trainPath, trainBody ? `${trainBody}\n` : '', 'utf8')
  await writeFile(evalPath, evalBody ? `${evalBody}\n` : '', 'utf8')
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  await writeFile(trainingConfigPath, JSON.stringify(trainingConfig, null, 2), 'utf8')
  await writeFile(trainingRunbookPath, trainingRunbook, 'utf8')
  await writeFile(postTrainingChecklistPath, postTrainingChecklist, 'utf8')

  return {
    outputDir: request.outputDir,
    files: [
      { relativePath, path, count: readyRecords.length },
      { relativePath: trainRelativePath, path: trainPath, count: split.train.length },
      { relativePath: evalRelativePath, path: evalPath, count: split.eval.length },
      { relativePath: manifestRelativePath, path: manifestPath, count: readyRecords.length },
      { relativePath: trainingConfigRelativePath, path: trainingConfigPath, count: readyRecords.length },
      { relativePath: trainingRunbookRelativePath, path: trainingRunbookPath, count: readyRecords.length },
      { relativePath: postTrainingChecklistRelativePath, path: postTrainingChecklistPath, count: readyRecords.length },
    ],
    exportedAt,
  }
}
