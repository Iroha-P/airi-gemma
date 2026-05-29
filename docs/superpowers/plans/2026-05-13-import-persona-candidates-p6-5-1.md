# P6.5.1 Import Persona Candidates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn imported chat records and local knowledge notes into reviewable persona candidates, so AIRI can learn user background, preferences, habits, boundaries, and project context without putting raw imports directly into the active profile.

**Architecture:** Extend the deterministic memory ingestion pipeline. Imported raw entries remain unchanged; when an imported entry contains first-person/profile-like signals, the pipeline creates one additional `needs_review` candidate memory with `metadata.personaCandidate`. The candidate is never active by default and still passes the existing safety scanner and conflict detector.

**Tech Stack:** TypeScript, Electron main memory service, Vitest.

---

## Scope

- Add deterministic persona candidate extraction for `import_wechat`, `import_lark`, `import_qq`, and `knowledge_base`.
- Classify candidates into `profile`, `preference`, `habit`, or `project` using conservative keyword signals.
- Tag candidates with `persona-candidate` and keep them `needs_review`.
- Preserve privacy defaults from the original import; never downgrade privacy.
- Keep unsafe candidates secret/review-only through the existing safety scanner.
- Document that imported persona shaping remains review-first.

## Tasks

- [x] Add failing ingestion tests for persona candidate extraction.
- [x] Implement deterministic candidate derivation in the ingestion pipeline.
- [x] Keep unrelated chat lines from producing candidates.
- [x] Update architecture documentation.
- [x] Run targeted tests, typecheck, small-scope lint, and diff check.
