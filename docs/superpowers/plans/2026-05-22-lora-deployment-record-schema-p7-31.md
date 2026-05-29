# LoRA Deployment Record Schema P7.31 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the LoRA deployment guide require record schema and model-card checks before serving or publishing an adapter/GGUF.

**Architecture:** Update only the checked-in deployment guide and its existing documentation test. Keep exporter, dry-run, model card, README, and training script behavior unchanged.

**Tech Stack:** TypeScript, Vitest, Markdown.

---

## Task 1: Add Failing Deployment Expectations

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

- [x] **Step 1: Expect deployment guide to mention schema audit**

Assert `DEPLOYMENT.zh-CN.md` contains:
- `MODEL_CARD_TEMPLATE.zh-CN.md`
- `recordSchemaVersion`
- `schemaVersion`
- `jsonl_records_parseable`
- `record_schema_matches_config`

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because deployment docs do not yet require schema/model-card audit.

## Task 2: Update Deployment Guide

**Files:**
- Modify: `scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md`

- [x] **Step 1: Add deployment preflight section**

Add a short section before release boundaries explaining that before serving/publishing an adapter, the operator should verify the model card records:
- `recordSchemaVersion`
- record `schemaVersion`
- AIRI dry-run checks `jsonl_records_parseable` and `record_schema_matches_config`

- [x] **Step 2: Run test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 3: Document And Verify

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-deployment-record-schema-p7-31.md`

- [x] **Step 1: Add P7.31 design note**

Document that deployment docs now require model-card/schema checks before adapter/GGUF serving or publishing.

- [x] **Step 2: Run final verification**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-deployment-record-schema-p7-31.md
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-deployment-record-schema-p7-31.md
```

Expected: all commands exit 0.
