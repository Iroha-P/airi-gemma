# LoRA Dataset Quality Gate P7.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a training-readiness quality gate so LoRA candidate export writes only ready records to JSONL and keeps questionable records in a manifest-only review list.

**Architecture:** Keep privacy/export eligibility in `export-preflight.ts`. Add lightweight deterministic quality checks inside `lora-dataset.ts` for candidate content quality and local path leakage before writing JSONL.

**Tech Stack:** TypeScript, Vitest, AIRI memory service, JSONL, JSON manifest.

---

## Task 1: Training-Readiness Quality Gate

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

- [x] **Step 1: Write failing quality-gate expectations**

Extend the LoRA dataset export test with two preflight-allowed but not training-ready memories:
- short content should be withheld with `too_short`
- content containing a Windows local path should be withheld with `possible_local_path`

Expect JSONL to contain only ready records, while manifest records quality summaries and review-only IDs without content.

- [x] **Step 2: Run LoRA dataset test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: fail because the quality gate is not implemented yet.

- [x] **Step 3: Implement deterministic quality checks**

Add:
- `LoraDatasetQualityReason = 'too_short' | 'missing_assistant_content' | 'possible_local_path'`
- `assessCandidateRecordQuality(record)`
- filter JSONL records to quality-ready records only
- manifest `quality.summary` and `quality.needsReview`

- [x] **Step 4: Run LoRA dataset test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-dataset-quality-gate-p7-2.md`

- [x] **Step 1: Document P7.2**

Add a note that JSONL now contains only quality-ready candidates and questionable samples stay in manifest-only review.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-dataset-quality-gate-p7-2.md`
- Re-run the targeted Vitest command after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-dataset-quality-gate-p7-2.md`

Expected: all commands pass.
