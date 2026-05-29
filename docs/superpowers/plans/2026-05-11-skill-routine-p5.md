# Skill Routine P5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal local-first Skill/Routine backend that can draft, confirm, persist, list, and expose reusable routines to the Agent Orchestrator.

**Architecture:** Routine state lives in Electron main process and persists Markdown files under a local routines directory. Renderer calls typed Eventa RPC. The Agent Orchestrator only lists routine tools in P5; actual routine execution remains a later phase.

**Tech Stack:** Electron main, TypeScript, Eventa invoke RPC, Node fs/promises, Vitest.

---

## Task 1: Routine Types And Eventa Events

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`

- [ ] **Step 1: Add routine DTOs and RPC events**

Add:
- `ElectronRoutineDraftRequest`
- `ElectronRoutineDraft`
- `ElectronRoutineItem`
- `ElectronRoutineSaveRequest`
- `ElectronRoutineListResult`
- `electronRoutineDraft`
- `electronRoutineSave`
- `electronRoutineList`
- `electronRoutineDelete`

Expected event names:

```text
eventa:invoke:electron:routine:draft
eventa:invoke:electron:routine:save
eventa:invoke:electron:routine:list
eventa:invoke:electron:routine:delete
```

## Task 2: Routine Manager

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/routines/index.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/routines/index.test.ts`

- [ ] **Step 1: Write failing tests**

Tests must cover:
- draft generation from multiline task text.
- saving a draft creates a Markdown file with frontmatter and `## Steps`.
- list reads saved routines.
- delete removes a routine file.
- Eventa adapter routes all routine RPCs to manager methods.

- [ ] **Step 2: Run RED**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/routines/index.test.ts
```

Expected: fail because module/events are missing.

- [ ] **Step 3: Implement manager and service**

Implement:
- `createRoutineManager({ routinesDir })`
- `setupRoutineManager()` using `app.getPath('userData')/airi-memory/skills`
- `createRoutineService({ context, manager })`

P5 constraints:
- Use kebab-case slugs.
- Default status is `draft`.
- Do not execute routines.
- Markdown is plain text and local-only.

- [ ] **Step 4: Run GREEN**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/routines/index.test.ts
```

Expected: pass.

### Task 3: Wire Routine Manager Into Electron Windows

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/windows/main/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/windows/main/rpc/index.electron.ts`
- Modify: `apps/stage-tamagotchi/src/main/windows/settings/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/windows/settings/rpc/index.electron.ts`

- [ ] **Step 1: Add DI provider**

Create `routineManager = injeca.provide('modules:routine-manager', { build: async () => setupRoutineManager() })`.

- [ ] **Step 2: Pass to main/settings windows**

Add `routineManager` dependency to both window setup paths.

- [ ] **Step 3: Register Eventa handlers**

Call `createRoutineService({ context, manager: params.routineManager })` in main/settings RPC setup.

### Task 4: Agent Routine Awareness

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/index.ts`

- [ ] **Step 1: Add failing test**

Agent `listTools()` should include saved routines as `routine.<slug>` low-risk descriptors when a routine manager is provided.

- [ ] **Step 2: Implement optional routine manager injection**

Allow `createAgentOrchestrator({ memoryManager, routineManager })`. Keep routine manager optional so existing tests remain simple.

### Task 5: Verification

- [ ] **Step 1: Run targeted lint**

```powershell
pnpm exec eslint --fix apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/main/services/airi/routines/index.ts apps/stage-tamagotchi/src/main/services/airi/routines/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.ts apps/stage-tamagotchi/src/main/index.ts apps/stage-tamagotchi/src/main/windows/main/index.ts apps/stage-tamagotchi/src/main/windows/main/rpc/index.electron.ts apps/stage-tamagotchi/src/main/windows/settings/index.ts apps/stage-tamagotchi/src/main/windows/settings/rpc/index.electron.ts
```

- [ ] **Step 2: Run targeted tests**

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/routines/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts
```

- [ ] **Step 3: Run typecheck**

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

- [ ] **Step 4: Run diff check**

```powershell
git diff --check
```
