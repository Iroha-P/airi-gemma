# P8.72 Memory-Aware Runtime Context Safety

## Goal

Make the final chat-runtime prompt assembly defensive even when context fragments bypass the normal RAG composer.

## Change

- `createMemoryAwareChatRuntime` scans each context fragment's text before prompt assembly.
- Secret fragments and safety-risk fragments are withheld for both local and cloud targets.
- Cloud calls still require `privacy: public`.
- Regression test verifies a prompt-injection-like public fragment is withheld even for local target.

## Validation

- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/chat-runtime/memory-aware.test.ts apps/stage-tamagotchi/src/main/services/airi/memory/rag-context.test.ts apps/stage-tamagotchi/src/main/services/airi/agent/orchestrator.test.ts`
- `pnpm exec moeru-lint --fix apps/stage-tamagotchi/src/main/services/airi/chat-runtime/memory-aware.ts apps/stage-tamagotchi/src/main/services/airi/chat-runtime/memory-aware.test.ts`
