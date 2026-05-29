# Memory Conflict Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users resolve one imported memory conflict directly from the Memory settings page.

**Architecture:** Reuse existing memory update RPCs. The renderer store adds focused conflict actions, and the settings page renders buttons inside each conflict card when the candidate is still `needs_review`.

**Tech Stack:** Pinia, Vue 3, Eventa RPC, TypeScript, Vitest, UnoCSS, i18n YAML.

---

## Task 1: Store Conflict Actions

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [x] Add failing store tests for rejecting a candidate and keeping a candidate while archiving the related memory.
- [x] Implement `rejectMemory` and `keepMemoryAndArchiveRelated`.
- [x] Verify renderer store tests.

## Task 2: Memory Settings UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/*/settings.yaml`

- [x] Render per-conflict action buttons for `needs_review` candidates.
- [x] Add locale labels for all settings locale files.

## Task 3: Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] Document single-conflict resolution behavior.
- [x] Run targeted tests, typecheck, lint, and diff checks.
