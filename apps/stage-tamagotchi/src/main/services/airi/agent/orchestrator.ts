import type {
  ElectronAgentChatTarget,
  ElectronAgentConfirmActionRequest,
  ElectronAgentContextFragment,
  ElectronAgentReflectAndStoreRequest,
  ElectronAgentRun,
  ElectronAgentRunRequest,
  ElectronAgentToolDescriptor,
  ElectronComputerUseActionKind,
  ElectronComputerUseActionPreview,
} from '../../../../shared/eventa'
import type { MemoryAwareChatRuntime } from '../chat-runtime/memory-aware'
import type { ComputerUseManager } from '../computer-use'
import type { MemoryManager } from '../memory'
import type { RoutineManager } from '../routines'

import { randomUUID } from 'node:crypto'

import { composeMemoryRagContext } from '../memory/rag-context'
import { scanMemorySafety } from '../memory/safety'

interface CollectedAgentContext {
  fragments: ElectronAgentContextFragment[]
  withheldContextIds: string[]
}

export interface AgentChatRuntimeState {
  chatRuntime?: MemoryAwareChatRuntime
  chatTarget?: ElectronAgentChatTarget
}

export interface AgentOrchestrator {
  run: (payload: ElectronAgentRunRequest) => Promise<ElectronAgentRun>
  getRun: (payload: { id: string }) => ElectronAgentRun | null
  cancelRun: (payload: { id: string }) => Promise<ElectronAgentRun>
  listTools: () => ElectronAgentToolDescriptor[] | Promise<ElectronAgentToolDescriptor[]>
  confirmAction: (payload: ElectronAgentConfirmActionRequest) => Promise<ElectronAgentRun>
  configureChatRuntime: (state: AgentChatRuntimeState) => void
  reflectAndStore: (payload: ElectronAgentReflectAndStoreRequest) => Promise<ElectronAgentRun>
}

const tools: ElectronAgentToolDescriptor[] = [
  {
    name: 'memory.search',
    title: 'Search local memory',
    description: 'Read confirmed local memories and LLMWiki snippets.',
    risk: 'low',
    requiresConfirmation: false,
  },
  {
    name: 'computer.delete-file',
    title: 'Delete file or folder',
    description: 'High-risk computer-use action. AIRI can preview and confirm it, but execution remains disabled.',
    risk: 'high',
    requiresConfirmation: true,
  },
  {
    name: 'computer.run-command',
    title: 'Run command',
    description: 'High-risk shell action. AIRI can preview and confirm it, but execution remains disabled.',
    risk: 'high',
    requiresConfirmation: true,
  },
]

const deleteIntentPrefixes = new Set([
  'delete file',
  'delete folder',
  'delete path',
  'erase file',
  'erase folder',
  'erase path',
  'remove file',
  'remove folder',
  'remove path',
  'rm file',
  'rm folder',
  'rm path',
])

const commandIntentPrefixes = new Set([
  'execute command',
  'execute powershell',
  'execute shell',
  'run command',
  'run powershell',
  'run shell',
])

const routineIntentPrefixes = new Set([
  'preview routine',
  'routine',
  'run routine',
])

const safeComputerUseIntentPrefixes: Array<{
  kind: Extract<ElectronComputerUseActionKind, 'open_path' | 'open_url' | 'read_file' | 'search_files'>
  prefixes: Set<string>
  title: string
  toolName: string
}> = [
  {
    kind: 'read_file',
    prefixes: new Set(['read file', 'read path']),
    title: 'Read file',
    toolName: 'computer.read-file',
  },
  {
    kind: 'search_files',
    prefixes: new Set(['search files', 'search folder', 'search path']),
    title: 'Search files',
    toolName: 'computer.search-files',
  },
  {
    kind: 'open_url',
    prefixes: new Set(['open url', 'open website']),
    title: 'Open URL',
    toolName: 'computer.open-url',
  },
  {
    kind: 'open_path',
    prefixes: new Set(['open file', 'open folder', 'open path']),
    title: 'Open path',
    toolName: 'computer.open-path',
  },
]

function now() {
  return new Date().toISOString()
}

function assertInput(input: string) {
  if (!input.trim())
    throw new Error('Agent input cannot be empty')
}

function parseColonIntent(input: string, prefixes: Set<string>) {
  const separatorIndex = input.indexOf(':')
  if (separatorIndex === -1)
    return undefined

  const prefix = input.slice(0, separatorIndex).trim().toLowerCase()
  if (!prefixes.has(prefix))
    return undefined

  return input.slice(separatorIndex + 1).trim() || undefined
}

function parseSlashCommandIntent(input: string) {
  const trimmed = input.trim()
  const normalized = trimmed.toLowerCase()

  for (const prefix of ['/exec ', '/run ']) {
    if (normalized.startsWith(prefix))
      return trimmed.slice(prefix.length).trim() || undefined
  }

  return undefined
}

