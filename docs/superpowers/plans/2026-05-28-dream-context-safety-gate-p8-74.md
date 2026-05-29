# P8.74 Dream Context Safety Gate

## Goal

Prevent Local Gemma Dream Cycle prompts from receiving unsafe non-secret memories. Dream is local-only, but it still becomes an internal summarizer and possible LoRA candidate source, so it should share the same memory safety boundary as RAG, Obsidian, LLMWiki, backup restore, and repository writes.

## Changes

- Extend `ElectronDreamWithheldContext.reason` with `safety_risk`.
- Reuse `hasMemorySafetyRisk` in `collectDreamContext`.
- Withhold memories that contain local paths, credentials, prompt-injection markers, invisible Unicode, or persisted `metadata.safety.safe=false`.
- Localize Dream withheld reasons in the Memory settings UI.
- Add regression coverage for context collection, prompt exclusion, and UI/i18n wiring.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/dream/context.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/manager.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/dream-withheld-safety-ui.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `git diff --check`
