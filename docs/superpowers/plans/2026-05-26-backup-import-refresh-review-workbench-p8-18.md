# P8.18 Backup Import Refresh Review Workbench

## Goal

Refresh the Memory Review Workbench immediately after memory backup imports so restored `needs_review` candidates are visible without a manual refresh.

## Constraints

- Do not auto-approve restored memories.
- Do not change backup import parsing or conflict detection.
- Keep backup import behavior review-first.

## Plan

1. After successful backup import, refresh the review workbench snapshot.
2. Cover both direct backup import and selected backup import in the store test.
3. Update the architecture document with the backup import-to-review behavior.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/backup.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-backup-import-refresh-review-workbench-p8-18.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-backup-import-refresh-review-workbench-p8-18.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-backup-import-refresh-review-workbench-p8-18.md`
