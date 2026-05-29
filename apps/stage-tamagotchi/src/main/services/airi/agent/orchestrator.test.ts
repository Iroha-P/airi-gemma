import type { ElectronMemoryItem } from '../../../../shared/eventa'
import type { MemoryAwareChatGenerateRequest, MemoryAwareChatRuntime } from '../chat-runtime/memory-aware'
import type { ComputerUseManager } from '../computer-use'
import type { MemoryManager } from '../memory'
import type { RoutineManager } from '../routines'

import { describe, expect, it, vi } from 'vitest'

import { createAgentOrchestrator } from './orchestrator'

const memoryItem: ElectronMemoryItem = {
  id: 'memory-1',
  scope: 'user',
  type: 'project',
  content: 'The AIRI project is building local-first long-term memory.',
  summary: 'AIRI memory project',
  tags: ['airi'],
  importance: 4,
  privacy: 'local',
  sourceType: 'manual',
  sourceId: null,
  status: 'active',
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  lastAccessedAt: null,
  accessCount: 0,
  archivedAt: null,
  metadata: null,
}

function createMemoryManagerMock(): MemoryManager {
  return {
    path: ':memory:',
    close: vi.fn(),
    getStatus: vi.fn(),
    list: vi.fn(async () => [memoryItem]),
    create: vi.fn(async payload => ({
      ...memoryItem,
      id: 'reflection-1',
      content: payload.content,
      type: payload.type ?? 'note',
      status: payload.status ?? 'active',
      sourceType: payload.sourceType ?? 'manual',
      metadata: payload.metadata ?? null,
    })),
    update: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    compactProfile: vi.fn(async () => ({
      generatedAt: '2026-05-12T00:00:00.000Z',
      markdown: '# AIRI Compact Profile\n\n- User is building a local memory assistant.',
      sections: [],
      sourceIds: ['memory-1'],
      withheld: [],
    })),
    getReviewWorkbench: vi.fn(),
    ingest: vi.fn(),
    applyAction: vi.fn(),
    detectConflicts: vi.fn(),
    importKnowledgeBase: vi.fn(),
    importChatRecords: vi.fn(),
    exportLlmWiki: vi.fn(),
    exportObsidianVault: vi.fn(),
    exportPublicProfile: vi.fn(),
    exportLoraDatasetCandidates: vi.fn(),
    validateLoraTrainingPackage: vi.fn(),
    exportBackup: vi.fn(),
    importBackup: vi.fn(),
    previewBackup: vi.fn(),
    previewExportPreflight: vi.fn(async () => ({
      surface: 'lora_dataset',
      summary: {
        total: 1,
        allowed: 1,
        blocked: 0,
      },
      items: [{
        id: 'memory-1',
        type: 'project',
        privacy: 'local',
        sourceType: 'manual',
        status: 'active',
        allowed: true,
        reasons: [],
      }],
    })),
    searchLlmWiki: vi.fn(async () => ({
      inputDir: 'F:/airi-brain/70-llmwiki',
      scannedFiles: 1,
      snippets: [{
        relativePath: 'projects/airi-gemma.md',
        path: 'F:/airi-brain/70-llmwiki/projects/airi-gemma.md',
        text: 'AIRI-Gemma uses Memory DB and LLMWiki for grounded context.',
        score: 3,
      }],
    })),
    previewRagContext: vi.fn(async () => ({
      fragments: [{
        kind: 'memory',
        id: 'memory-1',
        title: 'AIRI memory project',
        text: 'The AIRI project is building local-first long-term memory.',
        privacy: 'local',
        score: 4,
      }],
      withheld: [],
    })),
    previewEvolution: vi.fn(async () => ({
      generatedAt: '2026-05-13T00:00:00.000Z',
      total: 0,
      suggestions: [],
    })),
  } as MemoryManager
}

function createChatRuntimeMock(): MemoryAwareChatRuntime {
  return {
    generate: vi.fn(async (request: MemoryAwareChatGenerateRequest) => ({
      response: `runtime response for ${request.input}`,
      usedContextIds: request.context.map(fragment => fragment.id),
      withheldContextIds: [],
    })),
  }
}

