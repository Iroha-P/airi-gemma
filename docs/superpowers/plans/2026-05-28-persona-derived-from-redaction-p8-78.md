# P8.78 Persona Candidate Derived-From Redaction

## Goal

Avoid showing local import root paths in Review Workbench evidence rows. Persona candidates previously stored `metadata.personaCandidate.derivedFrom` from the full source id, which can include an absolute chat export or knowledge-base root directory.

## Changes

- Store only the imported entry `externalId` in `personaCandidate.derivedFrom`.
- Keep the original memory `sourceId` unchanged for internal traceability.
- Update ingestion regression coverage and the architecture plan.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/ingestion.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `git diff --check`
