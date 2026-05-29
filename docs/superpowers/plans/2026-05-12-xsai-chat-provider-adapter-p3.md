# xsAI Chat Provider Adapter P3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first real text-generation adapter that connects the memory-aware chat runtime to OpenAI-compatible local or API endpoints through `@xsai/generate-text`.

**Architecture:** Keep the adapter provider-agnostic at the AIRI layer and OpenAI-compatible at the transport layer. The adapter accepts explicit `baseURL`, optional `apiKey`, explicit `model`, optional headers, and the provider-neutral messages produced by `createMemoryAwareChatRuntime()`. It returns plain text for the runtime and does not decide memory privacy; privacy stays in the runtime and orchestrator layers.

**Tech Stack:** TypeScript, Electron main process service modules, `@xsai/generate-text`, Vitest.

---

## Task 1: Adapter Unit

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/xsai-openai-compatible.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/xsai-openai-compatible.test.ts`

- [x] Write a failing test that the adapter passes `baseURL`, `apiKey`, `model`, headers, and messages to `@xsai/generate-text`.
- [x] Write a failing test that trims and normalizes `baseURL` with a trailing slash.
- [x] Write a failing test that missing `baseURL` or `model` throws a clear configuration error before remote calls.
- [x] Write a failing test that an empty provider text result throws a clear error.
- [x] Write a failing test that `apiKey` plus an `Authorization` header is rejected as ambiguous credentials.
- [x] Write a failing regression test that injected `chatRuntime` requires explicit `chatTarget` at runtime.
- [x] Implement `createXsaiOpenAICompatibleChatGenerateText()`.
- [x] Run adapter tests until green.

## Task 2: Runtime Wiring Test

**Files:**
- Modify: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/memory-aware.test.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/chat-runtime/xsai-openai-compatible.test.ts`

- [x] Add a test showing the adapter function can be passed into `createMemoryAwareChatRuntime()`.
- [x] Verify local target still includes compact profile and context before reaching the adapter.
- [x] Verify cloud target still withholds non-public context before reaching the adapter.

## Task 3: Documentation + Verification

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-12-xsai-chat-provider-adapter-p3.md`

- [x] Document the adapter boundary and provider examples: Ollama/LM Studio/vLLM/OpenAI-compatible API.
- [ ] Run focused tests, typecheck, lint, and diff check.
- [x] Request independent code review and fix Critical/Important findings.
