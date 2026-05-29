# P6.5.4 Review Action Derived Refresh Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a persona candidate is approved/rejected/archived from Review Workbench, refresh the derived memory views that show what AIRI would actually use.

**Architecture:** Store the latest compact profile result and latest RAG preview request/result in the Pinia memory settings store. Review Workbench actions update memory status, then refresh status, review workbench, compact profile, and any existing RAG preview. This keeps user-visible derived state aligned without automatically exporting to LLMWiki, Obsidian, or LoRA.

**Tech Stack:** Pinia, Vue 3, TypeScript, Eventa memory APIs, Vitest.

---

## Scope

- Persist `compactProfileResult` in the memory settings store.
- Remember the last RAG preview request.
- After `applyReviewWorkbenchAction()`, refresh:
  - memory status,
  - Review Workbench snapshot,
  - compact profile result,
  - current RAG preview if one exists.
- Do not auto-export LLMWiki, Obsidian, public profile, or LoRA data.

## Tasks

- [x] Add failing store test for derived refresh after review action.
- [x] Store compact profile and latest RAG preview request.
- [x] Refresh derived state after review action.
- [x] Update architecture documentation.
- [x] Run targeted tests, typecheck, small-scope lint, and diff check.
