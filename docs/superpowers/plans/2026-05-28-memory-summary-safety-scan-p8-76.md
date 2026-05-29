# P8.76 Memory Summary Safety Scan

## Goal

Close a safety gap where `content` was scanned but `summary` could still contain local paths, credentials, prompt-injection text, or invisible Unicode. Several export surfaces render summaries, so summary text must share the same safety boundary.

## Changes

- Add `scanMemoryCandidateSafety()` to scan both `content` and `summary`.
- Make `hasMemorySafetyRisk()` use the candidate-level scan.
- Make Memory Repository write-boundary scan summaries on create/update.
- Make backup preview/import rescan summaries before restore.
- Add regression coverage for safety helper, repository write boundary, backup restore/preview, and export preflight.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/safety.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/repository.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/backup.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `git diff --check`
