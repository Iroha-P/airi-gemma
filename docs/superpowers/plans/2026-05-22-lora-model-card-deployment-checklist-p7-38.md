# P7.38 Model Card and Deployment Checklist Gate

## Goal

Make the post-training model card and deployment checklist record the `post_training_checklist_exists` dry-run gate.

## Scope

- Extend template tests so model card and deployment docs must mention `post_training_checklist_exists`.
- Extend template tests so both docs must mention `lora-post-training-checklist.zh-CN.md`.
- Update `MODEL_CARD_TEMPLATE.zh-CN.md`.
- Update `DEPLOYMENT.zh-CN.md`.
- Record P7.38 in the main memory/agent orchestrator design document.

## TDD Evidence

1. RED: `lora-training-template.test.ts` failed because the model card template did not mention `post_training_checklist_exists`.
2. GREEN: Model card and deployment docs now both include the check id and checklist file name.

## Safety Notes

- This phase updates documentation templates only.
- The templates still instruct users not to include raw chat records, private paths, or unreviewed memory content.
