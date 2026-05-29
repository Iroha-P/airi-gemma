# P8.49 LLMWiki Pattern Reference

## Goal

Absorb the user-provided `llm-wiki.md` idea file into AIRI's Chinese architecture docs as a practical reference for LLMWiki, Obsidian-compatible memory, and RAG workflows.

## Constraints

- Treat the source as a conceptual pattern, not as a runnable dependency.
- Do not copy the original document verbatim.
- Keep AIRI's Memory DB as the fact source and LLMWiki as a curated view.
- Preserve existing privacy rules: secret data never enters LLMWiki, RAG, Obsidian export, or LoRA candidates.

## Plan

1. Add a Chinese LLMWiki pattern reference document.
2. Link the reference from the docs index.
3. Update the main architecture document's LLMWiki section with the Raw Sources / Wiki / Schema and Ingest / Query / Lint framing.
4. Run doc lint, diff, and whitespace checks.

## Verification

- Passed keyword scan for the new reference, docs index link, and main architecture updates.
- Passed `pnpm exec moeru-lint --fix` on touched docs.
- Passed `git diff --check`.
- Passed trailing whitespace scan.

## Result

Added `llmwiki-pattern-reference.zh-CN.md` and linked it from the docs index. The main architecture document now explicitly records the LLMWiki vs RAG distinction, Raw Sources / Wiki / Schema layers, and Ingest / Query / Lint workflow for future AIRI memory evolution.
