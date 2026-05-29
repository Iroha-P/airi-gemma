# P8.52 LLMWiki Index And Log Export

## Goal

Add generated `index.md` and `log.md` files to LLMWiki exports, matching the LLMWiki pattern reference and making exported wiki folders easier for both humans and agents to navigate.

## Constraints

- Do not change memory eligibility or privacy filtering.
- Keep Memory DB as the source of truth.
- Do not expose secret memories, raw metadata, or absolute paths in generated index/log files.
- Keep LLMWiki search behavior simple: index/log are regular Markdown files and may be scanned.

## Plan

1. Add index/log formatters to the LLMWiki exporter.
2. Record `index.md` and `log.md` in export results before content pages.
3. Update export/search tests for the new files and scanned Markdown count.
4. Update architecture docs.
5. Run targeted Vitest, typecheck, lint, diff, and whitespace checks.

## Verification

- Passed targeted Vitest LLMWiki export/search and RAG context tests.
- Passed `pnpm -F @proj-airi/stage-tamagotchi typecheck`.
- Passed `pnpm exec moeru-lint --fix` on touched service, test, and doc files.
- Passed `git diff --check`.
- Passed trailing whitespace scan.

## Result

LLMWiki exports now include generated `index.md` and `log.md` files before content pages. The files provide navigation and export timeline metadata without changing memory eligibility, privacy filtering, or search behavior beyond increasing the scanned Markdown file count.
