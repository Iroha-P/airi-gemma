# P6.5.2 Persona Candidate Review Workbench Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make imported persona candidates visible as a distinct review reason in Memory Review Workbench, so users can approve/edit/reject personality-shaping memories intentionally.

**Architecture:** Keep persona candidates as normal `ElectronMemoryItem` rows with `metadata.personaCandidate`. The review workbench derives a `persona_candidate` reason from metadata, keeps the item review-only, and recommends `edit -> approve -> reject` before it can enter active profile/RAG/LLMWiki.

**Tech Stack:** TypeScript, Electron main memory service, Eventa types, Vue settings i18n, Vitest.

---

## Scope

- Add `persona_candidate` to memory review reason types.
- Detect `metadata.personaCandidate` in `createMemoryReviewWorkbenchSnapshot()`.
- Prefer `edit`, then `approve`, then `reject` for persona candidates.
- Add i18n labels for review reason.
- Document the P6.5.2 boundary in the main design doc.

## Tasks

- [x] Add failing review-workbench test for persona candidates.
- [x] Implement persona candidate detection and action recommendation.
- [x] Update shared Eventa review reason type.
- [x] Add i18n labels.
- [x] Update architecture documentation.
- [x] Run targeted tests, typecheck, small-scope lint, and diff check.
