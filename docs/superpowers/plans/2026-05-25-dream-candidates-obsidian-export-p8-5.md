# P8.5 Dream Candidates Obsidian Export

## Goal

Export local dream-generated memory candidates into an Obsidian/AIRI-Brain inbox page so the user can review dream consolidation output as readable notes before approving anything into long-term memory.

## Boundaries

- Do not turn dream candidates into active memory.
- Do not export `secret` dream candidates.
- Do not add an Obsidian runtime dependency.
- Keep Memory DB and Review Workbench as the source of truth.

## TDD Notes

1. Add a regression test proving a pending local dream candidate is exported to `00-inbox/dream-candidates.md`.
2. Include a `secret` dream candidate in the same test to prove it stays out of the vault.
3. Implement the smallest export filter and page entry needed to satisfy the test.
4. Update the Chinese architecture plan with the new P8.5 behavior.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-dream-candidates-obsidian-export-p8-5.md`
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-dream-candidates-obsidian-export-p8-5.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-dream-candidates-obsidian-export-p8-5.md`
