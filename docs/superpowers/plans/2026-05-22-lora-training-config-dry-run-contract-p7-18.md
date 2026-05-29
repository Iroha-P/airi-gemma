# LoRA Training Config Dry-Run Contract P7.18 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the external training script dry-run contract into `lora-training-config.json` so AIRI UI and Agent Orchestrator can read it without parsing Markdown.

**Architecture:** Extend the existing generated training config with a `dryRunContract` object containing only portable metadata: success schema version, checks, error format, error type, and validation-error exit code. Keep it free of absolute paths and sample content.

**Tech Stack:** TypeScript, JSON config generation, Vitest, pnpm scoped verification.

---

## Task 1: Add Contract Metadata To Training Config

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`

- [x] **Step 1: Write the failing config expectations**

Extend the `trainingConfig` test type and assertions with:

```ts
interface TrainingConfigShape {
  dryRunContract: {
    successSchemaVersion: number
    successChecks: string[]
    errorFormat: string
    validationErrorType: string
    validationErrorExitCode: number
  }
}
```

Expected value:

```ts
const expected = {
  dryRunContract: {
    successSchemaVersion: 1,
    successChecks: ['privacy_flags', 'dataset_counts', 'chat_record_safety'],
    errorFormat: 'json',
    validationErrorType: 'validation_error',
    validationErrorExitCode: 2,
  },
}
```

Also assert the JSON string does not contain sample content or local paths, reusing existing privacy assertions.

- [x] **Step 2: Run lora dataset test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts
```

Expected: FAIL because `dryRunContract` is not yet generated.

- [x] **Step 3: Implement config contract metadata**

Add `dryRunContract` to `LoraTrainingConfig` and `toTrainingConfig()`:

```ts
const dryRunContract = {
  successSchemaVersion: 1,
  successChecks: ['privacy_flags', 'dataset_counts', 'chat_record_safety'],
  errorFormat: 'json',
  validationErrorType: 'validation_error',
  validationErrorExitCode: 2,
}
```

- [x] **Step 4: Run lora dataset test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts
```

Expected: PASS.

## Task 2: Document Config Contract

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Mention `dryRunContract` in generated runbook**

Add a short sentence in `toTrainingRunbook()`:

```md
同一契约也写入 `lora-training-config.json` 的 `dryRunContract` 字段，便于前端或编排器直接读取。
```

- [x] **Step 2: Add P7.18 design note**

Add:

```md
- P7.18 将外部训练脚本 dry-run 契约写入 `lora-training-config.json.dryRunContract`：包含成功报告 schema、检查项、JSON 错误格式、`validation_error` 类型和退出码 2，避免 Orchestrator 解析 Markdown。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.18 files.

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
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-config-dry-run-contract-p7-18.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 3: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-config-dry-run-contract-p7-18.md
```

Expected: no output and exit code 0.
