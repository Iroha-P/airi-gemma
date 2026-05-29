# RAG Context Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make P3 RAG injection explicit, tested, and reusable by Agent Orchestrator or future chat runtime integration.

**Architecture:** Extract context composition into a dedicated memory service module. It retrieves active memories and LLMWiki snippets, applies privacy rules for local/cloud targets, and returns context fragments plus withheld-memory audit records.

**Tech Stack:** TypeScript, Vitest, Eventa shared types, existing MemoryManager list/search APIs.

---

## Task 1: Composer Core

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.ts`
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.test.ts`

- [x] Add failing tests for local privacy filtering, cloud privacy filtering, and LLMWiki snippet inclusion.
- [x] Implement `composeMemoryRagContext`.
- [x] Verify composer tests.

## Task 2: Orchestrator Integration

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`

- [x] Replace inline context collection with the composer.
- [x] Ensure orchestrator tests still pass.

## Task 3: Docs And Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] Document P3 implemented boundary.
- [x] Run targeted tests, typecheck, lint, and diff checks.
