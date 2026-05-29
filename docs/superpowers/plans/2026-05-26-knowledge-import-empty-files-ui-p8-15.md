# P8.15 Knowledge Import Empty Files UI

## Goal

Show empty Markdown file paths in the Memory settings knowledge import result panel so users can tell which imported notes were ignored because they had no content.

## Constraints

- Do not change knowledge import semantics.
- Do not treat empty files as failures.
- Keep the panel lightweight and scoped to the existing Memory Console.

## Plan

1. Render `emptyFiles` as a small relative-path list.
2. Add empty-state copy when no empty files were skipped.
3. Extend English and Simplified Chinese locale keys.
4. Extend the static UI contract test.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-knowledge-import-empty-files-ui-p8-15.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-knowledge-import-empty-files-ui-p8-15.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/knowledge-import-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-knowledge-import-empty-files-ui-p8-15.md`
