# P8.31 Review Workbench Snapshot Time

## Goal

Show when the Review Workbench snapshot was generated so users can tell whether import, backup restore, dream candidate import, or manual refresh has updated the visible review queue.

## Constraints

- Use the existing `reviewWorkbench.generatedAt` value only.
- Do not change Memory DB state, review ordering, filters, or actions.
- Do not add a new backend call.
- Keep the UI text localized.

## Plan

1. Add a generated-at line to the Review Workbench header.
2. Add English and Simplified Chinese locale keys.
3. Add a static UI contract test for the timestamp line.
4. Update the architecture/design document.
5. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Review Workbench now displays the generated time for the currently loaded review snapshot. This helps users verify that imports, backup restore, dream candidate writes, and manual refreshes have updated the visible review queue.
