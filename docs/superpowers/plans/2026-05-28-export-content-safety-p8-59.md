# P8.59 Export Content Safety

## Goal

Prevent public-profile and LoRA export paths from leaking unsafe memory content even when a memory already has export visibility metadata.

## Scope

- Extend memory safety scanning to flag local filesystem paths.
- Add an `unsafe_content` preflight reason for export surfaces.
- Block all unsafe content from public-profile exports.
- Block high-severity unsafe content from LoRA exports while keeping local-path-only LoRA candidates in the quality-review lane.
- Add focused regression coverage for safety scanning, export preflight, public profile export, LoRA export, ingestion, and agent reflection.

## Verification

- Run focused Vitest suites for safety, preflight, public profile, LoRA dataset, ingestion, and agent orchestrator.
- Run stage-tamagotchi typecheck.
- Run lint/fix and whitespace checks.
