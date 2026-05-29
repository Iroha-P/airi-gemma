# Computer Use Safety Console P6.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a renderer-side Computer Use Safety console so users can inspect the preview-only policy, classify a proposed desktop action, and view audit entries.

**Architecture:** Reuse the existing Electron main-process Computer Use manager and Eventa RPC contract. Add a Pinia settings store and a compact Memory settings section; no real desktop action is executed in this phase.

**Tech Stack:** Vue 3, Pinia, TypeScript, Eventa invoke RPC, Vitest, UnoCSS, existing `@proj-airi/ui` primitives.

---

## Scope

- [x] Add a renderer Pinia store for computer-use Eventa RPCs.
- [x] Cover the store with Vitest before implementation.
- [x] Add a Computer Use Safety section to `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`.
- [x] Add i18n strings for all root `settings.yaml` locale files.
- [x] Update the design document to mark P6.2 as implemented.
- [x] Verify with targeted Vitest, stage-tamagotchi typecheck, lint fix, and diff whitespace check.

## Verification

- `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/computer-use.test.ts apps/stage-tamagotchi/src/main/services/airi/computer-use/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/agent.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/routines.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
  - Result: 6 files passed, 39 tests passed.
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
  - Result: passed.
- `pnpm lint:fix`
  - Result: 0 warnings, 0 errors.
- `git diff --check`
  - Result: exit 0. Git only reported existing LF/CRLF normalization warnings.

## Out of Scope

- Real mouse/keyboard/filesystem/shell/browser execution.
- Editing policy from the UI.
- Approval ledger.
- Streaming desktop observation.

## Acceptance

- User can refresh and inspect the current `preview_only` computer-use policy.
- User can submit an action preview request with kind, target, command, cwd, and reason.
- UI shows preview risk, decision, reasons, `requiresConfirmation`, and `canExecute`.
- UI lists recent audit entries from the existing audit RPC.
- Every preview remains non-executable in this phase.
