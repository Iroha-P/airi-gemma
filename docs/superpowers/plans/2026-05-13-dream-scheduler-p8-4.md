# P8.4 Local Dream Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only configurable scheduler that can periodically start Local Dream Cycle without auto-approving memory, routine, or LoRA candidates.

**Architecture:** Extend the existing dream service with a small scheduler module that owns persisted schedule config, next-run calculation, and timer lifecycle. Eventa exposes get/apply/trigger-now schedule RPCs, and the renderer dream settings store/page controls the config.

**Tech Stack:** Electron main process, Eventa RPC, Valibot persisted config, Vue/Pinia renderer store, Vitest.

---

## Scope

- Add a persisted dream schedule config with `enabled`, `intervalHours`, `windowHours`, and `includeLoraCandidates`.
- Add a main-process scheduler that uses the existing `DreamManager.startLocalDream()` API.
- Add renderer store methods and Memory settings controls for schedule config.
- Do not auto-import dream report candidates. P8.3 review actions remain explicit human actions.
- Do not add cloud LLM calls.

## Tasks

- [x] Write failing tests for schedule normalization and timer behavior.
- [x] Implement the dream scheduler module.
- [x] Add Eventa shared types and RPC declarations.
- [x] Register schedule RPCs in the dream service.
- [x] Extend the renderer dream store with schedule get/apply/trigger actions.
- [x] Add Memory settings controls and i18n keys.
- [x] Update the architecture document with the P8.4 decision.
- [x] Run targeted tests, typecheck, lint, and code review.
