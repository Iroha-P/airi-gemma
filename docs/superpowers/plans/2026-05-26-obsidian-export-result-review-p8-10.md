# P8.10 Obsidian Export Result Review

## Goal

After exporting the Obsidian/AIRI-Brain vault, show the user which review inbox files were written and how many memories each contains.

## Boundaries

- Do not open Obsidian automatically.
- Do not mutate Memory DB state.
- Do not parse generated Markdown back into memory.
- Keep the result view based on the export result already returned by Eventa.

## TDD Notes

1. Add a renderer static UI contract test for `obsidianVaultExportResult` and `obsidianInboxExportFiles`.
2. Extend the Pinia store test to prove `exportObsidianVault()` stores the returned file list.
3. Render output directory, exported time, inbox relative paths, absolute paths, and counts.
4. Allow Obsidian export when there are pending memories but no active memories by disabling only when `status.total === 0`.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/obsidian-export-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/obsidian-export-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-export-result-review-p8-10.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/obsidian-export-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-export-result-review-p8-10.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/obsidian-export-result-ui.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-export-result-review-p8-10.md`
