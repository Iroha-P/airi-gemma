# P8.77 RAG LLMWiki Snippet Safety

## Goal

Keep RAG preview and final chat runtime behavior aligned. The final memory-aware runtime already rescans context fragments, but `composeMemoryRagContext` could still show unsafe LLMWiki snippets as sendable fragments in the settings preview.

## Changes

- Scan LLMWiki snippet text inside `composeMemoryRagContext`.
- Withhold unsafe LLMWiki snippets with `reason: safety_risk`.
- Keep cloud behavior unchanged: default-local LLMWiki is not searched for cloud targets.
- Add regression coverage for unsafe LLMWiki snippets.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.test.ts apps/stage-tamagotchi/src/main/services/airi/chat-runtime/memory-aware.test.ts`
- `pnpm -F @proj-airi/stage-tamagotchi typecheck`
- `git diff --check`
