# LoRA README Record Schema P7.29 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the checked-in external training README document the LoRA record schema contract and AIRI app-side JSONL dry-run checks.

**Architecture:** Update only `scripts/training/gemma-qlora/README.zh-CN.md` and the existing template documentation test. Keep the Python script, exporter, and generated runbook unchanged.

**Tech Stack:** TypeScript, Vitest, Markdown.

---

## Task 1: Add Failing README Expectations

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

- [x] **Step 1: Expect README to mention record schema contract**

Assert README contains:
- `recordSchemaVersion`
- `schemaVersion`
- `jsonl_records_parseable`
- `record_schema_matches_config`

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because README does not yet explain the record schema contract.

## Task 2: Update README

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`

- [x] **Step 1: Add record schema section**

Add a short Chinese section near local dry-run explaining:
- `lora-training-config.json.dataset.recordSchemaVersion`
- each JSONL row's `schemaVersion`
- AIRI app-side checks `jsonl_records_parseable` and `record_schema_matches_config`

- [x] **Step 2: Run test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 3: Document And Verify

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-readme-record-schema-p7-29.md`

- [x] **Step 1: Add P7.29 design note**

Document that the checked-in external training README now explains record schema versioning and app-side JSONL dry-run checks.

- [x] **Step 2: Run final verification**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-readme-record-schema-p7-29.md
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-readme-record-schema-p7-29.md
```

Expected: all commands exit 0.
