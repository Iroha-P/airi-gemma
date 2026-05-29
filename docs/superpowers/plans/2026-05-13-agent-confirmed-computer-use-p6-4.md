# P6.4 Agent Confirmed Computer Use Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Agent Orchestrator route safe read/open computer-use intents through preview -> user confirmation -> approved execution.

**Architecture:** Extend Agent Orchestrator intent parsing with a safe computer-use allowlist. Safe intents create a pending action with a Computer Use preview id; approving the pending action calls the existing `ComputerUseManager.executeAction()`. High-risk command/delete/write/move flows remain confirmation-only and non-executing.

**Tech Stack:** Electron main process, TypeScript, Agent Orchestrator, ComputerUseManager, Vitest.

---

## Scope

- Recognize `read file:`, `search files:`, `open url:`, and `open path:` intents.
- Create pending confirmation actions with a stored preview id.
- On approval, execute the stored preview through `ComputerUseManager.executeAction({ approved: true, id })`.
- Keep `run command:` and delete/remove intents non-executing.
- Do not add autonomous execution without confirmation.

## Tasks

- [x] Add failing Agent Orchestrator tests for safe computer-use confirmation execution.
- [x] Implement safe computer-use intent parsing and preview creation.
- [x] Execute safe preview ids from `confirmAction`.
- [x] Keep high-risk confirmations non-executing.
- [x] Update architecture docs.
- [x] Run targeted tests, typecheck, small-scope lint, and diff check.
