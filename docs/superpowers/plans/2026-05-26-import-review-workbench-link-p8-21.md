# P8.21 Import Review Workbench Link

## Goal

Let users jump from import result panels directly to the refreshed Memory Review Workbench.

## Constraints

- Do not approve, reject, archive, or edit imported memories automatically.
- Do not introduce another review queue state source.
- Keep the action local to the page; no Obsidian process, filesystem, or Memory DB side effect.

## Plan

1. Add a local `reviewWorkbenchSection` template ref and `scrollToReviewWorkbench()` helper.
2. Add a small "open review queue" button inside knowledge-base, chat-record, and backup import result summaries.
3. Add English and Simplified Chinese locale labels.
4. Add a static UI contract test for the link behavior.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-workbench-link-p8-21.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-workbench-link-p8-21.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/import-review-workbench-link-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-workbench-link-p8-21.md`

## Result

- Passed targeted Vitest import-result UI tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code/test files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two i18n YAML files.
