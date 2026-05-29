import type { createContext } from '@moeru/eventa/adapters/electron/main'

import type {
  ElectronComputerUseActionKind,
  ElectronComputerUseActionPreview,
  ElectronComputerUseActionPreviewRequest,
  ElectronComputerUseActionRisk,
  ElectronComputerUseAuditListResult,
  ElectronComputerUseExecuteActionRequest,
  ElectronComputerUseExecutionResult,
  ElectronComputerUsePolicySnapshot,
} from '../../../../shared/eventa'

import { randomUUID } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineInvokeHandler } from '@moeru/eventa'
import { createContext as createElectronMainContext } from '@moeru/eventa/adapters/electron/main'
import { app, ipcMain, shell } from 'electron'
import { object, optional, parse, picklist, string } from 'valibot'

import {
  electronComputerUseExecuteAction,
  electronComputerUseGetPolicy,
  electronComputerUseListAuditLogs,
  electronComputerUsePreviewAction,
} from '../../../../shared/eventa'

const HIGH_RISK_KINDS: ElectronComputerUseActionKind[] = [
  'write_file',
  'delete_path',
  'move_path',
  'run_command',
]

const MEDIUM_RISK_KINDS: ElectronComputerUseActionKind[] = [
  'open_url',
  'open_path',
]

const READ_TARGET_KINDS: ElectronComputerUseActionKind[] = [
  'read_file',
  'search_files',
]

const WRITE_TARGET_KINDS: ElectronComputerUseActionKind[] = [
  'write_file',
  'delete_path',
  'move_path',
]

const TRAILING_SLASH_PATTERN = /\/+$/u
const DEFAULT_MAX_AUDIT_ENTRIES = 500
const DEFAULT_MAX_READ_CHARS = 20000
const DEFAULT_MAX_SEARCH_RESULTS = 200
const EXECUTABLE_KINDS = new Set<ElectronComputerUseActionKind>([
  'open_path',
  'open_url',
  'read_file',
  'search_files',
])

const actionPreviewRequestSchema = object({
  kind: picklist([
    'observe_screen',
    'read_file',
    'search_files',
    'open_url',
    'open_path',
    'write_file',
    'delete_path',
    'move_path',
    'run_command',
  ]),
  target: optional(string()),
  command: optional(string()),
  cwd: optional(string()),
  reason: optional(string()),
})

function now() {
  return new Date().toISOString()
}

function normalizePolicyPath(path: string) {
  return resolve(path)
    .replace(/\\/g, '/')
    .replace(TRAILING_SLASH_PATTERN, '')
    .toLowerCase()
}

function localTargetForPolicy(payload: ElectronComputerUseActionPreviewRequest) {
  if (payload.kind !== 'open_url')
    return payload.target

  if (!payload.target)
    return undefined

  try {
    const url = new URL(payload.target)
    if (url.protocol === 'file:')
      return fileURLToPath(url)
  }
  catch {
    return payload.target
  }

  return undefined
}

function isInsideRoot(path: string | undefined, roots: string[]) {
  if (!path)
    return false

  const normalizedPath = normalizePolicyPath(path)
  return roots
    .map(normalizePolicyPath)
    .some(root => normalizedPath === root || normalizedPath.startsWith(`${root}/`))
}

function riskForKind(policy: ElectronComputerUsePolicySnapshot, kind: ElectronComputerUseActionKind): ElectronComputerUseActionRisk {
  if (policy.highRiskKinds.includes(kind))
    return 'high'

  if (MEDIUM_RISK_KINDS.includes(kind))
    return 'medium'

  return 'low'
}

function hasLocalTarget(payload: ElectronComputerUseActionPreviewRequest) {
  return Boolean(localTargetForPolicy(payload) || payload.cwd)
}

function isReadTargetOutsideAllowedRoots(policy: ElectronComputerUsePolicySnapshot, payload: ElectronComputerUseActionPreviewRequest) {
  return Boolean(
    payload.target
    && READ_TARGET_KINDS.includes(payload.kind)
    && !isInsideRoot(payload.target, policy.allowedReadRoots),
  )
}

