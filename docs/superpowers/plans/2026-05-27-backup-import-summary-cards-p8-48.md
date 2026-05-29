# P8.48 Backup Import Summary Cards

## Goal

Make backup restore results easier to scan by showing imported and skipped counts as dedicated summary cards after a backup import finishes.

## Constraints

- Do not change backup import parsing, backup format, skipped reasons, review workbench refresh, or imported memory content.
- Keep the result panel read-only and avoid exposing imported memory body text.
- Keep UI text localized.

## Plan

1. Add localized labels for imported and skipped backup item summary cards.
2. Render the two summary cards in the backup import result panel.
3. Add static UI regression coverage.
4. Update the architecture/design document.
5. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest backup import summary cards, backup import result, backup preview bulk-selection, backup store, and backup service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Backup import result now shows dedicated imported and skipped summary cards, making migration restore outcomes easier to scan without exposing restored memory body text.
