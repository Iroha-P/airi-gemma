# P8.33 Review Workbench High Priority Notice

## Goal

Show a concise notice when the current Review Workbench snapshot contains high priority items, so users can spot urgent safety or conflict reviews before scanning the full queue.

## Constraints

- Derive the notice from the existing loaded snapshot only.
- Do not change Memory DB state, review ordering, filters, or actions.
- Do not add a backend call.
- Keep the UI text localized.

## Plan

1. Add a computed high-priority presence flag.
2. Render a bounded notice in the Review Workbench filter area when high priority items exist.
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

Review Workbench now shows a localized high-priority notice when the loaded review snapshot contains high priority items. The notice is read-only and does not change filters, ordering, Memory DB state, or review actions.
