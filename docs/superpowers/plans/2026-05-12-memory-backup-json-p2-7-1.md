# Memory Backup JSON Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first safe memory backup and restore path for moving AIRI to a new Windows machine.

**Architecture:** Export memories from the repository into a versioned JSON backup file under `airi-brain/95-backups`. Import reads that JSON file and recreates memories as reviewed local records without overwriting the current database.

**Tech Stack:** Electron main process, Eventa RPC, TypeScript, Vitest, Pinia store, Vue settings UI, UnoCSS.

---

## Task 1: Backup Module

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/backup.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/backup.test.ts`

- [x] Write failing tests for exporting versioned JSON without access counters and importing records as `needs_review`.
- [x] Implement JSON serialization, validation, export, and import helpers.
- [x] Verify with `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/backup.test.ts`.

## Task 2: Main RPC Wiring

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

- [x] Add `electronMemoryExportBackup` and `electronMemoryImportBackup` Eventa contracts.
- [x] Add manager methods and handlers.
- [x] Verify index adapter tests.

## Task 3: Renderer Store And UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/*/settings.yaml`

- [x] Add store actions for export and import.
- [x] Add settings page buttons for backup export and backup import.
- [x] Add i18n labels in all existing settings locale files.
- [x] Verify renderer store tests.

## Task 4: Docs And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/ai/MIGRATION.zh-CN.md`

- [x] Document the JSON backup boundary and privacy warning.
- [x] Run targeted tests, `pnpm -F @proj-airi/stage-tamagotchi typecheck`, `pnpm lint:fix`, and `git diff --check`.
