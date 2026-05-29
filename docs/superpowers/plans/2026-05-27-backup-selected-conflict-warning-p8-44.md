# P8.44 Backup Selected Conflict Warning

## Goal

Warn users when the currently selected backup items include conflict findings, so they know the pending import selection still needs review before restore.

## Constraints

- Do not change backup preview conflict detection, selection defaults, import behavior, or backup format.
- Keep item selection behavior unchanged.
- Keep UI text localized.
- Keep the existing Memory settings page as the composition surface; this is a small derived-state warning and does not need a new component.

## Plan

1. Add a computed count for selected backup preview items with conflict findings.
2. Render a localized warning when the selected conflict count is greater than zero.
3. Add English and Simplified Chinese warning text.
4. Add static UI regression coverage.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest backup selected-conflict UI, backup risk summary UI, backup store, and backup service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Backup preview now warns when currently selected import items contain conflict findings. The warning is derived from the existing backup preview selection state and conflict findings, so backup format, preview detection, selection defaults, and import behavior remain unchanged.
