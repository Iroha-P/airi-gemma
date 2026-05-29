# P8.43 Backup Preview Risk Summary

## Goal

Show a compact backup preview risk summary before import, so users can quickly see how many backup items are selected, empty, or have conflict findings.

## Constraints

- Do not change backup preview conflict detection, selection defaults, import behavior, or backup format.
- Keep the result read-only except for the existing item selection checkboxes.
- Keep UI text localized.
- Keep the existing Memory settings page as the composition surface; this is a small derived-state display improvement and does not need a new component.

## Plan

1. Add computed counts for empty backup preview items and conflict-bearing backup preview items.
2. Render a localized three-cell risk summary inside the backup preview panel.
3. Add English and Simplified Chinese labels.
4. Add static UI regression coverage.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest backup preview/export UI and backup store/service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Backup preview now shows a compact risk summary with selected item count, empty item count, and conflict-bearing item count before import. This makes migration/restore review faster without changing backup preview conflict detection, selection defaults, backup format, or import behavior.
