# P8.75 Dream Review Actions Use Sanitized Candidates

## Goal

Make every Dream Review action consume sanitized dream output, not the raw local model response. LoRA import already used `sanitizedReport`; memory candidate import and routine saving needed the same boundary.

## Changes

- `useDreamSettingsStore.importMemoryCandidatesToReview()` now reads `sanitizedReport.memoryCandidates`.
- `useDreamSettingsStore.saveRoutineCandidates()` now reads `sanitizedReport.routineCandidates`.
- Actions return no-op results when a completed dream session has no `training_sanitized` report.
- Memory settings action enablement now follows sanitized memory/routine candidate counts.
- Memory settings candidate lists now display sanitized memory/routine candidates.
- Regression tests assert local paths and credentials from raw dream output are not queued through review actions.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/dream.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/dream-sanitized-lora-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `git diff --check`
