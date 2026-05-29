# P8.29 Review Workbench Stale Evidence

## Goal

Show concise stale-memory evidence inside Review Workbench cards so users can understand why an active memory is being resurfaced for review.

## Constraints

- Do not change Memory DB state.
- Do not change stale detection logic, review snapshot generation, ordering, or actions.
- Do not display local paths or source IDs.
- Use existing loaded memory fields only.

## Plan

1. Extend `reviewEvidenceRows()` to include stale-active evidence rows.
2. Add localized labels for updated time, last accessed time, and access count.
3. Add a static UI contract test.
4. Update the architecture/design document.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-stale-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-conflict-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-stale-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-conflict-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-stale-evidence-p8-29.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-stale-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-conflict-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-stale-evidence-p8-29.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-stale-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-conflict-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-stale-evidence-p8-29.md`

## Result

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code/test/doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two i18n YAML files.
