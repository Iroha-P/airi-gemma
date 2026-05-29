# LoRA Dataset Splits P7.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate deterministic train/eval JSONL splits from quality-ready LoRA candidates.

**Architecture:** Keep `lora-dataset-candidates.jsonl` as the full ready candidate pool. Add `lora-dataset-train.jsonl` and `lora-dataset-eval.jsonl` using a deterministic tail-eval split recorded in the manifest.

**Tech Stack:** TypeScript, Vitest, AIRI memory service, JSONL, JSON manifest.

---

## Task 1: Deterministic Train/Eval Split

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

- [x] **Step 1: Write failing split expectations**

Expect LoRA export to also create:
- `lora-dataset-train.jsonl`
- `lora-dataset-eval.jsonl`

For fewer than 5 ready records, all ready records should go to train and eval should be empty. For 5 or more ready records, the last 20% should go to eval. Manifest should include split counts and source IDs without message content.

- [x] **Step 2: Run LoRA dataset test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: fail because train/eval split files do not exist yet.

- [x] **Step 3: Implement split generation**

Add:
- deterministic `splitReadyRecords(records)`
- write train/eval JSONL files
- include split metadata in manifest
- include split files in export result

- [x] **Step 4: Run LoRA dataset test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-dataset-splits-p7-3.md`

- [x] **Step 1: Document P7.3**

Add a note that LoRA candidate export now creates full/train/eval JSONL files and records split metadata in the manifest.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-dataset-splits-p7-3.md`
- Re-run the targeted Vitest command after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-dataset-splits-p7-3.md`

Expected: all commands pass.
