# P8.9 Obsidian Inbox Evidence Rows

## Goal

Export concise provenance evidence for dream and persona candidates into the Obsidian/AIRI-Brain inbox pages so the user can review candidate memories outside AIRI without losing source context.

## Boundaries

- Do not export `secret` candidates.
- Do not serialize full metadata objects.
- Do not write raw chat transcripts, full dream prompts, local paths, or long private source text.
- Do not change Memory DB state; Obsidian remains a human-readable review view.

## TDD Notes

1. Extend the Obsidian vault exporter test to expect persona source/reason evidence in `00-inbox/persona-candidates.md`.
2. Extend the dream inbox test to expect dream session, requires-review, and LoRA-candidate evidence.
3. Implement a small formatter for known-safe short metadata fields.
4. Update the architecture plan with P8.9 behavior.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-obsidian-inbox-evidence-rows-p8-9.md`
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-obsidian-inbox-evidence-rows-p8-9.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-obsidian-inbox-evidence-rows-p8-9.md`
