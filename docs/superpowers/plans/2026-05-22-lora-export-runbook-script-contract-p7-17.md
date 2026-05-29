# LoRA Export Runbook Script Contract P7.17 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the generated LoRA export runbook aligned with the external training script's machine-readable dry-run contract.

**Architecture:** Update the runbook generator in `lora-dataset.ts` and cover it from the existing export test that reads `lora-training-runbook.zh-CN.md`. This keeps the exported training package self-contained, so a user does not need to read repository docs to discover `--error-format json` or the success report shape.

**Tech Stack:** TypeScript, Vitest, generated Markdown, pnpm scoped verification.

---

## Task 1: Add Runbook Contract Expectations

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`

- [x] **Step 1: Write the failing runbook expectations**

Add expectations to the existing export test:

```ts
expect(trainingRunbook).toContain('--error-format json')
expect(trainingRunbook).toContain('schemaVersion')
expect(trainingRunbook).toContain('chat_record_safety')
expect(trainingRunbook).toContain('validation_error')
```

- [x] **Step 2: Run lora dataset test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts
```

Expected: FAIL because generated runbook does not yet include the external script machine-readable contract.

- [x] **Step 3: Update generated runbook**

In `toTrainingRunbook()`, add a small "external script dry-run" section that includes:

- `uv run scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py --config lora-training-config.json --dry-run --error-format json`
- success stdout shape with `schemaVersion`, `ok`, `checks`, `counts`
- failure stderr shape with `validation_error`

- [x] **Step 4: Run lora dataset test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts
```

Expected: PASS.

## Task 2: Update Main Design Note

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Add P7.17 design note**

Add:

```md
- P7.17 把外部训练脚本的机器可读 dry-run 契约同步进导出的 `lora-training-runbook.zh-CN.md`：训练包自带 `--error-format json` 示例、成功 stdout 结构和失败 `validation_error` 结构。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.17 files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: PASS.

- [x] **Step 2: Run scoped typecheck and lint**

Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-export-runbook-script-contract-p7-17.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 3: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-export-runbook-script-contract-p7-17.md
```

Expected: no output and exit code 0.
