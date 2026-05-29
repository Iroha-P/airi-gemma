# Routine Library P5.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small renderer-side Routine Library so users can draft, save, list, and delete reusable routines from the Memory settings page.

**Architecture:** Reuse the existing Electron main-process routine manager and Eventa RPC contract. Add a Pinia settings store in the renderer and a compact settings-page section that updates the Agent Console tool list after routine changes.

**Tech Stack:** Vue 3, Pinia, TypeScript, Eventa invoke RPC, Vitest, UnoCSS, existing `@proj-airi/ui` primitives.

---

## Scope

- [x] Add a renderer Pinia store for routine Eventa RPCs.
- [x] Cover the store with Vitest before implementation.
- [x] Add a Routine Library section to `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`.
- [x] Add i18n strings for all root `settings.yaml` locale files.
- [x] Update the design document to mark P5.1 as implemented.
- [x] Verify with targeted Vitest, stage-tamagotchi typecheck, lint fix, and diff whitespace check.

## Verification

- `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/routines.test.ts apps/stage-tamagotchi/src/main/services/airi/routines/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/agent.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
  - Result: 5 files passed, 28 tests passed.
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
  - Result: passed.
- `pnpm lint:fix`
  - Result: 0 warnings, 0 errors.
- `git diff --check`
  - Result: exit 0. Git only reported existing LF/CRLF normalization warnings.

## Out of Scope

- Executing routines.
- Rich routine editor.
- Separate settings route.
- Routine marketplace or import/export.

## Acceptance

- User can paste multiline task text and draft a routine.
- User can inspect generated title, slug, and steps before saving.
- User can save the draft as a local Markdown routine through existing Eventa RPC.
- User can list and delete saved routines.
- Agent Console tool metadata refreshes after routine save/delete so saved routines can appear as `routine.<slug>` tools.
