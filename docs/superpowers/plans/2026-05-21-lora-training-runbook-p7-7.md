# LoRA Training Runbook P7.7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export a Chinese training handoff runbook beside the LoRA dataset package so the user can understand how to take the package into Unsloth/TRL without AIRI launching training.

**Architecture:** Keep this as a generated Markdown artifact from the existing dataset exporter. The runbook references `lora-training-config.json`, train/eval JSONL files, dry-run validation, privacy gates, and manual training steps, but never embeds sample content.

**Tech Stack:** TypeScript, Vitest, Markdown, AIRI memory service.

---

## Task 1: Generated Training Runbook

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

- [x] **Step 1: Write failing runbook expectations**

Expect LoRA export to also create `lora-training-runbook.zh-CN.md`. The runbook must mention:
- `lora-training-config.json`
- `lora-dataset-train.jsonl`
- `lora-dataset-eval.jsonl`
- `validateLoraTrainingPackage`
- Unsloth / TRL
- QLoRA
- privacy gates

It must not include raw assistant sample content or local source paths.

- [x] **Step 2: Run LoRA dataset test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: fail because the runbook artifact does not exist yet.

- [x] **Step 3: Implement runbook generation**

Add a runbook builder that receives the training config summary and writes `lora-training-runbook.zh-CN.md`. Add it to `result.files`.

- [x] **Step 4: Run LoRA dataset test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-training-runbook-p7-7.md`

- [x] **Step 1: Document P7.7**

Add a note that the exporter now writes a Chinese LoRA training runbook and that AIRI still does not start training from the desktop app.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-runbook-p7-7.md`
- Re-run targeted Vitest after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-runbook-p7-7.md`

Expected: all commands pass.
