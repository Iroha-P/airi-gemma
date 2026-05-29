# Memory Export Preflight P6.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared memory export preflight layer so public profile and LoRA dataset exports can explain which memories are allowed or blocked before any file is written.

**Architecture:** Create a focused `export-preflight.ts` module beside the existing memory exporters. Public profile and LoRA dataset exporters will reuse its predicates so the preflight report and actual exported files cannot drift apart.

**Tech Stack:** TypeScript, Vitest, Electron main memory service, AIRI memory item metadata.

---

## Task 1: Shared Export Preflight Rules

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.ts`
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts`

- [x] **Step 1: Write the failing test**

Add tests that check:
- `public_profile` allows only active, non-sensitive/non-secret, non-raw-import memories with `metadata.profileVisibility` set to `demo` or `training_sanitized`.
- `lora_dataset` allows only active, non-sensitive/non-secret, non-raw-import memories with `metadata.loraDatasetCandidate === true` or `metadata.profileVisibility === 'training_sanitized'`.
- blocked memories include machine-readable reasons such as `not_active`, `sensitive_or_secret`, `raw_chat_import`, `missing_public_visibility`, `missing_training_visibility`, and `demo_only`.

- [x] **Step 2: Run the new test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts`

Expected: fail because `./export-preflight` does not exist yet.

- [x] **Step 3: Implement the minimal shared preflight module**

Add:
- `MemoryExportSurface = 'public_profile' | 'lora_dataset'`
- `MemoryExportPreflightReason`
- `createMemoryExportPreflightReport`
- `isMemoryAllowedForExport`
- `isRawImportSourceType`

- [x] **Step 4: Run the new test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts`

Expected: pass.

## Task 2: Reuse Preflight In Existing Exporters

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.test.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

- [x] **Step 1: Replace duplicated filtering with `isMemoryAllowedForExport`**

`public-profile.ts` should call `isMemoryAllowedForExport(memory, 'public_profile')`.

`lora-dataset.ts` should call `isMemoryAllowedForExport(memory, 'lora_dataset')`.

- [x] **Step 2: Run exporter tests**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: pass.

## Task 3: Wire Manager Preview API

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [x] **Step 1: Add Eventa request/result types**

Add `ElectronMemoryPreviewExportPreflightRequest`, `ElectronMemoryPreviewExportPreflightResult`, and `electronMemoryPreviewExportPreflight`.

- [x] **Step 2: Add manager method and invoke handler**

`createMemoryManager().previewExportPreflight({ surface })` should list memories and call `createMemoryExportPreflightReport`.

- [x] **Step 3: Add store method**

`previewExportPreflight(surface)` should call the Eventa invoke, cache the result, and return it.

- [x] **Step 4: Run store and memory service tests**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

Expected: pass.

## Task 4: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-memory-export-preflight-p6-6.md`

- [x] **Step 1: Document P6.6**

Add a note that public profile and LoRA dataset exports now share a preflight rule engine and expose blocked reasons before export.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.ts apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-memory-export-preflight-p6-6.md`
- Re-run the targeted Vitest command after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.ts apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-memory-export-preflight-p6-6.md`

Expected: all commands pass.
