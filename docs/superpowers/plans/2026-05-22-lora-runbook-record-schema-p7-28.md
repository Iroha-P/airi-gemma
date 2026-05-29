# LoRA Runbook Record Schema P7.28 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the generated Chinese LoRA training runbook document the record schema contract and AIRI app-side dry-run checks added in P7.25-P7.27.

**Architecture:** Update only the generated Markdown runbook text and its export test. Do not change dataset JSONL content, training config generation, or training script behavior.

**Tech Stack:** TypeScript, Vitest, Markdown.

---

## Task 1: Add Failing Runbook Expectations

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`

- [x] **Step 1: Expect runbook to mention record schema contract**

Assert the generated `lora-training-runbook.zh-CN.md` contains:
- `recordSchemaVersion`
- `schemaVersion`
- `jsonl_records_parseable`
- `record_schema_matches_config`

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts
```

Expected: FAIL because the runbook does not yet explain the app-side record schema checks.

## Task 2: Update Generated Runbook

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`

- [x] **Step 1: Add record schema text**

In `toTrainingRunbook()`, add a short section under training preflight explaining:
- config declares `dataset.recordSchemaVersion`
- every JSONL row declares `schemaVersion`
- AIRI dry-run checks `jsonl_records_parseable` and `record_schema_matches_config`

- [x] **Step 2: Run test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts
```

Expected: PASS.

## Task 3: Document And Verify

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-runbook-record-schema-p7-28.md`

- [x] **Step 1: Add P7.28 design note**

Document that exported LoRA runbooks now explain record schema versioning and app-side JSONL dry-run checks.

- [x] **Step 2: Run final verification**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-runbook-record-schema-p7-28.md
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-runbook-record-schema-p7-28.md
```

Expected: all commands exit 0.
