# P8.67 Obsidian / Compact Profile Safety Gate

## Goal

Keep unsafe memory content from spreading into generated Markdown views. The Memory DB remains the source of truth, but Obsidian/AIRI-Brain and Compact Profile exports are easy to copy, sync, migrate, and inspect, so they must not write out memories flagged by the shared safety scanner.

## Scope

- Reuse `scanMemorySafety` for Compact Profile export eligibility.
- Reuse `scanMemorySafety` for Obsidian/AIRI-Brain active sections, persona inbox, dream inbox, and public profile preview.
- Record `safety_risk` in Compact Profile withheld metadata.
- Update tests to cover local paths and credential-like content.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/profile-compactor.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/profile-compactor.ts apps/stage-tamagotchi/src/main/services/airi/memory/profile-compactor.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`
