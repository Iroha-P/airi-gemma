# Obsidian Vault Export P2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first AIRI-Brain / Obsidian vault export path that writes reviewed local memories into human-readable Markdown pages.

**Architecture:** The Electron main memory service will expose a new `exportObsidianVault` operation next to existing LLMWiki, backup, public profile, and LoRA exports. The exporter writes an Obsidian-friendly vault root with an index page and stable category pages, while keeping the Memory DB as the source of truth.

**Tech Stack:** TypeScript, Electron main process, Eventa IPC, Pinia settings store, Vue settings page, Vitest.

---

## Task 1: Main-Process Exporter

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`

- [ ] **Step 1: Write the failing exporter test**

Test that active non-secret memories are exported into an index and category pages, while `secret` and non-active memories are skipped.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`

Expected: FAIL because `./obsidian-vault` does not exist.

- [ ] **Step 3: Implement minimal exporter**

Create `exportMemoryObsidianVault()` with deterministic pages:
- `AIRI-Brain.md`
- `10-profile/user-profile.md`
- `20-boundaries/user-boundaries.md`
- `30-projects/airi-gemma.md`
- `40-knowledge/knowledge-base.md`
- `50-memories/memories.md`

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`

Expected: PASS.

## Task 2: Eventa + Manager Integration

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

- [ ] **Step 1: Write failing manager/Eventa test**

Assert `createMemoryManager().exportObsidianVault()` writes the vault into the configured or default `airi-brain` root.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

Expected: FAIL because `exportObsidianVault` is not exposed.

- [ ] **Step 3: Add Eventa contract and manager method**

Add `ElectronMemoryExportObsidianVaultRequest`, `ElectronMemoryExportObsidianVaultResult`, `electronMemoryExportObsidianVault`, and a service handler.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`

Expected: PASS.

## Task 3: Settings Store + UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/*/settings.yaml`

- [ ] **Step 1: Write failing store test**

Assert `store.exportObsidianVault()` invokes the new Eventa call and reports the output directory.

- [ ] **Step 2: Run the store test and verify RED**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

Expected: FAIL because the store method does not exist.

- [ ] **Step 3: Implement store/UI/i18n**

Add a settings button near LLMWiki export and a localized `export-obsidian-vault` action label.

- [ ] **Step 4: Run the store test and verify GREEN**

Run: `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

Expected: PASS.

## Task 4: Documentation + Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [ ] **Step 1: Document P2 implemented boundary**

Record that Obsidian/AIRI-Brain export v1 writes a local vault view but does not yet do bidirectional sync.

- [ ] **Step 2: Run focused verification**

Run:
`pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [ ] **Step 3: Run project verification**

Run:
`pnpm -F @proj-airi/stage-tamagotchi typecheck`

Run:
`pnpm lint:fix`

Run:
`git diff --check`
