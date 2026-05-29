# P8.37 LLMWiki Export Result UI

## Goal

Persist and display the most recent LLMWiki export result in Memory settings so users can confirm which Markdown pages were written to `70-llmwiki`.

## Constraints

- Do not change LLMWiki export content, privacy filtering, or file paths.
- Do not read generated Markdown back into Memory DB.
- Keep the UI read-only.
- Keep the UI text localized.

## Plan

1. Store the latest `ElectronMemoryExportLlmWikiResult` in the memory settings store.
2. Render output directory, export time, file count, and exported file list in Memory settings.
3. Add English and Simplified Chinese locale keys.
4. Add store and static UI contract coverage.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest LLMWiki export/search tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

Memory settings now stores and displays the latest LLMWiki export result, including output directory, export time, exported Markdown files, and per-file memory counts. The panel is read-only and does not change export content, privacy filtering, or Memory DB state.
