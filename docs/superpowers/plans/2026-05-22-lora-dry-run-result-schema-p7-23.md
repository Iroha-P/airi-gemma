# LoRA Dry-Run Result Schema P7.23 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `schemaVersion: 1` to AIRI's `validateLoraTrainingPackage` result so frontends and Agent Orchestrator can version the app-side dry-run report itself.

**Architecture:** Extend the app-side dry-run result interface, shared Eventa IPC type, and test fixtures. Keep this independent from the external Python script success schema; this version describes AIRI's validator result envelope.

**Tech Stack:** TypeScript, Eventa shared IPC types, Vitest, pnpm scoped verification.

---

## Task 1: Add App-Side Result Schema Version

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts`
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

- [x] **Step 1: Write failing schema expectations**

In the happy-path dry-run test, assert:

```ts
expect(report.schemaVersion).toBe(1)
```

Add `schemaVersion: 1` to renderer and main test fixtures after implementation.

- [x] **Step 2: Run dry-run test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: FAIL because the result does not yet include `schemaVersion`.

- [x] **Step 3: Implement schema version in result**

Add `schemaVersion: 1` to `LoraTrainingDryRunResult`, `ElectronMemoryValidateLoraTrainingPackageResult`, and `finish()`.

- [x] **Step 4: Update fixtures and run dry-run test to verify GREEN**

Add `schemaVersion: 1` to the affected test fixtures and run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: PASS.

## Task 2: Update Design Note

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Add P7.23 design note**

Add:

```md
- P7.23 给 AIRI 端 `validateLoraTrainingPackage` 返回值增加 `schemaVersion: 1`，区分 AIRI dry-run 结果信封版本和外部训练脚本成功 stdout schema，方便前端与 Orchestrator 做兼容判断。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.23 files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts
```

Expected: PASS.

- [x] **Step 2: Run scoped typecheck and lint**

Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-dry-run-result-schema-p7-23.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 3: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/shared/eventa.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-dry-run-result-schema-p7-23.md
```

Expected: no output and exit code 0, allowing existing LF/CRLF warnings on touched shared files.
