# P8.38 LLMWiki Export Memory Summary

## Goal

Show the total number of memories included in the latest LLMWiki export result so users can verify how much reviewed content actually entered the Markdown knowledge layer.

## Constraints

- Derive the total from the existing export result files only.
- Do not change LLMWiki export content, filtering, paths, or Memory DB state.
- Keep the UI read-only and localized.

## Plan

1. Add a computed total memory count for the latest LLMWiki export result.
2. Render a localized total memory summary in the LLMWiki export result panel.
3. Add English and Simplified Chinese locale keys.
4. Extend static UI contract coverage.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest LLMWiki export/search tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

The LLMWiki export result panel now shows the total number of memories included in the latest export. The value is derived from exported file counts and does not change export content, privacy filtering, paths, or Memory DB state.
