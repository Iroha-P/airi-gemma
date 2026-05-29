# Memory Aware Chat Runtime P3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first memory-aware chat runtime interface so Agent Orchestrator can call a real local/API model provider while preserving the current deterministic fallback.

**Architecture:** The runtime is provider-agnostic. It receives user input, compact profile, RAG context fragments, and target privacy mode, then builds a structured prompt for a supplied `generateText` function. Agent Orchestrator accepts the runtime optionally; when absent it keeps the existing response behavior. When a runtime is injected, the provider target must be explicit (`local` or `cloud`) so cloud/API calls cannot accidentally receive local compact profile data.

**Tech Stack:** TypeScript, Electron main process service modules, Eventa Agent Orchestrator, Vitest.

---

## Task 1: Runtime Unit

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/memory-aware.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/memory-aware.test.ts`

- [x] Write a failing test that verifies compact profile and memory/RAG fragments are included for local target.
- [x] Write a failing test that verifies cloud target withholds non-public fragments.
- [x] Add a regression test that `secret` fragments and default-local LLMWiki snippets are withheld from cloud prompts.
- [x] Add a prompt-injection boundary test that retrieved context is reference data, not instructions.
- [x] Implement `createMemoryAwareChatRuntime()`.
- [x] Run runtime tests until green.

## Task 2: Orchestrator Integration

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`

- [x] Write a failing test that an injected runtime produces the agent response.
- [x] Add optional `chatRuntime` dependency to `createAgentOrchestrator()`.
- [x] Require explicit `chatTarget` when a runtime is injected.
- [x] Pass input, context, compact profile, and local/cloud target into the runtime.
- [x] Store runtime `usedContextIds` / `withheldContextIds` on the agent run for auditability.
- [x] Store RAG-level withheld IDs on direct-answer runs even when no runtime is injected.
- [x] Skip default-local LLMWiki retrieval for cloud targets until a public-only LLMWiki index exists.
- [x] Skip memory retrieval, compact profile generation, and runtime calls for high-risk pending actions.
- [x] Keep existing fallback when no runtime is provided.

## Task 3: Documentation + Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`

- [x] Document Phase 3 first boundary.
- [ ] Run focused tests, typecheck, lint, and diff check.
