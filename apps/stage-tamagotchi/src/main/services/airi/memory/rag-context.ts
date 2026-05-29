import type {
  ElectronAgentContextFragment,
  ElectronMemoryItem,
  ElectronMemoryListRequest,
  ElectronMemoryPrivacy,
  ElectronMemorySearchLlmWikiResult,
} from '../../../../shared/eventa'

import { hasMemorySafetyRisk, scanMemorySafety } from './safety'

export type MemoryRagTarget = 'local' | 'cloud'
export type WithheldMemoryReason = 'secret_memory' | 'safety_risk' | 'cloud_target_requires_public_memory'

export interface WithheldMemoryContext {
  id: string
  privacy: ElectronMemoryPrivacy
  reason: WithheldMemoryReason
}

export interface ComposeMemoryRagContextRequest {
  query: string
  target?: MemoryRagTarget
  memoryLimit?: number
  llmWikiLimit?: number
  listMemories: (request?: ElectronMemoryListRequest) => Promise<ElectronMemoryItem[]>
  searchLlmWiki: (request: { query: string, limit?: number }) => Promise<ElectronMemorySearchLlmWikiResult>
}

export interface ComposeMemoryRagContextResult {
  fragments: ElectronAgentContextFragment[]
  withheld: WithheldMemoryContext[]
}

function hasSafetyRisk(memory: ElectronMemoryItem) {
  return hasMemorySafetyRisk(memory)
}

function shouldIncludeMemory(memory: ElectronMemoryItem, target: MemoryRagTarget): { include: true } | { include: false, reason: WithheldMemoryReason } {
  if (memory.privacy === 'secret')
    return { include: false, reason: 'secret_memory' }
  if (hasSafetyRisk(memory))
    return { include: false, reason: 'safety_risk' }
  if (target === 'cloud' && memory.privacy !== 'public')
    return { include: false, reason: 'cloud_target_requires_public_memory' }
  return { include: true }
}

function compareMemoryFragments(first: ElectronAgentContextFragment, second: ElectronAgentContextFragment) {
  return (second.score ?? 0) - (first.score ?? 0)
}

function toSafeLlmWikiFragments(
  snippets: ElectronMemorySearchLlmWikiResult['snippets'],
  withheld: WithheldMemoryContext[],
): ElectronAgentContextFragment[] {
  const fragments: ElectronAgentContextFragment[] = []

  for (const snippet of snippets) {
    if (!scanMemorySafety(snippet.text).safe) {
      withheld.push({
        id: snippet.relativePath,
        privacy: 'local',
        reason: 'safety_risk',
      })
      continue
    }

    fragments.push({
      kind: 'llmwiki',
      id: snippet.relativePath,
      title: snippet.relativePath,
      text: snippet.text,
      privacy: 'local',
      score: snippet.score,
    })
  }

  return fragments
}

export async function composeMemoryRagContext(request: ComposeMemoryRagContextRequest): Promise<ComposeMemoryRagContextResult> {
  const target = request.target ?? 'local'
  const [memories, wiki] = await Promise.all([
    request.listMemories({
      query: request.query,
      status: 'active',
      limit: request.memoryLimit ?? 8,
      trackAccess: true,
    }),
    target === 'local'
      ? request.searchLlmWiki({
          query: request.query,
          limit: request.llmWikiLimit ?? 5,
        })
      : undefined,
  ])

  const withheld: WithheldMemoryContext[] = []
  const memoryFragments: ElectronAgentContextFragment[] = []

  for (const memory of memories) {
    const decision = shouldIncludeMemory(memory, target)
    if (!decision.include) {
      withheld.push({
        id: memory.id,
        privacy: memory.privacy,
        reason: decision.reason,
      })
      continue
    }

    memoryFragments.push({
      kind: 'memory',
      id: memory.id,
      title: memory.summary ?? memory.type,
      text: memory.content,
      privacy: memory.privacy,
      score: memory.importance,
    })
  }

  return {
    fragments: [
      ...memoryFragments.sort(compareMemoryFragments),
      ...toSafeLlmWikiFragments(wiki?.snippets ?? [], withheld),
    ],
    withheld,
  }
}
