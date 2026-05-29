# P8.47 Backup Preview Bulk Selection

## Goal

Add bulk selection actions to the backup preview panel, so users can quickly select all importable backup items or clear the current import selection before restoring.

## Constraints

- Do not change backup preview parsing, conflict detection, selection defaults, import behavior, or backup format.
- Bulk select must only select non-empty backup items, matching the existing default selection rule.
- Keep item-level checkboxes unchanged.
- Keep UI text localized.

## Plan

1. Add `selectAllBackupItems` and `clearBackupSelection` actions to the memory settings store.
2. Add a computed selectable backup item count in the Memory settings page.
3. Render localized bulk selection buttons beside the existing import action.
4. Add store/static UI regression coverage.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest backup preview bulk-selection, metadata, empty-state, selected-conflict, risk-summary, backup store, and backup service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched store, Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Backup preview now supports bulk selection actions. Users can select all non-empty importable backup items or clear the current selection before import, while item-level checkboxes, preview parsing, conflict detection, backup format, and import behavior remain unchanged. The select-all action is disabled when there are no remaining importable items to add.
