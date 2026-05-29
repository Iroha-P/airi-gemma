# P8.40 LLMWiki Empty State Guidance

## Goal

Make LLMWiki search empty results easier to diagnose by showing different guidance when no Markdown files were scanned versus when files exist but the query matched no snippets.

## Constraints

- Do not change LLMWiki search scoring, export content, or RAG context composition.
- Keep the result read-only.
- Keep UI text localized.
- Keep the existing Memory settings page as the composition surface; this is a small state presentation improvement and does not need a new component.

## Plan

1. Add a computed empty-state translation key for LLMWiki search results.
2. Render the derived localized empty message only when no snippets are returned.
3. Add English and Simplified Chinese copy for the zero-file and zero-match cases.
4. Add a static UI regression test for the empty-state branching.
5. Update the architecture/design document.
6. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest LLMWiki search UI/service/store tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched Vue, test, i18n, and doc files.
- Passed `git diff --check` and trailing whitespace scan. Git reported existing LF-to-CRLF normalization warnings for the two touched i18n YAML files.

## Result

LLMWiki search empty states now distinguish between zero scanned Markdown files and zero matched snippets. The Memory settings page gives localized guidance to export LLMWiki first when no Markdown files were scanned, while keeping the existing no-match case for searches that scanned files but found no snippets.
