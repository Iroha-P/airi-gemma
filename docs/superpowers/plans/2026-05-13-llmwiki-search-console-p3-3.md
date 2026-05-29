# LLMWiki Search Console P3.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small renderer-side LLMWiki search console so users can manually verify what the local Markdown knowledge layer returns for a query.

**Architecture:** Reuse the existing Electron main-process `electronMemorySearchLlmWiki` RPC. Extend the Memory settings Pinia store with search state and expose a compact UI section in the Memory settings page.

**Tech Stack:** Vue 3, Pinia, TypeScript, Eventa invoke RPC, Vitest, UnoCSS, existing `@proj-airi/ui` primitives.

---

## Scope

- [x] Extend Memory settings store with LLMWiki search state and method.
- [x] Cover the store behavior with Vitest before implementation.
- [x] Add an LLMWiki Search section to `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`.
- [x] Add i18n strings for all root `settings.yaml` locale files.
- [x] Update the design document to mark P3.3 as implemented.
- [x] Verify with targeted Vitest, stage-tamagotchi typecheck, lint fix, and diff whitespace check.

## Verification

- `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/llmwiki.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/index.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`
  - Result: 5 files passed, 23 tests passed.
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
  - Result: passed.
- `pnpm lint:fix`
  - Result: 0 warnings, 0 errors.
- `git diff --check`
  - Result: exit 0. Git only reported existing LF/CRLF normalization warnings.

## Out of Scope

- Vector search.
- Editing LLMWiki files from the UI.
- Cloud-safe public LLMWiki generation.
- Replacing the existing Agent RAG composer.

## Acceptance

- User can enter a query and optional limit.
- Store calls `electronMemorySearchLlmWiki` and stores the returned result.
- UI shows input directory, snippet relative path, score, and text.
- Empty query is rejected before invoking main process.
