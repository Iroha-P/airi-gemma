# P8.46 Backup Preview Metadata

## Goal

Show backup file metadata in the preview panel, including the selected backup file path, schema version, and original export time, so users can verify restore source details before import.

## Constraints

- Do not change backup preview parsing, conflict detection, selection defaults, import behavior, or backup format.
- Keep the metadata read-only.
- Keep UI text localized.
- Keep the existing Memory settings page as the composition surface; this is a small read-only display improvement and does not need a new component.

## Plan

1. Render backup file path, schema version, and exported time inside the backup preview panel.
2. Add English and Simplified Chinese metadata labels.
3. Add static UI regression coverage.
4. Update the architecture/design document.
5. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest backup preview metadata, empty-state, selected-conflict, risk-summary, backup store, and backup service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Backup preview now shows the selected backup file path, schema version, and original export time before import. The metadata is read-only and does not change backup parsing, conflict detection, item selection, backup format, or import behavior.
