# P8.17 Import Refresh Review Workbench

## Goal

Refresh the Memory Review Workbench immediately after Markdown/Obsidian or chat record imports so newly created `needs_review` candidates are visible without a manual refresh.

## Constraints

- Do not auto-approve imported memories.
- Do not change import parsing, privacy, or safety semantics.
- Do not refresh expensive full-repo or unrelated UI state beyond the existing memory refresh and review snapshot.

## Plan

1. After successful Markdown knowledge-base import, refresh the review workbench snapshot.
2. After successful WeChat/Feishu/QQ chat record import, refresh the review workbench snapshot.
3. Extend store tests to prove imports call `getReviewWorkbench`.
4. Update the architecture document with the import-to-review behavior.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/chat-records.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-refresh-review-workbench-p8-17.md`
- `git diff --check -- apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-refresh-review-workbench-p8-17.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-import-refresh-review-workbench-p8-17.md`
