# LoRA Training Script Success Report P7.16 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the external Gemma QLoRA script a stable machine-readable success dry-run report, not just machine-readable error output.

**Architecture:** Keep stdout as JSON on successful dry-run. Add a small report shape with `schemaVersion`, `ok`, `checks`, and `counts`; do not change training behavior or import ML dependencies during dry-run.

**Tech Stack:** Python stdlib JSON, Vitest subprocess tests, pnpm scoped verification.

---

## Task 1: Add Stable Success Report Shape

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Modify: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`

- [x] **Step 1: Write the failing success-report test**

Update the minimal dry-run test to expect:

```ts
expect(report).toEqual({
  schemaVersion: 1,
  ok: true,
  checks: [
    'privacy_flags',
    'dataset_counts',
    'chat_record_safety',
  ],
  counts: {
    candidates: 1,
    train: 1,
    eval: 0,
  },
})
```

- [x] **Step 2: Run the template test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because the script does not yet include `schemaVersion` or `checks`.

- [x] **Step 3: Implement the success report**

Change the `args.dry_run` branch in `train_gemma_qlora_unsloth.py` to print:

```python
{
    "schemaVersion": 1,
    "ok": True,
    "checks": [
        "privacy_flags",
        "dataset_counts",
        "chat_record_safety",
    ],
    "counts": package["counts"],
}
```

- [x] **Step 4: Run the template test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 2: Document Success Report Contract

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Update external training README**

Document that successful dry-run stdout contains:

```json
{ "schemaVersion": 1, "ok": true, "checks": ["privacy_flags", "dataset_counts", "chat_record_safety"], "counts": { "candidates": 1, "train": 1, "eval": 0 } }
```

- [x] **Step 2: Update main design document**

Add a P7.16 note:

```md
- P7.16 稳定了训练脚本成功 dry-run 的 stdout 契约：返回 `schemaVersion`、`ok`、`checks` 和 `counts`，让 AIRI 前端或 Agent Orchestrator 能同时机器读取成功与失败结果。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.16 files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts
```

Expected: PASS.

- [x] **Step 2: Run Python syntax verification**

Run:

```powershell
python -m py_compile scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py
```

Expected: PASS. Remove `scripts/training/gemma-qlora/__pycache__` afterwards if Python creates it.

- [x] **Step 3: Run scoped typecheck and lint**

Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-success-report-p7-16.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 4: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-success-report-p7-16.md
```

Expected: no output and exit code 0.
