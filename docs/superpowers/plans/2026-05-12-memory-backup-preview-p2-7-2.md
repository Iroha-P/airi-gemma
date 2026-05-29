# Memory Backup Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users preview a memory backup, see duplicate/conflict warnings, and restore only selected memories.

**Architecture:** Extend the JSON backup module with a preview reader and selected-id import filter. Wire it through Eventa and expose preview state in the memory settings store/page.

**Tech Stack:** Electron main process, Eventa RPC, TypeScript, Vitest, Pinia store, Vue settings UI, UnoCSS.

---

## Task 1: Backup Preview Core

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/backup.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/backup.test.ts`

- [x] Add failing tests for preview conflict summaries and selected-id import.
- [x] Implement preview reader and selected import filtering.
- [x] Verify backup tests.

## Task 2: Eventa And Manager

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

- [x] Add `electronMemoryPreviewBackup`.
- [x] Wire preview through `MemoryManager` using existing conflict detection.
- [x] Verify adapter tests.

## Task 3: Store And UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/*/settings.yaml`

- [x] Add backup preview state, selection toggles, and import-selected action.
- [x] Render a compact backup preview panel in Memory settings.
- [x] Add locale labels.
- [x] Verify renderer store tests.

## Task 4: Docs And Verification

**Files:**
- Modify: `docs/ai/MIGRATION.zh-CN.md`
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] Document preview and selected import behavior.
- [x] Run targeted tests, typecheck, lint, and diff checks.
