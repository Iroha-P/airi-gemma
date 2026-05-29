# LoRA Dataset Candidates P7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export a local JSONL file of LoRA dataset candidates from explicitly approved and sanitized memories.

**Architecture:** The exporter lives beside Memory Service exporters. It filters active memories by explicit training eligibility, excludes sensitive/raw imports, and writes reviewable chat-style SFT candidate records into `airi-brain/90-lora-dataset-candidates`. The renderer only triggers export; it does not generate or mutate training data.

**Tech Stack:** Electron main process, Eventa RPC, Pinia store, Vue settings page, Vitest, TypeScript.

---

## File Structure

- Create `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
  - Filters eligible memories and writes JSONL candidate records.
- Create `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`
  - Verifies eligibility filters, raw import exclusion, and JSONL shape.
- Modify `apps/stage-tamagotchi/src/shared/eventa.ts`
  - Add request/result types and `electronMemoryExportLoraDatasetCandidates`.
- Modify `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
  - Wire manager and Eventa handler.
- Modify `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`
  - Verify RPC delegates to manager.
- Modify `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
  - Add store action and toast.
- Modify `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
  - Verify store action invokes RPC.
- Modify `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
  - Add export button.
- Modify `packages/i18n/src/locales/*/settings.yaml`
  - Add button label.
- Modify `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
  - Mark P7 first implementation boundary.

## Task 1: Exporter

- [ ] Write failing test for `exportLoraDatasetCandidates`.
- [ ] Run `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`; expect missing module failure.
- [ ] Implement exporter with strict eligibility:
  - active only;
  - privacy must not be `sensitive` or `secret`;
  - source type must not be raw chat imports;
  - `metadata.loraDatasetCandidate === true` or `metadata.profileVisibility === 'training_sanitized'`.
- [ ] Re-run exporter test; expect pass.

## Task 2: RPC and UI

- [ ] Add Eventa types and invoke.
- [ ] Wire manager, adapter, store, and settings button.
- [ ] Update tests for main adapter and store.

## Task 3: Verification

- [ ] Run targeted memory tests.
- [ ] Run `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- [ ] Run `pnpm lint:fix`.
- [ ] Run `git diff --check`.
