# Local Gemma Dream Cycle P8.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a manual Local Gemma Dream Cycle that turns recent local context into a structured, reviewable Dream Report without sending private memory to cloud providers.

**Architecture:** Add a focused Electron main service under `apps/stage-tamagotchi/src/main/services/airi/dream` with pure context collection, output parsing, sanitizer, and manager units. Expose preview/start/current Dream RPCs through Eventa, add a renderer Pinia store, and show a compact Dream Console in the existing Memory settings page. First version is manual, local-only, and preview/review oriented.

**Tech Stack:** Electron main process, Eventa RPC, xsAI/OpenAI-compatible local runtime pattern, Vue 3, Pinia, TypeScript, Vitest, UnoCSS.

---

## Source Spec

- `docs/superpowers/specs/2026-05-13-local-gemma-dream-cycle-design.md`

## File Structure

- Create `apps/stage-tamagotchi/src/main/services/airi/dream/types.ts`
  - Dream DTO helpers shared inside the main service implementation.
- Create `apps/stage-tamagotchi/src/main/services/airi/dream/context.ts`
  - Collects memory/evolution context and withholds `secret` memories.
- Create `apps/stage-tamagotchi/src/main/services/airi/dream/parser.ts`
  - Parses local Gemma JSON output into a normalized Dream Report.
- Create `apps/stage-tamagotchi/src/main/services/airi/dream/sanitizer.ts`
  - Produces sanitized reports and redaction logs for future cloud review.
- Create `apps/stage-tamagotchi/src/main/services/airi/dream/manager.ts`
  - Owns current session state, local-only runtime checks, and start/get/cancel logic.
- Create `apps/stage-tamagotchi/src/main/services/airi/dream/index.ts`
  - Eventa service registration wrapper.
- Create tests beside each unit:
  - `context.test.ts`
  - `parser.test.ts`
  - `sanitizer.test.ts`
  - `manager.test.ts`
  - `index.test.ts`
- Modify `apps/stage-tamagotchi/src/shared/eventa.ts`
  - Add Dream RPC DTOs and invoke events.
- Modify `apps/stage-tamagotchi/src/main/index.ts`
  - Register the Dream service after memory/agent runtime dependencies exist.
- Create `apps/stage-tamagotchi/src/renderer/stores/settings/dream.ts`
  - Pinia store for current Dream Session and start/cancel actions.
- Create `apps/stage-tamagotchi/src/renderer/stores/settings/dream.test.ts`
  - Store RPC tests.
