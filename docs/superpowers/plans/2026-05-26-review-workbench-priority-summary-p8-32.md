# P8.32 Review Workbench Priority Summary

## Goal

Show a compact high/medium/low priority summary for the currently loaded Review Workbench snapshot so users can decide whether to handle urgent review items first.

## Constraints

- Derive counts from the existing loaded snapshot only.
- Do not change Memory DB state, review ordering, filters, or actions.
- Do not add a backend call.
- Keep the UI text localized.

## Plan

1. Add priority count derivation for high, medium, and low review entries.
2. Render the priority summary in the Review Workbench filter area.
3. Add English and Simplified Chinese locale keys.
4. Add a static UI contract test.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Review Workbench now displays high, medium, and low priority counts for the currently loaded review snapshot. The summary is read-only and does not change review ordering, filters, Memory DB state, or available actions.