function createRoutineManagerMock(): RoutineManager {
  return {
    routinesDir: 'F:/airi-memory/skills',
    draft: vi.fn(),
    save: vi.fn(),
    list: vi.fn(async () => [{
      slug: 'morning-check',
      title: 'Morning check',
      status: 'draft',
      steps: ['Open dashboard', 'Summarize blockers'],
      content: '## Steps\n\n- Open dashboard\n- Summarize blockers\n',
      path: 'F:/airi-memory/skills/morning-check.md',
      updatedAt: '2026-05-11T00:00:00.000Z',
    }]),
    delete: vi.fn(),
  } as RoutineManager
}

function createComputerUseManagerMock(): ComputerUseManager {
  return {
    getPolicy: vi.fn(() => ({
      mode: 'controlled_execution',
      allowedReadRoots: ['F:\\workspace'],
      allowedWriteRoots: [],
      deniedRoots: [],
      requireConfirmationRoots: ['F:\\workspace'],
      highRiskKinds: ['write_file', 'delete_path', 'move_path', 'run_command'],
    })),
    previewAction: vi.fn(payload => ({
      id: 'computer-preview-1',
      kind: payload.kind,
      target: payload.target,
      command: payload.command,
      cwd: payload.cwd,
      reason: payload.reason,
      risk: ['delete_path', 'move_path', 'run_command', 'write_file'].includes(payload.kind) ? 'high' : 'low',
      decision: 'confirm',
      reasons: ['Computer-use action requires confirmation.'],
      requiresConfirmation: true,
      canExecute: !['delete_path', 'move_path', 'run_command', 'write_file'].includes(payload.kind),
      createdAt: '2026-05-11T00:00:00.000Z',
    })),
    executeAction: vi.fn(async payload => ({
      executedAt: '2026-05-11T00:00:01.000Z',
      id: 'computer-execution-1',
      kind: 'read_file',
      output: payload.approved ? 'approved' : 'not approved',
      previewId: payload.id,
      status: 'completed',
    })),
    listAuditLogs: vi.fn(() => ({ items: [] })),
  } as ComputerUseManager
}

