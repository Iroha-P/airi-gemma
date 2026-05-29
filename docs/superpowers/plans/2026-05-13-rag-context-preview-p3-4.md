# RAG Context Preview P3.4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a RAG Context Preview so users can inspect which memory and LLMWiki fragments would be sent or withheld for a local/cloud target.

**Architecture:** Reuse the existing `composeMemoryRagContext` function in Electron main. Add a typed Eventa RPC, expose it through the Memory settings store, and render a compact preview section in Memory settings.

**Tech Stack:** Electron main process, Eventa RPC, Vue 3, Pinia, TypeScript, Vitest, UnoCSS.

---

## Scope

- [x] Add shared Eventa DTOs and invoke event for RAG context preview.
- [x] Add Memory manager/service support and tests.
- [x] Extend Memory settings store and tests.
- [x] Add a RAG Context Preview section to the Memory settings page.
- [x] Add i18n strings for all root `settings.yaml` locale files.
- [x] Update the design document to mark P3.4 as implemented.
- [x] Verify with targeted Vitest, stage-tamagotchi typecheck, lint fix, and diff whitespace check.

## Out of Scope

- Changing RAG ranking.
- Embeddings/vector search.
- Prompt rendering.
- Sending anything to a real LLM.

## Acceptance

- User can enter query, target, memory limit, and LLMWiki limit.
- Local target preview includes eligible local memory and LLMWiki fragments.
- Cloud target preview withholds non-public memory and does not include default-local LLMWiki.
- UI shows fragments and withheld context with reasons.

## Verification

- [x] `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/llmwiki.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts` - 5 files / 23 tests passed.
- [x] `pnpm -F @proj-airi/stage-tamagotchi typecheck` - passed.
- [x] `pnpm lint:fix` - passed with 0 warnings / 0 errors.
- [x] `git diff --check` - passed; only existing LF/CRLF normalization warnings were printed.
