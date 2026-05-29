# LoRA Training Config P7.4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a privacy-safe LoRA training configuration package beside the exported train/eval JSONL files.

**Architecture:** Extend the existing LoRA dataset exporter without adding a trainer dependency. The exporter writes `lora-training-config.json` with relative dataset paths, sample counts, deterministic split metadata, conservative QLoRA defaults, and privacy gates that downstream Unsloth/TRL scripts can validate before training.

**Tech Stack:** TypeScript, Vitest, AIRI memory service, JSONL, JSON config.

---

## Task 1: Training Config Artifact

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

- [x] **Step 1: Write failing config expectations**

Expect LoRA export to also create:
- `lora-training-config.json`

The config must include:
- `schemaVersion: 1`
- `task: "chat_companion_memory_sft"`
- relative paths for candidates/train/eval/manifest
- train/eval/candidate counts
- split strategy
- privacy gates and quality gate names
- conservative QLoRA defaults for Gemma-family local fine-tuning
- no raw message content and no local source paths

- [x] **Step 2: Run LoRA dataset test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: fail because `lora-training-config.json` does not exist yet.

- [x] **Step 3: Implement config generation**

Add a config builder that receives `exportedAt`, ready records, split, and artifact paths, then writes `lora-training-config.json` after the manifest. Add the config to `result.files`.

- [x] **Step 4: Run LoRA dataset test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-training-config-p7-4.md`

- [x] **Step 1: Document P7.4**

Add a note that LoRA candidate export now writes `lora-training-config.json` for downstream training scripts, but still does not run training inside AIRI.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-config-p7-4.md`
- Re-run the targeted Vitest command after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-training-config-p7-4.md`

Expected: all commands pass.