function isWriteTargetOutsideAllowedRoots(policy: ElectronComputerUsePolicySnapshot, payload: ElectronComputerUseActionPreviewRequest) {
  return Boolean(
    payload.target
    && WRITE_TARGET_KINDS.includes(payload.kind)
    && !isInsideRoot(payload.target, policy.allowedWriteRoots),
  )
}

function isMissingRequiredInput(payload: ElectronComputerUseActionPreviewRequest) {
  if (payload.kind === 'observe_screen')
    return false

  if (payload.kind === 'run_command')
    return !payload.command?.trim()

  return !payload.target?.trim()
}

function isUnsupportedUrl(payload: ElectronComputerUseActionPreviewRequest) {
  if (payload.kind !== 'open_url' || !payload.target)
    return false

  try {
    const url = new URL(payload.target)
    return !['http:', 'https:', 'file:'].includes(url.protocol)
  }
  catch {
    return true
  }
}

function validateActionPreviewRequest(payload: ElectronComputerUseActionPreviewRequest) {
  try {
    return parse(actionPreviewRequestSchema, payload)
  }
  catch (error) {
    throw new Error('Invalid computer-use action preview request', { cause: error })
  }
}

function isAuditEntry(value: unknown): value is ElectronComputerUseActionPreview {
  if (!value || typeof value !== 'object')
    return false

  const entry = value as Partial<ElectronComputerUseActionPreview>
  return Boolean(
    typeof entry.id === 'string'
    && typeof entry.kind === 'string'
    && typeof entry.risk === 'string'
    && typeof entry.decision === 'string'
    && Array.isArray(entry.reasons)
    && typeof entry.requiresConfirmation === 'boolean'
    && typeof entry.canExecute === 'boolean'
    && typeof entry.createdAt === 'string',
  )
}

function takeRecentAuditEntries(entries: ElectronComputerUseActionPreview[], limit: number) {
  return entries.slice(Math.max(0, entries.length - limit))
}

function loadAuditLog(path: string, limit: number): ElectronComputerUseActionPreview[] {
  if (!existsSync(path))
    return []

  const entries = readFileSync(path, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        const parsed = JSON.parse(line) as unknown
        return isAuditEntry(parsed) ? parsed : undefined
      }
      catch {
        return undefined
      }
    })
    .filter((entry): entry is ElectronComputerUseActionPreview => Boolean(entry))

  return takeRecentAuditEntries(entries, limit)
}

function appendAuditLog(path: string, entry: ElectronComputerUseActionPreview) {
  mkdirSync(dirname(path), { recursive: true })
  appendFileSync(path, `${JSON.stringify(entry)}\n`, 'utf-8')
}

function findAuditPreview(entries: ElectronComputerUseActionPreview[], id: string) {
  return entries.find(entry => entry.id === id)
}

function assertPreviewStillAllowed(policy: ElectronComputerUsePolicySnapshot, preview: ElectronComputerUseActionPreview) {
  if (isMissingRequiredInput(preview))
    throw new Error('Computer-use execution target is no longer valid')
  if (isUnsupportedUrl(preview))
    throw new Error('Computer-use execution URL scheme is not allowed')
  if (isInsideRoot(localTargetForPolicy(preview), policy.deniedRoots) || isInsideRoot(preview.cwd, policy.deniedRoots))
    throw new Error('Computer-use execution target is inside a denied root')
  if (isReadTargetOutsideAllowedRoots(policy, preview))
    throw new Error('Computer-use execution read target is outside allowed read roots')
  if (isWriteTargetOutsideAllowedRoots(policy, preview))
    throw new Error('Computer-use execution write target is outside allowed write roots')
}

function assertExecutablePreview(policy: ElectronComputerUsePolicySnapshot, preview: ElectronComputerUseActionPreview | undefined, request: ElectronComputerUseExecuteActionRequest) {
  if (!preview)
    throw new Error('Computer-use preview was not found')
  if (!request.approved)
    throw new Error('Computer-use execution requires explicit approval')
  if (preview.decision === 'deny')
    throw new Error('Computer-use execution cannot run a denied preview')
  if (preview.risk === 'high')
    throw new Error('Computer-use execution is not allowed for high-risk actions')
  if (!EXECUTABLE_KINDS.has(preview.kind))
    throw new Error(`Computer-use execution is not supported for ${preview.kind}`)

  assertPreviewStillAllowed(policy, preview)
  if (!preview.canExecute)
    throw new Error('Computer-use execution is not allowed for this preview')
  return preview
}

