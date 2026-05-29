# LoRA Training Script Contract Validation P7.20 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the external Gemma QLoRA script validate `lora-training-config.json.dryRunContract`, matching AIRI's app-side dry-run validator.

**Architecture:** Add a small Python validation function for `dryRunContract` and call it before dataset paths are loaded. Keep the external script self-contained so direct CLI users receive the same protection as AIRI UI users.

**Tech Stack:** Python stdlib, Vitest subprocess tests, pnpm scoped verification.

---

## Task 1: Validate Contract In External Script

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Modify: `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`

- [x] **Step 1: Write failing stale-contract test**

Update `writeMinimalTrainingPackage()` so the generated config includes a valid `dryRunContract`. Then add a test that changes `validationErrorExitCode` to `1`, runs:

```powershell
python train_gemma_qlora_unsloth.py --config lora-training-config.json --dry-run --error-format json
```

and expects exit code `2`, `error.type === 'validation_error'`, and message containing `dry-run contract`.

- [x] **Step 2: Run template test to verify RED**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: FAIL because the external script ignores `dryRunContract`.

- [x] **Step 3: Implement Python contract validation**

Add constants:

```python
EXPECTED_DRY_RUN_CHECKS = ["privacy_flags", "dataset_counts", "chat_record_safety"]
```

Add:

```python
def validate_dry_run_contract(config: dict[str, Any]) -> None:
    contract = config.get("dryRunContract", {})
    if not isinstance(contract, dict):
        raise ValueError("Invalid dry-run contract: expected object")
    success_checks = contract.get("successChecks")
    if (
        contract.get("successSchemaVersion") != 1
        or not isinstance(success_checks, list)
        or not all(check in success_checks for check in EXPECTED_DRY_RUN_CHECKS)
        or contract.get("errorFormat") != "json"
        or contract.get("validationErrorType") != "validation_error"
        or contract.get("validationErrorExitCode") != 2
    ):
        raise ValueError("Invalid dry-run contract: does not match script contract")
```

Call it from `validate_training_package()` immediately after `validate_privacy_flags(config)`.

- [x] **Step 4: Run template test to verify GREEN**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts
```

Expected: PASS.

## Task 2: Update Documentation

**Files:**
- Modify: `scripts/training/gemma-qlora/README.zh-CN.md`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] **Step 1: Update external training README**

Mention that script-side dry-run validates `dryRunContract` before loading training dependencies.

- [x] **Step 2: Add P7.20 design note**

Add:

```md
- P7.20 让外部 `train_gemma_qlora_unsloth.py` 也校验 `dryRunContract`：直接运行脚本时，旧包或手改包若缺少正确成功检查项、JSON 错误格式、`validation_error` 类型或退出码 2，会在加载训练依赖前失败。
```

## Task 3: Final Verification

**Files:**
- Verify all P7.20 files.

- [x] **Step 1: Run targeted tests**

Run:

```powershell
.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts
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
pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-contract-validation-p7-20.md
```

Expected: typecheck passes and lint reports 0 errors.

- [x] **Step 4: Run whitespace check**

Run:

```powershell
git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py scripts/training/gemma-qlora/README.zh-CN.md docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-22-lora-training-script-contract-validation-p7-20.md
```

Expected: no output and exit code 0.
