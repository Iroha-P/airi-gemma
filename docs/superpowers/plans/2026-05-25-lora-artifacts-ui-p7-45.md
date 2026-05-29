# P7.45 LoRA Artifacts UI

## Goal

Show the LoRA training handoff artifact paths in the Memory settings LoRA dry-run panel.

## Problem

P7.44 made AIRI's `validateLoraTrainingPackage` return:

- `artifacts.trainingRunbookPath`
- `artifacts.postTrainingChecklistPath`

The renderer stored the data but did not display it, so users still had to infer or inspect files manually after a successful dry-run.

## Test-first Change

Update the existing string-level UI regression test to require:

- `loraTrainingDryRunArtifactRows`
- `settings.pages.memory.lora-training-dry-run.artifacts-title`
- localized labels for `training-runbook-path` and `post-training-checklist-path`

The first run fails because the page and locale files do not contain these keys.

## Implementation

- Add `loraTrainingDryRunArtifactRows` as a computed derivation from `loraTrainingDryRunResult.artifacts`.
- Render a compact read-only artifacts section below the dry-run contract summary.
- Add English and Simplified Chinese i18n labels.

## Verification

- LoRA dry-run contract UI Vitest.
- Stage tamagotchi typecheck.
- Targeted lint and whitespace checks.
