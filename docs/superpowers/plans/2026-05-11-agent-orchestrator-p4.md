# Agent Orchestrator P4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal local-first Agent Orchestrator backend for AIRI desktop.

**Architecture:** The orchestrator runs in Electron main process, reads Memory Manager and LLMWiki context, builds an auditable `AgentRun`, and exposes typed Eventa RPC to renderer windows. It does not execute high-risk tools directly in this phase; high-risk requests stop at `awaiting_confirmation`.

**Tech Stack:** Electron main, TypeScript, Eventa invoke RPC, Vitest, existing Memory Manager.

---

## Task 1: Agent Types And Events

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`

- [ ] **Step 1: Add agent DTOs and Eventa invokes**

Add `ElectronAgentRunRequest`, `ElectronAgentRun`, `ElectronAgentToolDescriptor`, confirmation payload/result types, and invoke events:

```ts
export const electronAgentRun = defineInvokeEventa<ElectronAgentRun, ElectronAgentRunRequest>('eventa:invoke:electron:agent:run')
export const electronAgentGetRun = defineInvokeEventa<ElectronAgentRun | null, { id: string }>('eventa:invoke:electron:agent:get-run')
export const electronAgentCancelRun = defineInvokeEventa<ElectronAgentRun, { id: string }>('eventa:invoke:electron:agent:cancel-run')
export const electronAgentListTools = defineInvokeEventa<ElectronAgentToolDescriptor[]>('eventa:invoke:electron:agent:list-tools')
export const electronAgentConfirmAction = defineInvokeEventa<ElectronAgentRun, ElectronAgentConfirmActionRequest>('eventa:invoke:electron:agent:confirm-action')
export const electronAgentReflectAndStore = defineInvokeEventa<ElectronAgentRun, ElectronAgentReflectAndStoreRequest>('eventa:invoke:electron:agent:reflect-and-store')
```

- [ ] **Step 2: Run targeted typecheck after implementation**

Run: `pnpm -F @proj-airi/stage-tamagotchi typecheck`

Expected: event type definitions compile.

### Task 2: Agent Orchestrator Core

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- direct answer run retrieves memory and LLMWiki context.
- high-risk tool-like request returns `awaiting_confirmation`.
- cancel changes a pending run to `cancelled`.
- reflect-and-store creates a `needs_review` memory.

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`

Expected: FAIL because orchestrator module does not exist.

- [ ] **Step 3: Implement minimal orchestrator**

Expose `createAgentOrchestrator({ memoryManager })` with:
- `run(payload)`
- `getRun({ id })`
- `cancelRun({ id })`
- `listTools()`
- `confirmAction(payload)`
- `reflectAndStore(payload)`

Use in-memory run storage for P4. No external model call yet.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`

Expected: PASS.

### Task 3: Agent Eventa Service Adapter

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/agent/index.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts`

- [ ] **Step 1: Write failing adapter test**

Create an Eventa context, register `createAgentService`, invoke every agent RPC, and assert the orchestrator mock receives the payload.

- [ ] **Step 2: Run adapter test to verify RED**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts`

Expected: FAIL because adapter does not exist.

- [ ] **Step 3: Implement adapter**

Register handlers with `defineInvokeHandler` for all agent RPC events.

- [ ] **Step 4: Run adapter test to verify GREEN**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts`

Expected: PASS.

### Task 4: Wire Agent Manager Into Desktop Main

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/windows/main/rpc/index.electron.ts`
- Modify: `apps/stage-tamagotchi/src/main/windows/settings/rpc/index.electron.ts`
- Modify: `apps/stage-tamagotchi/src/main/windows/main/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/windows/settings/index.ts`

- [ ] **Step 1: Add manager dependency**

Create `agentOrchestrator` via `setupAgentOrchestrator({ memoryManager })` and pass it into main/settings window invoke setup.

- [ ] **Step 2: Register service**

Call `createAgentService({ context, orchestrator })` beside `createMemoryService`.

- [ ] **Step 3: Run targeted typecheck**

Run: `pnpm -F @proj-airi/stage-tamagotchi typecheck`

Expected: PASS.

### Task 5: Verification

**Files:**
- All modified files in this phase.

- [ ] **Step 1: Run targeted ESLint**

Run:

```powershell
pnpm exec eslint --fix apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts apps/stage-tamagotchi/src/main/index.ts apps/stage-tamagotchi/src/main/windows/main/rpc/index.electron.ts apps/stage-tamagotchi/src/main/windows/settings/rpc/index.electron.ts apps/stage-tamagotchi/src/main/windows/main/index.ts apps/stage-tamagotchi/src/main/windows/settings/index.ts
```

- [ ] **Step 2: Run agent and memory tests**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts
```

- [ ] **Step 3: Run stage-tamagotchi typecheck**

Run: `pnpm -F @proj-airi/stage-tamagotchi typecheck`

- [ ] **Step 4: Run whitespace check**

Run: `git diff --check`
