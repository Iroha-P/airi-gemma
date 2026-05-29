# P8.53 LLMWiki Export Navigation Files UI

## Goal

Expose generated LLMWiki `index.md` and `log.md` files in the Memory settings LLMWiki export result panel, and keep the displayed memory total based on content pages only.

## Constraints

- Do not change LLMWiki export format, search behavior, memory eligibility, or privacy filtering.
- Keep the panel read-only.
- Display file paths only from the export result; do not read file contents.
- Keep UI text localized.

## Plan

1. Add computed LLMWiki navigation/content file groups.
2. Render localized navigation file cards for `index.md` and `log.md`.
3. Use content files for the displayed total memory count and regular file list.
4. Add static UI regression coverage.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest LLMWiki export navigation/result UI and LLMWiki service tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Memory settings now shows generated LLMWiki `index.md` and `log.md` files in a dedicated navigation section. The regular LLMWiki file list and memory total now use content pages only, preventing navigation file counts from being double-counted.
