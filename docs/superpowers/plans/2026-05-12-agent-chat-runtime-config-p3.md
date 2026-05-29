# Agent Chat Runtime Config P3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the memory-aware chat runtime and xsAI OpenAI-compatible adapter into startup configuration while preserving the current deterministic fallback by default.

**Architecture:** Add a small persisted main-process config for Agent chat runtime. The config is disabled by default. When enabled, a pure resolver creates `createMemoryAwareChatRuntime({ generateText: createXsaiOpenAICompatibleChatGenerateText(...) })` and passes it plus explicit `chatTarget` into Agent Orchestrator. UI editing remains a later step; this stage only creates the safe startup boundary.

**Tech Stack:** TypeScript, Electron main process config persistence, Valibot, xsAI adapter, Vitest.

---

## Task 1: Pure Runtime Resolver

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts`

- [x] Write a failing test that disabled config returns no runtime.
- [x] Write a failing test that enabled local config creates a runtime and target `local`.
- [x] Write a failing test that enabled cloud config creates a runtime and target `cloud`.
- [x] Write a failing test that missing provider config throws a clear error.
- [x] Write a failing test that enabled config without explicit target throws.
- [x] Implement `resolveAgentChatRuntimeFromConfig()`.

## Task 2: Startup Wiring

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/index.ts`
- Modify: `apps/stage-tamagotchi/src/main/services/airi/agent/index.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/index.ts`

- [x] Write a failing test that `setupAgentOrchestrator()` passes resolved runtime and target into `createAgentOrchestrator()`.
- [x] Add `chatRuntimeConfig` to `setupAgentOrchestrator()` params.
- [x] Add `createAgentChatRuntimeConfig()` persisted config with disabled default.
- [x] Provide the config in main `injeca` startup and pass it to `setupAgentOrchestrator()`.
- [x] Fall back to deterministic responses and report an error when startup config is invalid.

## Task 3: Documentation + Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-12-agent-chat-runtime-config-p3.md`

- [x] Document default-disabled startup config and future UI step.
- [ ] Run focused tests, typecheck, lint, and diff check.
- [ ] Request independent code review and fix Critical/Important findings.
