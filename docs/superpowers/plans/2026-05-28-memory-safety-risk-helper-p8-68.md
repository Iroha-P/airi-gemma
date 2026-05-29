# P8.68 Unified Memory Safety Risk Helper

## Goal

Make every memory consumer interpret safety risk consistently. Some paths were scanning the current content, while others trusted persisted `metadata.safety.safe`; stale or edited records could therefore behave differently across RAG, Review Workbench, Evolution, and exports.

## Scope

- Add `hasMemorySafetyRisk` to the shared memory safety module.
- Treat a memory as unsafe when either persisted metadata says `safe: false` or the current content scan fails.
- Reuse this helper in RAG context, Review Workbench, Evolution suggestions, export preflight, Compact Profile, and Obsidian/AIRI-Brain export.
- Tighten LoRA export preflight so local paths and invisible Unicode are blocked before dry-run packaging, not only at training-script validation time.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/safety.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/profile-compactor.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/evolution.test.ts`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/safety.ts apps/stage-tamagotchi/src/main/services/airi/memory/safety.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/profile-compactor.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.ts apps/stage-tamagotchi/src/main/services/airi/memory/evolution.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts`
