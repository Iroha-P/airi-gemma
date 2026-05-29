# P4.1 Agent Console v1

## Goal

Expose the existing Memory + RAG + Agent Orchestrator chain from the Memory settings page so users can run a small local-first agent request, inspect retrieved context, handle pending high-risk actions, and store a reflected answer as a reviewable memory.

## Scope

- [x] Add a renderer Pinia store for Agent Eventa RPCs.
- [x] Cover the store with Vitest before implementation.
- [x] Add a compact Agent Console section to `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`.
- [x] Add i18n strings for all root `settings.yaml` locale files.
- [x] Update the design document to mark P4.1 as implemented.
- [x] Verify with targeted Vitest, stage-tamagotchi typecheck, lint fix, and diff whitespace check.

## Verification

- `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/agent.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
  - Result: 4 files passed, 25 tests passed.
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
  - Result: passed.
- `pnpm lint:fix`
  - Result: 0 warnings, 0 errors.
- `git diff --check`
  - Result: exit 0. Git only reported existing LF/CRLF normalization warnings.

## Review

- Independent subagent review found one P3 issue: reflected memories showed raw `agent_reflection` source labels.
- Fixed by adding `agent_reflection` source labels to all root `settings.yaml` locale files.
- No P0/P1/P2 blockers remain for P4.1.

## Out of Scope

- Full chat UI polish.
- Real computer-use execution.
- Obsidian/GBrain UI.
- Vector embeddings.
- Agent streaming.

## Acceptance

- User can run an agent prompt from Memory settings.
- Current run shows status, mode, response, context ids, used context ids, and withheld context ids.
- If the run awaits confirmation, user can approve or reject the pending action.
- User can cancel a current run.
- Completed runs can be reflected and stored as `needs_review` memory candidates through existing orchestrator RPC.
