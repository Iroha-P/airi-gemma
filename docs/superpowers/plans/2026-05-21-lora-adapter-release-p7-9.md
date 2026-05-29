# LoRA Adapter Release P7.9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add post-training release and local deployment documentation for AIRI-Gemma LoRA adapters.

**Architecture:** Keep the artifacts under `scripts/training/gemma-qlora/` beside the external training script. Add a Chinese model card template and a Chinese deployment guide; extend the existing static Vitest guard so these docs keep references to privacy gates, evaluation, PEFT/GGUF, Ollama, LM Studio, vLLM, and AIRI's local OpenAI-compatible runtime.

**Tech Stack:** Markdown, Vitest static checks, AIRI training handoff docs.

---

## Task 1: Static Guard For Release Docs

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Create: `scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md`
- Create: `scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md`

- [x] **Step 1: Write failing release-doc expectations**

Extend the existing static test to assert:
- README links to `MODEL_CARD_TEMPLATE.zh-CN.md` and `DEPLOYMENT.zh-CN.md`
- model card template mentions `lora-training-config.json`, privacy gates, train/eval counts, evaluation, limitations, and no raw chat imports
- deployment guide mentions PEFT adapter, GGUF, Ollama, LM Studio, vLLM, OpenAI-compatible endpoint, and `agent-chat-runtime-config.json`

- [x] **Step 2: Run template test and verify RED**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

Expected: fail because release docs do not exist yet.

## Task 2: Release Docs

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Create: `scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md`
- Create: `scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md`

- [x] **Step 1: Add model card template**

Create a Chinese template covering base model, adapter path, dataset provenance, privacy gates, training config, evaluation checklist, limitations, and release decision.

- [x] **Step 2: Add deployment guide**

Create a Chinese guide covering PEFT adapter loading, optional merge/GGUF conversion, Ollama/LM Studio/vLLM routes, and AIRI `agent-chat-runtime-config.json` local target wiring.

- [x] **Step 3: Link docs from README**

Add links from the training README to both new docs.

- [x] **Step 4: Run template test and verify GREEN**

Run: `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

Expected: pass.

## Task 3: Documentation And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-21-lora-adapter-release-p7-9.md`

- [x] **Step 1: Document P7.9**

Add a note that post-training adapter release docs now exist, but publishing remains a manual privacy decision.

- [x] **Step 2: Run final verification**

Run:
- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- `python -m py_compile scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-adapter-release-p7-9.md`
- Re-run targeted Vitest after lint.
- Re-run Python py_compile after lint.
- Re-run `pnpm -F @proj-airi/stage-tamagotchi typecheck` after lint.
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/README.zh-CN.md scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-21-lora-adapter-release-p7-9.md`

Expected: all commands pass.
