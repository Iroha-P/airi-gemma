# LoRA Training Script Concise Errors P7.14 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the external Gemma QLoRA script dry-run print concise validation errors instead of a full Python traceback for expected package/data problems.

**Architecture:** Keep the existing validation functions raising `ValueError`, and add a small CLI boundary wrapper in `train_gemma_qlora_unsloth.py` that converts those expected validation failures into `ERROR: ...` plus exit code 2. Keep unexpected exceptions untouched enough for debugging by only catching `ValueError` at the script entrypoint.

**Tech Stack:** Python stdlib, Vitest subprocess tests, pnpm scoped verification.

---

## Task 1: Add Concise CLI Error Contract

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Modify: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`

- [x] **Step 1: Write the failing concise-error test**

Update the malformed JSONL test to assert that the script prints a concise validation error and does not include a traceback:

```ts
await expect(execFileAsync('python', [
  scriptPath,
  '--config',
  join(outputDir, 'lora-training-config.json'),
  '--dry-run',
])).rejects.toMatchObject({
  code: 2,
  stderr: expect.stringContaining('ERROR: Invalid JSONL at'),
})
```

Then assert `stderr` does not contain `Traceback`.

- [x] **Step 2: Run the template test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because the current script emits a full traceback and exits with Python's default exception code.

- [x] **Step 3: Implement entrypoint ValueError handling**

In `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`:

```python
import sys
```

Add:

```python
def run_cli() -> None:
    try:
        main()
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(2) from error
```

Change the entrypoint to:

```python
if __name__ == "__main__":
    run_cli()
```

- [x] **Step 4: Run the template test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 2: Document Concise Error Behavior

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Update external training README**

Add that expected validation errors are printed as `ERROR: ...` without loading training dependencies:

```md
这类预期内的数据错误会以 `ERROR: ...` 输出并使用退出码 2，不会进入正式训练依赖加载阶段。
```

- [x] **Step 2: Update main design document**

Add a P7.14 note near the P7.13 note:

```md
- P7.14 给训练脚本 CLI 增加了预期数据错误边界：导出包路径、隐私门禁、JSONL 格式、样本内容等 `ValueError` 会被转换为简短的 `ERROR: ...` 和退出码 2，避免用户在 dry-run 阶段被完整 Python traceback 淹没。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.14 files.

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
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-concise-errors-p7-14.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 4: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-concise-errors-p7-14.md
```

Expected: no output and exit code 0.
