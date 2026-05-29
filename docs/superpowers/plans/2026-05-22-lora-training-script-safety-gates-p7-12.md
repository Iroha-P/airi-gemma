# LoRA Training Script Safety Gates P7.12 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the external training script dry-run reject unsafe or malformed LoRA JSONL records before any training dependency is imported.

**Architecture:** Keep validation in Python stdlib helpers. Extend `load_jsonl_records` to validate chat roles, require assistant content, reject very short assistant messages, and reject local path leakage. Tests exercise the CLI dry-run path through a real subprocess.

**Tech Stack:** Python stdlib validation, Vitest subprocess test.

---

## Task 1: Dataset Record Safety Gates

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Modify: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`

- [x] **Step 1: Write failing unsafe-record expectations**

Add a test that writes a minimal package whose assistant message contains `F:/private/interview.md`, runs `python train_gemma_qlora_unsloth.py --dry-run`, and expects the command to fail with `possible local path`.

- [x] **Step 2: Run template test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

Expected: fail because the script currently validates only that `messages` is a list.

- [x] **Step 3: Implement record validation**

Add:
- allowed roles: `system`, `user`, `assistant`
- required non-empty assistant content
- minimum assistant content length of 40 chars
- local path pattern rejection

- [x] **Step 4: Run template test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-training-script-safety-gates-p7-12.md`

- [x] **Step 1: Document safety gates**

Mention that script dry-run rejects malformed roles, missing assistant content, very short assistant content, and local path leakage.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- `python -m py_compile scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-safety-gates-p7-12.md`
- Re-run targeted Vitest after lint.
- Re-run Python py_compile after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-safety-gates-p7-12.md`

Expected: all commands pass.
