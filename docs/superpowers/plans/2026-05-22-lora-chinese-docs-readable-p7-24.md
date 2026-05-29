# LoRA Chinese Docs Readability P7.24 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make generated and checked-in Chinese LoRA training handoff docs readable UTF-8 Chinese, with tests that prevent mojibake from returning.

**Architecture:** Keep training behavior unchanged. Add readability assertions to the existing LoRA export/template tests, then replace corrupted Chinese Markdown strings in the runbook generator and external training docs. The tests check concrete Chinese headings and reject Unicode private-use characters that appear in mojibake.

**Tech Stack:** TypeScript, Vitest, Markdown, Python script template docs.

---

## Task 1: Add Failing Readability Tests

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`

- [x] **Step 1: Update generated runbook expectations**

Assert `lora-training-runbook.zh-CN.md` contains readable Chinese headings such as `隐私门禁`, `训练前检查`, `后续训练脚本接入方式`, and does not match `/[\uE000-\uF8FF]/u`.

- [x] **Step 2: Update checked-in template doc expectations**

Assert `README.zh-CN.md`, `MODEL_CARD_TEMPLATE.zh-CN.md`, and `DEPLOYMENT.zh-CN.md` contain readable Chinese headings such as `本地运行`, `评估`, `局限性`, `本地部署说明`, and do not match `/[\uE000-\uF8FF]/u`.

- [x] **Step 3: Run tests to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because current docs contain mojibake/private-use characters and missing readable Chinese headings.

Actual: PASS. Node reads the files as valid UTF-8 Chinese with no private-use characters; the apparent mojibake came from PowerShell console decoding, not source content. P7.24 therefore keeps the new readability assertions as regression coverage and skips content rewrites.

## Task 2: Fix Chinese Markdown Content

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts`
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Modify: `scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md`
- Modify: `scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md`

- [x] **Step 1: Rewrite generated runbook strings**

No rewrite needed. `toTrainingRunbook()` already contains readable UTF-8 Chinese when read with Node; the new tests now guard `隐私门禁`, `训练前检查`, `后续训练脚本接入方式`, and absence of private-use characters.

- [x] **Step 2: Rewrite checked-in training docs**

No rewrite needed. The checked-in docs are already valid UTF-8 Chinese when read with Node; the new tests now guard readable headings and absence of private-use characters.

- [x] **Step 3: Run tests to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 3: Document And Verify

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-22-lora-chinese-docs-readable-p7-24.md`

- [x] **Step 1: Add P7.24 design note**

Add a note that generated and checked-in Chinese LoRA handoff docs are now UTF-8 readable and guarded by private-use-character tests.

- [x] **Step 2: Run final verification**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/README.zh-CN.md scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-chinese-docs-readable-p7-24.md
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/README.zh-CN.md scripts/training/gemma-qlora/MODEL_CARD_TEMPLATE.zh-CN.md scripts/training/gemma-qlora/DEPLOYMENT.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-chinese-docs-readable-p7-24.md
```

Expected: all commands exit 0.
