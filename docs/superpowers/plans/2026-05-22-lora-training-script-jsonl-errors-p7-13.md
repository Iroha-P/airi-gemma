# LoRA Training Script JSONL Errors P7.13 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the external Gemma QLoRA script dry-run report malformed JSONL with a stable file-and-line error before ML dependencies are imported.

**Architecture:** Keep validation inside `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`, directly in the JSONL loader that already performs chat-record safety checks. Cover the behavior from the existing TypeScript template test that executes the Python script as a real subprocess.

**Tech Stack:** Python stdlib, Vitest, Node `execFile`, pnpm workspace verification.

---

## Task 1: Add Stable Malformed JSONL Dry-Run Error

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Modify: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`

- [x] **Step 1: Write the failing malformed JSONL test**

Add this test after the existing local-path dry-run rejection test:

```ts
it('reports malformed JSONL with file and line during script dry-run', async () => {
  await writeMinimalTrainingPackage(outputDir)
  await writeFile(join(outputDir, 'lora-dataset-train.jsonl'), '{"messages": [}\n', 'utf8')

  await expect(execFileAsync('python', [
    scriptPath,
    '--config',
    join(outputDir, 'lora-training-config.json'),
    '--dry-run',
  ])).rejects.toMatchObject({
    stderr: expect.stringContaining('Invalid JSONL at'),
  })
})
```

- [x] **Step 2: Run the test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because the Python script currently emits a raw `json.JSONDecodeError` instead of `Invalid JSONL at`.

- [x] **Step 3: Implement the minimal JSON decode wrapper**

Change `load_jsonl_records()` in `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py` so the parse line becomes:

```python
            try:
                record = json.loads(stripped)
            except json.JSONDecodeError as error:
                raise ValueError(f"Invalid JSONL at {path}:{line_number}: {error.msg}") from error
```

Keep `validate_chat_record(record, path, line_number)` immediately after the parsed record.

- [x] **Step 4: Run the template test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 2: Document The Error Contract

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Update external training README**

In the local dry-run section, extend the safety-gate note to say malformed JSONL reports file and line:

```md
脚本侧 dry-run 会额外检查每条训练样本的 messages 角色、assistant 内容是否存在、assistant 内容是否过短，以及样本正文中是否疑似包含本地路径；如果 JSONL 行格式损坏，会返回对应文件和行号，便于回到导出包定位。
```

- [x] **Step 2: Update main design document**

Add a short P7.13 note near the existing P7.12 note:

```md
- P7.13 补强了训练脚本 dry-run 的坏 JSONL 排错契约：当 `lora-dataset-*.jsonl` 中某一行不是合法 JSON 时，脚本会在加载训练依赖前返回 `Invalid JSONL at <file>:<line>`，方便用户定位导出包损坏位置。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.13 files.

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
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-jsonl-errors-p7-13.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 4: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-jsonl-errors-p7-13.md
```

Expected: no output and exit code 0.
