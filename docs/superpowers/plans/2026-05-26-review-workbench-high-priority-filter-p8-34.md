# P8.34 Review Workbench High Priority Filter

## Goal

Add a manual high-priority filter to the Review Workbench so users can focus on urgent safety or conflict items without scanning the entire loaded review snapshot.

## Constraints

- Filter only the currently loaded Review Workbench snapshot.
- Do not change Memory DB state, review ordering, or actions.
- Do not add a backend call.
- Keep filter labels localized.

## Plan

1. Extend the local Review Workbench filter union with `high_priority`.
2. Add a high-priority filter button and count.
3. Update filtered entries logic to match `entry.priority === 'high'`.
4. Add English and Simplified Chinese locale keys.
5. Add a static UI contract test.
6. Update the architecture/design document.
7. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Review Workbench now includes a localized high-priority filter. Users can manually focus the loaded review snapshot on `priority: high` items without changing Memory DB state, ordering, or available review actions.
