# Memory Safety Scanner P2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Hermes-inspired safety scan before imported memories enter the review queue.

**Architecture:** A small deterministic scanner flags prompt-injection-like instructions, credential-looking strings, and invisible Unicode control characters. The ingestion pipeline preserves flagged entries for review, but forces them to `privacy: secret`, `status: needs_review`, and adds `safety-review` metadata/tags so they cannot enter RAG or exports by accident.

**Tech Stack:** TypeScript, Electron main memory service, Vitest.

---

## Task 1: Scanner Unit

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/memory/safety.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/memory/safety.test.ts`

- [ ] Write failing tests for prompt injection, credential-like content, invisible Unicode, and safe content.
- [ ] Implement `scanMemorySafety(content)`.
- [ ] Run scanner tests until green.

## Task 2: Ingestion Integration

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/ingestion.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/memory/ingestion.test.ts`

- [ ] Write failing ingestion test for flagged import content.
- [ ] Force flagged entries to `privacy: secret`, `status: needs_review`, and add `safety-review`.
- [ ] Attach safety findings into metadata.
- [ ] Run ingestion tests until green.

## Task 3: Documentation + Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [ ] Document that the first Hermes-inspired safety gate is implemented.
- [ ] Run focused memory tests, typecheck, lint, and diff check.
