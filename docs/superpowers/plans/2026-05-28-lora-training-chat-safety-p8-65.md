# P8.65 LoRA Training Chat Safety

## Goal

Make both AIRI-side and external-script LoRA dry-runs reject unsafe chat content if a training package is manually edited after export.

## Scope

- Add AIRI-side `jsonl_records_safe` validation for local paths, raw chat markers, credentials, and invisible Unicode controls.
- Extend the external Gemma QLoRA script's `chat_record_safety` gate to reject the same unsafe content classes.
- Keep dry-run reports content-free: only check ids/statuses are exposed, not sample text.

## Verification

- Run LoRA dry-run, LoRA dataset, and training template tests.
- Run external script `--help`.
- Run stage-tamagotchi typecheck.
- Run targeted lint/fix and whitespace checks.
