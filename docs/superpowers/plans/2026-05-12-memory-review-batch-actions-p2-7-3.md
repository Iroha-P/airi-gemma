# Memory Review Batch Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make imported and restored `needs_review` memories easier to process in batches.

**Architecture:** Reuse the existing `electronMemoryUpdate` path and add renderer store helpers for approving, rejecting, or archiving a list of memory ids. The Memory settings page exposes these actions for the current filtered pending set.

**Tech Stack:** Pinia, Vue 3, Eventa RPC, TypeScript, Vitest, UnoCSS, i18n YAML.

---

## Task 1: Store Batch Actions

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [x] Add failing store tests for batch reject and archive.
- [x] Implement reusable batch status helper.
- [x] Verify renderer store tests.

## Task 2: Memory Settings UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/*/settings.yaml`

- [x] Add filtered pending reject/archive buttons.
- [x] Add locale labels for all settings locale files.

## Task 3: Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] Document batch review behavior.
- [x] Run targeted tests, typecheck, lint, and diff checks.
