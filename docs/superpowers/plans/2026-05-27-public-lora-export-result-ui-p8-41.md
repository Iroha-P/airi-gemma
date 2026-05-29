# P8.41 Public Profile And LoRA Export Result UI

## Goal

Persist and render the latest Public Profile and LoRA dataset candidate export results in Memory settings, so users can inspect output folders and generated files after export instead of relying only on toast messages.

## Constraints

- Do not change export filtering, privacy gates, file content, or LoRA dry-run validation.
- Keep sample content hidden in the UI.
- Keep UI text localized.
- Keep the existing Memory settings page as the composition surface; this is a small export-result visibility improvement and does not need a new component.

## Plan

1. Persist `publicProfileExportResult` and `loraDatasetCandidatesExportResult` in the memory settings store.
2. Expose both results through `storeToRefs`.
3. Add computed record counts for the two result panels.
4. Render localized output folder, timestamp, total count, empty state, and generated file rows.
5. Add store/static UI regression coverage.
6. Update the architecture/design document.
7. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest store/export UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched store, Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Memory settings now persists and renders the latest Public Profile and LoRA dataset candidate export results. Users can inspect output folders, timestamps, generated file paths, and included memory/record counts after export, while sample content remains hidden and privacy/training gates stay unchanged.
