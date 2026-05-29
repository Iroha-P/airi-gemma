# P2.6 Obsidian-inspired Memory Workspace Plan

## Goal

Record the updated product/frontend direction for AIRI memory management: keep AIRI's built-in console as the safety and automation layer, while making the human-facing memory workspace compatible with and inspired by Obsidian.

## Decisions

- Memory DB remains the source of truth.
- AIRI built-in Memory Console handles imports, review queues, privacy gates, LoRA candidate export, Computer Use permissions, dream tasks, and auditability.
- Obsidian-compatible AIRI-Brain vault is the human-readable layer: Markdown, YAML frontmatter, tags, backlinks, timeline pages, and Graph View.
- Local `Obsidian.exe` is optional. AIRI should export a standard vault folder that can be opened by Obsidian, edited manually, backed up, or moved to another computer.
- Markdown edits must not silently overwrite Memory DB. Re-imported Markdown becomes `manual_override` or `import_candidate`, then enters `needs_review`.
- Future AIRI UI should borrow Obsidian's information architecture: left navigation tree, central Markdown/memory editor, right evidence/backlink/status panel.

## Non-goals

- No automatic bidirectional sync in this phase.
- No Obsidian plugin dependency.
- No direct dependency on a running Obsidian process.
- No Graph editor implementation yet.
- No UI beauty pass yet; this phase only locks the product architecture.

## Documentation Updates

- Update `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md` with the two-layer frontend model and P2.6 roadmap.
- Update `docs/ai/airi-local-life-memory-design.zh-CN.md` with the Memory Workspace product shape.
- Update `docs/ai/README.md` so future work points to the new frontend management direction.

## Verification

- Run Markdown/text checks on the touched docs.
- Run `git diff --check`.
