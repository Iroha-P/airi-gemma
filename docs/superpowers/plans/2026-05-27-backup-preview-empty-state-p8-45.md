# P8.45 Backup Preview Empty State

## Goal

Show a clear empty state when a selected backup file contains zero memories, so the backup preview panel does not look blank before import.

## Constraints

- Do not change backup preview parsing, selection defaults, import behavior, or backup format.
- Keep the result read-only except for the existing item selection checkboxes when items exist.
- Keep UI text localized.
- Keep the existing Memory settings page as the composition surface; this is a small template branch and does not need a new component.

## Plan

1. Render a localized empty state when `backupPreview.items.length === 0`.
2. Keep the existing item list behavior for non-empty backup previews.
3. Add English and Simplified Chinese empty-state text.
4. Add static UI regression coverage.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest backup preview empty-state, selected-conflict, risk-summary, backup store, and backup service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Backup preview now shows a localized empty state when a selected backup file contains zero memories. Non-empty previews keep the existing selectable item list, conflict display, and import behavior unchanged.
