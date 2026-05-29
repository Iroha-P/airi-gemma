# LoRA Training Script Template P7.8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an external Unsloth/TRL QLoRA training script template that consumes AIRI's exported LoRA package without adding Python dependencies to the Electron desktop app.

**Architecture:** Keep training assets under `scripts/training/gemma-qlora/`. Add a self-contained `uv run` Python script with PEP 723 dependencies, a Chinese README, and a static Vitest guard that checks the template reads `lora-training-config.json`, enforces privacy gates, uses train/eval JSONL, and follows current TRL/Unsloth API shape.

**Tech Stack:** Python template, uv PEP 723 dependencies, Unsloth, Hugging Face TRL SFTTrainer/SFTConfig, Vitest static checks.

---

## Task 1: Static Guard For Training Template

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Create: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- Create: `scripts/training/gemma-qlora/README.zh-CN.md`

- [x] **Step 1: Write failing static template expectations**

The test should assert:
- script file exists
- README file exists
- script has PEP 723 dependencies
- script references `FastLanguageModel`, `SFTTrainer`, `SFTConfig`, `Dataset.from_list`
- script reads `lora-training-config.json`
- script uses `processing_class=tokenizer`
- script uses `assistant_only_loss=True`
- script validates privacy flags before training
- README mentions `uv run`, `validateLoraTrainingPackage`, `lora-dataset-train.jsonl`, `lora-dataset-eval.jsonl`, Unsloth, TRL, QLoRA

- [x] **Step 2: Run template test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

Expected: fail because the template files do not exist yet.

## Task 2: Training Template Files

**Files:**
- Create: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- Create: `scripts/training/gemma-qlora/README.zh-CN.md`

- [x] **Step 1: Implement Python template**

The script should:
- parse `--config`, `--base-model`, `--output-dir`, optional `--push-to-hub`, `--hub-model-id`
- validate paths stay inside the export directory
- validate privacy booleans are safe
- read train/eval JSONL as `messages` records
- load Gemma-family model through Unsloth `FastLanguageModel`
- apply LoRA with config defaults
- train through TRL `SFTTrainer` / `SFTConfig`
- save adapter locally, optionally push to Hub

- [x] **Step 2: Implement Chinese README**

Document:
- what the script is and is not
- setup command with `uv run`
- required preflight/dry-run order
- local vs cloud/HF Jobs note
- privacy warnings

- [x] **Step 3: Run template test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

Expected: pass.

## Task 3: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-training-script-template-p7-8.md`

- [x] **Step 1: Document P7.8**

Add a note that AIRI now includes an external training script template, but the desktop app still does not own training execution.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-script-template-p7-8.md`
- Re-run targeted Vitest after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-script-template-p7-8.md`

Expected: all commands pass.
