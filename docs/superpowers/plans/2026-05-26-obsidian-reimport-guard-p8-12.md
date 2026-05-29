# P8.12 Obsidian Re-import Guard

## Goal

Avoid turning AIRI-generated Obsidian/AIRI-Brain Markdown views back into new knowledge-base memory candidates when the user imports an exported vault.

## Constraints

- Do not block normal user-authored Obsidian notes.
- Do not parse or trust generated Markdown content as a source of truth.
- Do not introduce automatic bidirectional sync.
- Keep Memory DB as the source of truth.

## Plan

1. Add a regression test with an AIRI-generated `AIRI-Brain.md` frontmatter block.
2. Detect `source: airi-memory-service` in Markdown frontmatter.
3. Skip generated files and return them in `skippedGeneratedFiles`.
4. Update the shared Eventa result type and architecture document.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.ts apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.test.ts apps/stage-tamagotchi/src/shared/eventa.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-reimport-guard-p8-12.md`
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.ts apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.test.ts apps/stage-tamagotchi/src/shared/eventa.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-reimport-guard-p8-12.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.ts apps/stage-tamagotchi/src/main/services/airi/memory/knowledge-base.test.ts apps/stage-tamagotchi/src/shared/eventa.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-reimport-guard-p8-12.md`
