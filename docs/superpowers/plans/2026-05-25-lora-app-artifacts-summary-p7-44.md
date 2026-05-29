# P7.44 LoRA App Artifacts Summary

## Goal

Return `artifacts` from AIRI's app-side `validateLoraTrainingPackage`, matching the external script's P7.43 successful dry-run report.

## Problem

The external Python script can now return:

- `artifacts.trainingRunbookPath`
- `artifacts.postTrainingChecklistPath`

AIRI's own dry-run result still returned only `dryRunContract`, counts, and checks. The renderer or Agent Orchestrator would need to re-read `lora-training-config.json` to display which handoff files the app-side dry-run checked.

## Test-first Change

Add an assertion to `lora-training-dry-run.test.ts` that a fresh package returns:

```json
{
  "artifacts": {
    "trainingRunbookPath": "lora-training-runbook.zh-CN.md",
    "postTrainingChecklistPath": "lora-post-training-checklist.zh-CN.md"
  }
}
```

The first run fails because `artifacts` is undefined.

## Implementation

- Add `LoraTrainingDryRunArtifactSummary`.
- Return `artifacts: null` before config shape validation succeeds.
- Populate `artifacts` from `config.artifacts` after config validation.
- Include `artifacts` in `finish`.
- Add the matching Eventa result type.
- Sync service and renderer test fixtures.

## Verification

- Targeted Vitest for app-side dry-run, Eventa adapter, and renderer store.
- Stage tamagotchi typecheck.
- Targeted lint and whitespace checks.
