# Agent Chat Runtime Test Connection P3.1 Implementation Plan

> **For agentic workers:** Use Superpowers TDD and verification. Keep this stage scoped to a non-persistent probe API and settings-page wiring.

**Goal:** Let users test an Agent Chat Runtime config before relying on it for AIRI Agent runs.

**Architecture:** Add an Eventa invoke that accepts an `ElectronAgentChatRuntimeConfig`, validates it with the same schema/resolver as save, creates a temporary runtime, sends a small local/cloud-targeted probe request without memory context, and returns a success/failure result. The probe must not persist config and must not update the running orchestrator.

**Tech Stack:** TypeScript, Eventa, xsAI/OpenAI-compatible adapter, Pinia, Vue 3, Vitest, i18n.

---

## Task 1: Main-Process Probe API

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts`

- [x] **Step 1: Write failing tests**
  - Probe valid config and assert it returns `ok: true`.
  - Assert probe does not call config persistence or `onConfigApplied`.
  - Probe provider failure and assert it returns `ok: false` with an error message.

- [x] **Step 2: Implement API**
  - Add `ElectronAgentChatRuntimeTestResult`.
  - Add `electronAgentChatRuntimeTestConfig`.
  - Register Eventa handler.

## Task 2: Renderer Store and Settings UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/*/settings.yaml`

- [x] **Step 1: Write failing store test**
  - Assert `testAgentChatRuntimeConfig()` invokes the new Eventa call and returns/stores the result.

- [x] **Step 2: Implement UI**
  - Add a "Test connection" button next to save.
  - Show success/failure text from the latest probe result.

## Task 3: Verification

- [x] Run targeted Vitest tests.
- [x] Run `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- [x] Run `pnpm lint:fix`.
- [x] Run `git diff --check`.

Notes:
- Red checks failed for the intended missing behavior: no test-config Eventa definition/handler and no store method.
- Targeted tests and `stage-tamagotchi` typecheck passed before lint/final diff checks.
- Focused review found two P2 issues. Follow-up fixes added: disabled runtime configs cannot trigger a connection test from the UI, and provider probes time out after 15000ms instead of holding the settings page in a saving state indefinitely.
