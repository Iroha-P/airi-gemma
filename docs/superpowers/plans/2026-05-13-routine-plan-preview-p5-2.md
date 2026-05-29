# P5.2 Routine Plan Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Agent Orchestrator recognize saved routine requests and return a reviewable routine step plan without executing desktop actions.

**Architecture:** Add a narrow routine intent parser to the Agent Orchestrator. When the user asks to preview/run a routine by slug or title, the orchestrator loads routines from the existing RoutineManager, returns a `tool_call` style plan response, and skips memory/RAG/chat-runtime execution.

**Tech Stack:** Electron main process, TypeScript, RoutineManager, Agent Orchestrator, Vitest.

---

## Scope

- Recognize `routine: <slug-or-title>`, `preview routine: <slug-or-title>`, and `run routine: <slug-or-title>`.
- Match saved routines by slug or title, case-insensitive.
- Return a numbered routine plan in the Agent response.
- Do not execute routine steps.
- Do not read memory/RAG for routine plan previews.
- Do not call Computer Use execution from this path.

## Tasks

- [x] Add failing Agent Orchestrator tests for routine plan preview.
- [x] Implement routine intent parsing and matching.
- [x] Return safe `tool_call` routine plan responses.
- [x] Update architecture docs.
- [x] Run targeted tests, typecheck, small-scope lint, and diff check.
