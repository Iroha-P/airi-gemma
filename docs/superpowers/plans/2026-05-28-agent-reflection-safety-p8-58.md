# P8.58 Agent Reflection Safety

## Goal

Prevent agent reflection memories from leaking raw prompts, local paths, or credentials through metadata while keeping the review workflow intact.

## Scope

- Run memory safety scanning on reflection content.
- Mark unsafe reflection candidates, including credential or local-path-bearing reflections, as `secret` and add `safety-review`.
- Store only redacted previews in reflection metadata.
- Keep the actual candidate content reviewable in the Memory DB as `needs_review`.

## Verification

- Run agent orchestrator tests.
- Run stage-tamagotchi typecheck.
- Run lint/fix and whitespace checks.
