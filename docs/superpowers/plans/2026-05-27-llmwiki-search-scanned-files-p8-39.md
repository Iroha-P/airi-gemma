# P8.39 LLMWiki Search Scanned Files

## Goal

Return and display how many Markdown files were scanned during LLMWiki search, so users can distinguish "no exported wiki files yet" from "files exist but this query did not match snippets".

## Constraints

- Do not change LLMWiki export content, search scoring, snippet splitting, RAG context composition, or privacy rules.
- Keep the result read-only.
- Keep UI text localized.

## Plan

1. Add `scannedFiles` to `ElectronMemorySearchLlmWikiResult`.
2. Return `scannedFiles` from `searchMemoryLlmWiki`, including the missing-directory case.
3. Update tests and fixtures.
4. Show scanned file count in the LLMWiki Search Console result summary.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest LLMWiki/RAG/Agent/memory-context tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched code, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for `eventa.ts` and the two touched i18n YAML files.

## Result

LLMWiki search results now include `scannedFiles`, and Memory settings displays both scanned Markdown file count and matched snippet count. Missing or non-directory LLMWiki inputs return `scannedFiles: 0`, making empty search results easier to diagnose without changing search scoring, RAG composition, or privacy behavior.
