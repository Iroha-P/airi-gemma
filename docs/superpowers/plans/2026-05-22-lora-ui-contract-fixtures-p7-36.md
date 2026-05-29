# P7.36 UI and Service Dry-Run Contract Fixtures

## Goal

Keep Eventa adapter and Pinia Memory store tests aligned with the P7.35 machine-readable LoRA dry-run contract.

## Scope

- Add regression assertions that service-layer and renderer store dry-run results include `post_training_checklist_exists`.
- Update stale test fixtures from the old 3-check external script contract to the current 4-check contract.
- Update the renderer store success toast fixture from 9 to 16 passed checks so the example matches the current AIRI dry-run report shape.
- Record P7.36 in the main memory/agent orchestrator design document.

## TDD Evidence

1. RED: `vitest run apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts` failed because fixtures still had only `privacy_flags`, `dataset_counts`, and `chat_record_safety`.
2. GREEN: Both fixtures now include `post_training_checklist_exists`, and the renderer success toast expectation reflects 16 checks.

## Safety Notes

- No production UI behavior changed in this phase.
- The UI still receives only dry-run counts, check IDs/statuses, and contract metadata; no sample text is introduced.
