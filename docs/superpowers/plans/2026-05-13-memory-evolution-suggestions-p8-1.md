# Memory Evolution Suggestions P8.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Hermes-inspired local memory evolution preview that proposes safe review actions for stale, conflicting, duplicate, unsafe, and pending memories.

**Architecture:** Build a deterministic analyzer in Electron main that reads Memory DB items and returns suggestions only. Expose it through Eventa, store the preview in the Memory settings Pinia store, and add a compact Memory Evolution section to the existing Memory settings page. No suggestion is applied automatically.

**Tech Stack:** Electron main process, Eventa RPC, Vue 3, Pinia, TypeScript, Vitest, UnoCSS.

---

## Scope

- [x] Add a red test for deterministic memory evolution suggestion generation.
- [x] Add shared Eventa DTOs and invoke event for evolution preview.
- [x] Add Memory manager/service support and Eventa adapter tests.
- [x] Extend Memory settings store and tests.
- [x] Add a Memory Evolution section to the Memory settings page.
- [x] Add i18n strings for all root `settings.yaml` locale files.
- [x] Update the main design document to mark P8.1 as implemented.
- [x] Verify with targeted Vitest, stage-tamagotchi typecheck, lint fix, and diff whitespace check.

## Out of Scope

- Automatically applying merge/archive/reclassify actions.
- Calling a real LLM for reflection.
- Adding vector embeddings or GBrain.
- Writing back to Obsidian/LLMWiki.

## Acceptance

- Unsafe imported memories produce high-priority privacy tightening suggestions.
- Duplicate/conflict metadata produces high-priority merge or review suggestions.
- Plain `needs_review` memories produce medium-priority promotion suggestions.
- Low-importance stale active memories produce low-priority archive suggestions.
- UI clearly states this is a preview and does not modify Memory DB.

## Verification

- [x] Red test observed: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/evolution.test.ts` failed because `./evolution` did not exist.
- [x] `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/evolution.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts` - 3 files / 7 tests passed before UI.
- [x] `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/evolution.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts` - 4 files / 23 tests passed after review fixes.
- [x] `pnpm -F @proj-airi/stage-tamagotchi typecheck` - passed after adding the new manager method to tests.
- [x] `pnpm lint:fix` - passed with 0 warnings / 0 errors.
- [x] `git diff --check` - passed; only existing LF/CRLF normalization warnings were printed.

## Code Review Follow-Up

- [x] Subagent review found no critical issues.
- [x] Fixed duplicate suggestion IDs when one memory has multiple duplicate/conflict metadata entries.
- [x] Added regression coverage for unique suggestion IDs.
- [x] Cleared cached evolution preview after memory mutations so the UI does not show stale suggestions.
- [x] Added regression coverage for stale preview cache invalidation.
