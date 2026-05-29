# P8.28 Review Workbench Conflict Evidence

## Goal

Show concise conflict evidence inside Review Workbench cards so users can understand why a memory was flagged as conflicting before approving, editing, archiving, or rejecting it.

## Constraints

- Do not display related memory content.
- Do not display local paths or source IDs.
- Do not change Memory DB state.
- Do not change review snapshot generation, ordering, or action behavior.

## Plan

1. Extend `reviewEvidenceRows()` to include conflict metadata rows.
2. Add localized labels for related memory id, conflict reason, and conflict score.
3. Add a static UI contract test.
4. Update the architecture/design document.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-conflict-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-conflict-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-conflict-evidence-p8-28.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-conflict-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-conflict-evidence-p8-28.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-conflict-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-counts-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-empty-state-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-tag-chips-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-memory-badges-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-review-workbench-conflict-evidence-p8-28.md`

## Result

- Passed targeted Vitest review workbench UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code/test/doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two i18n YAML files.
