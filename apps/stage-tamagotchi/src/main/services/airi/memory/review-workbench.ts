import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { hasMemorySafetyRisk } from './safety'

export type MemoryReviewReason = 'persona_candidate' | 'dream_candidate' | 'pending_candidate' | 'conflict' | 'safety_risk' | 'stale_active'
export type MemoryReviewPriority = 'high' | 'medium' | 'low'
export type MemoryReviewAction = 'approve' | 'archive' | 'archive_related' | 'edit' | 'keep' | 'reclassify' | 'reject'

export interface MemoryReviewWorkbenchEntry {
  id: string
  item: ElectronMemoryItem
  priority: MemoryReviewPriority
  reasons: MemoryReviewReason[]
  relatedItemIds: string[]
  recommendedActions: MemoryReviewAction[]
}

export interface MemoryReviewWorkbenchSnapshot {
  generatedAt: string
  entries: MemoryReviewWorkbenchEntry[]
  total: number
}

export interface MemoryReviewWorkbenchOptions {
  generatedAt?: Date
  memories: ElectronMemoryItem[]
  staleBefore?: Date
}

interface MetadataConflict {
  itemId?: unknown
}

interface MetadataPersonaCandidate {
  reviewRequired?: unknown
}

function getMetadataConflicts(memory: ElectronMemoryItem): MetadataConflict[] {
  const conflicts = memory.metadata?.conflicts
  return Array.isArray(conflicts) ? conflicts as MetadataConflict[] : []
}

function hasSafetyRisk(memory: ElectronMemoryItem) {
  return hasMemorySafetyRisk(memory)
}

function hasPersonaCandidate(memory: ElectronMemoryItem) {
  const candidate = memory.metadata?.personaCandidate as MetadataPersonaCandidate | undefined
  return Boolean(candidate) || memory.tags.includes('persona-candidate')
}

function hasDreamCandidate(memory: ElectronMemoryItem) {
  return memory.sourceType === 'dream'
    && memory.status === 'needs_review'
    && memory.metadata?.requiresReview === true
}

function relatedItemIds(memory: ElectronMemoryItem) {
  return [...new Set(
    getMetadataConflicts(memory)
      .map(conflict => typeof conflict.itemId === 'string' ? conflict.itemId : null)
      .filter((id): id is string => Boolean(id)),
  )]
}

function reviewReasons(memory: ElectronMemoryItem, staleBefore: Date | undefined): MemoryReviewReason[] {
  const reasons: MemoryReviewReason[] = []

  if (hasSafetyRisk(memory))
    reasons.push('safety_risk')
  if (getMetadataConflicts(memory).length > 0)
    reasons.push('conflict')
  if (hasPersonaCandidate(memory))
    reasons.push('persona_candidate')
  if (hasDreamCandidate(memory))
    reasons.push('dream_candidate')
  if (memory.status === 'needs_review')
    reasons.push('pending_candidate')
  if (staleBefore && memory.status === 'active' && new Date(memory.updatedAt) < staleBefore)
    reasons.push('stale_active')

  return reasons
}

function priorityFor(reasons: MemoryReviewReason[]): MemoryReviewPriority {
  if (reasons.includes('safety_risk') || reasons.includes('conflict'))
    return 'high'
  if (reasons.includes('pending_candidate'))
    return 'medium'
  return 'low'
}

function recommendedActionsFor(reasons: MemoryReviewReason[]): MemoryReviewAction[] {
  if (reasons.includes('safety_risk'))
    return ['reject', 'reclassify', 'approve']
  if (reasons.includes('conflict'))
    return ['approve', 'archive_related', 'reject']
  if (reasons.includes('persona_candidate'))
    return ['edit', 'approve', 'reject']
  if (reasons.includes('dream_candidate'))
    return ['edit', 'approve', 'reject']
  if (reasons.includes('pending_candidate'))
    return ['approve', 'reject', 'edit']

  return ['keep', 'archive', 'edit']
}

function compareEntries(first: MemoryReviewWorkbenchEntry, second: MemoryReviewWorkbenchEntry) {
  const priorityRank: Record<MemoryReviewPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  }

  if (priorityRank[first.priority] !== priorityRank[second.priority])
    return priorityRank[second.priority] - priorityRank[first.priority]

  return second.item.updatedAt.localeCompare(first.item.updatedAt)
}

export function createMemoryReviewWorkbenchSnapshot(options: MemoryReviewWorkbenchOptions): MemoryReviewWorkbenchSnapshot {
  const entries = options.memories
    .map((memory): MemoryReviewWorkbenchEntry | null => {
      const reasons = reviewReasons(memory, options.staleBefore)
      if (reasons.length === 0)
        return null

      return {
        id: memory.id,
        item: memory,
        priority: priorityFor(reasons),
        reasons,
        relatedItemIds: relatedItemIds(memory),
        recommendedActions: recommendedActionsFor(reasons),
      }
    })
    .filter((entry): entry is MemoryReviewWorkbenchEntry => Boolean(entry))
    .sort(compareEntries)

  return {
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    entries,
    total: entries.length,
  }
}
