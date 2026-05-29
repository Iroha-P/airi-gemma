# P8.51 Obsidian Export Navigation Files UI

## Goal

Expose generated AIRI-Brain navigation files in the Memory settings Obsidian export result panel, so users can immediately find `index.md` and `log.md` after export.

## Constraints

- Do not change Obsidian vault export format, memory eligibility, or import behavior.
- Keep the panel read-only.
- Display file paths only from the export result; do not read file contents.
- Keep UI text localized.

## Plan

1. Add computed navigation file extraction for `index.md` and `log.md`.
2. Render a localized navigation files section in the Obsidian export result panel.
3. Add static UI regression coverage.
4. Update the architecture/design document.
5. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest Obsidian export navigation/result UI and Obsidian vault export tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Memory settings now shows generated Obsidian/AIRI-Brain `index.md` and `log.md` files in the Obsidian export result panel. The UI displays only export result metadata and paths, without reading file contents or changing vault export/import behavior.
