import type {
  ElectronMemoryEvolutionPreviewResult,
  ElectronMemoryEvolutionPriority,
  ElectronMemoryEvolutionSuggestion,
  ElectronMemoryItem,
} from '../../../../shared/eventa'

import { hasMemorySafetyRisk } from './safety'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export interface MemoryEvolutionPreviewOptions {
  generatedAt?: Date
  memories: ElectronMemoryItem[]
  staleBefore?: Date
  includeLowPriority?: boolean
  limit?: number
}

interface MetadataConflict {
  kind?: unknown
  itemId?: unknown
  reason?: unknown
  score?: unknown
}

function normalizeLimit(limit: number | undefined) {
  if (!limit)
    return DEFAULT_LIMIT
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(limit)))
}

function priorityRank(priority: ElectronMemoryEvolutionPriority) {
  if (priority === 'high')
    return 3
  if (priority === 'medium')
    return 2
  return 1
}

function getMetadataConflicts(memory: ElectronMemoryItem): MetadataConflict[] {
  const conflicts = memory.metadata?.conflicts
  return Array.isArray(conflicts) ? conflicts as MetadataConflict[] : []
}

function hasSafetyRisk(memory: ElectronMemoryItem) {
  return hasMemorySafetyRisk(memory)
}

function slugSegment(value: string) {
  return value.trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown'
}

function suggestionId(memory: ElectronMemoryItem, suffix: string, relatedId?: string, index?: number) {
  return [
    'evolve',
    slugSegment(memory.id),
    suffix,
    relatedId ? slugSegment(relatedId) : undefined,
    typeof index === 'number' ? String(index) : undefined,
  ].filter(Boolean).join('-')
}

function relatedId(conflict: MetadataConflict) {
  return typeof conflict.itemId === 'string' && conflict.itemId.trim()
    ? conflict.itemId
    : undefined
}

function relatedIds(memory: ElectronMemoryItem, conflict: MetadataConflict) {
  const id = relatedId(conflict)
  return [
    memory.id,
    ...(id ? [id] : []),
  ]
}

function conflictReason(conflict: MetadataConflict, fallback: string) {
  return typeof conflict.reason === 'string' && conflict.reason.trim()
    ? conflict.reason
    : fallback
}

function buildSuggestions(memory: ElectronMemoryItem, staleBefore: Date | undefined): ElectronMemoryEvolutionSuggestion[] {
  const suggestions: ElectronMemoryEvolutionSuggestion[] = []

  if (hasSafetyRisk(memory)) {
    suggestions.push({
      id: suggestionId(memory, 'tighten-privacy'),
      kind: 'tighten_privacy',
      priority: 'high',
      title: 'Tighten unsafe memory privacy',
      reason: 'Safety scanner marked this memory as unsafe. Keep it reviewable and prevent it from entering retrieval until the user decides.',
      memoryIds: [memory.id],
      recommendedActions: ['reclassify_secret', 'reject', 'edit'],
      createdAt: memory.updatedAt,
    })
  }

  for (const [index, conflict] of getMetadataConflicts(memory).entries()) {
    if (conflict.kind === 'duplicate') {
      suggestions.push({
        id: suggestionId(memory, 'merge-duplicate', relatedId(conflict), index),
        kind: 'merge_duplicate',
        priority: 'high',
        title: 'Merge duplicate memory',
        reason: conflictReason(conflict, 'This memory appears to duplicate an existing memory. Merge the useful parts before archiving one side.'),
        memoryIds: relatedIds(memory, conflict),
        recommendedActions: ['merge', 'archive', 'edit'],
        createdAt: memory.updatedAt,
      })
    }
    else if (conflict.kind === 'conflict') {
      suggestions.push({
        id: suggestionId(memory, 'review-conflict', relatedId(conflict), index),
        kind: 'review_conflict',
        priority: 'high',
        title: 'Review conflicting memory',
        reason: conflictReason(conflict, 'This memory may contradict an existing memory. Ask the user which one should remain active.'),
        memoryIds: relatedIds(memory, conflict),
        recommendedActions: ['keep', 'reject', 'edit'],
        createdAt: memory.updatedAt,
      })
    }
  }

  if (memory.status === 'needs_review' && suggestions.length === 0) {
    suggestions.push({
      id: suggestionId(memory, 'promote-candidate'),
      kind: 'promote_candidate',
      priority: 'medium',
      title: 'Review candidate memory',
      reason: 'This candidate is waiting for user review before it can become active long-term memory.',
      memoryIds: [memory.id],
      recommendedActions: ['approve', 'reject', 'edit'],
      createdAt: memory.updatedAt,
    })
  }

  if (staleBefore && memory.status === 'active' && memory.importance <= 2 && new Date(memory.updatedAt) < staleBefore) {
    suggestions.push({
      id: suggestionId(memory, 'archive-stale'),
      kind: 'archive_stale',
      priority: 'low',
      title: 'Archive stale low-importance memory',
      reason: 'This active memory is old and low importance. Archive it if it no longer reflects the user or project.',
      memoryIds: [memory.id],
      recommendedActions: ['archive', 'keep', 'edit'],
      createdAt: memory.updatedAt,
    })
  }

  return suggestions
}

function compareSuggestions(first: ElectronMemoryEvolutionSuggestion, second: ElectronMemoryEvolutionSuggestion) {
  const priorityDiff = priorityRank(second.priority) - priorityRank(first.priority)
  if (priorityDiff !== 0)
    return priorityDiff

  return second.createdAt.localeCompare(first.createdAt)
}

export function createMemoryEvolutionPreview(options: MemoryEvolutionPreviewOptions): ElectronMemoryEvolutionPreviewResult {
  const includeLowPriority = options.includeLowPriority ?? true
  const suggestions = options.memories
    .flatMap(memory => buildSuggestions(memory, options.staleBefore))
    .filter(suggestion => includeLowPriority || suggestion.priority !== 'low')
    .sort(compareSuggestions)
    .slice(0, normalizeLimit(options.limit))

  return {
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    suggestions,
    total: suggestions.length,
  }
}
