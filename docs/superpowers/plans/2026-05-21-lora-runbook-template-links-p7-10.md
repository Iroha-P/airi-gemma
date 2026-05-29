# LoRA Runbook Template Links P7.10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the generated LoRA training runbook point to the concrete external training template, model card template, and deployment guide.

**Architecture:** Extend the existing generated `lora-training-runbook.zh-CN.md` content only. Keep the exporter deterministic and content-safe; do not add sample text or execute training.

**Tech Stack:** TypeScript, Vitest, Markdown.

---

## Task 1: Generated Runbook Links

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

- [x] **Step 1: Write failing runbook-link expectations**

Expect the generated runbook to mention:
- `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- `scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md`
- `scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md`
- `uv run`
- `agent-chat-runtime-config.json`

It must still avoid sample content and local source paths.

- [x] **Step 2: Run LoRA dataset test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: fail because generated runbook does not yet mention the concrete template paths.

- [x] **Step 3: Update runbook generation**

Add a "仓库模板" / "训练后交付" section pointing to the concrete script and docs.

- [x] **Step 4: Run LoRA dataset test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

Expected: pass.

## Task 2: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-runbook-template-links-p7-10.md`

- [x] **Step 1: Document P7.10**

Add a note that generated runbooks now link the concrete training template and release docs.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- `python -m py_compile scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-runbook-template-links-p7-10.md`
- Re-run targeted Vitest after lint.
- Re-run Python py_compile after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-runbook-template-links-p7-10.md`

Expected: all commands pass.
