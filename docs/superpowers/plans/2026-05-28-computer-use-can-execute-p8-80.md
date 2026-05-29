# P8.80 Computer Use Executability Signal

## Goal

Make the Computer Use preview result truthfully report whether a low/medium-risk preview can be executed after explicit user approval.

## Implementation

- `createComputerUseManager().previewAction()` now sets `canExecute` to `true` only when the preview is not denied, is not high risk, and its kind is in the safe execution allowlist.
- The current policy mode is now `controlled_execution`, while the legacy `preview_only` mode remains in the Eventa type for older audit/config compatibility.
- High-risk actions such as command execution, delete, write, and move remain non-executable even after confirmation.
- The Memory settings Computer Use console now enables the approved execute button from `preview.canExecute` instead of duplicating policy logic in the renderer.
- The renderer Computer Use store also refuses direct execution when the selected preview has `canExecute: false`, so non-UI callers cannot bypass the local UI guard.
- Main-process execution and Agent confirmation execution now both require `canExecute: true`; current policy revalidation still runs before the final `canExecute` gate so stale audit entries report useful path/policy failures.

## Verification

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/computer-use.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/computer-use-can-execute-ui.test.ts`
