# LoRA Training Dry Run P7.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dry-run validator that checks whether an exported LoRA dataset package is internally consistent and safe enough for a downstream training script to consume.

**Architecture:** Keep validation separate from dataset export. The new validator reads `lora-training-config.json`, counts JSONL rows, verifies manifest/config split counts, rejects unsafe dataset paths, and reports privacy gate failures without returning raw memory content.

**Tech Stack:** TypeScript, Vitest, AIRI memory service, JSONL, JSON config.

---

## Task 1: Dry-Run Validator

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts`
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`

- [x] **Step 1: Write failing dry-run tests**

Test two behaviors:
- a freshly exported package returns `ok: true`
- a tampered train count returns `ok: false` with a `train_count_matches_config` failure

The returned report must not include raw assistant message text.

- [x] **Step 2: Run dry-run test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`

Expected: fail because the validator module does not exist yet.

- [x] **Step 3: Implement validator**

Add `validateLoraTrainingPackage({ outputDir, configRelativePath })` that:
- reads `lora-training-config.json`
- rejects absolute paths and `..` path traversal in dataset references
- verifies candidate/train/eval/manifest files exist
- counts JSONL rows and compares them with config counts
- verifies manifest split strategy/counts match config
- verifies privacy booleans are strict safe values
- returns only check IDs, status, messages, and counts

- [x] **Step 4: Run dry-run test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-training-dry-run-p7-5.md`

- [x] **Step 1: Document P7.5**

Add a note that the LoRA package can be dry-run validated before any trainer touches it. State that dry-run reports counts and gate status only, not sample content.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-dry-run-p7-5.md`
- Re-run the targeted Vitest command after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-dry-run-p7-5.md`

Expected: all commands pass.
