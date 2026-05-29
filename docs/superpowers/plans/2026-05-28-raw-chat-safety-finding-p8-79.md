# P8.79 Raw Chat Safety Finding

## Goal

Treat raw chat archive markers as first-class memory safety risks. LoRA dry-run already rejects raw chat markers, but the shared Memory safety gate also needs to block manually created or edited memories that still contain `[微信]`, `[WeChat]`, `[飞书]`, `[Feishu]`, or `[QQ]` markers.

## Changes

- Add `raw_chat` to `MemorySafetyFindingKind`.
- Detect common raw chat archive markers in `scanMemorySafety`.
- Localize the new safety finding badge.
- Add export preflight regressions for public profile and LoRA surfaces.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/safety.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/export-preflight.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `git diff --check`
