# LoRA Training Script JSON Errors P7.15 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a machine-readable validation error mode to the external Gemma QLoRA script so future AIRI UI/agent integrations can parse dry-run failures without scraping prose.

**Architecture:** Keep the default CLI behavior as concise text errors. Add `--error-format text|json` to the Python script and route expected `ValueError` failures through a small entrypoint wrapper that can print either `ERROR: ...` or a compact JSON error object to stderr.

**Tech Stack:** Python stdlib argparse/json, Vitest subprocess tests, pnpm scoped verification.

---

## Task 1: Add JSON Error Mode

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Modify: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`

- [x] **Step 1: Write the failing JSON-error test**

Add a test that corrupts `lora-dataset-train.jsonl`, runs the script with `--dry-run --error-format json`, and asserts stderr parses as:

```json
{
  "ok": false,
  "error": {
    "type": "validation_error",
    "message": "Invalid JSONL at ..."
  }
}
```

Also assert exit code `2` and no `Traceback`.

- [x] **Step 2: Run the template test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because the script does not yet support `--error-format`.

- [x] **Step 3: Implement `--error-format`**

In `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`:

- Change `main()` to accept a parsed args object.
- Add `--error-format` with choices `text` and `json`, default `text`.
- Parse args in `run_cli()` before calling `main(args)`.
- On `ValueError`, print JSON to stderr when `args.error_format == "json"`:

```python
print(json.dumps({
    "ok": False,
    "error": {
        "type": "validation_error",
        "message": str(error),
    },
}, ensure_ascii=False), file=sys.stderr)
```

- Keep default text behavior unchanged.

- [x] **Step 4: Run the template test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 2: Document JSON Error Mode

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Update external training README**

Document:

```md
如果需要被 AIRI 前端或外部编排器解析，可以追加 `--error-format json`，预期内的数据错误会以 `{"ok":false,"error":{"type":"validation_error","message":"..."}}` 写入 stderr。
```

- [x] **Step 2: Update main design document**

Add a P7.15 note:

```md
- P7.15 给训练脚本增加了 `--error-format json`，让 AIRI 前端或 Agent Orchestrator 可以机器读取 dry-run 失败原因，而不需要解析自然语言 stderr。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.15 files.

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
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-json-errors-p7-15.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 4: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-json-errors-p7-15.md
```

Expected: no output and exit code 0.
