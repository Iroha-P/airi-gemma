# LoRA App Dry-Run JSONL Parse P7.27 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split AIRI's app-side LoRA dry-run JSONL validation into separate parseability and record-schema checks so users can distinguish corrupt JSONL from stale schema metadata.

**Architecture:** Keep the dry-run privacy-safe by returning only check IDs and statuses. Replace the current boolean JSONL schema helper with a small aggregate result: `parseable` and `schemaMatches`. Malformed JSONL should fail `jsonl_records_parseable`; valid JSONL with stale `schemaVersion` should fail `record_schema_matches_config`.

**Tech Stack:** TypeScript, Vitest, AIRI Electron memory service.

---

## Task 1: Add Failing Malformed JSONL Parse Test

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`

- [x] **Step 1: Write malformed JSONL test**

After exporting a valid LoRA package, overwrite `lora-dataset-train.jsonl` with malformed JSONL like `{"messages": [}\n`. Expect `validateLoraTrainingPackage()` to return `ok: false` and a failed check with id `jsonl_records_parseable`.

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: FAIL because app-side dry-run currently folds malformed JSONL into `record_schema_matches_config` and does not expose `jsonl_records_parseable`.

## Task 2: Implement Separate Parseability Check

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts`

- [x] **Step 1: Return JSONL validation aggregate**

Change the JSONL helper to return `{ parseable: boolean, schemaMatches: boolean }` for candidates/train/eval.

- [x] **Step 2: Add `jsonl_records_parseable` check**

Add a check before `record_schema_matches_config`:

```ts
addCheck(checks, 'jsonl_records_parseable', jsonlValidation.parseable, 'LoRA JSONL records are parseable JSON objects.')
```

- [x] **Step 3: Preserve schema check behavior**

Keep `record_schema_matches_config` for valid JSON objects whose `schemaVersion` does not match config.

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: PASS.

## Task 3: Document And Verify

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-app-dry-run-jsonl-parse-p7-27.md`

- [x] **Step 1: Add P7.27 design note**

Document that app-side dry-run now distinguishes malformed JSONL from stale record schema while still not returning sample text.

- [x] **Step 2: Run final verification**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-app-dry-run-jsonl-parse-p7-27.md
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-app-dry-run-jsonl-parse-p7-27.md
```

Expected: all commands exit 0.
