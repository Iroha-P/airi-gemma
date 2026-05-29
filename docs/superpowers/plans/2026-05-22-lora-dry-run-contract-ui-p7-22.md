# LoRA Dry-Run Contract UI P7.22 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the external training script dry-run contract summary in the Memory settings LoRA dry-run result panel.

**Architecture:** Keep this as a small view-level enhancement in the existing Memory settings page: derive display rows from `loraTrainingDryRunResult.dryRunContract`, render them only when present, and add local i18n keys. Add a lightweight static UI contract test because this page currently has no mount-based component test harness.

**Tech Stack:** Vue 3 `<script setup>`, Pinia store refs, vue-i18n, Vitest static file test, pnpm scoped verification.

---

## Task 1: Add UI Contract Test

**Files:**
- Create: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/lora-dry-run-contract-ui.test.ts`

- [x] **Step 1: Write failing static UI test**

Create a test that reads:

- `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- `packages/i18n/src/locales/en/settings.yaml`
- `packages/i18n/src/locales/zh-Hans/settings.yaml`

Assert the page references:

- `settings.pages.memory.lora-training-dry-run.contract-title`
- `loraTrainingDryRunContractRows`

Assert both locale files contain:

- `contract-title`
- `success-schema`
- `success-checks`
- `error-format`
- `validation-error-type`
- `validation-error-exit-code`

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/lora-dry-run-contract-ui.test.ts
```

Expected: FAIL because the page and i18n keys do not yet exist.

## Task 2: Render Contract Summary

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/en/settings.yaml`
- Modify: `packages/i18n/src/locales/zh-Hans/settings.yaml`

- [x] **Step 1: Add computed display rows**

Add:

```ts
const loraTrainingDryRunContractRows = computed(() => {
  const contract = loraTrainingDryRunResult.value?.dryRunContract
  if (!contract)
    return []

  return [
    { label: t('settings.pages.memory.lora-training-dry-run.success-schema'), value: String(contract.successSchemaVersion) },
    { label: t('settings.pages.memory.lora-training-dry-run.success-checks'), value: contract.successChecks.join(', ') },
    { label: t('settings.pages.memory.lora-training-dry-run.error-format'), value: contract.errorFormat },
    { label: t('settings.pages.memory.lora-training-dry-run.validation-error-type'), value: contract.validationErrorType },
    { label: t('settings.pages.memory.lora-training-dry-run.validation-error-exit-code'), value: String(contract.validationErrorExitCode) },
  ]
})
```

- [x] **Step 2: Render rows in dry-run panel**

Under the count summary grid, add a section guarded by `loraTrainingDryRunContractRows.length > 0` that renders the contract title and rows.

- [x] **Step 3: Add English and Chinese i18n keys**

Add localized labels under `lora-training-dry-run`.

- [x] **Step 4: Run UI contract test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/lora-dry-run-contract-ui.test.ts
```

Expected: PASS.

## Task 3: Final Verification

**Files:**
- Verify all P7.22 files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/lora-dry-run-contract-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: PASS.

- [x] **Step 2: Run scoped typecheck and lint**

Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/lora-dry-run-contract-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/superpowers/plans/2026-05-22-lora-dry-run-contract-ui-p7-22.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 3: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/lora-dry-run-contract-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/superpowers/plans/2026-05-22-lora-dry-run-contract-ui-p7-22.md
```

Expected: no output and exit code 0.
