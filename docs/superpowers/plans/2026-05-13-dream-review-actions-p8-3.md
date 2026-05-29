# P8.3 Dream Review Actions Plan

## Goal

Connect Local Dream Cycle report outputs to existing reviewable AIRI workflows without auto-approving memory or training data.

## Safety Rules

- Dream memory candidates must enter Memory DB as `needs_review`.
- Dream LoRA candidates must enter Memory DB as `needs_review` with sanitized training metadata, and only become exportable after human approval changes them to `active`.
- Dream routine candidates may be saved into the Routine Library because they are operational drafts, not private user facts.
- No cloud LLM calls are added in this phase.

## Tasks

- [x] Add failing store tests for importing dream memory candidates to review.
- [x] Add failing store tests for saving dream routine candidates.
- [x] Add failing store tests for queuing dream LoRA dataset candidates to review.
- [x] Implement the minimal renderer store actions.
- [x] Add Memory settings page buttons for the three review actions.
- [x] Add i18n labels for the buttons and empty/no-report helper copy.
- [x] Update the architecture document with the P8.3 decision.
- [x] Run targeted tests, typecheck, and lint.

## Verification

- `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/dream.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm lint:fix`
