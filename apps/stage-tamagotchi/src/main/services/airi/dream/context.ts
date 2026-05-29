import type {
  ElectronDreamWithheldContext,
  ElectronMemoryEvolutionPreviewResult,
  ElectronMemoryItem,
} from '../../../../shared/eventa'

import { hasMemorySafetyRisk } from '../memory/safety'

export interface DreamContext {
  evolutionSuggestionIds: string[]
  memories: ElectronMemoryItem[]
  withheld: ElectronDreamWithheldContext[]
}

export interface DreamContextOptions {
  evolution: ElectronMemoryEvolutionPreviewResult
  memories: ElectronMemoryItem[]
}

export function collectDreamContext(options: DreamContextOptions): DreamContext {
  const memories: ElectronMemoryItem[] = []
  const withheld: ElectronDreamWithheldContext[] = []

  for (const memory of options.memories) {
    if (memory.privacy === 'secret') {
      withheld.push({
        sourceId: memory.id,
        reason: 'secret_memory',
      })
      continue
    }

    if (hasMemorySafetyRisk(memory)) {
      withheld.push({
        sourceId: memory.id,
        reason: 'safety_risk',
      })
      continue
    }

    memories.push(memory)
  }

  return {
    evolutionSuggestionIds: options.evolution.suggestions.map(suggestion => suggestion.id),
    memories,
    withheld,
  }
}
