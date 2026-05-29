# P8.6 Dream Candidate Review Reason

## Goal

Make local dream-generated candidates visible as their own review reason inside the Memory Review Workbench.

## Boundaries

- Do not auto-approve dream candidates.
- Do not change Memory DB persistence.
- Do not call cloud reviewers.
- Keep all dream outputs in the existing `needs_review` flow.

## TDD Notes

1. Add a regression test for a `sourceType: dream` memory with `metadata.requiresReview: true`.
2. Expect the review queue to include `dream_candidate` before `pending_candidate`.
3. Expect recommended actions to be `edit -> approve -> reject`.
4. Add the shared Eventa type and i18n labels so the renderer can display the reason safely.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-dream-candidate-review-reason-p8-6.md`
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-dream-candidate-review-reason-p8-6.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts apps/stage-tamagotchi/src/shared/eventa.ts packages/i18n/src/locales/en/settings.yaml packages/i18n/src/locales/zh-Hans/settings.yaml docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-25-dream-candidate-review-reason-p8-6.md`
