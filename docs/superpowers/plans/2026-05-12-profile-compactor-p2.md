# Profile Compactor P2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first Hermes-inspired ProfileCompactor so AIRI can turn reviewed long-term memories into a stable, high-density local profile summary.

**Architecture:** The compactor is deterministic in v1: it groups active non-secret memories into profile, preferences, habits, boundaries, projects, and knowledge sections, sorts them by importance and recency, and returns Markdown plus structured metadata. The Memory DB remains the source of truth; the compact profile is a generated view for future prompt injection, Obsidian sync, and review workflows.

**Tech Stack:** TypeScript, Electron main memory service, Eventa IPC, Pinia settings store, Vitest.

---

## Task 1: Compactor Unit

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/profile-compactor.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/profile-compactor.test.ts`

- [ ] Write a failing test for grouping active memories, withholding secret/non-active memories, and producing stable Markdown.
- [ ] Implement `compactMemoryProfile()`.
- [ ] Run the test until green.

## Task 2: Eventa + Manager Integration

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts`

- [ ] Write a failing adapter test for `electronMemoryCompactProfile`.
- [ ] Expose `compactProfile()` from `createMemoryManager()`.
- [ ] Register the Eventa handler.
- [ ] Run focused tests until green.

## Task 3: Settings Store Hook

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts`
- Modify: `apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts`

- [ ] Write a failing store test for `store.compactProfile()`.
- [ ] Implement the store method and success toast.
- [ ] Run the store test until green.

## Task 4: Documentation + Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/ai/hermes-memory-system-reference.zh-CN.md`

- [ ] Document ProfileCompactor v1 boundaries.
- [ ] Run focused tests, typecheck, lint, and diff check.
