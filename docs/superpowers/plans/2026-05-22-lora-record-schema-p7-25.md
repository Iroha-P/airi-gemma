# LoRA Record Schema P7.25 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Version every exported LoRA JSONL chat record with `schemaVersion: 1` and make the external dry-run script reject stale or missing record schema metadata.

**Architecture:** Extend the LoRA dataset exporter record shape and training config dataset metadata. The external Python script validates `dataset.recordSchemaVersion` and each JSONL record's `schemaVersion` before formal training dependencies load. Keep AIRI desktop training behavior unchanged; this only stabilizes the data contract.

**Tech Stack:** TypeScript, Vitest, Python stdlib dry-run validator, Markdown docs.

---

## Task 1: Add Failing Record Schema Expectations

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

- [x] **Step 1: Expect exported records and config to declare schema**

In the LoRA dataset export test, assert every JSONL record has `schemaVersion: 1` and `lora-training-config.json.dataset.recordSchemaVersion` is `1`.

- [x] **Step 2: Expect script dry-run to reject stale record schema**

In the external training template test, add a case that writes a package with `dataset.recordSchemaVersion: 1` but a record `schemaVersion: 0`, then expects dry-run with `--error-format json` to exit code 2 and include `record schema`.

- [x] **Step 3: Run tests to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because exported records do not yet include `schemaVersion`, config lacks `dataset.recordSchemaVersion`, and the script does not reject stale record schemas.

## Task 2: Implement Record Schema Contract

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

- [x] **Step 1: Add schemaVersion to exported records and config**

Add `schemaVersion: 1` to `LoraDatasetCandidateRecord` and `dataset.recordSchemaVersion: 1` to `LoraTrainingConfig`.

- [x] **Step 2: Validate record schema in the Python script**

In `validate_chat_record`, reject any record where `record.get("schemaVersion") != expected_record_schema_version`. Pass the expected version from `config["dataset"]["recordSchemaVersion"]`.

- [x] **Step 3: Update minimal package fixtures**

Update `writeMinimalTrainingPackage()` so the happy-path package includes `dataset.recordSchemaVersion: 1` and record `schemaVersion: 1`, while the stale-schema test can override the record version.

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 3: Update AIRI Dry-Run Shape And Docs

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-record-schema-p7-25.md`

- [x] **Step 1: Make app-side dry-run accept dataset record schema metadata**

Extend the training config shape so `dataset.recordSchemaVersion` is required and add a dry-run check `record_schema_version_declared`.

- [x] **Step 2: Add P7.25 design note**

Document that LoRA JSONL records and config now carry schema metadata and the external script rejects stale record schema before training imports.

- [x] **Step 3: Run final verification**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
python -m py_compile scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-record-schema-p7-25.md
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-record-schema-p7-25.md
```

Expected: all commands exit 0. Remove `scripts/training/gemma-qlora/__pycache__` if `py_compile` creates it.
