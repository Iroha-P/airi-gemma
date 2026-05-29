import { readFile, stat } from 'node:fs/promises'
import { isAbsolute, join, normalize } from 'node:path'

export interface LoraTrainingDryRunRequest {
  outputDir: string
  configRelativePath?: string
}

export interface LoraTrainingDryRunCheck {
  id: string
  status: 'fail' | 'pass'
  message: string
}

export interface LoraTrainingDryRunContractSummary {
  successSchemaVersion: number
  successChecks: string[]
  errorFormat: string
  validationErrorType: string
  validationErrorExitCode: number
}

export interface LoraTrainingDryRunArtifactSummary {
  trainingRunbookPath: string
  postTrainingChecklistPath: string
}

export interface LoraTrainingDryRunResult {
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
  dryRunContract: LoraTrainingDryRunContractSummary | null
  artifacts: LoraTrainingDryRunArtifactSummary | null
  checks: LoraTrainingDryRunCheck[]
}

interface LoraTrainingConfigShape {
  dataset: {
    candidatesPath: string
    trainPath: string
    evalPath: string
    manifestPath: string
    recordSchemaVersion: number
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
  gates: {
    exportPreflight: string[]
    quality: string[]
  }
  dryRunContract: LoraTrainingDryRunContractSummary
  privacy: {
    containsRawChatImports: boolean
    containsBlockedMemoryContent: boolean
    containsSourceMetadataPaths: boolean
    requiresHumanApprovalBeforeTraining: boolean
  }
}

interface LoraDatasetManifestShape {
  recordCount: number
  split: {
    strategy: string
    trainCount: number
    evalCount: number
  }
}

const requiredExportPreflightGates = [
  'active_status',
  'non_sensitive_privacy',
  'no_raw_chat_imports',
  'explicit_training_visibility',
  'no_demo_only_profile',
]

const requiredQualityGates = [
  'assistant_content_required',
  'minimum_assistant_content_length',
  'no_local_path_leakage',
]
const requiredScriptDryRunChecks = [
  'privacy_flags',
  'dataset_counts',
  'chat_record_safety',
  'training_runbook_exists',
  'post_training_checklist_exists',
]
const chatArchivePattern = /\[(?:微信|WeChat|飞书|Feishu|QQ)\]/iu
const credentialPattern = /\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|password)\s*[:=]\s*\S{8,}|\bsk-[\w-]{12,}\b/iu
const invisibleUnicodePattern = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/u
const localPathPattern = /[A-Za-z]:[\\/]|\/(?:Users|home|mnt|private|var|tmp)\//u
const jsonlLineBreakPattern = /\r?\n/

