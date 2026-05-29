# P8.73 Memory Repository Safety Write Boundary

## Goal

Prevent unsafe memories from becoming active through any UI or service path, including bulk approve and review actions.

## Change

- `createMemoryRepository` now applies a safety adjustment on create and update.
- If final content or persisted metadata is unsafe, writes are forced to `privacy: secret` and tagged `safety-review`.
- Unsafe writes cannot become `active`; active writes are downgraded to `needs_review`.
- Archive/reject style status changes are still allowed, so users can remove unsafe memories without getting stuck.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/repository.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/actions.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/backup.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/repository.ts apps/stage-tamagotchi/src/main/services/airi/memory/repository.test.ts`
