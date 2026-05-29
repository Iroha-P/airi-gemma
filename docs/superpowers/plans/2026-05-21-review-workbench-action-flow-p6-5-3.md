# P6.5.3 Review Workbench Action Flow Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Memory Review Workbench suggestions become actionable UI controls, especially for imported persona candidates.

**Architecture:** Add a renderer-store action dispatcher that maps review actions to existing Memory update flows. The UI renders recommended actions as buttons. `edit` only loads the memory into the edit form; `approve`, `reject`, and `archive` change status explicitly. No persona candidate becomes active without user action.

**Tech Stack:** Vue 3, Pinia, TypeScript, Eventa memory APIs, Vitest.

---

## Scope

- Add a store-level `applyReviewWorkbenchAction()` for explicit review actions.
- Support `approve`, `reject`, and `archive` status transitions.
- Keep `edit` as UI-only form loading, not an automatic save.
- Render Review Workbench recommended actions as buttons.
- Document the P6.5.3 status flow.

## Tasks

- [x] Add failing settings store tests for review workbench approve/reject/archive actions.
- [x] Implement store dispatcher.
- [x] Add Review Workbench action buttons in the settings UI.
- [x] Add edit-form loading for review entries.
- [x] Update architecture documentation.
- [x] Run targeted tests, typecheck, small-scope lint, and diff check.