export async function validateLoraTrainingPackage(request: LoraTrainingDryRunRequest): Promise<LoraTrainingDryRunResult> {
  const configRelativePath = request.configRelativePath ?? 'lora-training-config.json'
  const configPath = join(request.outputDir, configRelativePath)
  const checks: LoraTrainingDryRunCheck[] = []
  const counts = {
    candidates: 0,
    train: 0,
    eval: 0,
    manifestRecords: 0,
  }
  let dryRunContract: LoraTrainingDryRunContractSummary | null = null
  let artifacts: LoraTrainingDryRunArtifactSummary | null = null

  const configContent = await readTextFile(configPath)

  addCheck(checks, 'config_file_exists', configContent != null, 'Training config file is readable.')

  if (configContent == null)
    return finish({ request, configPath, counts, dryRunContract, artifacts, checks })

  const config = parseJsonObject(configContent) as Partial<LoraTrainingConfigShape> | null

  addCheck(checks, 'config_json_parseable', config != null, 'Training config JSON is parseable.')

  if (!isTrainingConfigShape(config))
    return finish({ request, configPath, counts, dryRunContract, artifacts, checks })

  dryRunContract = config.dryRunContract
  artifacts = {
    trainingRunbookPath: config.artifacts.trainingRunbookPath,
    postTrainingChecklistPath: config.artifacts.postTrainingChecklistPath,
  }

  const datasetPaths = [
    config.dataset.candidatesPath,
    config.dataset.trainPath,
    config.dataset.evalPath,
    config.dataset.manifestPath,
  ]
  const artifactPaths = [
    config.artifacts.trainingRunbookPath,
    config.artifacts.postTrainingChecklistPath,
  ]
  const pathsAreSafe = datasetPaths.every(isSafeRelativePath)
  const artifactPathsAreSafe = artifactPaths.every(isSafeRelativePath)

  addCheck(checks, 'dataset_paths_are_safe_relative', pathsAreSafe, 'Dataset paths are relative and stay inside the export directory.')
  addCheck(checks, 'artifact_paths_are_safe_relative', artifactPathsAreSafe, 'Training artifact paths are relative and stay inside the export directory.')

  if (!pathsAreSafe || !artifactPathsAreSafe)
    return finish({ request, configPath, counts, dryRunContract, artifacts, checks })

  const candidatesPath = join(request.outputDir, config.dataset.candidatesPath)
  const trainPath = join(request.outputDir, config.dataset.trainPath)
  const evalPath = join(request.outputDir, config.dataset.evalPath)
  const manifestPath = join(request.outputDir, config.dataset.manifestPath)
  const filesExist = await Promise.all([
    fileExists(candidatesPath),
    fileExists(trainPath),
    fileExists(evalPath),
    fileExists(manifestPath),
  ])

  addCheck(checks, 'dataset_files_exist', filesExist.every(Boolean), 'Candidate, train, eval, and manifest files exist.')

  if (!filesExist.every(Boolean))
    return finish({ request, configPath, counts, dryRunContract, artifacts, checks })

  addCheck(
    checks,
    'training_runbook_exists',
    await fileExists(join(request.outputDir, config.artifacts.trainingRunbookPath)),
    'Training runbook file is present for handoff before external training.',
  )
  addCheck(
    checks,
    'post_training_checklist_exists',
    await fileExists(join(request.outputDir, config.artifacts.postTrainingChecklistPath)),
    'Post-training checklist file is present for model card, deployment, and public-safe review.',
  )

  counts.candidates = await countJsonlRows(candidatesPath)
  counts.train = await countJsonlRows(trainPath)
  counts.eval = await countJsonlRows(evalPath)
  const jsonlValidation = await validateJsonlRecords([
    candidatesPath,
    trainPath,
    evalPath,
  ], config.dataset.recordSchemaVersion)

  const manifest = parseJsonObject(await readFile(manifestPath, 'utf8')) as Partial<LoraDatasetManifestShape> | null

  if (isDatasetManifestShape(manifest))
    counts.manifestRecords = manifest.recordCount

  addCheck(checks, 'candidate_count_matches_config', counts.candidates === config.dataset.candidateCount, 'Candidate JSONL count matches training config.')
  addCheck(checks, 'train_count_matches_config', counts.train === config.dataset.trainCount, 'Train JSONL count matches training config.')
  addCheck(checks, 'eval_count_matches_config', counts.eval === config.dataset.evalCount, 'Eval JSONL count matches training config.')
  addCheck(checks, 'manifest_count_matches_config', counts.manifestRecords === config.dataset.candidateCount, 'Manifest record count matches candidate count.')
  addCheck(checks, 'record_schema_version_declared', config.dataset.recordSchemaVersion === 1, 'LoRA JSONL record schema version is declared and supported.')
  addCheck(checks, 'jsonl_records_parseable', jsonlValidation.parseable, 'LoRA JSONL records are parseable JSON objects.')
  addCheck(checks, 'record_schema_matches_config', jsonlValidation.schemaMatches, 'LoRA JSONL records match the configured record schema version.')
  addCheck(checks, 'jsonl_records_safe', jsonlValidation.safe, 'LoRA JSONL records do not contain local paths, raw chat markers, credentials, or invisible Unicode controls.')
  addCheck(
    checks,
    'manifest_split_matches_config',
    isDatasetManifestShape(manifest)
    && manifest.split.strategy === config.split.strategy
    && manifest.split.trainCount === config.dataset.trainCount
    && manifest.split.evalCount === config.dataset.evalCount,
    'Manifest split strategy and counts match training config.',
  )
  addCheck(
    checks,
    'privacy_flags_safe',
    config.privacy.containsRawChatImports === false
    && config.privacy.containsBlockedMemoryContent === false
    && config.privacy.containsSourceMetadataPaths === false
    && config.privacy.requiresHumanApprovalBeforeTraining === true,
    'Training config privacy flags require reviewed, sanitized data.',
  )
  addCheck(
    checks,
    'required_gates_present',
    requiredExportPreflightGates.every(gate => config.gates.exportPreflight.includes(gate))
    && requiredQualityGates.every(gate => config.gates.quality.includes(gate)),
    'Training config lists the required preflight and quality gates.',
  )
  addCheck(
    checks,
    'dry_run_contract_matches_script',
    config.dryRunContract.successSchemaVersion === 1
    && stringListsEqual(config.dryRunContract.successChecks, requiredScriptDryRunChecks)
    && config.dryRunContract.errorFormat === 'json'
    && config.dryRunContract.validationErrorType === 'validation_error'
    && config.dryRunContract.validationErrorExitCode === 2,
    'Training config dry-run contract matches the external script contract.',
  )

  return finish({ request, configPath, counts, dryRunContract, artifacts, checks })
}

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  }
  catch {
    return null
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile()
  }
  catch {
    return false
  }
}

async function countJsonlRows(path: string): Promise<number> {
  const content = await readFile(path, 'utf8')

  if (!content.trim())
    return 0

  return content
    .split(jsonlLineBreakPattern)
    .filter(line => line.trim().length > 0)
    .length
}

async function validateJsonlRecords(paths: string[], recordSchemaVersion: number): Promise<{
  parseable: boolean
  safe: boolean
  schemaMatches: boolean
}> {
  const results = await Promise.all(paths.map(path => validateJsonlFileRecords(path, recordSchemaVersion)))

  return {
    parseable: results.every(result => result.parseable),
    safe: results.every(result => result.safe),
    schemaMatches: results.every(result => result.schemaMatches),
  }
}

