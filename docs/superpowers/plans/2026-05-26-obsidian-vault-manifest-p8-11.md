# P8.11 Obsidian Vault Manifest

## Goal

Export a machine-readable AIRI-Brain vault manifest so future migration, re-import checks, and Obsidian-inspired workspace features can inspect vault structure without parsing Markdown bodies.

## Constraints

- Do not write memory content, raw chat text, absolute local paths, or secret metadata into the manifest.
- Do not introduce automatic Obsidian write-back or bidirectional sync.
- Keep Memory DB as the source of truth.
- Keep the manifest deterministic and lightweight.

## Plan

1. Add a regression test that expects `.airi/manifest.json` in the exported vault.
2. Include schema version, exported timestamp, source-of-truth marker, section/file counts, and privacy policy flags.
3. Ensure the manifest avoids secret content and absolute output paths.
4. Update the architecture document with the P8.11 behavior.

## Verification

- `.\node_modules\.bin\vitest.CMD run apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-vault-manifest-p8-11.md`
- `git diff --check -- apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-vault-manifest-p8-11.md`
- `rg -n "[ \t]+$" apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.ts apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md docs/superpowers/plans/2026-05-26-obsidian-vault-manifest-p8-11.md`
