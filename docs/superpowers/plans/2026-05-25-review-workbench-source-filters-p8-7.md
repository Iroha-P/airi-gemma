# P8.7 Review Workbench Source Filters

## Goal

Let the user quickly focus the Memory Review Workbench on dream candidates, persona candidates, and safety risks without changing the underlying Memory DB.

## Boundaries

- Filtering is renderer-local and only affects the current review snapshot view.
- Do not add a new backend query or persistence field.
- Do not auto-approve, reject, archive, or edit memories.
- Keep Review Workbench ordering from the snapshot; only hide non-matching entries.

## Component Map

- `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`: existing route-level composition surface; owns local filter state and derives visible review entries.
- No new child component in this phase because the change is a small, local segmented control plus one computed list.

## TDD Notes

1. Add a renderer-side static UI contract test for `reviewWorkbenchFilter`, `reviewWorkbenchFilterOptions`, and `filteredReviewWorkbenchEntries`.
2. Assert English and Simplified Chinese locale keys exist for dream/persona filters and the filtered count text.
3. Implement local filter state and use `filteredReviewWorkbenchEntries` in the workbench list.
4. Update the architecture plan with P8.7 behavior.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-review-workbench-source-filters-p8-7.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-review-workbench-source-filters-p8-7.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-review-workbench-source-filters-p8-7.md`
