# P8.60 Agent Computer Use Deny Handling

## Goal

Keep Agent Orchestrator aligned with the Computer Use policy layer when a seemingly safe action, such as reading a file, is denied by policy.

## Scope

- Treat denied computer-use previews as high-risk pending actions at the Agent layer.
- When the user confirms a denied preview, cancel the run and return the policy denial reason instead of attempting execution or reporting a generic confirmation.
- Preserve existing behavior for executable low-risk previews and high-risk non-executable previews.

## Verification

- Run Agent Orchestrator and Computer Use manager tests.
- Run stage-tamagotchi typecheck.
- Run lint/fix and whitespace checks.
