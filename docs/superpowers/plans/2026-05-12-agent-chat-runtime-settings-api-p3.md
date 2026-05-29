# Agent Chat Runtime Settings API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose Agent Chat Runtime configuration through typed Eventa invokes and the memory settings store, while preserving the explicit local/cloud target privacy boundary.

**Architecture:** Shared Eventa types define the renderer/main contract. The main-process config service validates config before persistence and refuses enabled configs without an explicit target. The renderer memory settings store calls the new invokes and keeps the current runtime config available for future UI.

**Tech Stack:** TypeScript, Eventa invoke handlers, Pinia setup store, Vitest, Valibot config persistence.

---

## Task 1: Main Config Eventa Service

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.ts`
- Modify: `apps/stage-tamagotchi/src/main/index.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts`

- [x] **Step 1: Write failing service tests**

Add tests that call `electronAgentChatRuntimeGetConfig` and `electronAgentChatRuntimeApplyConfig` through an in-memory Eventa context. Assert disabled config can be returned, enabled config with explicit `target: 'local'` is persisted, and enabled config without `target` rejects without updating storage.

- [x] **Step 2: Run red test**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts
```

Expected: FAIL because the new Eventa events/service functions do not exist yet.

- [x] **Step 3: Implement minimal service**

Add shared config types/events, create `createAgentChatRuntimeConfigService`, `registerGlobalAgentChatRuntimeConfigService`, and validation helpers in `config.ts`. Register the service from `main/index.ts`.

- [x] **Step 4: Run green test**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts
```

Expected: PASS.

## Task 2: Renderer Store Binding

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [x] **Step 1: Write failing store tests**

Extend the existing mocked `useElectronEventaInvoke` map with Agent Chat Runtime get/apply invokes. Assert initial refresh loads the config and `saveAgentChatRuntimeConfig` persists the config through Eventa, updates store state, and shows success toast.

- [x] **Step 2: Run red test**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts
```

Expected: FAIL because the store does not call the new invokes yet.

- [x] **Step 3: Implement minimal store binding**

Import shared config types/events, add `agentChatRuntimeConfig`, `refreshAgentChatRuntimeConfig`, and `saveAgentChatRuntimeConfig`, then include config refresh in the existing `refresh()` call.

- [x] **Step 4: Run green test**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts
```

Expected: PASS.

## Task 3: Verification and Review

**Files:**
- No new implementation files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts
```

- [x] **Step 2: Run typecheck and lint**

Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm lint:fix
git diff --check
```

- [x] **Step 3: Independent review**

Ask a fresh subagent to review the changed files for spec compliance, privacy regressions, type issues, and code quality. Fix any actionable findings and rerun the relevant tests.
