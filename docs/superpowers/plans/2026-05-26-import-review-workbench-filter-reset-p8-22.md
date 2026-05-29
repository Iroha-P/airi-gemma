# P8.22 Import Review Workbench Filter Reset

## Goal

Make the import-result "open review queue" action show the full Review Workbench instead of preserving a stale source filter that could hide newly imported candidates.

## Constraints

- Do not mutate Memory DB state.
- Do not change review entry ordering or snapshot contents.
- Keep the behavior local to the Memory settings page.

## Plan

1. Reset `reviewWorkbenchFilter` to `all` before scrolling to the Review Workbench.
2. Extend the import review link UI contract test to cover the filter reset.
3. Update the architecture/design document.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-workbench-filter-reset-p8-22.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-workbench-filter-reset-p8-22.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-workbench-filter-reset-p8-22.md`

## Result

- Passed targeted Vitest import-result UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code/test/doc files.
- Passed `git diff --check` and trailing whitespace scan.
