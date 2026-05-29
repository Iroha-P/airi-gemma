# P7.41 LoRA Script Config Artifacts

## Goal

Make the external Gemma QLoRA training script honor the machine-readable `lora-training-config.json.artifacts` contract that AIRI exports in P7.40.

## Problem

P7.40 taught AIRI's exporter and AIRI-side dry-run to declare and validate:

- `artifacts.trainingRunbookPath`
- `artifacts.postTrainingChecklistPath`

The external Python script still hardcoded `lora-post-training-checklist.zh-CN.md`, so a package with a valid config-declared checklist path could pass AIRI dry-run but fail script dry-run.

## Test-first Changes

- Add a failing script dry-run test where `artifacts.postTrainingChecklistPath` points to `handoff/lora-post-training-checklist.zh-CN.md` and the root checklist is missing. Expected: script dry-run succeeds.
- Add a failing script dry-run test where `artifacts.trainingRunbookPath` escapes the export directory. Expected: JSON `validation_error` and exit code 2.
- Update the script guard test to require `validate_artifact_config`.

## Implementation

- Add `validate_artifact_config(config, export_dir)`.
- Require `artifacts` to be an object.
- Require `trainingRunbookPath` and `postTrainingChecklistPath` to be non-empty strings.
- Resolve both artifact paths through the same safe relative path boundary check used by dataset paths.
- Use `artifacts.postTrainingChecklistPath` for `post_training_checklist_exists`.
- Do not require `trainingRunbookPath` to exist yet; P7.41 only aligns path safety and checklist lookup. A later phase can add `training_runbook_exists` if useful.

## Verification

- `vitest run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts`
- Python compile for `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`
- Targeted typecheck/lint/diff checks after implementation.
