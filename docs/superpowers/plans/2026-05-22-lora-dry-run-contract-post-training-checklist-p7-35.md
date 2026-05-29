# P7.35 Dry-Run Contract Post-Training Checklist Check

## Goal

Make the machine-readable external script dry-run contract declare the post-training checklist gate that the script already performs.

## Scope

- Add `post_training_checklist_exists` to exported `lora-training-config.json.dryRunContract.successChecks`.
- Add the same check to AIRI app-side `requiredScriptDryRunChecks`.
- Add the same check to external script successful dry-run stdout.
- Update README and generated runbook examples so documentation matches the machine-readable contract.
- Record P7.35 in the main memory/agent orchestrator design document.

## TDD Evidence

1. RED: LoRA dataset, AIRI dry-run, and external script tests failed because `post_training_checklist_exists` was expected but missing from config, dry-run report, and script stdout.
2. GREEN: Exporter, AIRI validator, script constant, script stdout, README, and runbook example now use the same check list.

## Safety Notes

- This phase does not add new sample-content exposure.
- The dry-run success report remains a compact machine-readable contract with check ids and counts only.
