# P8.20 Import Review Queue Summary

## Goal

Show the refreshed Review Workbench total inside import result panels so users can see that imported candidates are ready for review.

## Constraints

- Do not auto-approve imported or restored memories.
- Do not add new mutable UI state; derive the count from the existing review workbench snapshot.
- Do not expose memory content in import summaries.

## Plan

1. Derive `reviewWorkbenchTotal` from the current review workbench snapshot.
2. Render the review queue count in knowledge-base, chat-record, and backup import result panels.
3. Add English and Simplified Chinese locale keys.
4. Extend existing static UI contract tests.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-queue-summary-p8-20.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-queue-summary-p8-20.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/chat-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/backup-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-review-queue-summary-p8-20.md`

## Result

- Passed targeted Vitest import result UI contract tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code/test files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two i18n YAML files.
