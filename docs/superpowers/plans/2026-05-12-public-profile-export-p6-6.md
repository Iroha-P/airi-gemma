# Public Profile Export P6.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only public profile exporter that produces a sanitized demo/training profile from explicitly approved memories.

**Architecture:** The exporter lives in Electron main process beside Memory Service exporters. It only reads active memories, filters by explicit `metadata.profileVisibility`, rejects sensitive/private import sources, and writes Markdown/JSON into an `airi-brain/80-public-profile` folder. Renderer exposes one settings action for manual export.

**Tech Stack:** Electron main process, Eventa RPC, Pinia store, Vue settings page, Vitest, TypeScript.

---

## File Structure

- Create `apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.ts`
  - Filters memories eligible for public demo/training export.
  - Writes `public-profile.md` and `public-profile.json`.
- Create `apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.test.ts`
  - Verifies explicit visibility, privacy/source exclusions, and no metadata leakage.
- Modify `apps/stage-tamagotchi/src/shared/eventa.ts`
  - Add request/result types and `electronMemoryExportPublicProfile`.
- Modify `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
  - Wire manager and Eventa handler.
- Modify `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`
  - Verify RPC delegates to manager.
- Modify `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
  - Add store action and toast.
- Modify `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
  - Verify store action invokes RPC.
- Modify `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
  - Add export button.
- Modify `packages/i18n/src/locales/*/settings.yaml`
  - Add button label.
- Modify `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
  - Mark P6.6 first version behavior.

## Task 1: Main Exporter

- [ ] Write failing test in `public-profile.test.ts`:
  - create active memories with `metadata.profileVisibility: 'demo'` and `'training_sanitized'`;
  - include excluded memories with `privacy: 'sensitive'`, `privacy: 'secret'`, no visibility, `sourceType: 'import_wechat'`;
  - assert only eligible content appears in Markdown/JSON.
- [ ] Run `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/public-profile.test.ts`; expect missing module failure.
- [ ] Implement `exportPublicProfile`.
- [ ] Re-run the test; expect pass.

## Task 2: Eventa RPC

- [ ] Add `ElectronMemoryExportPublicProfileRequest/Result` and `electronMemoryExportPublicProfile`.
- [ ] Update `memory/index.test.ts` with expected RPC delegation.
- [ ] Run `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`; expect pass after wiring.
- [ ] Wire manager and Eventa handler in `memory/index.ts`.

## Task 3: Renderer Store and UI

- [ ] Update store test to expect `exportPublicProfile` invoke.
- [ ] Add store action.
- [ ] Add Memory settings button with existing compact tool-row styling.
- [ ] Add i18n labels.
- [ ] Run `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`.

## Task 4: Verification

- [ ] Run targeted memory tests.
- [ ] Run `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- [ ] Run `pnpm lint:fix`.
- [ ] Run `git diff --check`.
