# Computer Use Safety P6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a preview-only Computer Use safety layer so AIRI can classify desktop actions before any real execution is implemented.

**Architecture:** P6.0 introduces a main-process `computer-use` manager with policy snapshots, action preview classification, and audit logs. Eventa exposes read-only/preview RPCs, and the Agent Orchestrator consumes the preview result when it detects high-risk computer-use intent.

**Tech Stack:** Electron main process, TypeScript, Eventa IPC/RPC, injeca DI, Vitest.

---

## Scope

P6.0 intentionally does not execute mouse, keyboard, filesystem mutation, shell command, browser launch, or application launch. It only decides whether a requested action would be allowed, require confirmation, or be denied under the current local policy.

## P6.1 Audit Persistence Addendum

P6.1 keeps the same preview-only execution boundary and adds durable audit bookkeeping:

- Computer-use previews are appended as JSONL to `app.getPath('userData')/airi-memory/computer-use/audit.jsonl`.
- The in-memory audit list is capped at the most recent 500 entries by default.
- Malformed historical JSONL rows are skipped during load so one corrupted line does not break startup.
- Audit persistence records previews only; it is not an approval ledger and must not be used as proof that a real action executed.

## Files

- Create: `apps/stage-tamagotchi/src/main/services/airi/computer-use/index.ts`
- Create: `apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts`
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/index.ts`

## Task 1: Computer Use Policy Manager

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/computer-use/index.ts`
- Create: `apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts`

- [ ] Step 1: Write failing tests for policy classification.

Tests must cover:
- `read_file` inside an allowed read root returns `decision: 'confirm'` because local file inspection still exposes private data.
- `delete_path` returns `decision: 'confirm'` and `risk: 'high'`.
- Actions targeting a denied root return `decision: 'deny'`.
- `previewAction` appends an audit entry with `canExecute: false`.

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts
```

Expected: fail because the module does not exist yet.

- [ ] Step 2: Implement the minimal manager.

The manager exports:

```ts
export function createComputerUseManager(options: { policy?: Partial<ElectronComputerUsePolicySnapshot> }): ComputerUseManager
export async function setupComputerUseManager(): Promise<ComputerUseManager>
export function createComputerUseService(params: { context: ReturnType<typeof createContext>['context'], manager: ComputerUseManager }): void
export function registerGlobalComputerUseService(params: { manager: ComputerUseManager }): void
```

Rules:
- `mode` is always `preview_only`.
- `canExecute` is always `false`.
- Mutating actions and commands are high-risk and require confirmation.
- Read/search/observe actions are low-risk but still require confirmation when a local target is involved.
- Denied roots override every other rule.

- [ ] Step 3: Run the computer-use test until green.

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts
```

Expected: pass.

## Task 2: Eventa Contract

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts`

- [ ] Step 1: Add shared DTOs and invoke events.

Add:
- `ElectronComputerUseActionKind`
- `ElectronComputerUseActionRisk`
- `ElectronComputerUseDecision`
- `ElectronComputerUseActionPreviewRequest`
- `ElectronComputerUseActionPreview`
- `ElectronComputerUsePolicySnapshot`
- `ElectronComputerUseAuditEntry`
- `ElectronComputerUseAuditListResult`
- `electronComputerUseGetPolicy`
- `electronComputerUsePreviewAction`
- `electronComputerUseListAuditLogs`

- [ ] Step 2: Verify the service adapter via Eventa.

The test must create an in-memory Eventa context and call the three invokes through `defineInvoke`.

Expected: policy, preview result, and audit list are returned from the manager.

## Task 3: Agent Orchestrator Integration

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/index.ts`

- [ ] Step 1: Write failing agent tests.

Tests must cover:
- `listTools()` includes `computer.preview-action` when a computer-use manager is provided.
- A command-like request stores the computer-use preview in `pendingAction.arguments.preview`.

- [ ] Step 2: Implement optional `computerUseManager` dependency.

`createAgentOrchestrator` accepts:

```ts
interface AgentOrchestratorDependencies {
  memoryManager: MemoryManager
  routineManager?: RoutineManager
  computerUseManager?: ComputerUseManager
}
```

When high-risk intent is detected, call `previewAction` before returning a confirmation run.

## Task 4: Main Process Wiring

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/index.ts`

- [ ] Step 1: Add injeca providers.

Add:
- `modules:computer-use-manager`
- `services:computer-use-rpc`

Pass `computerUseManager` into `setupAgentOrchestrator`.

- [ ] Step 2: Force global RPC registration in `injeca.invoke`.

Include `computerUseManager` and `computerUseRpc` in the invoke dependency set.

## Verification

Run:

```powershell
pnpm exec eslint --fix apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/main/services/airi/computer-use/index.ts apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/main/index.ts
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/main/services/airi/routines/index.test.ts
pnpm -F @proj-airi/stage-tamagotchi typecheck
git diff --check
```

Expected: all commands pass.
