# P8.8 Review Workbench Evidence Rows

## Goal

Show concise provenance evidence for dream and persona candidates inside the Memory Review Workbench so the user can judge where a candidate came from before editing, approving, or rejecting it.

## Boundaries

- Do not expose raw chat transcript bodies, full dream prompts, or long private source text.
- Do not mutate Memory DB or review statuses.
- Do not add a backend query.
- Keep evidence display renderer-local and derived from already-loaded metadata.

## Component Map

- `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`: existing route-level composition surface; derives evidence rows for each review entry and renders them inside the existing card.
- No child component in this phase because the evidence section is a small, local read-only subsection of each card.

## TDD Notes

1. Add a renderer static UI contract test for `reviewEvidenceRows`.
2. Assert the page references dream session, requires review, LoRA candidate, persona source, and persona reason evidence keys.
3. Add English and Simplified Chinese locale labels for those evidence rows.
4. Implement a read-only evidence section that only renders when evidence rows exist.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-review-workbench-evidence-rows-p8-8.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-review-workbench-evidence-rows-p8-8.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-evidence-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/review-workbench-filter-ui.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-review-workbench-evidence-rows-p8-8.md`