async function validateJsonlFileRecords(path: string, recordSchemaVersion: number): Promise<{
  parseable: boolean
  safe: boolean
  schemaMatches: boolean
}> {
  const content = await readFile(path, 'utf8')

  if (!content.trim()) {
    return {
      parseable: true,
      safe: true,
      schemaMatches: true,
    }
  }

  const records = content
    .split(jsonlLineBreakPattern)
    .filter(line => line.trim().length > 0)
    .map(line => parseJsonObject(line))
  const parseable = records.every(record => record != null)

  return {
    parseable,
    safe: parseable && records.every(record => isSafeChatRecord(record)),
    schemaMatches: parseable && records.every(record => record?.schemaVersion === recordSchemaVersion),
  }
}

function isSafeChatRecord(record: Record<string, unknown> | null) {
  if (!record || !Array.isArray(record.messages))
    return false

  return record.messages.every((message) => {
    if (!isRecord(message) || typeof message.content !== 'string')
      return false

    return !localPathPattern.test(message.content)
      && !chatArchivePattern.test(message.content)
      && !credentialPattern.test(message.content)
      && !invisibleUnicodePattern.test(message.content)
  })
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content) as unknown

    return isRecord(parsed) ? parsed : null
  }
  catch {
    return null
  }
}

function isSafeRelativePath(path: string): boolean {
  const normalized = normalize(path)

  return !isAbsolute(path)
    && !normalized.startsWith('..')
    && !normalized.includes('\\..\\')
    && !normalized.includes('/../')
}

function stringListsEqual(actual: string[], expected: string[]): boolean {
  return actual.length === expected.length
    && actual.every((item, index) => item === expected[index])
}

function isTrainingConfigShape(value: Partial<LoraTrainingConfigShape> | null): value is LoraTrainingConfigShape {
  return isRecord(value)
    && isRecord(value.dataset)
    && typeof value.dataset.candidatesPath === 'string'
    && typeof value.dataset.trainPath === 'string'
    && typeof value.dataset.evalPath === 'string'
    && typeof value.dataset.manifestPath === 'string'
    && typeof value.dataset.recordSchemaVersion === 'number'
    && typeof value.dataset.candidateCount === 'number'
    && typeof value.dataset.trainCount === 'number'
    && typeof value.dataset.evalCount === 'number'
    && isRecord(value.split)
    && typeof value.split.strategy === 'string'
    && isRecord(value.artifacts)
    && typeof value.artifacts.trainingRunbookPath === 'string'
    && typeof value.artifacts.postTrainingChecklistPath === 'string'
    && isRecord(value.gates)
    && Array.isArray(value.gates.exportPreflight)
    && Array.isArray(value.gates.quality)
    && isRecord(value.dryRunContract)
    && typeof value.dryRunContract.successSchemaVersion === 'number'
    && Array.isArray(value.dryRunContract.successChecks)
    && typeof value.dryRunContract.errorFormat === 'string'
    && typeof value.dryRunContract.validationErrorType === 'string'
    && typeof value.dryRunContract.validationErrorExitCode === 'number'
    && isRecord(value.privacy)
    && typeof value.privacy.containsRawChatImports === 'boolean'
    && typeof value.privacy.containsBlockedMemoryContent === 'boolean'
    && typeof value.privacy.containsSourceMetadataPaths === 'boolean'
    && typeof value.privacy.requiresHumanApprovalBeforeTraining === 'boolean'
}

function isDatasetManifestShape(value: Partial<LoraDatasetManifestShape> | null): value is LoraDatasetManifestShape {
  return isRecord(value)
    && typeof value.recordCount === 'number'
    && isRecord(value.split)
    && typeof value.split.strategy === 'string'
    && typeof value.split.trainCount === 'number'
    && typeof value.split.evalCount === 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value)
}

function addCheck(checks: LoraTrainingDryRunCheck[], id: string, passed: boolean, message: string) {
  checks.push({
    id,
    status: passed ? 'pass' : 'fail',
    message,
  })
}

function finish(params: {
  request: LoraTrainingDryRunRequest
  configPath: string
  counts: LoraTrainingDryRunResult['counts']
  dryRunContract: LoraTrainingDryRunResult['dryRunContract']
  artifacts: LoraTrainingDryRunResult['artifacts']
  checks: LoraTrainingDryRunCheck[]
}): LoraTrainingDryRunResult {
  const failed = params.checks.filter(check => check.status === 'fail').length

  return {
    schemaVersion: 1,
    ok: failed === 0,
    outputDir: params.request.outputDir,
    configPath: params.configPath,
    checkedAt: new Date().toISOString(),
    summary: {
      passed: params.checks.length - failed,
      failed,
    },
    counts: params.counts,
    dryRunContract: params.dryRunContract,
    artifacts: params.artifacts,
    checks: params.checks,
  }
}
