# LoRA Training Script Dry Run P7.11 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the external Gemma QLoRA training script validate an exported LoRA package with `--dry-run` before importing Unsloth/TRL or touching a GPU.

**Architecture:** Refactor `train_gemma_qlora_unsloth.py` so heavy ML imports happen only inside the real training path. Add `--dry-run` to validate config privacy flags, safe paths, train/eval row counts, and chat record shape, then print a JSON summary and exit.

**Tech Stack:** Python stdlib dry-run, Unsloth/TRL lazy imports, Vitest static and subprocess checks.

---

## Task 1: Dry-Run Guard

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Modify: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`

- [x] **Step 1: Write failing dry-run expectations**

Extend the template test to:
- assert the script contains `--dry-run`
- assert heavy imports are not top-level `from datasets`, `from trl`, or `from unsloth`
- create a minimal temporary LoRA package
- run `python train_gemma_qlora_unsloth.py --config <tmp>/lora-training-config.json --dry-run`
- expect JSON output with candidate/train/eval counts

- [x] **Step 2: Run template test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

Expected: fail because `--dry-run` is not implemented and heavy imports are top-level.

- [x] **Step 3: Implement script dry-run**

Add:
- `--dry-run`
- `validate_training_package`
- lazy ML imports inside the non-dry-run path
- JSON summary output for dry-run

- [x] **Step 4: Run template test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-training-script-dry-run-p7-11.md`

- [x] **Step 1: Document dry-run usage**

Add README and design-doc notes that `python ... --dry-run` validates the package before importing GPU training dependencies.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- `python -m py_compile scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-dry-run-p7-11.md`
- Re-run targeted Vitest after lint.
- Re-run Python py_compile after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-dry-run-p7-11.md`

Expected: all commands pass.
