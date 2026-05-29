# LoRA Model Card Record Schema P7.30 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the LoRA adapter model card template record the dataset record schema contract used to train an adapter.

**Architecture:** Update only the checked-in model card template and its existing documentation test. Keep exporter, dry-run, and training script behavior unchanged.

**Tech Stack:** TypeScript, Vitest, Markdown.

---

## Task 1: Add Failing Model Card Expectations

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

- [x] **Step 1: Expect model card to mention record schema metadata**

Assert `MODEL_CARD_TEMPLATE.zh-CN.md` contains:
- `recordSchemaVersion`
- `schemaVersion`
- `jsonl_records_parseable`
- `record_schema_matches_config`

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because the model card template does not yet mention record schema metadata.

## Task 2: Update Model Card Template

**Files:**
- Modify: `scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md`

- [x] **Step 1: Add dataset schema section**

Add a short section under data source/governance for recording:
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
- Modify: `docs/superpowers/plans/2026-05-22-lora-model-card-record-schema-p7-30.md`

- [x] **Step 1: Add P7.30 design note**

Document that the model card template now records LoRA record schema versioning and app-side JSONL dry-run checks.

- [x] **Step 2: Run final verification**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-model-card-record-schema-p7-30.md
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-model-card-record-schema-p7-30.md
```

Expected: all commands exit 0.
