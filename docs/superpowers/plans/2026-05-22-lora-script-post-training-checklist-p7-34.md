# P7.34 External Script Post-Training Checklist Gate

## Goal

Keep AIRI app-side dry-run and the external Gemma QLoRA script aligned by making the Python script reject training packages that are missing the package-local post-training checklist.

## Scope

- Add a script-side check for `lora-post-training-checklist.zh-CN.md`.
- Keep the check limited to file presence; do not read or return checklist content.
- Add a script dry-run regression test that deletes the checklist and expects `validation_error` with exit code 2.
- Update the external training README to list the checklist as a required input and dry-run gate.
- Record P7.34 in the main memory/agent orchestrator design document.

## TDD Evidence

1. RED: `vitest run apps/stage-tamagotchi/src/main/services/airi/memory/lora-training-template.test.ts` failed because deleting `lora-post-training-checklist.zh-CN.md` still allowed script dry-run to succeed.
2. GREEN: `train_gemma_qlora_unsloth.py` now validates the checklist path before loading dataset rows or training dependencies.
3. DOC RED/GREEN: The template documentation test first failed because README did not mention `lora-post-training-checklist.zh-CN.md`; README was updated and the test passed.

## Safety Notes

- Missing-checklist errors are expected data errors and use the existing `validation_error` JSON contract.
- The script does not expose sample body text, raw chat imports, local paths, or checklist content in successful dry-run stdout.
