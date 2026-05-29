# P8.35 Review Workbench Active Filter Reset

## Goal

Show a visible "show all" reset button whenever the Review Workbench is filtered, so users can quickly return from high-priority, dream, persona, safety, conflict, or stale views to the full loaded snapshot.

## Constraints

- Reset only the local Review Workbench filter state.
- Do not change Memory DB state, review ordering, or actions.
- Do not add a backend call.
- Reuse existing localized `show-all` text.

## Plan

1. Add an `isReviewWorkbenchFiltered` computed flag.
2. Render a "show all" button next to the filtered count whenever the active filter is not `all`.
3. Add a static UI contract test.
4. Update the architecture/design document.
5. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, and doc files.
- Passed `git diff --check` and trailing whitespace scan.

## Result

Review Workbench now shows a localized "show all" reset button whenever the active filter is not `all`. The button only resets local UI filter state and does not change Memory DB state, review ordering, or available actions.
