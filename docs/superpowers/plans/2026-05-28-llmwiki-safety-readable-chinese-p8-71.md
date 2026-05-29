# P8.71 LLMWiki Safety Gate And Readable Chinese

## Goal

Keep generated LLMWiki pages safe for RAG and human review, and prevent corrupted Chinese labels from polluting downstream snippets or training review.

## Change

- LLMWiki export now excludes memories with `hasMemorySafetyRisk`.
- Export log states that unsafe content is omitted.
- Chinese labels in generated LLMWiki memory rows use readable text such as `记忆条目` and `类型/重要性/更新时间`.
- Regression test covers local-path exclusion and readable Chinese labels.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/llmwiki.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.test.ts`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/memory/llmwiki.ts apps/stage-tamagotchi/src/main/services/airi/memory/llmwiki.test.ts`