function normalizeRoutineQuery(input: string) {
  return input.trim().toLowerCase()
}

function parseRoutineIntent(input: string) {
  return parseColonIntent(input, routineIntentPrefixes)
}

async function previewRoutinePlan(input: string, routineManager: RoutineManager | undefined) {
  const routineQuery = parseRoutineIntent(input)
  if (!routineQuery || !routineManager)
    return undefined

  const normalizedQuery = normalizeRoutineQuery(routineQuery)
  const routines = await routineManager.list()
  const routine = routines.find(item =>
    normalizeRoutineQuery(item.slug) === normalizedQuery
    || normalizeRoutineQuery(item.title) === normalizedQuery,
  )

  if (!routine) {
    return `Routine not found: ${routineQuery}.`
  }

  return [
    `Routine plan: ${routine.title}`,
    '',
    ...routine.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    'This preview does not execute desktop actions.',
  ].join('\n')
}

function previewForDeleteIntent(computerUseManager: ComputerUseManager | undefined, target: string) {
  return computerUseManager?.previewAction({
    kind: 'delete_path',
    target,
    reason: 'Agent detected a delete or removal intent.',
  })
}

function previewForCommandIntent(computerUseManager: ComputerUseManager | undefined, command: string) {
  return computerUseManager?.previewAction({
    kind: 'run_command',
    command,
    reason: 'Agent detected a shell or command execution intent.',
  })
}

function previewForSafeComputerUseIntent(computerUseManager: ComputerUseManager | undefined, input: string) {
  if (!computerUseManager)
    return undefined

  for (const intent of safeComputerUseIntentPrefixes) {
    const target = parseColonIntent(input, intent.prefixes)
    if (!target)
      continue

    return {
      intent,
      preview: computerUseManager.previewAction({
        kind: intent.kind,
        target,
        reason: 'Agent detected a safe computer-use intent.',
      }),
      target,
    }
  }

  return undefined
}

function isComputerUsePreview(value: unknown): value is ElectronComputerUseActionPreview {
  if (!value || typeof value !== 'object')
    return false

  const preview = value as Partial<ElectronComputerUseActionPreview>
  return Boolean(
    typeof preview.id === 'string'
    && typeof preview.kind === 'string'
    && Array.isArray(preview.reasons)
    && typeof preview.decision === 'string'
    && typeof preview.risk === 'string',
  )
}

function isExecutableComputerUsePreview(value: unknown): value is ElectronComputerUseActionPreview {
  if (!isComputerUsePreview(value))
    return false

  const preview = value as ElectronComputerUseActionPreview
  return preview.canExecute === true
}

function agentRiskForComputerUsePreview(preview: ElectronComputerUseActionPreview) {
  if (preview.decision === 'deny' || preview.risk === 'high')
    return 'high'

  return 'low'
}

function detectPendingAction(input: string, computerUseManager?: ComputerUseManager): ElectronAgentRun['pendingAction'] | undefined {
  const trimmed = input.trim()
  const safeComputerUse = previewForSafeComputerUseIntent(computerUseManager, trimmed)
  if (safeComputerUse) {
    return {
      id: randomUUID(),
      toolName: safeComputerUse.intent.toolName,
      title: safeComputerUse.intent.title,
      risk: agentRiskForComputerUsePreview(safeComputerUse.preview),
      requiresConfirmation: true,
      arguments: {
        input,
        preview: safeComputerUse.preview,
        target: safeComputerUse.target,
      },
    }
  }

  const deleteTarget = parseColonIntent(trimmed, deleteIntentPrefixes)

  if (deleteTarget) {
    const preview = previewForDeleteIntent(computerUseManager, deleteTarget)
    return {
      id: randomUUID(),
      toolName: 'computer.delete-file',
      title: 'Delete file or folder',
      risk: 'high',
      requiresConfirmation: true,
      arguments: preview ? { input, target: deleteTarget, preview } : { input, target: deleteTarget },
    }
  }

  const command = parseColonIntent(trimmed, commandIntentPrefixes) ?? parseSlashCommandIntent(trimmed)

  if (command) {
    const preview = previewForCommandIntent(computerUseManager, command)
    return {
      id: randomUUID(),
      toolName: 'computer.run-command',
      title: 'Run command',
      risk: 'high',
      requiresConfirmation: true,
      arguments: preview ? { command, input, preview } : { command, input },
    }
  }

  return undefined
}

async function collectContext(memoryManager: MemoryManager, input: string, target: ElectronAgentChatTarget): Promise<CollectedAgentContext> {
  const result = await composeMemoryRagContext({
    query: input,
    target,
    listMemories: request => memoryManager.list(request),
    searchLlmWiki: request => memoryManager.searchLlmWiki(request),
  })

  return {
    fragments: result.fragments,
    withheldContextIds: result.withheld.map(item => item.id),
  }
}

