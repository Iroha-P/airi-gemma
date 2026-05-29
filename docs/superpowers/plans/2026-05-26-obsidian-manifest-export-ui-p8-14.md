# P8.14 Obsidian Manifest Export UI

## Goal

Show the generated `.airi/manifest.json` file in the Obsidian/AIRI-Brain export result panel so users can confirm the migration/workspace manifest was written.

## Constraints

- Do not change export semantics or manifest contents.
- Do not open Obsidian automatically.
- Do not parse the manifest back into memory.

## Plan

1. Derive the manifest file from the existing Obsidian export result.
2. Render a small manifest row with relative and absolute path.
3. Add English and Simplified Chinese locale keys.
4. Extend the existing static UI contract test.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/obsidian-export-result-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/obsidian-export-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-manifest-export-ui-p8-14.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/obsidian-export-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-manifest-export-ui-p8-14.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/obsidian-export-result-ui.test.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-manifest-export-ui-p8-14.md`
