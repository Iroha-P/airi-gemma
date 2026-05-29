# P8.66 Agent Reflection Safety Metadata

## Goal

Keep Agent Reflection safety metadata compatible with Memory Review, Memory Evolution, and RAG safety gates.

## Scope

- Store `metadata.safety` as the shared `{ safe, findings }` scan result instead of a bare findings array.
- Preserve redacted previews for reflected input/content.
- Keep unsafe reflections as `secret`, `needs_review`, and `safety-review`.

## Verification

- Run Agent Orchestrator, Memory Review Workbench, and RAG context tests.
- Run stage-tamagotchi typecheck.
- Run targeted lint/fix and whitespace checks.
