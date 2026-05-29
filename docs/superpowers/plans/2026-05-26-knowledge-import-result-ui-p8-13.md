# P8.13 Knowledge Import Result UI

## Goal

Show Markdown/Obsidian import results in the Memory settings page, especially AIRI-generated vault files skipped by the P8.12 re-import guard.

## Constraints

- Do not change import safety semantics.
- Do not auto-open Obsidian or parse generated vault views back into memory.
- Keep the UI as a small result panel in the existing Memory Console.

## Plan

1. Store the latest knowledge-base import result in the Pinia memory settings store.
2. Render created/scanned counts, empty files count, and skipped generated files in the Memory settings page.
3. Add English and Simplified Chinese locale keys.
4. Add a renderer static contract test for the result panel.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-knowledge-import-result-ui-p8-13.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-knowledge-import-result-ui-p8-13.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-knowledge-import-result-ui-p8-13.md`
