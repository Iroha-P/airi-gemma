# Agent Chat Runtime Hot Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Agent Chat Runtime config changes to the running Agent Orchestrator without requiring an AIRI restart.

**Architecture:** `AgentOrchestrator` owns mutable chat runtime state through an explicit `configureChatRuntime()` method. The config Eventa service persists only validated configs, then calls an optional post-apply callback. Main process wiring uses that callback to resolve the config and update the existing orchestrator instance.

**Tech Stack:** TypeScript, Eventa, Pinia/Vue settings UI, Vitest, Valibot.

---

## Task 1: Mutable Orchestrator Runtime

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`

- [x] **Step 1: Write failing test**

Add a test showing an orchestrator starts deterministic, then uses an injected runtime after `configureChatRuntime({ chatRuntime, chatTarget: 'local' })`, then returns deterministic after `configureChatRuntime({})`.

- [x] **Step 2: Run red test**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts
```

- [x] **Step 3: Implement runtime state**

Store `chatRuntime` and `chatTarget` in local mutable variables instead of reading directly from constructor params in `run()`.

## Task 2: Config Apply Callback

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/index.ts`

- [x] **Step 1: Write failing service test**

Assert `createAgentChatRuntimeConfigService({ onConfigApplied })` calls the callback with the saved config after a valid apply, and does not call it for invalid payloads.

- [x] **Step 2: Implement callback**

After `applyAgentChatRuntimeConfig` succeeds, call `onConfigApplied(storedConfig)`. In main process, pass a callback that resolves the config and calls `agentOrchestrator.configureChatRuntime(resolved)`.

## Task 3: UI Restart Copy Cleanup

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/*/settings.yaml`

- [x] **Step 1: Remove restart-only wording**

Replace the restart note with immediate-apply wording once hot update is wired.

## Task 4: Verification and Review

- [x] **Step 1: Run targeted tests**

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/agent-chat-runtime-form.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts
```

- [x] **Step 2: Run typecheck and lint**

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm lint:fix
git diff --check
```

- [x] **Step 3: Independent review**

Review that hot update cannot bypass validation and does not lose run history.

Notes:
- TDD red check failed for the intended reasons: `configureChatRuntime` did not exist, and `onConfigApplied` was not called.
- Targeted tests, `stage-tamagotchi` typecheck, `pnpm lint:fix`, and `git diff --check` were run after implementation.
- Subagent review attempt failed due a transport disconnect, so the review was completed locally against the focused diff and search results.
