# LoRA Dry-Run Contract Summary P7.21 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Include `dryRunContract` in AIRI's `validateLoraTrainingPackage` result so the renderer and Agent Orchestrator can inspect the external script contract without reading `lora-training-config.json` again.

**Architecture:** Extend the main-service result shape and the shared Eventa type with a nullable `dryRunContract` summary. Return `null` before a valid config shape is parsed; return the config's contract once available, even if the later compatibility check fails.

**Tech Stack:** TypeScript, Eventa shared IPC types, Vitest, pnpm scoped verification.

---

## Task 1: Add Contract Summary To Dry-Run Result

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts`
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [x] **Step 1: Write failing result expectations**

In the happy-path dry-run test, assert:

```ts
expect(report.dryRunContract).toEqual({
  successSchemaVersion: 1,
  successChecks: ['privacy_flags', 'dataset_counts', 'chat_record_safety'],
  errorFormat: 'json',
  validationErrorType: 'validation_error',
  validationErrorExitCode: 2,
})
```

In the stale-contract test, assert the returned `dryRunContract.validationErrorExitCode` is `1` so the caller can diagnose the mismatch.

- [x] **Step 2: Run dry-run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: FAIL because `validateLoraTrainingPackage` does not yet return `dryRunContract`.

- [x] **Step 3: Implement dry-run result contract summary**

Add `LoraTrainingDryRunContractSummary` and `dryRunContract` to `LoraTrainingDryRunResult`. Initialize the contract summary as `null`, assign it from `config.dryRunContract` after config shape validation, and pass it through `finish()`.

- [x] **Step 4: Update shared Eventa type and renderer test fixture**

Add a matching `ElectronMemoryValidateLoraTrainingPackageDryRunContract` interface and `dryRunContract` field to `ElectronMemoryValidateLoraTrainingPackageResult`. Update the renderer store test fixture with the expected contract object.

- [x] **Step 5: Run dry-run test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: PASS.

## Task 2: Update Design Note

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Add P7.21 design note**

Add:

```md
- P7.21 将 `dryRunContract` 回传到 `validateLoraTrainingPackage` 结果中：前端或 Agent Orchestrator 不需要再次读取 config，也能显示成功报告 schema、检查项、JSON 错误格式、错误类型和退出码。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.21 files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

- [x] **Step 2: Run scoped typecheck and lint**

Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-dry-run-contract-summary-p7-21.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 3: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-dry-run-contract-summary-p7-21.md
```

Expected: no output and exit code 0.
