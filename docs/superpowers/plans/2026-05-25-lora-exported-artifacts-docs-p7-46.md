# P7.46 LoRA Exported Artifacts Docs

## Goal

Make exported LoRA package documentation describe the latest `artifacts` reporting contract.

## Problem

P7.43-P7.45 aligned the app-side dry-run, external script dry-run, and Memory settings UI around:

- `artifacts.trainingRunbookPath`
- `artifacts.postTrainingChecklistPath`

The generated `lora-training-runbook.zh-CN.md` and `lora-post-training-checklist.zh-CN.md` still described checks and counts, but did not explicitly state that AIRI app-side dry-run returns these artifact paths.

## Test-first Change

Add assertions to `lora-dataset.test.ts`:

- generated runbook mentions `validateLoraTrainingPackage` returns `artifacts`
- generated checklist preserves AIRI app-side artifacts evidence

The first run fails because the generated docs do not contain those strings.

## Implementation

- Add app-side artifact return notes to generated runbook.
- Add app-side artifact evidence line to generated post-training checklist.
- Record P7.46 in the main design document.

## Verification

- Targeted LoRA dataset Vitest.
- Stage tamagotchi typecheck.
- Targeted lint and whitespace checks.
