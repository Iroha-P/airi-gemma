# P8.62 Dream LoRA Sanitized Import Gate

## Goal

Prevent Local Dream LoRA candidates from being marked as `training_sanitized` unless they come from the dream sanitizer output.

## Scope

- Extend the Dream sanitizer to redact credentials and Unix-style local paths in addition to Windows paths and raw chat markers.
- Make the Dream settings store import LoRA candidates from `report.sanitizedReport.loraDatasetCandidates` only.
- Make the Memory settings UI enable/render Dream LoRA candidates from the sanitized report only.
- Keep raw Dream output visible only as local session data for review/debugging, not as training-ready memory.

## Verification

- Run Dream sanitizer, Dream settings store, and Memory settings UI wiring tests.
- Run the full Dream service test group and focused Memory export tests.
- Run stage-tamagotchi typecheck.
- Run targeted lint/fix and whitespace checks.
