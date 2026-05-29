# P8.57 LLMWiki Readable Chinese Export

## Goal

Fix garbled Chinese labels in the LLMWiki exporter so exported Markdown remains readable in Obsidian, local review, and RAG debugging.

## Scope

- Replace mojibake headings and metadata labels in `llmwiki.ts`.
- Replace mojibake fixture text and expectations in `llmwiki.test.ts`.
- Keep the export schema, file layout, and search behavior unchanged.

## Verification

- Run LLMWiki exporter tests.
- Run RAG/LLMWiki UI contract tests that depend on exported markdown.
- Search the LLMWiki exporter and tests for known mojibake fragments.