- Modify `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
  - Add Local Dream Cycle console section.
- Modify `packages/i18n/src/locales/*/settings.yaml`
  - Add Dream Console strings for all root locale files.
- Modify `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
  - Mark P8.2 as planned/implemented depending on execution progress.

## Task 1: Shared Dream Contracts

**Files:**
- Modify: `apps/stage-tamagotchi/src/shared/eventa.ts`

- [x] Add Dream status/types to `eventa.ts`:

```ts
export type ElectronDreamStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
export type ElectronDreamRedactionReason = 'private_identity' | 'raw_chat' | 'local_path' | 'secret_memory' | 'sensitive_relationship' | 'unpublished_project'

export interface ElectronDreamStartRequest {
  windowHours?: number
  includeLoraCandidates?: boolean
}

export interface ElectronDreamMemoryCandidate {
  content: string
  type: ElectronMemoryType
  privacy: ElectronMemoryPrivacy
  importance: number
  tags: string[]
}

export interface ElectronDreamRoutineCandidate {
  title: string
  steps: string[]
}

export interface ElectronDreamLlmWikiDraft {
  title: string
  content: string
}

export interface ElectronDreamLoraDatasetCandidate {
  messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
  tags: string[]
}

export interface ElectronDreamWithheldContext {
  sourceId: string
  reason: 'secret_memory'
}

export interface ElectronDreamRedaction {
  field: string
  reason: ElectronDreamRedactionReason
}

export interface ElectronSanitizedDreamReport {
  id: string
  generatedAt: string
  summary: string
  memoryCandidates: ElectronDreamMemoryCandidate[]
  routineCandidates: ElectronDreamRoutineCandidate[]
  llmWikiDrafts: ElectronDreamLlmWikiDraft[]
  loraDatasetCandidates: ElectronDreamLoraDatasetCandidate[]
  visibility: 'demo' | 'training_sanitized'
}

export interface ElectronDreamReport {
  id: string
  generatedAt: string
  summary: string
  memoryCandidates: ElectronDreamMemoryCandidate[]
  routineCandidates: ElectronDreamRoutineCandidate[]
  llmWikiDrafts: ElectronDreamLlmWikiDraft[]
  loraDatasetCandidates: ElectronDreamLoraDatasetCandidate[]
  evolutionSuggestionIds: string[]
  withheld: ElectronDreamWithheldContext[]
  rawModelOutput?: string
  sanitizedReport?: ElectronSanitizedDreamReport
  redactionLog?: ElectronDreamRedaction[]
}

export interface ElectronDreamSession {
  id: string
  status: ElectronDreamStatus
  startedAt: string
  completedAt?: string
  windowHours: number
  localModel?: string
  report?: ElectronDreamReport
  errorMessage?: string
}
```

- [x] Add invoke events:

```ts
export const electronDreamStartLocal = defineInvokeEventa<ElectronDreamSession, ElectronDreamStartRequest | undefined>('eventa:invoke:electron:dream:start-local')
export const electronDreamGetCurrent = defineInvokeEventa<ElectronDreamSession | null>('eventa:invoke:electron:dream:get-current')
export const electronDreamCancelCurrent = defineInvokeEventa<ElectronDreamSession | null>('eventa:invoke:electron:dream:cancel-current')
```

- [x] Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

Expected: may fail until implementation imports are wired, but `eventa.ts` syntax should be valid.

## Task 2: Dream Context Collector

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/dream/context.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/dream/context.test.ts`

- [x] Write failing tests:
  - `collects local non-secret memories and records secret memories as withheld`
  - `includes memory evolution suggestion ids`

Test shape:

```ts
const result = collectDreamContext({
  memories: [
    memory({ id: 'local-1', privacy: 'local' }),
    memory({ id: 'secret-1', privacy: 'secret' }),
  ],
  evolution: {
    generatedAt: '2026-05-13T00:00:00.000Z',
    total: 1,
    suggestions: [{ id: 'evolve-local-1-promote-candidate', kind: 'promote_candidate', priority: 'medium', title: 'Review', reason: 'Pending', memoryIds: ['local-1'], recommendedActions: ['approve'], createdAt: '2026-05-13T00:00:00.000Z' }],
  },
})

expect(result.memories.map(item => item.id)).toEqual(['local-1'])
expect(result.withheld).toEqual([{ sourceId: 'secret-1', reason: 'secret_memory' }])
expect(result.evolutionSuggestionIds).toEqual(['evolve-local-1-promote-candidate'])
```

- [x] Run red test:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/dream/context.test.ts
```

Expected: fail because `context.ts` does not exist.

- [x] Implement `collectDreamContext`.

- [x] Run green test.

## Task 3: Dream Output Parser

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/dream/parser.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/dream/parser.test.ts`

- [x] Write failing tests:
  - parses valid Gemma JSON into normalized report.
  - skips empty memory candidates.
  - marks all memory candidates as review-only by leaving status out of the report DTO.
  - returns fallback report when model output is invalid JSON.

- [x] Run red test:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/dream/parser.test.ts
```

- [x] Implement:

```ts
export function parseDreamModelOutput(options: {
  id: string
  generatedAt: Date
  rawModelOutput: string
  evolutionSuggestionIds: string[]
  withheld: ElectronDreamWithheldContext[]
  includeLoraCandidates: boolean
}): ElectronDreamReport
```

- [x] Run green test.

## Task 4: Sanitizer Gate

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/dream/sanitizer.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/dream/sanitizer.test.ts`

- [x] Write failing tests:
  - removes Windows/local path patterns.
  - removes raw chat markers like `[微信]` / `[Feishu]` from candidate text.
  - drops secret memory candidates from sanitized output.
  - creates redactionLog entries with concrete reasons.

- [x] Run red test.

- [x] Implement deterministic sanitizer with conservative regexes:
  - Windows drive path: `/[A-Z]:[\\/][^\s，。；;]+/g`
  - raw chat markers: `/\[(微信|WeChat|飞书|Feishu|QQ)\]/gi`
  - secret candidates are removed.

- [x] Run green test.

## Task 5: Dream Manager

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/dream/manager.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/dream/manager.test.ts`

- [x] Write failing tests:
  - rejects cloud runtime config.
  - fails when local runtime is disabled or missing model/baseURL.
  - creates a completed Dream Session from valid local model output.
  - prevents concurrent Dream Session.
  - cancel marks a running session as cancelled.

- [x] Dependencies should be injectable:

```ts
export interface DreamManagerDeps {
  getRuntimeConfig: () => Promise<ElectronAgentChatRuntimeConfig>
  generateText: (request: { input: string, model: string, baseURL: string, apiKey?: string }) => Promise<string>
  listMemories: () => Promise<ElectronMemoryItem[]>
  previewEvolution: () => Promise<ElectronMemoryEvolutionPreviewResult>
  now?: () => Date
  randomId?: () => string
}
```

- [x] Run red test.

- [x] Implement `createDreamManager(deps)`.

- [x] Run green test.

## Task 6: Eventa Service Registration

**Files:**
- Create: `apps/stage-tamagotchi/src/main/services/airi/dream/index.ts`
- Test: `apps/stage-tamagotchi/src/main/services/airi/dream/index.test.ts`
- Modify: `apps/stage-tamagotchi/src/main/index.ts`

- [x] Write failing Eventa adapter test:
  - `electronDreamStartLocal` calls `manager.startLocalDream`.
  - `electronDreamGetCurrent` calls `manager.getCurrent`.
  - `electronDreamCancelCurrent` calls `manager.cancelCurrent`.

- [x] Run red test.

- [x] Implement `createDreamService`.

- [x] Wire global setup in `main/index.ts` using existing memory manager and agent chat runtime config provider patterns.

- [x] Run green test and stage-tamagotchi typecheck.

## Task 7: Renderer Dream Store

**Files:**
- Create: `apps/stage-tamagotchi/src/renderer/stores/settings/dream.ts`
- Test: `apps/stage-tamagotchi/src/renderer/stores/settings/dream.test.ts`

- [x] Write failing store tests:
  - refreshes current dream.
  - starts local dream with `windowHours` and `includeLoraCandidates`.
  - cancels current dream.
  - stores error messages via `errorMessageFrom`.

- [x] Run red test.

- [x] Implement Pinia store with:
  - `currentSession`
  - `loading`
  - `lastError`
  - `refreshCurrent`
  - `startLocalDream`
  - `cancelCurrent`

- [x] Run green test.

## Task 8: Memory Settings Dream Console UI

**Files:**
- Modify: `apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue`
- Modify: `packages/i18n/src/locales/*/settings.yaml`

- [x] Add `useDreamSettingsStore` to the Memory settings page.

- [x] Add refs:
  - `dreamWindowHours = ref(4)`
  - `dreamIncludeLoraCandidates = ref(true)`

- [x] Add section:
  - title: Local Dream Cycle
  - description: local Gemma only, preview/review oriented
  - number input for window hours
  - checkbox for LoRA candidates
  - Start local dream button
  - Cancel button when running
  - report display: summary, memory candidates, routine candidates, LLMWiki drafts, LoRA candidates, withheld, redaction log

- [x] Add i18n keys under `settings.pages.memory.dream`.

- [x] Run:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

Expected: pass.

## Task 9: Documentation Update

**Files:**
- Modify: `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- Modify: `docs/superpowers/plans/2026-05-13-local-gemma-dream-cycle-p8-2.md`