function readFilePreview(target: string | undefined) {
  if (!target)
    throw new Error('Read target is required')

  const content = readFileSync(target, 'utf-8')
  return content.length > DEFAULT_MAX_READ_CHARS
    ? `${content.slice(0, DEFAULT_MAX_READ_CHARS)}\n[truncated]`
    : content
}

function searchFilesPreview(target: string | undefined) {
  if (!target)
    throw new Error('Search target is required')

  const root = resolve(target)
  const results: string[] = []

  function walk(dir: string) {
    if (results.length >= DEFAULT_MAX_SEARCH_RESULTS)
      return

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      }
      else if (entry.isFile()) {
        results.push(relative(root, fullPath).replace(/\\/g, '/'))
        if (results.length >= DEFAULT_MAX_SEARCH_RESULTS)
          return
      }
    }
  }

  if (statSync(root).isDirectory())
    walk(root)
  else
    results.push(root)

  return results.join('\n') || 'No files found.'
}

function mergePolicy(policy?: Partial<ElectronComputerUsePolicySnapshot>): ElectronComputerUsePolicySnapshot {
  return {
    mode: 'controlled_execution',
    allowedReadRoots: policy?.allowedReadRoots ?? [],
    allowedWriteRoots: policy?.allowedWriteRoots ?? [],
    deniedRoots: policy?.deniedRoots ?? [],
    requireConfirmationRoots: policy?.requireConfirmationRoots ?? [],
    highRiskKinds: policy?.highRiskKinds ?? HIGH_RISK_KINDS,
  }
}

function defaultPolicy(): ElectronComputerUsePolicySnapshot {
  const home = app.getPath('home')

  return mergePolicy({
    allowedReadRoots: [home],
    allowedWriteRoots: [],
    deniedRoots: [
      join(home, '.ssh'),
      join(home, '.gnupg'),
      join(home, '.aws'),
      join(home, '.azure'),
      join(home, '.config', 'gh'),
    ],
    requireConfirmationRoots: [home],
  })
}

function buildPreview(
  policy: ElectronComputerUsePolicySnapshot,
  payload: ElectronComputerUseActionPreviewRequest,
): ElectronComputerUseActionPreview {
  const localTarget = localTargetForPolicy(payload)
  const risk = riskForKind(policy, payload.kind)
  const reasons: string[] = []
  let decision: ElectronComputerUseActionPreview['decision'] = 'allow'

  if (isMissingRequiredInput(payload)) {
    decision = 'deny'
    reasons.push('Action target is required.')
  }
  else if (isUnsupportedUrl(payload)) {
    decision = 'deny'
    reasons.push('URL scheme is not allowed.')
  }
  else if (isInsideRoot(localTarget, policy.deniedRoots) || isInsideRoot(payload.cwd, policy.deniedRoots)) {
    decision = 'deny'
    reasons.push('Target is inside a denied root.')
  }
  else if (isReadTargetOutsideAllowedRoots(policy, payload)) {
    decision = 'deny'
    reasons.push('Read target is outside allowed read roots.')
  }
  else if (isWriteTargetOutsideAllowedRoots(policy, payload)) {
    decision = 'deny'
    reasons.push('Write target is outside allowed write roots.')
  }
  else if (risk === 'high') {
    decision = 'confirm'
    reasons.push('Mutating computer-use actions are high risk.')
  }
  else if (hasLocalTarget(payload)) {
    decision = 'confirm'
    reasons.push('Local targets require user confirmation in controlled execution mode.')
  }
  else if (payload.kind === 'observe_screen') {
    decision = 'confirm'
    reasons.push('Screen observation can expose private information.')
  }
  else if (risk === 'medium') {
    decision = 'confirm'
    reasons.push('Launching or opening resources requires confirmation.')
  }
  else {
    reasons.push('Action is low risk under the current controlled execution policy.')
  }

  return {
    id: randomUUID(),
    ...payload,
    risk,
    decision,
    reasons,
    requiresConfirmation: decision === 'confirm',
    canExecute: decision !== 'deny' && risk !== 'high' && EXECUTABLE_KINDS.has(payload.kind),
    createdAt: now(),
  }
}

