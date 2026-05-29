# P7.40 LoRA Training Config Artifacts

## Goal

Make exported LoRA training packages declare package-local handoff documents in `lora-training-config.json` so Orchestrator code can read artifact paths without parsing Markdown.

## Scope

- Add `artifacts.trainingRunbookPath`.
- Add `artifacts.postTrainingChecklistPath`.
- Update AIRI dry-run config shape to require these paths.
- Add an `artifact_paths_are_safe_relative` dry-run check.
- Use `artifacts.postTrainingChecklistPath` for `post_training_checklist_exists`.
- Record P7.40 in the main memory/agent orchestrator design document.

## TDD Evidence

1. RED: `lora-dataset.test.ts` failed because the exported config did not include `artifacts`.
2. RED: `lora-training-dry-run.test.ts` failed because AIRI dry-run did not report `artifact_paths_are_safe_relative`.
3. RED: a package whose artifact path escaped the export directory was not rejected.
4. GREEN: Exporter writes the artifact paths and AIRI dry-run validates them.

## Safety Notes

- Artifact paths are checked with the same relative-path boundary rule as dataset paths.
- The dry-run report still exposes only paths/check status/counts, never sample text.