- [x] Add P8.2 implementation status after P8.1.

- [x] Note:
  - Local Gemma can read local/sensitive memory except secret.
  - Cloud LLM is not used in P8.2.1.
  - Sanitizer Gate prepares future sanitized cloud review.
  - Dream candidates are review-only.

## Task 10: Verification

- [x] Run targeted tests:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/dream/context.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/parser.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/sanitizer.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/manager.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/index.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/dream.test.ts
```

- [x] Run existing related tests:

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/evolution.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts
```

- [x] Run typecheck:

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

- [x] Run lint:

```powershell
pnpm lint:fix
```

- [x] Run whitespace check:

```powershell
git diff --check
```

Expected final state: all tests and typecheck pass; `git diff --check` may print existing LF/CRLF warnings but must exit 0.

## Implementation Summary

- Added shared Dream Eventa DTOs and RPCs.
- Added Dream context collection with `secret` memory withholding.
- Added local Gemma JSON parser with fallback Dream Report.
- Added Sanitizer Gate for future cloud reviewer / dataset teacher boundaries.
- Added Dream Manager with local-only runtime enforcement, cancellation, concurrent-run guard, report parsing, and sanitized report generation.
- Registered Dream RPC in Electron main.
- Added renderer Dream settings store.
- Added Local Dream Cycle console to Memory settings.
- Added Dream i18n keys for all root locale files.
- Updated the main AIRI memory/agent design document.

## Verification Results

- `pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings/dream.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/context.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/parser.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/sanitizer.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/manager.test.ts apps/stage-tamagotchi/src/main/services/airi/dream/index.test.ts` - passed, 6 files / 9 tests.
- `pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory/evolution.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/main/services/airi/chat-runtime/config.test.ts` - passed, 3 files / 21 tests.
- `pnpm -F @proj-airi/stage-tamagotchi typecheck` - passed after Dream UI integration.
- `pnpm lint:fix` - passed with 0 warnings / 0 errors.
- `git diff --check` - passed; only existing LF/CRLF normalization warnings were printed.

## Self-Review

- Spec coverage: local Gemma dream, cloud reviewer boundary, Sanitizer Gate, review-only candidates, LoRA candidate generation, UI, Eventa, tests are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Scope check: P8.2.1 remains manual and local-only; cloud review is explicitly deferred to P8.3.
- Type consistency: Dream DTO names use `ElectronDream*`; service methods use `startLocalDream`, `getCurrent`, `cancelCurrent`.

