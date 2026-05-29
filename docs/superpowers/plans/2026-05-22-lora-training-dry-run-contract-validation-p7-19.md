# LoRA Training Dry-Run Contract Validation P7.19 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AIRI's `validateLoraTrainingPackage` verify `lora-training-config.json.dryRunContract` so stale or manually edited export packages cannot silently claim the wrong external script dry-run contract.

**Architecture:** Extend the existing app-side dry-run validator with a required `dryRunContract` shape and a dedicated `dry_run_contract_matches_script` check. Keep the check metadata-only and independent of sample content.

**Tech Stack:** TypeScript, Vitest, pnpm scoped verification.

---

## Task 1: Add Dry-Run Contract Validation

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts`

- [x] **Step 1: Write failing validation expectations**

Add an assertion to the happy-path dry-run test:

```ts
expect(report.checks.map(check => check.id)).toContain('dry_run_contract_matches_script')
```

Add a negative test that changes `config.dryRunContract.validationErrorExitCode` to `1`, runs `validateLoraTrainingPackage`, and expects:

```ts
expect(report.ok).toBe(false)
expect(report.checks).toContainEqual(expect.objectContaining({
  id: 'dry_run_contract_matches_script',
  status: 'fail',
}))
```

- [x] **Step 2: Run dry-run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: FAIL because the validator does not yet inspect `dryRunContract`.

- [x] **Step 3: Implement contract shape and check**

Add `dryRunContract` to `LoraTrainingConfigShape`:

```ts
interface ConfigShape {
  dryRunContract: {
    successSchemaVersion: number
    successChecks: string[]
    errorFormat: string
    validationErrorType: string
    validationErrorExitCode: number
  }
}
```

Add constants for expected values and a check:

```ts
addCheck(
  checks,
  'dry_run_contract_matches_script',
  config.dryRunContract.successSchemaVersion === 1
  && requiredScriptDryRunChecks.every(check => config.dryRunContract.successChecks.includes(check))
  && config.dryRunContract.errorFormat === 'json'
  && config.dryRunContract.validationErrorType === 'validation_error'
  && config.dryRunContract.validationErrorExitCode === 2,
  'Training config dry-run contract matches the external script contract.',
)
```

- [x] **Step 4: Run dry-run test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: PASS.

## Task 2: Update Design Note

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Add P7.19 design note**

Add:

```md
- P7.19 让 AIRI 的 `validateLoraTrainingPackage` 校验 `dryRunContract`：如果导出包缺少正确的成功检查项、JSON 错误格式、`validation_error` 类型或退出码 2，dry-run 会返回 `dry_run_contract_matches_script` 失败。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.19 files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

- [x] **Step 2: Run scoped typecheck and lint**

Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-dry-run-contract-validation-p7-19.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 3: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-dry-run-contract-validation-p7-19.md
```

Expected: no output and exit code 0.
