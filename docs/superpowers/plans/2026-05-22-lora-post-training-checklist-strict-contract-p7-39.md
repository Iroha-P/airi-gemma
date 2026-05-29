# P7.39 Post-Training Checklist Strict Contract

## Goal

Make the exported package-local `lora-post-training-checklist.zh-CN.md` record the strict external script dry-run success-check contract.

## Scope

- Extend `lora-dataset.test.ts` so the generated checklist must mention `dryRunContract.successChecks`.
- Require the checklist to include the four current success checks:
  - `privacy_flags`
  - `dataset_counts`
  - `chat_record_safety`
  - `post_training_checklist_exists`
- Require the checklist to warn that unknown success checks should not be accepted.
- Update `toPostTrainingChecklist`.
- Record P7.39 in the main memory/agent orchestrator design document.

## TDD Evidence

1. RED: `lora-dataset.test.ts` failed because the package-local checklist did not mention `dryRunContract.successChecks`.
2. GREEN: The generated checklist now records the exact success-check list and warns against unknown success checks.

## Safety Notes

- The checklist records only contract names and counts.
- It still does not include sample text, local source paths, raw chat content, or blocked memory content.
