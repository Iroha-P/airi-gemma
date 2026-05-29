# P8.27 Review Workbench Conflict And Stale Filters

## Goal

Add Review Workbench filters for conflict and stale-active review reasons so users can focus on higher-risk or aging memories without scanning the full queue.

## Constraints

- Do not change Memory DB state.
- Do not change review snapshot generation, ordering, or action behavior.
- Derive filter counts from the existing loaded Review Workbench entries only.

## Plan

1. Extend the local Review Workbench filter union with `conflict` and `stale_active`.
2. Add conflict and stale-active filter buttons with counts.
3. Add English and Simplified Chinese labels.
4. Extend the static UI contract test.
5. Update the architecture/design document.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-conflict-stale-filters-p8-27.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-conflict-stale-filters-p8-27.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-conflict-stale-filters-p8-27.md`

## Result

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code/test/doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two i18n YAML files.
