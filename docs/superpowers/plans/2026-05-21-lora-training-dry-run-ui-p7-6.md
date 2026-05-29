# LoRA Training Dry Run UI P7.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the LoRA training package dry-run validator through Eventa, Pinia, and the Memory settings UI.

**Architecture:** Keep the validator in the main memory service and call it through a narrow Eventa invoke. The renderer store owns the latest dry-run report and the settings page renders only counts/check statuses, never sample content.

**Tech Stack:** TypeScript, Eventa, Electron main service, Pinia, Vue 3 `<script setup>`, UnoCSS, Vitest.

---

## Task 1: Eventa And Main Service Wiring

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

- [x] **Step 1: Write failing Eventa adapter expectations**

Update the memory service adapter test to expect an `electronMemoryValidateLoraTrainingPackage` invoke that calls `manager.validateLoraTrainingPackage(undefined)` and returns a dry-run report.

- [x] **Step 2: Run memory service test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

Expected: fail because the Eventa invoke and manager method are not wired yet.

- [x] **Step 3: Implement Eventa and manager wiring**

Add:
- shared request/result/check/count types
- `electronMemoryValidateLoraTrainingPackage`
- `createMemoryManager().validateLoraTrainingPackage()`
- `createMemoryService()` handler

- [x] **Step 4: Run memory service test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

Expected: pass.

## Task 2: Pinia Store And Settings UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/en/settings.yaml`
- Modify: `packages/i18n/src/locales/zh-Hans/settings.yaml`

- [x] **Step 1: Write failing store expectations**

Update the memory store test to expect `store.validateLoraTrainingPackage()` to call the new Eventa invoke, store the report, and toast a success/failure summary.

- [x] **Step 2: Run store test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

Expected: fail because the store action and invoke mock branch do not exist yet.

- [x] **Step 3: Implement store action and UI report**

Add:
- `loraTrainingDryRunResult` state
- `validateLoraTrainingPackage()` action
- settings page button beside LoRA export
- report card with pass/fail summary, counts, and failed checks
- English and Simplified Chinese labels

- [x] **Step 4: Run store test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

Expected: pass.

## Task 3: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-training-dry-run-ui-p7-6.md`

- [x] **Step 1: Document P7.6**

Add a note that the dry-run validator is available from Memory settings through Eventa/Pinia and still exposes no sample content.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-dry-run-ui-p7-6.md`
- Re-run targeted Vitest after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-dry-run-ui-p7-6.md`

Expected: all commands pass.