export function createComputerUseManager(options: {
  auditLogPath?: string
  maxAuditEntries?: number
  openExternal?: (target: string) => Promise<unknown>
  openPath?: (target: string) => Promise<string>
  policy?: Partial<ElectronComputerUsePolicySnapshot>
} = {}) {
  const policy = mergePolicy(options.policy)
  const maxAuditEntries = options.maxAuditEntries ?? DEFAULT_MAX_AUDIT_ENTRIES
  const auditLogs: ElectronComputerUseActionPreview[] = options.auditLogPath
    ? loadAuditLog(options.auditLogPath, maxAuditEntries)
    : []

  return {
    getPolicy(): ElectronComputerUsePolicySnapshot {
      return {
        ...policy,
        allowedReadRoots: [...policy.allowedReadRoots],
        allowedWriteRoots: [...policy.allowedWriteRoots],
        deniedRoots: [...policy.deniedRoots],
        requireConfirmationRoots: [...policy.requireConfirmationRoots],
        highRiskKinds: [...policy.highRiskKinds],
      }
    },

    previewAction(payload: ElectronComputerUseActionPreviewRequest): ElectronComputerUseActionPreview {
      const preview = buildPreview(policy, validateActionPreviewRequest(payload))
      auditLogs.push(preview)
      if (auditLogs.length > maxAuditEntries)
        auditLogs.splice(0, auditLogs.length - maxAuditEntries)

      if (options.auditLogPath)
        appendAuditLog(options.auditLogPath, preview)

      return preview
    },

    async executeAction(payload: ElectronComputerUseExecuteActionRequest): Promise<ElectronComputerUseExecutionResult> {
      const preview = assertExecutablePreview(policy, findAuditPreview(auditLogs, payload.id), payload)

      try {
        let output = ''
        if (preview.kind === 'read_file') {
          output = readFilePreview(preview.target)
        }
        else if (preview.kind === 'search_files') {
          output = searchFilesPreview(preview.target)
        }
        else if (preview.kind === 'open_url') {
          if (!preview.target)
            throw new Error('URL target is required')
          await (options.openExternal ?? shell.openExternal)(preview.target)
          output = `Opened URL: ${preview.target}`
        }
        else if (preview.kind === 'open_path') {
          if (!preview.target)
            throw new Error('Path target is required')
          const error = await (options.openPath ?? shell.openPath)(preview.target)
          if (error)
            throw new Error(error)
          output = `Opened path: ${preview.target}`
        }

        return {
          executedAt: now(),
          id: randomUUID(),
          kind: preview.kind,
          output,
          previewId: preview.id,
          status: 'completed',
        }
      }
      catch (error) {
        return {
          errorMessage: error instanceof Error ? error.message : String(error),
          executedAt: now(),
          id: randomUUID(),
          kind: preview.kind,
          previewId: preview.id,
          status: 'failed',
        }
      }
    },

    listAuditLogs(): ElectronComputerUseAuditListResult {
      return {
        items: [...auditLogs],
      }
    },
  }
}

export async function setupComputerUseManager() {
  const computerUseDir = join(app.getPath('userData'), 'airi-memory', 'computer-use')
  return createComputerUseManager({
    auditLogPath: join(computerUseDir, 'audit.jsonl'),
    policy: defaultPolicy(),
  })
}

export type ComputerUseManager = ReturnType<typeof createComputerUseManager>

let computerUseServiceRegistered = false

export function createComputerUseService(params: {
  context: ReturnType<typeof createContext>['context']
  manager: ComputerUseManager
}) {
  defineInvokeHandler(params.context, electronComputerUseGetPolicy, () => params.manager.getPolicy())
  defineInvokeHandler(params.context, electronComputerUsePreviewAction, payload => params.manager.previewAction(payload))
  defineInvokeHandler(params.context, electronComputerUseExecuteAction, payload => params.manager.executeAction(payload))
  defineInvokeHandler(params.context, electronComputerUseListAuditLogs, () => params.manager.listAuditLogs())
}

export function registerGlobalComputerUseService(params: { manager: ComputerUseManager }) {
  if (computerUseServiceRegistered)
    return

  computerUseServiceRegistered = true
  const { context } = createElectronMainContext(ipcMain)
  createComputerUseService({ context, manager: params.manager })
}
