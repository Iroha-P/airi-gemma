# P6.3 Confirmed Computer Use Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow explicitly approved low/medium risk computer-use previews to execute safe read/open actions, while keeping mutating and command actions blocked.

**Architecture:** Execution is bound to an existing preview/audit entry by id. The main-process computer-use manager validates the stored preview, requires explicit approval, refuses high-risk kinds, executes only a small allowlist, and appends an execution result to the audit stream.

**Tech Stack:** Electron main process, Eventa RPC, Node fs/path utilities, Electron shell, Pinia renderer store, Vitest.

---

## Scope

- Execute only `read_file`, `search_files`, `open_url`, and `open_path`.
- Require `approved: true` and an existing preview id.
- Keep `write_file`, `delete_path`, `move_path`, `run_command`, and `observe_screen` non-executable.
- Return structured execution results for UI/audit.
- Do not add autonomous execution from Agent Orchestrator in this phase.

## Tasks

- [x] Add failing manager tests for approved read execution, high-risk denial, and missing approval.
- [x] Add shared Eventa request/result types and execute RPC.
- [x] Implement manager execution with safe filesystem/open helpers.
- [x] Register execute RPC in computer-use service.
- [x] Extend renderer computer-use store and settings page with execute button/result.
- [x] Update architecture docs and i18n labels.
- [x] Run targeted tests, typecheck, lint, and diff check.
