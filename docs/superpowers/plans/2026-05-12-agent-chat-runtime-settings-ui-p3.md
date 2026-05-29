# Agent Chat Runtime Settings UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact settings-page UI for enabling/disabling the Agent Chat Runtime and configuring an OpenAI-compatible local or cloud provider.

**Architecture:** The existing memory settings route remains the composition surface. Local form refs mirror `useMemorySettingsStore().agentChatRuntimeConfig`; saves call the already-tested `saveAgentChatRuntimeConfig` store action, while main-process validation remains the source of truth.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, `@proj-airi/ui` field components, Eventa-backed settings store, Vitest, vue-tsc.

---

## Task 1: Store Regression Coverage

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [x] **Step 1: Write failing test**

Add a test that verifies saving a disabled Agent Chat Runtime config sends `{ enabled: false, provider: 'openai-compatible' }` without a target. This prevents UI defaults from reintroducing implicit `local`.

- [x] **Step 2: Run red test**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts
```

Expected: FAIL until the test expectation and store behavior line up with the explicit-target rule.

- [x] **Step 3: Keep implementation minimal**

If the store already satisfies the behavior, keep production code unchanged and preserve the regression test.

- [x] **Step 4: Run green test**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts
```

Expected: PASS.

## Task 2: Settings Page UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`

- [x] **Step 1: Add local form state**

Add refs for `enabled`, `target`, `baseURL`, `model`, and `apiKey`. Watch `agentChatRuntimeConfig` and sync these refs when settings load.

- [x] **Step 2: Add save handler**

Build a payload that omits `target` when disabled and requires `target/baseURL/model` when enabled. Call `memoryStore.saveAgentChatRuntimeConfig(payload)`.

- [x] **Step 3: Add compact UI section**

Add a bordered settings section after the memory status cards using existing `FieldCheckbox`, `FieldSelect`, `FieldInput`, and `Button` components.

## Task 3: Verification and Review

**Files:**
- No new implementation files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts
```

- [x] **Step 2: Run typecheck and lint**

Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm lint:fix
git diff --check
```

- [x] **Step 3: Independent review**

Review the UI for explicit target behavior, no API-key disclosure in logs/tests, and no accidental bypass of main-process validation.
