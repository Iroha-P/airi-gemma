# LoRA App Dry-Run Record Schema P7.26 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AIRI's app-side `validateLoraTrainingPackage` verify that exported LoRA JSONL records actually match `dataset.recordSchemaVersion`, not just that the config declares it.

**Architecture:** Keep the external Python script's stricter sample safety checks in place, but add a lightweight TypeScript dry-run guard for JSONL parseability and record schema version. The report remains privacy-safe: it only adds pass/fail checks and counts, never sample content.

**Tech Stack:** TypeScript, Vitest, AIRI Electron memory service.

---

## Task 1: Add Failing App-Side Record Schema Test

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`

- [x] **Step 1: Write stale JSONL record schema test**

After exporting a valid LoRA package, rewrite the first line of `lora-dataset-train.jsonl` with `schemaVersion: 0`, then expect `validateLoraTrainingPackage()` to return `ok: false` and a failed check with id `record_schema_matches_config`.

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: FAIL because app-side dry-run currently only checks `dataset.recordSchemaVersion`, not the actual JSONL record schemas.

## Task 2: Implement App-Side JSONL Record Schema Check

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts`

- [x] **Step 1: Add JSONL record schema validator**

Add a helper that reads candidate/train/eval JSONL files, parses non-empty lines as JSON objects, and returns false if any row is malformed or `schemaVersion` does not equal `config.dataset.recordSchemaVersion`.

- [x] **Step 2: Add dry-run check**

After dataset file existence and count checks, add:

```ts
addCheck(checks, 'record_schema_matches_config', recordsMatchSchema, 'LoRA JSONL records match the configured record schema version.')
```

- [x] **Step 3: Run test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: PASS.

## Task 3: Document And Verify

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-app-dry-run-record-schema-p7-26.md`

- [x] **Step 1: Add P7.26 design note**

Document that AIRI app-side dry-run now parses JSONL rows enough to verify record schema version alignment while still not exposing sample text.

- [x] **Step 2: Run final verification**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-app-dry-run-record-schema-p7-26.md
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-app-dry-run-record-schema-p7-26.md
```

Expected: all commands exit 0.
