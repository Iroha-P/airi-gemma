# P7.33 LoRA Dry-Run Post-Training Checklist Gate

## Goal

Make the AIRI app-side LoRA dry-run verify that an exported training package still contains its package-local post-training checklist.

## Scope

- Add a `post_training_checklist_exists` dry-run check.
- Keep the check limited to file presence; do not read or return checklist content in the dry-run report.
- Add a regression test for a freshly exported package.
- Add a regression test for a package where `lora-post-training-checklist.zh-CN.md` was deleted.
- Record P7.33 in the main memory/agent orchestrator design document.

## TDD Evidence

1. RED: `vitest run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-dry-run.test.ts` failed because the dry-run did not report `post_training_checklist_exists` and still accepted a package after the checklist was deleted.
2. GREEN: `validateLoraTrainingPackage` now checks for `lora-post-training-checklist.zh-CN.md` after required dataset files are present.
3. VERIFY: Run focused LoRA tests, stage-tamagotchi typecheck, targeted lint fix, and whitespace checks.

## Safety Notes

- The report only exposes the check id, status, and a generic message.
- No sample body, raw chat import, source metadata path, or checklist body is included in the dry-run result.