function buildDirectResponse(context: ElectronAgentContextFragment[]) {
  if (context.length === 0)
    return 'I did not find local context for this request yet.'

  return `I found local context from ${context.length} source(s).`
}

function mustGetRun(runs: Map<string, ElectronAgentRun>, id: string) {
  const run = runs.get(id)
  if (!run)
    throw new Error(`Agent run not found: ${id}`)

  return run
}

function updateRun(runs: Map<string, ElectronAgentRun>, run: ElectronAgentRun, patch: Partial<ElectronAgentRun>) {
  const updated = {
    ...run,
    ...patch,
    updatedAt: now(),
  }
  runs.set(run.id, updated)
  return updated
}

function assertChatRuntimeState(state: AgentChatRuntimeState) {
  if (state.chatRuntime && !state.chatTarget)
    throw new Error('Agent chatTarget is required when chatRuntime is configured')
}

function redactAgentReflectionPreview(input: string) {
  return input
    .replace(/\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|password)\s*[:=]\s*\S{4,}/giu, '[redacted-credential]')
    .replace(/\bsk-[\w-]{8,}\b/giu, '[redacted-api-key]')
    .replace(/[A-Z]:\\[^\s"'`<>]+/gu, '[redacted-path]')
    .replace(/\/(?:Users|home|mnt|var|etc)\/[^\s"'`<>]+/gu, '[redacted-path]')
    .slice(0, 240)
}

function deniedComputerUseResponse(pendingAction: NonNullable<ElectronAgentRun['pendingAction']>) {
  const preview = pendingAction.arguments?.preview
  if (!isComputerUsePreview(preview) || preview.decision !== 'deny')
    return undefined

  return `Computer action denied by policy: ${preview.reasons.join(' ')}`
}

function nonExecutableComputerUseResponse(pendingAction: NonNullable<ElectronAgentRun['pendingAction']>) {
  const preview = pendingAction.arguments?.preview
  if (!isComputerUsePreview(preview) || preview.canExecute)
    return undefined

  return `Computer action is not executable under the current policy: ${preview.reasons.join(' ')}`
}

async function executePendingComputerUseAction(
  computerUseManager: ComputerUseManager | undefined,
  pendingAction: NonNullable<ElectronAgentRun['pendingAction']>,
) {
  const preview = pendingAction.arguments?.preview
  if (!computerUseManager || !isExecutableComputerUsePreview(preview))
    return undefined

  const result = await computerUseManager.executeAction({
    approved: true,
    id: preview.id,
  })

  if (result.status === 'failed')
    return `Computer action failed: ${result.errorMessage ?? 'Unknown error'}`

  return [
    `Executed computer action: ${result.kind}`,
    result.output ? `\n${result.output}` : '',
  ].join('')
}

interface AgentOrchestratorBaseParams {
  memoryManager: MemoryManager
  routineManager?: RoutineManager
  computerUseManager?: ComputerUseManager
}

type AgentOrchestratorParams = AgentOrchestratorBaseParams & (
  | {
    chatRuntime?: undefined
    chatTarget?: ElectronAgentChatTarget
  }
  | {
    chatRuntime: MemoryAwareChatRuntime
    chatTarget: ElectronAgentChatTarget
  }
)

export function createAgentOrchestrator(params: AgentOrchestratorParams): AgentOrchestrator {
  assertChatRuntimeState(params)

  const runs = new Map<string, ElectronAgentRun>()
  let chatRuntime = params.chatRuntime
  let chatTarget = params.chatTarget

  return {
    configureChatRuntime(state) {
      assertChatRuntimeState(state)
      chatRuntime = state.chatRuntime
      chatTarget = state.chatTarget
    },

    async run(payload) {
      assertInput(payload.input)

      const createdAt = now()
      const activeChatTarget = chatTarget ?? 'local'
      const routinePlan = await previewRoutinePlan(payload.input, params.routineManager)
      if (routinePlan) {
        const run: ElectronAgentRun = {
          id: randomUUID(),
          input: payload.input,
          conversationId: payload.conversationId,
          mode: 'tool_call',
          status: 'completed',
          createdAt,
          updatedAt: createdAt,
          context: [],
          response: routinePlan,
          usedContextIds: [],
          withheldContextIds: [],
        }

        runs.set(run.id, run)
        return run
      }

      const pendingAction = detectPendingAction(payload.input, params.computerUseManager)
      const collectedContext = pendingAction
        ? { fragments: [], withheldContextIds: [] }
        : await collectContext(params.memoryManager, payload.input, activeChatTarget)
      const context = collectedContext.fragments
      const compactProfile = !pendingAction && chatRuntime && activeChatTarget === 'local'
        ? await params.memoryManager.compactProfile()
        : undefined
      const runtimeResult = !pendingAction && chatRuntime
        ? await chatRuntime.generate({
            input: payload.input,
            target: activeChatTarget,
            compactProfileMarkdown: compactProfile?.markdown,
            context,
          })
        : undefined

      const run: ElectronAgentRun = {
        id: randomUUID(),
        input: payload.input,
        conversationId: payload.conversationId,
        mode: pendingAction ? 'confirmation' : payload.mode ?? 'direct_answer',
        status: pendingAction ? 'awaiting_confirmation' : 'completed',
        createdAt,
        updatedAt: createdAt,
        context,
        response: pendingAction ? undefined : runtimeResult?.response ?? buildDirectResponse(context),
        usedContextIds: runtimeResult?.usedContextIds ?? context.map(fragment => fragment.id),
        withheldContextIds: [
          ...collectedContext.withheldContextIds,
          ...(runtimeResult?.withheldContextIds ?? []),
        ],
        pendingAction,
      }

      runs.set(run.id, run)
      return run
    },

    getRun(payload) {
      return runs.get(payload.id) ?? null
    },

    async cancelRun(payload) {
      const run = mustGetRun(runs, payload.id)
      return updateRun(runs, run, {
        status: 'cancelled',
        pendingAction: undefined,
      })
    },

    async listTools() {
      const computerUseTools: ElectronAgentToolDescriptor[] = params.computerUseManager
        ? [{
            name: 'computer.preview-action',
            title: 'Preview computer action',
            description: 'Classify a computer-use action before execution.',
            risk: 'low',
            requiresConfirmation: false,
          }]
        : []

      if (!params.routineManager)
        return [...tools, ...computerUseTools]

      const routines = await params.routineManager.list()
      return [
        ...tools,
        ...computerUseTools,
        ...routines.map<ElectronAgentToolDescriptor>(routine => ({
          name: `routine.${routine.slug}`,
          title: routine.title,
          description: `Saved routine with ${routine.steps.length} step(s).`,
          risk: 'low',
          requiresConfirmation: false,
        })),
      ]
    },

    async confirmAction(payload) {
      const run = mustGetRun(runs, payload.id)

      if (!run.pendingAction)
        throw new Error(`Agent run has no pending action: ${payload.id}`)

      if (!payload.approved) {
        return updateRun(runs, run, {
          status: 'cancelled',
          pendingAction: undefined,
        })
      }

      const deniedResponse = deniedComputerUseResponse(run.pendingAction)
      if (deniedResponse) {
        return updateRun(runs, run, {
          mode: 'tool_call',
          status: 'cancelled',
          response: deniedResponse,
          pendingAction: undefined,
        })
      }

      const nonExecutableResponse = nonExecutableComputerUseResponse(run.pendingAction)
      if (nonExecutableResponse) {
        return updateRun(runs, run, {
          mode: 'tool_call',
          status: 'cancelled',
          response: nonExecutableResponse,
          pendingAction: undefined,
        })
      }

      const computerUseResponse = await executePendingComputerUseAction(params.computerUseManager, run.pendingAction)
      if (computerUseResponse) {
        return updateRun(runs, run, {
          mode: 'tool_call',
          status: 'completed',
          response: computerUseResponse,
          pendingAction: undefined,
        })
      }

      return updateRun(runs, run, {
        mode: 'tool_call',
        status: 'completed',
        response: `Confirmed action: ${run.pendingAction.title}. Execution is not enabled under the current policy.`,
        pendingAction: undefined,
      })
    },

    async reflectAndStore(payload) {
      const run = mustGetRun(runs, payload.id)
      const content = payload.content?.trim() || run.response?.trim() || run.input.trim()
      const safety = scanMemorySafety(content)
      const originalInputPreview = redactAgentReflectionPreview(run.input)
      const contentPreview = redactAgentReflectionPreview(content)

      const memory = await params.memoryManager.create({
        content,
        summary: 'Agent reflection',
        type: 'note',
        privacy: safety.safe ? 'local' : 'secret',
        importance: 3,
        sourceType: 'agent_reflection',
        sourceId: run.id,
        status: 'needs_review',
        tags: safety.safe ? ['agent', 'reflection'] : ['agent', 'reflection', 'safety-review'],
        metadata: {
          agentRunId: run.id,
          contentPreview,
          originalInputPreview,
          redacted: contentPreview !== content || originalInputPreview !== run.input,
          safety,
        },
      })

      return updateRun(runs, run, {
        mode: 'reflect_and_store',
        status: 'completed',
        memoryId: memory.id,
        response: content,
      })
    },
  }
}
