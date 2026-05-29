# P7.37 Strict LoRA Dry-Run Contract Checks

## Goal

Make AIRI app-side dry-run and the external Gemma QLoRA script reject unknown `dryRunContract.successChecks` entries.

## Scope

- Add an AIRI dry-run regression test for an extra `unknown_check` in `successChecks`.
- Add an external script dry-run regression test for the same extra check.
- Change AIRI dry-run validation from "contains required checks" to "exactly equals the expected ordered check list".
- Change Python script validation the same way.
- Record P7.37 in the main memory/agent orchestrator design document.

## TDD Evidence

1. RED: AIRI dry-run accepted a config whose `successChecks` included an extra `unknown_check`.
2. RED: Python script dry-run accepted a package with the same unknown success check.
3. GREEN: Both validators now require the exact expected ordered list.

## Safety Notes

- The strict check protects Orchestrator integrations from trusting unsupported or hand-edited contract entries.
- No sample text or raw chat content is added to reports.
