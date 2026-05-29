import type {
  ElectronMemoryCreateRequest,
  ElectronMemoryIngestionEntry,
  ElectronMemoryIngestionSource,
  ElectronMemoryIngestRequest,
  ElectronMemoryIngestResult,
  ElectronMemoryItem,
  ElectronMemoryType,
} from '../../../../shared/eventa'
import type { MemoryConflictDetectionResult } from './conflicts'
import type { MemorySafetyScanResult } from './safety'

import { scanMemorySafety } from './safety'

const SELF_REFERENCE_PATTERN = /\b(?:i|i'm|im|my|me|user)\b/

function normalizeTags(tags: string[] | undefined) {
  return [...new Set((tags ?? []).map(tag => tag.trim()).filter(Boolean))]
}

function createSourceId(source: ElectronMemoryIngestionSource, entry: ElectronMemoryIngestionEntry, index: number) {
  const entryId = entry.externalId?.trim() || `entry-${index}`

  if (!source.id)
    return entryId

  return `${source.id.trim()}:${entryId}`
}

function isPersonaCandidateSource(source: ElectronMemoryIngestionSource) {
  return source.type === 'import_wechat'
    || source.type === 'import_lark'
    || source.type === 'import_qq'
    || source.type === 'knowledge_base'
}

function hasAnySignal(content: string, signals: string[]) {
  const normalized = content.toLowerCase()
  return signals.some(signal => normalized.includes(signal))
}

function classifyPersonaCandidate(content: string): ElectronMemoryType | undefined {
  const normalized = content.toLowerCase()
  const hasSelfSignal = SELF_REFERENCE_PATTERN.test(normalized)
    || content.includes('我')
    || content.includes('本人')
    || content.includes('自己')
    || content.includes('用户')

  if (!hasSelfSignal)
    return undefined

  if (hasAnySignal(content, ['do not', 'don\'t', 'privacy', 'private', 'secret', '不要', '别', '隐私', '禁止']))
    return 'preference'

  if (hasAnySignal(content, ['fdu', 'student', 'studying', 'switching into cs', 'background', '本科', '学生', '复旦', '转码']))
    return 'profile'

  if (hasAnySignal(content, ['habit', 'daily', 'usually', 'often', 'routine', '习惯', '每天', '通常', '经常']))
    return 'habit'

  if (hasAnySignal(content, ['project', 'airi', 'agent', 'knowledge base', '项目', '智能体', '知识库']))
    return 'project'

  if (hasAnySignal(content, ['prefer', 'like', 'want', 'need', 'goal', '希望', '喜欢', '需要', '目标']))
    return 'preference'

  return undefined
}

function personaCandidateTags(type: ElectronMemoryType) {
  if (type === 'preference')
    return ['persona-candidate', 'preference']

  if (type === 'habit')
    return ['persona-candidate', 'habit']

  if (type === 'project')
    return ['persona-candidate', 'project']

  return ['persona-candidate', 'profile']
}

function createPersonaCandidateEntry(
  source: ElectronMemoryIngestionSource,
  entry: ElectronMemoryIngestionEntry,
  content: string,
  index: number,
): ElectronMemoryIngestionEntry | undefined {
  if (!isPersonaCandidateSource(source))
    return undefined

  if (entry.metadata?.personaCandidate)
    return undefined

  const type = classifyPersonaCandidate(content)
  if (!type)
    return undefined

  return {
    externalId: `${entry.externalId?.trim() || `entry-${index}`}:persona-candidate`,
    content,
    summary: 'Imported persona candidate',
    type,
    tags: personaCandidateTags(type),
    importance: entry.importance,
    privacy: entry.privacy,
    status: 'needs_review',
    occurredAt: entry.occurredAt,
    metadata: {
      personaCandidate: {
        derivedFrom: entry.externalId?.trim() || `entry-${index}`,
        kind: type,
        reason: 'imported_self_description',
        reviewRequired: true,
      },
    },
  }
}

function summarizeConflicts(result: MemoryConflictDetectionResult | undefined) {
  if (!result || result.findings.length === 0)
    return undefined

  return result.findings.map(finding => ({
    kind: finding.kind,
    itemId: finding.item.id,
    score: finding.score,
    reason: finding.reason,
  }))
}

function createMetadata(
  source: ElectronMemoryIngestionSource,
  entry: ElectronMemoryIngestionEntry,
  conflicts: MemoryConflictDetectionResult | undefined,
  safety: MemorySafetyScanResult,
) {
  const summarizedConflicts = summarizeConflicts(conflicts)

  return {
    ...entry.metadata,
    ingestion: {
      sourceId: source.id,
      sourceLabel: source.label,
      externalId: entry.externalId,
      occurredAt: entry.occurredAt,
    },
    ...(summarizedConflicts ? { conflicts: summarizedConflicts } : {}),
    ...(!safety.safe ? { safety } : {}),
  }
}

export function createMemoryIngestionPipeline(params: {
  createMemory: (request: ElectronMemoryCreateRequest) => Promise<ElectronMemoryItem>
  detectConflicts?: (request: ElectronMemoryCreateRequest) => Promise<MemoryConflictDetectionResult>
}) {
  async function createFromEntry(
    batch: ElectronMemoryIngestRequest,
    entry: ElectronMemoryIngestionEntry,
    index: number,
  ) {
    const content = entry.content.trim()
    if (!content)
      return undefined

    const safety = scanMemorySafety(content)
    const tags = normalizeTags([
      ...(batch.defaults?.tags ?? []),
      ...(entry.tags ?? []),
      ...(!safety.safe ? ['safety-review'] : []),
    ])

    const request: ElectronMemoryCreateRequest = {
      content,
      summary: entry.summary?.trim() || null,
      type: entry.type ?? 'note',
      tags,
      importance: entry.importance,
      privacy: safety.safe ? entry.privacy ?? batch.defaults?.privacy ?? 'local' : 'secret',
      sourceType: batch.source.type,
      sourceId: createSourceId(batch.source, entry, index),
      status: safety.safe ? entry.status ?? batch.defaults?.status ?? 'needs_review' : 'needs_review',
    }

    const conflicts = await params.detectConflicts?.(request)
    return params.createMemory({
      ...request,
      metadata: createMetadata(batch.source, entry, conflicts, safety),
    })
  }

  async function ingest(batch: ElectronMemoryIngestRequest): Promise<ElectronMemoryIngestResult> {
    const created: ElectronMemoryItem[] = []
    const skipped: ElectronMemoryIngestResult['skipped'] = []

    for (const [index, entry] of batch.entries.entries()) {
      const content = entry.content.trim()
      if (!content) {
        skipped.push({ index, reason: 'empty_content' })
        continue
      }

      const original = await createFromEntry(batch, entry, index)
      if (original)
        created.push(original)

      const candidate = createPersonaCandidateEntry(batch.source, entry, content, index)
      if (candidate) {
        const persona = await createFromEntry(batch, candidate, index)
        if (persona)
          created.push(persona)
      }
    }

    return { created, skipped }
  }

  return {
    ingest,
  }
}
