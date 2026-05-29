# P8.42 Backup Export Result UI

## Goal

Persist and render the latest Memory backup export result in Memory settings, so migration/restore preparation is visible after export instead of relying only on toast messages.

## Constraints

- Do not change backup file format, export filtering, import behavior, or restore behavior.
- Keep the result read-only.
- Keep UI text localized.
- Keep the existing Memory settings page as the composition surface; this is a small export-result visibility improvement and does not need a new component.

## Plan

1. Persist `backupExportResult` in the memory settings store.
2. Expose it through `storeToRefs`.
3. Add a computed backup record count.
4. Render localized output folder, timestamp, total count, empty state, and generated file rows.
5. Add store/static UI regression coverage.
6. Update the architecture/design document.
7. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest backup export UI/store/service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched store, Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Memory settings now persists and renders the latest backup export result. Users can inspect the backup output folder, timestamp, generated file path, and included memory count after export, while the backup file format and restore/import behavior remain unchanged.
