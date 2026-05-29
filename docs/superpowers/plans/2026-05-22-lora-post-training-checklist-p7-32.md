# P7.32 LoRA Post-Training Checklist

## Goal

Make each exported LoRA training package more self-contained by adding a package-local post-training checklist. The checklist should tell the trainer what to preserve after QLoRA finishes: model card evidence, deployment checks, schema evidence, public-safe review, and AIRI runtime wiring.

## Scope

- Add a generated `lora-post-training-checklist.zh-CN.md` file to `exportLoraDatasetCandidates`.
- Include the file in `LoraDatasetCandidateExportResult.files`.
- Keep the checklist free of sample body text, raw chat content, local paths, and blocked memory content.
- Record P7.32 in `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`.

## TDD Evidence

1. RED: `vitest run apps/stage-tamagotchi/src/main/services/airi/memory/lora-dataset.test.ts` failed because `result.files` did not include `lora-post-training-checklist.zh-CN.md`.
2. GREEN: Add the generated checklist and write it beside the existing JSONL/config/runbook outputs.
3. VERIFY: Run focused exporter tests, related LoRA dry-run/template tests, stage-tamagotchi typecheck, targeted lint fix, and `git diff --check`.

## Checklist Content Contract

- References `MODEL_CARD_TEMPLATE.zh-CN.md` and `DEPLOYMENT.zh-CN.md`.
- Records `recordSchemaVersion`, per-record `schemaVersion`, `jsonl_records_parseable`, and `record_schema_matches_config`.
- Mentions `agent-chat-runtime-config.json` as the AIRI runtime integration point.
- Requires `public-safe` review before publishing.
