# P8.24 Review Workbench Filter Counts

## Goal

Show review item counts on each Review Workbench source filter so users can see where pending memories are concentrated before switching filters.

## Constraints

- Do not change Memory DB state.
- Do not change review snapshot generation, ordering, or action behavior.
- Derive counts from the existing loaded Review Workbench entries only.

## Plan

1. Derive per-filter counts from `reviewWorkbenchEntries`.
2. Render filter button labels with the current count.
3. Add a static UI contract test.
4. Update the architecture/design document.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-filter-counts-p8-24.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-filter-counts-p8-24.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-filter-counts-p8-24.md`

## Result

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code/test/doc files.
- Passed `git diff --check` and trailing whitespace scan.
