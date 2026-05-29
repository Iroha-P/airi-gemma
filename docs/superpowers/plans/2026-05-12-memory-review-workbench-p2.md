# Memory Review Workbench P2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first Hermes-inspired MemoryReviewWorkbench snapshot API so AIRI can explain which memories need user review and why.

**Architecture:** The workbench is read-only in v1. It inspects Memory DB items and produces a deterministic queue grouped by review reason: pending candidate, conflict, safety risk, and stale active memory. Existing MemoryAction APIs remain responsible for mutations.

**Tech Stack:** TypeScript, Electron main memory service, Eventa IPC, Pinia settings store, Vitest.

---

## Task 1: Workbench Unit

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/review-workbench.test.ts`

- [ ] Write a failing test that converts memories with `needs_review`, `metadata.conflicts`, `metadata.safety`, and stale active timestamps into review entries.
- [ ] Implement `createMemoryReviewWorkbenchSnapshot()`.
- [ ] Run the test until green.

## Task 2: Eventa + Manager Integration

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

- [ ] Write a failing adapter test for `electronMemoryGetReviewWorkbench`.
- [ ] Expose `getReviewWorkbench()` from `createMemoryManager()`.
- [ ] Register the Eventa handler.
- [ ] Run focused tests until green.

## Task 3: Settings Store Hook

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [ ] Write a failing store test for `store.refreshReviewWorkbench()`.
- [ ] Add `reviewWorkbench` state and refresh method.
- [ ] Run the store test until green.

## Task 4: Documentation + Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/ai/hermes-memory-system-reference.zh-CN.md`

- [ ] Document Workbench v1 boundaries.
- [ ] Run focused tests, typecheck, lint, and diff check.
