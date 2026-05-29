# P8.64 Computer Use Execution Revalidation

## Goal

Prevent stale or tampered Computer Use audit previews from bypassing the current policy at execution time.

## Scope

- Revalidate loaded preview targets against the current policy before execution.
- Reject execution if the target is now missing, unsupported, inside a denied root, or outside allowed read/write roots.
- Preserve existing preview-time policy decisions and audit logging behavior.

## Verification

- Run Computer Use manager tests and Agent Orchestrator tests.
- Run stage-tamagotchi typecheck.
- Run targeted lint/fix and whitespace checks.