describe('agent orchestrator', () => {
  it('creates a direct answer run with memory and LLMWiki context', async () => {
    const memoryManager = createMemoryManagerMock()
    const orchestrator = createAgentOrchestrator({ memoryManager })

    const run = await orchestrator.run({ input: 'What is our AIRI memory plan?' })

    expect(run.status).toBe('completed')
    expect(run.mode).toBe('direct_answer')
    expect(run.context).toEqual([
      expect.objectContaining({ kind: 'memory', id: 'memory-1' }),
      expect.objectContaining({ kind: 'llmwiki', id: 'projects/airi-gemma.md' }),
    ])
    expect(run.response).toContain('I found local context')
    expect(memoryManager.list).toHaveBeenCalledWith({
      query: 'What is our AIRI memory plan?',
      status: 'active',
      limit: 8,
      trackAccess: true,
    })
    expect(memoryManager.searchLlmWiki).toHaveBeenCalledWith({
      query: 'What is our AIRI memory plan?',
      limit: 5,
    })
  })

  it('uses an injected chat runtime for direct answer responses', async () => {
    const memoryManager = createMemoryManagerMock()
    const chatRuntime = createChatRuntimeMock()
    const orchestrator = createAgentOrchestrator({ memoryManager, chatRuntime, chatTarget: 'local' })

    const run = await orchestrator.run({ input: 'Explain the memory plan.' })

    expect(run.status).toBe('completed')
    expect(run.response).toBe('runtime response for Explain the memory plan.')
    expect(run.usedContextIds).toEqual(['memory-1', 'projects/airi-gemma.md'])
    expect(run.withheldContextIds).toEqual([])
    expect(chatRuntime.generate).toHaveBeenCalledWith({
      input: 'Explain the memory plan.',
      target: 'local',
      compactProfileMarkdown: '# AIRI Compact Profile\n\n- User is building a local memory assistant.',
      context: run.context,
    })
    expect(memoryManager.compactProfile).toHaveBeenCalled()
  })

  it('applies chat runtime updates to future runs without recreating the orchestrator', async () => {
    const memoryManager = createMemoryManagerMock()
    const chatRuntime = createChatRuntimeMock()
    const orchestrator = createAgentOrchestrator({ memoryManager })

    const fallbackRun = await orchestrator.run({ input: 'Before runtime.' })

    orchestrator.configureChatRuntime({ chatRuntime, chatTarget: 'local' })
    const runtimeRun = await orchestrator.run({ input: 'After runtime.' })

    orchestrator.configureChatRuntime({})
    const disabledRun = await orchestrator.run({ input: 'After disabling runtime.' })

    expect(fallbackRun.response).toBe('I found local context from 2 source(s).')
    expect(runtimeRun.response).toBe('runtime response for After runtime.')
    expect(disabledRun.response).toBe('I found local context from 2 source(s).')
    expect(chatRuntime.generate).toHaveBeenCalledTimes(1)
    expect(orchestrator.getRun({ id: fallbackRun.id })).toEqual(fallbackRun)
  })

  it('requires an explicit chat target at runtime when a chat runtime is injected', () => {
    const memoryManager = createMemoryManagerMock()
    const chatRuntime = createChatRuntimeMock()

    expect(() => createAgentOrchestrator({ memoryManager, chatRuntime } as Parameters<typeof createAgentOrchestrator>[0])).toThrow(
      'Agent chatTarget is required when chatRuntime is configured',
    )
  })

  it('uses cloud target without compact profile when a cloud chat runtime is configured', async () => {
    const memoryManager = createMemoryManagerMock()
    const chatRuntime = createChatRuntimeMock()
    const orchestrator = createAgentOrchestrator({ memoryManager, chatRuntime, chatTarget: 'cloud' })

    await orchestrator.run({ input: 'Explain the public project plan.' })

    expect(chatRuntime.generate).toHaveBeenCalledWith(expect.objectContaining({
      input: 'Explain the public project plan.',
      target: 'cloud',
      compactProfileMarkdown: undefined,
      context: [],
    }))
    expect(memoryManager.compactProfile).not.toHaveBeenCalled()
    expect(memoryManager.list).toHaveBeenCalledWith({
      query: 'Explain the public project plan.',
      status: 'active',
      limit: 8,
      trackAccess: true,
    })
    expect(memoryManager.searchLlmWiki).not.toHaveBeenCalled()
  })

  it('audits RAG-used and RAG-withheld context ids when no chat runtime is injected', async () => {
    const memoryManager = createMemoryManagerMock()
    vi.mocked(memoryManager.list).mockResolvedValueOnce([
      {
        ...memoryItem,
        id: 'memory-public',
        privacy: 'public',
        content: 'Public project summary.',
      },
      {
        ...memoryItem,
        id: 'memory-local',
        privacy: 'local',
        content: 'Local-only project detail.',
      },
      {
        ...memoryItem,
        id: 'memory-secret',
        privacy: 'secret',
        content: 'Secret project detail.',
      },
    ])
    const orchestrator = createAgentOrchestrator({ memoryManager, chatTarget: 'cloud' })

    const run = await orchestrator.run({ input: 'What can I share publicly?' })

    expect(run.context).toEqual([expect.objectContaining({ id: 'memory-public', privacy: 'public' })])
    expect(run.usedContextIds).toEqual(['memory-public'])
    expect(run.withheldContextIds).toEqual(['memory-local', 'memory-secret'])
    expect(memoryManager.searchLlmWiki).not.toHaveBeenCalled()
  })

  it('does not read memory or call chat runtime for high-risk pending actions', async () => {
    const memoryManager = createMemoryManagerMock()
    const chatRuntime = createChatRuntimeMock()
    const orchestrator = createAgentOrchestrator({ memoryManager, chatRuntime, chatTarget: 'local' })

    const run = await orchestrator.run({ input: 'run command: pnpm test' })

    expect(run.status).toBe('awaiting_confirmation')
    expect(run.context).toEqual([])
    expect(memoryManager.list).not.toHaveBeenCalled()
    expect(memoryManager.searchLlmWiki).not.toHaveBeenCalled()
    expect(memoryManager.compactProfile).not.toHaveBeenCalled()
    expect(chatRuntime.generate).not.toHaveBeenCalled()
  })

  it('pauses high-risk tool-like requests for confirmation', async () => {
    const orchestrator = createAgentOrchestrator({ memoryManager: createMemoryManagerMock() })

    const run = await orchestrator.run({ input: 'delete path: F:\\workspace\\old-cache' })

    expect(run.status).toBe('awaiting_confirmation')
    expect(run.mode).toBe('confirmation')
    expect(run.pendingAction).toMatchObject({
      toolName: 'computer.delete-file',
      risk: 'high',
      requiresConfirmation: true,
    })

    const rejected = await orchestrator.confirmAction({ id: run.id, approved: false })
    expect(rejected.status).toBe('cancelled')
  })

  it('cancels a pending run', async () => {
    const orchestrator = createAgentOrchestrator({ memoryManager: createMemoryManagerMock() })
    const run = await orchestrator.run({ input: 'run command: pnpm test' })

    const cancelled = await orchestrator.cancelRun({ id: run.id })

    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.pendingAction).toBeUndefined()
  })

  it('stores a reflection as a needs_review memory', async () => {
    const memoryManager = createMemoryManagerMock()
    const orchestrator = createAgentOrchestrator({ memoryManager })
    const run = await orchestrator.run({ input: 'Remember that AIRI should explain actions clearly.' })

    const reflected = await orchestrator.reflectAndStore({
      id: run.id,
      content: 'AIRI should explain actions clearly before using tools.',
    })

    expect(reflected.status).toBe('completed')
    expect(reflected.mode).toBe('reflect_and_store')
    expect(reflected.memoryId).toBe('reflection-1')
    expect(memoryManager.create).toHaveBeenCalledWith({
      content: 'AIRI should explain actions clearly before using tools.',
      summary: 'Agent reflection',
      type: 'note',
      privacy: 'local',
      importance: 3,
      sourceType: 'agent_reflection',
      sourceId: run.id,
      status: 'needs_review',
      tags: ['agent', 'reflection'],
      metadata: {
        agentRunId: run.id,
        contentPreview: 'AIRI should explain actions clearly before using tools.',
        originalInputPreview: 'Remember that AIRI should explain actions clearly.',
        redacted: false,
        safety: {
          safe: true,
          findings: [],
        },
      },
    })
  })

  it('marks unsafe agent reflections as secret and stores only redacted previews in metadata', async () => {
    const memoryManager = createMemoryManagerMock()
    const orchestrator = createAgentOrchestrator({ memoryManager })
    const run = await orchestrator.run({ input: 'Remember password=super-secret-token and F:\\private\\notes.md' })

    await orchestrator.reflectAndStore({
      id: run.id,
      content: 'Store api_key=sk-private-1234567890 from F:\\private\\notes.md',
    })

    expect(memoryManager.create).toHaveBeenLastCalledWith(expect.objectContaining({
      content: 'Store api_key=sk-private-1234567890 from F:\\private\\notes.md',
      privacy: 'secret',
      status: 'needs_review',
      tags: ['agent', 'reflection', 'safety-review'],
      metadata: expect.objectContaining({
        agentRunId: run.id,
        contentPreview: 'Store [redacted-credential] from [redacted-path]',
        originalInputPreview: 'Remember [redacted-credential] and [redacted-path]',
        redacted: true,
        safety: expect.objectContaining({
          safe: false,
          findings: expect.arrayContaining([
            expect.objectContaining({ kind: 'credential', severity: 'high' }),
            expect.objectContaining({ kind: 'local_path', severity: 'medium' }),
          ]),
        }),
      }),
    }))
  })

  it('lists saved routines as low-risk tool descriptors when a routine manager is provided', async () => {
    const routineManager = createRoutineManagerMock()
    const orchestrator = createAgentOrchestrator({
      memoryManager: createMemoryManagerMock(),
      routineManager,
    })

    await expect(orchestrator.listTools()).resolves.toEqual(expect.arrayContaining([
      {
        name: 'routine.morning-check',
        title: 'Morning check',
        description: 'Saved routine with 2 step(s).',
        risk: 'low',
        requiresConfirmation: false,
      },
    ]))
    expect(routineManager.list).toHaveBeenCalled()
  })

  it('previews a saved routine plan without reading memory or executing computer actions', async () => {
    const memoryManager = createMemoryManagerMock()
    const routineManager = createRoutineManagerMock()
    const computerUseManager = createComputerUseManagerMock()
    const orchestrator = createAgentOrchestrator({
      memoryManager,
      routineManager,
      computerUseManager,
    })

    const run = await orchestrator.run({ input: 'run routine: morning-check' })

    expect(run).toMatchObject({
      mode: 'tool_call',
      status: 'completed',
      context: [],
      usedContextIds: [],
      withheldContextIds: [],
    })
    expect(run.response).toContain('Routine plan: Morning check')
    expect(run.response).toContain('1. Open dashboard')
    expect(run.response).toContain('2. Summarize blockers')
    expect(run.response).toContain('This preview does not execute desktop actions.')
    expect(routineManager.list).toHaveBeenCalled()
    expect(memoryManager.list).not.toHaveBeenCalled()
    expect(computerUseManager.previewAction).not.toHaveBeenCalled()
    expect(computerUseManager.executeAction).not.toHaveBeenCalled()
  })

  it('lists computer-use preview as a tool when a computer-use manager is provided', async () => {
    const orchestrator = createAgentOrchestrator({
      memoryManager: createMemoryManagerMock(),
      computerUseManager: createComputerUseManagerMock(),
    })

    await expect(orchestrator.listTools()).resolves.toEqual(expect.arrayContaining([{
      name: 'computer.preview-action',
      title: 'Preview computer action',
      description: 'Classify a computer-use action before execution.',
      risk: 'low',
      requiresConfirmation: false,
    }]))
  })

  it('stores computer-use previews on high-risk pending actions', async () => {
    const computerUseManager = createComputerUseManagerMock()
    const orchestrator = createAgentOrchestrator({
      memoryManager: createMemoryManagerMock(),
      computerUseManager,
    })

    const run = await orchestrator.run({ input: 'run command: pnpm test' })

    expect(run.pendingAction).toMatchObject({
      toolName: 'computer.run-command',
      arguments: {
        input: 'run command: pnpm test',
        preview: expect.objectContaining({
          id: 'computer-preview-1',
          kind: 'run_command',
          decision: 'confirm',
          canExecute: false,
        }),
      },
    })
    expect(computerUseManager.previewAction).toHaveBeenCalledWith({
      kind: 'run_command',
      command: 'pnpm test',
      reason: 'Agent detected a shell or command execution intent.',
    })
  })

  it('executes approved safe computer-use previews from pending actions', async () => {
    const memoryManager = createMemoryManagerMock()
    const computerUseManager = createComputerUseManagerMock()
    const orchestrator = createAgentOrchestrator({
      memoryManager,
      computerUseManager,
    })

    const run = await orchestrator.run({ input: 'read file: F:\\workspace\\notes.md' })

    expect(run.status).toBe('awaiting_confirmation')
    expect(run.mode).toBe('confirmation')
    expect(run.context).toEqual([])
    expect(run.pendingAction).toMatchObject({
      toolName: 'computer.read-file',
      risk: 'low',
      requiresConfirmation: true,
      arguments: {
        preview: expect.objectContaining({
          id: 'computer-preview-1',
          kind: 'read_file',
        }),
      },
    })
    expect(memoryManager.list).not.toHaveBeenCalled()
    expect(computerUseManager.previewAction).toHaveBeenCalledWith({
      kind: 'read_file',
      target: 'F:\\workspace\\notes.md',
      reason: 'Agent detected a safe computer-use intent.',
    })

    const confirmed = await orchestrator.confirmAction({ id: run.id, approved: true })

    expect(computerUseManager.executeAction).toHaveBeenCalledWith({
      approved: true,
      id: 'computer-preview-1',
    })
    expect(confirmed.status).toBe('completed')
    expect(confirmed.mode).toBe('tool_call')
    expect(confirmed.response).toContain('Executed computer action: read_file')
    expect(confirmed.response).toContain('approved')
    expect(confirmed.pendingAction).toBeUndefined()
  })

  it('cancels denied computer-use previews instead of executing them after confirmation', async () => {
    const computerUseManager = createComputerUseManagerMock()
    vi.mocked(computerUseManager.previewAction).mockReturnValueOnce({
      id: 'computer-preview-denied',
      kind: 'read_file',
      target: 'F:\\private\\tokens.txt',
      reason: 'Agent detected a safe computer-use intent.',
      risk: 'low',
      decision: 'deny',
      reasons: ['Read target is outside allowed read roots.'],
      requiresConfirmation: false,
      canExecute: false,
      createdAt: '2026-05-11T00:00:00.000Z',
    })
    const orchestrator = createAgentOrchestrator({
      memoryManager: createMemoryManagerMock(),
      computerUseManager,
    })

    const run = await orchestrator.run({ input: 'read file: F:\\private\\tokens.txt' })

    expect(run.status).toBe('awaiting_confirmation')
    expect(run.pendingAction).toMatchObject({
      toolName: 'computer.read-file',
      risk: 'high',
      arguments: {
        preview: expect.objectContaining({
          decision: 'deny',
          id: 'computer-preview-denied',
        }),
      },
    })

    const confirmed = await orchestrator.confirmAction({ id: run.id, approved: true })

    expect(computerUseManager.executeAction).not.toHaveBeenCalled()
    expect(confirmed.status).toBe('cancelled')
    expect(confirmed.response).toContain('Computer action denied by policy')
    expect(confirmed.response).toContain('Read target is outside allowed read roots.')
    expect(confirmed.pendingAction).toBeUndefined()
  })

  it('does not execute high-risk previews after confirmation', async () => {
    const computerUseManager = createComputerUseManagerMock()
    const orchestrator = createAgentOrchestrator({
      memoryManager: createMemoryManagerMock(),
      computerUseManager,
    })
    const run = await orchestrator.run({ input: 'run command: pnpm test' })

    const confirmed = await orchestrator.confirmAction({ id: run.id, approved: true })

    expect(computerUseManager.executeAction).not.toHaveBeenCalled()
    expect(confirmed.status).toBe('cancelled')
    expect(confirmed.response).toContain('Computer action is not executable under the current policy')
    expect(confirmed.response).toContain('Computer-use action requires confirmation.')
  })

  it('does not execute low-risk previews when canExecute is false', async () => {
    const computerUseManager = createComputerUseManagerMock()
    vi.mocked(computerUseManager.previewAction).mockReturnValueOnce({
      id: 'computer-preview-non-executable',
      kind: 'read_file',
      target: 'F:\\workspace\\notes.md',
      reason: 'Agent detected a safe computer-use intent.',
      risk: 'low',
      decision: 'confirm',
      reasons: ['Non-executable preview from current policy.'],
      requiresConfirmation: true,
      canExecute: false,
      createdAt: '2026-05-11T00:00:00.000Z',
    })
    const orchestrator = createAgentOrchestrator({
      memoryManager: createMemoryManagerMock(),
      computerUseManager,
    })
    const run = await orchestrator.run({ input: 'read file: F:\\workspace\\notes.md' })

    const confirmed = await orchestrator.confirmAction({ id: run.id, approved: true })

    expect(computerUseManager.executeAction).not.toHaveBeenCalled()
    expect(confirmed.status).toBe('cancelled')
    expect(confirmed.response).toContain('Computer action is not executable under the current policy')
    expect(confirmed.response).toContain('Non-executable preview from current policy.')
  })

  it('keeps explanatory command wording as a direct answer', async () => {
    const orchestrator = createAgentOrchestrator({
      memoryManager: createMemoryManagerMock(),
      computerUseManager: createComputerUseManagerMock(),
    })

    const run = await orchestrator.run({ input: 'How do I run pnpm test?' })

    expect(run.status).toBe('completed')
    expect(run.mode).toBe('direct_answer')
    expect(run.pendingAction).toBeUndefined()
  })
})
