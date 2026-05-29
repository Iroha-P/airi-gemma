import type {
  ElectronDreamLlmWikiDraft,
  ElectronDreamLoraDatasetCandidate,
  ElectronDreamMemoryCandidate,
  ElectronDreamReport,
  ElectronDreamRoutineCandidate,
  ElectronDreamWithheldContext,
  ElectronMemoryPrivacy,
  ElectronMemoryType,
} from '../../../../shared/eventa'

export interface ParseDreamModelOutputOptions {
  evolutionSuggestionIds: string[]
  generatedAt: Date
  id: string
  includeLoraCandidates: boolean
  rawModelOutput: string
  withheld: ElectronDreamWithheldContext[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringArray(value: unknown) {
  if (!Array.isArray(value))
    return []

  return value.map(text).filter(Boolean)
}

function memoryType(value: unknown): ElectronMemoryType {
  const normalized = text(value)
  if (['profile', 'preference', 'project', 'event', 'conversation', 'habit', 'knowledge', 'note'].includes(normalized))
    return normalized as ElectronMemoryType

  return 'note'
}

function memoryPrivacy(value: unknown): ElectronMemoryPrivacy {
  const normalized = text(value)
  if (['public', 'local', 'sensitive', 'secret'].includes(normalized))
    return normalized as ElectronMemoryPrivacy

  return 'local'
}

function importance(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value))
    return 3

  return Math.min(5, Math.max(1, Math.round(value)))
}

function normalizeMemoryCandidates(value: unknown): ElectronDreamMemoryCandidate[] {
  if (!Array.isArray(value))
    return []

  return value
    .filter(isRecord)
    .map((candidate): ElectronDreamMemoryCandidate | null => {
      const content = text(candidate.content)
      if (!content)
        return null

      return {
        content,
        type: memoryType(candidate.type),
        privacy: memoryPrivacy(candidate.privacy),
        importance: importance(candidate.importance),
        tags: stringArray(candidate.tags),
      }
    })
    .filter((candidate): candidate is ElectronDreamMemoryCandidate => Boolean(candidate))
}

function normalizeRoutineCandidates(value: unknown): ElectronDreamRoutineCandidate[] {
  if (!Array.isArray(value))
    return []

  return value
    .filter(isRecord)
    .map((candidate): ElectronDreamRoutineCandidate | null => {
      const title = text(candidate.title)
      const steps = stringArray(candidate.steps)
      if (!title || steps.length === 0)
        return null

      return { title, steps }
    })
    .filter((candidate): candidate is ElectronDreamRoutineCandidate => Boolean(candidate))
}

function normalizeLlmWikiDrafts(value: unknown): ElectronDreamLlmWikiDraft[] {
  if (!Array.isArray(value))
    return []

  return value
    .filter(isRecord)
    .map((draft): ElectronDreamLlmWikiDraft | null => {
      const title = text(draft.title)
      const content = text(draft.content)
      if (!title || !content)
        return null

      return { title, content }
    })
    .filter((draft): draft is ElectronDreamLlmWikiDraft => Boolean(draft))
}

function normalizeLoraDatasetCandidates(value: unknown, includeLoraCandidates: boolean): ElectronDreamLoraDatasetCandidate[] {
  if (!includeLoraCandidates || !Array.isArray(value))
    return []

  return value
    .filter(isRecord)
    .map((candidate): ElectronDreamLoraDatasetCandidate | null => {
      const messages = Array.isArray(candidate.messages)
        ? candidate.messages.filter(isRecord).map((message) => {
            const role = text(message.role)
            const content = text(message.content)
            if (!['system', 'user', 'assistant'].includes(role) || !content)
              return null

            return { role: role as 'system' | 'user' | 'assistant', content }
          }).filter((message): message is { role: 'system' | 'user' | 'assistant', content: string } => Boolean(message))
        : []

      if (messages.length === 0)
        return null

      return {
        messages,
        tags: stringArray(candidate.tags),
      }
    })
    .filter((candidate): candidate is ElectronDreamLoraDatasetCandidate => Boolean(candidate))
}

function baseReport(options: ParseDreamModelOutputOptions): Omit<ElectronDreamReport, 'summary'> {
  return {
    id: options.id,
    generatedAt: options.generatedAt.toISOString(),
    memoryCandidates: [],
    routineCandidates: [],
    llmWikiDrafts: [],
    loraDatasetCandidates: [],
    evolutionSuggestionIds: options.evolutionSuggestionIds,
    withheld: options.withheld,
    rawModelOutput: options.rawModelOutput,
  }
}

export function parseDreamModelOutput(options: ParseDreamModelOutputOptions): ElectronDreamReport {
  try {
    const parsed: unknown = JSON.parse(options.rawModelOutput)
    if (!isRecord(parsed))
      throw new Error('Dream output root must be an object')

    return {
      ...baseReport(options),
      summary: text(parsed.summary) || 'Local Gemma dream completed without a summary.',
      memoryCandidates: normalizeMemoryCandidates(parsed.memoryCandidates),
      routineCandidates: normalizeRoutineCandidates(parsed.routineCandidates),
      llmWikiDrafts: normalizeLlmWikiDrafts(parsed.llmWikiDrafts),
      loraDatasetCandidates: normalizeLoraDatasetCandidates(parsed.loraDatasetCandidates, options.includeLoraCandidates),
    }
  }
  catch {
    return {
      ...baseReport(options),
      summary: 'Local Gemma dream output could not be parsed. Review the raw model output before using any candidates.',
    }
  }
}
