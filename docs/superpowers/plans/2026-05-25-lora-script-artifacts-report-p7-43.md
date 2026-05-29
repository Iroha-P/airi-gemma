# P7.43 LoRA Script Artifacts Report

## Goal

Expose the config-declared training artifact paths in the external Python script's successful dry-run stdout.

## Problem

After P7.40-P7.42, the export package declares and validates:

- `artifacts.trainingRunbookPath`
- `artifacts.postTrainingChecklistPath`

The script success report still returned only `schemaVersion`, `ok`, `checks`, and `counts`. A UI or orchestrator could tell the script passed, but had to read `lora-training-config.json` again to show which runbook/checklist paths were validated.

## Test-first Change

Update the script template test so a minimal successful dry-run must return:

```json
{
  "artifacts": {
    "trainingRunbookPath": "lora-training-runbook.zh-CN.md",
    "postTrainingChecklistPath": "lora-post-training-checklist.zh-CN.md"
  }
}
```

The first run fails because the script does not include `artifacts`.

## Implementation

- Return config-declared relative artifact paths from `validate_training_package`.
- Include `artifacts` in successful `--dry-run` stdout.
- Update README/runbook examples and the main design document.

## Verification

- Targeted script template Vitest.
- Python compile for the training script.
- Stage tamagotchi typecheck.
- Targeted lint and whitespace checks.
