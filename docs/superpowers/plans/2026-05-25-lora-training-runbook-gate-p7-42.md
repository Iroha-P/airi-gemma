# P7.42 LoRA Training Runbook Gate

## Goal

Make `artifacts.trainingRunbookPath` a real dry-run gate, not only a safe-path declaration.

## Problem

P7.40 introduced `lora-training-config.json.artifacts.trainingRunbookPath`, and P7.41 made the external script validate artifact path safety. However, neither AIRI dry-run nor script dry-run failed when the training runbook file itself was missing.

That left a small handoff gap: a package could keep the model card / post-training checklist gate, but lose the actual training instructions before moving to an external GPU environment.

## Test-first Changes

- Add an AIRI dry-run regression test that deletes `lora-training-runbook.zh-CN.md` and expects `training_runbook_exists` to fail.
- Add a script dry-run regression test that deletes `lora-training-runbook.zh-CN.md` and expects JSON `validation_error` with exit code 2.
- Update success-check fixtures from four script checks to five script checks.

## Implementation

- Add `training_runbook_exists` to `dryRunContract.successChecks`.
- AIRI dry-run checks `config.artifacts.trainingRunbookPath`.
- External Python dry-run checks `artifacts.trainingRunbookPath`.
- Generated runbook/checklist/docs now mention `training_runbook_exists`.
- Service and renderer test fixtures now expect 17 app-side checks in the sample success report.

## Verification

- Targeted Vitest suite for LoRA dataset, AIRI dry-run, script template, Eventa adapter, and Pinia store.
- Python compile for the external training script.
- Stage tamagotchi typecheck.
- Targeted lint and whitespace checks.
