# P8.36 LLMWiki Search Result Summary

## Goal

Show a small result count summary in the LLMWiki Search Console so users can immediately tell how many snippets were recalled from the exported local Markdown knowledge layer.

## Constraints

- Use the existing `llmWikiSearchResult.snippets` only.
- Do not change LLMWiki export, search scoring, RAG context composition, or privacy rules.
- Do not add a backend call.
- Keep the UI text localized.

## Plan

1. Add a computed snippet count for the current LLMWiki search result.
2. Render a localized result summary near the input directory.
3. Add English and Simplified Chinese locale keys.
4. Add a static UI contract test.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest LLMWiki/search/RAG tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

LLMWiki Search Console now shows a localized snippet count summary for the current search result. This is read-only and does not change LLMWiki export, search scoring, RAG context composition, or privacy behavior.
