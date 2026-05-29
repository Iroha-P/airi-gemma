# P8.50 Obsidian Vault Index And Log

## Goal

Add generated `index.md` and `log.md` files to AIRI-Brain / Obsidian vault exports, turning the vault into a more navigable LLMWiki artifact.

## Constraints

- Do not change memory eligibility, privacy filtering, page grouping, or import behavior.
- Keep Memory DB as the source of truth.
- Do not expose secret memories, raw chat metadata, or absolute paths in generated navigation files.
- Keep generated index/log deterministic for tests.

## Plan

1. Add `index.md` and `log.md` formatters to the Obsidian vault exporter.
2. Record the new files in export results and `.airi/manifest.json`.
3. Update Obsidian vault export tests.
4. Update architecture docs with the implemented index/log export.
5. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest Obsidian vault export and memory service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched service, test, and doc files.
- Passed `git diff --check`.
- Passed trailing whitespace scan.

## Result

Obsidian-compatible AIRI-Brain exports now include generated `index.md` and `log.md` files. Both files are recorded in the export result and `.airi/manifest.json`, improving LLMWiki navigation without changing memory eligibility, privacy filtering, page grouping, or import behavior.
