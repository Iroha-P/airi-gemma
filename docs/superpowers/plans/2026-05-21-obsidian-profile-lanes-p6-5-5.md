# P6.5.5 Obsidian Profile Lanes Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AIRI-Brain / Obsidian exports separate private profile, pending persona candidates, and public-safe profile previews.

**Architecture:** Keep Memory DB as source of truth. The Obsidian exporter emits additional Markdown pages:
- `00-inbox/persona-candidates.md` for non-secret `needs_review` persona candidates.
- `80-public-profile/public-profile-preview.md` for active, non-sensitive memories explicitly marked `metadata.profileVisibility = demo | training_sanitized`.
The existing `10-profile/user-profile.md` remains the private active profile lane.

**Tech Stack:** TypeScript, Electron main memory exporters, Vitest.

---

## Scope

- Export pending persona candidates into an inbox page.
- Export public-safe profile previews into a separate public profile lane.
- Keep secret memories out of all Obsidian pages.
- Keep raw chat imports out of public profile preview.
- Update main architecture documentation.

## Tasks

- [x] Add failing Obsidian exporter test for profile lanes.
- [x] Implement pending persona candidate page.
- [x] Implement public profile preview page.
- [x] Update AIRI-Brain index links.
- [x] Update architecture documentation.
- [x] Run targeted tests, typecheck, small-scope lint, and diff check.
