# Memory Export Preflight UI P6.7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the memory export preflight report in the Memory settings page before public profile or LoRA candidate export.

**Architecture:** Keep export rules in the P6.6 service layer. Add small Pinia convenience actions for public-profile and LoRA preflight, then let the existing settings page trigger those actions and render the cached report.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, Eventa, UnoCSS class arrays, Vitest, vue-tsc.

---

## Task 1: Store Convenience Actions

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [x] **Step 1: Write failing store expectations**

Add assertions that `previewPublicProfileExport()` calls `preview-export-preflight` with `{ surface: 'public_profile' }`, and `previewLoraDatasetExport()` calls it with `{ surface: 'lora_dataset' }`.

- [x] **Step 2: Run the store test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

Expected: fail because the convenience actions do not exist yet.

- [x] **Step 3: Implement convenience actions**

Add:
- `previewPublicProfileExport()`
- `previewLoraDatasetExport()`

Both should delegate to `previewExportPreflight(surface)`.

- [x] **Step 4: Run the store test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

Expected: pass.

## Task 2: Memory Settings UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/en/settings.yaml`
- Modify: `packages/i18n/src/locales/zh-Hans/settings.yaml`

- [x] **Step 1: Read cached preflight result in the page**

Include `exportPreflightResult` in `storeToRefs(memoryStore)`.

- [x] **Step 2: Add derived display state**

Add computed values for blocked items and a compact surface label.

- [x] **Step 3: Add preflight buttons and report card**

Add buttons for public profile and LoRA preflight beside the existing export buttons. Render summary counts and blocked reasons without exposing memory content.

- [x] **Step 4: Add translations**

Add English and Simplified Chinese keys for:
- preview public profile
- preview LoRA candidates
- preflight title/description
- summary counts
- empty/blocked labels
- reason labels

## Task 3: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-memory-export-preflight-ui-p6-7.md`

- [x] **Step 1: Document P6.7**

Add a note that the settings page now exposes the preflight report before export.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-memory-export-preflight-ui-p6-7.md`
- Re-run the targeted store test after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-memory-export-preflight-ui-p6-7.md`

Expected: all commands pass.
