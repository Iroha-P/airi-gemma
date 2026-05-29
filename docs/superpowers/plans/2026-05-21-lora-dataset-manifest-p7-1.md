# LoRA Dataset Manifest P7.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export a LoRA dataset manifest beside the JSONL candidates so every training batch has auditable source IDs, counts, and blocked reasons.

**Architecture:** Keep JSONL as the training-facing artifact. Add `lora-dataset-manifest.json` as the governance artifact generated from the same export records and shared export preflight report.

**Tech Stack:** TypeScript, Vitest, AIRI memory service, JSONL, JSON manifest.

---

## Task 1: Manifest Export

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

- [x] **Step 1: Write failing manifest expectations**

Extend the existing LoRA dataset export test so it expects:
- `lora-dataset-candidates.jsonl`
- `lora-dataset-manifest.json`
- manifest `recordCount` equals the JSONL record count
- manifest `records` lists source memory IDs without raw metadata
- manifest `preflight.summary` includes total/allowed/blocked counts
- manifest `preflight.blocked` lists blocked memory IDs and reasons without memory content

- [x] **Step 2: Run LoRA dataset test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: fail because the manifest file is not created yet.

- [x] **Step 3: Implement manifest generation**

Use `createMemoryExportPreflightReport({ surface: 'lora_dataset' })` in `exportLoraDatasetCandidates`. Write `lora-dataset-manifest.json` with:
- `exportedAt`
- `recordCount`
- `records`
- `preflight.summary`
- `preflight.blocked`

- [x] **Step 4: Run LoRA dataset test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-dataset-manifest-p7-1.md`

- [x] **Step 1: Document P7.1**

Add a note that LoRA candidate export now writes a governance manifest and does not put blocked memory content into that manifest.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-dataset-manifest-p7-1.md`
- Re-run the targeted Vitest command after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-dataset-manifest-p7-1.md`

Expected: all commands pass.
