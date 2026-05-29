# P8.23 Review Workbench Filter Empty State

## Goal

Distinguish an actually empty Review Workbench from a filter that hides all currently available review entries.

## Constraints

- Do not change Memory DB state.
- Do not change review snapshot ordering or generation.
- Keep the recovery action local to the page filter.

## Plan

1. Add a filtered-empty branch when `reviewWorkbenchEntries` has items but `filteredReviewWorkbenchEntries` is empty.
2. Add a "show all" button that resets `reviewWorkbenchFilter` to `all`.
3. Add English and Simplified Chinese locale keys.
4. Add a static UI contract test.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-filter-empty-state-p8-23.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-filter-empty-state-p8-23.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-filter-empty-state-p8-23.md`

## Result

- Passed targeted Vitest review/import UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code/test/doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two i18n YAML files.
