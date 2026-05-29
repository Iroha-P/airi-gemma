import type {
  ElectronMemoryCreateRequest,
  ElectronMemoryItem,
} from '../../../../shared/eventa'
import type { MemoryRepository } from './repository'

export type MemoryConflictKind = 'duplicate' | 'conflict'

export interface MemoryConflictFinding {
  kind: MemoryConflictKind
  item: ElectronMemoryItem
  score: number
  reason: string
}

export interface MemoryConflictDetectionResult {
  findings: MemoryConflictFinding[]
}

const WORD_PATTERN = /[a-z0-9][a-z0-9-]*/giu
const CJK_PATTERN = /[\u3400-\u9FFF]+/gu
const POSITIVE_PATTERNS = ['喜欢', '偏好', '希望', '适合', '需要']
const NEGATIVE_PATTERNS = ['不喜欢', '讨厌', '避免', '不要', '不想']

function normalizeText(content: string) {
  return content
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim()
}

function addCjkBigrams(tokens: Set<string>, content: string) {
  for (const match of content.matchAll(CJK_PATTERN)) {
    const value = match[0]
    for (let index = 0; index < value.length - 1; index++)
      tokens.add(value.slice(index, index + 2))
  }
}

function tokenize(content: string) {
  const normalized = normalizeText(content)
  const tokens = new Set<string>()

  for (const match of normalized.matchAll(WORD_PATTERN))
    tokens.add(match[0])

  addCjkBigrams(tokens, normalized)
  return tokens
}

function intersectionSize(first: Set<string>, second: Set<string>) {
  let count = 0
  for (const token of first) {
    if (second.has(token))
      count += 1
  }
  return count
}

function getSimilarityScore(first: string, second: string) {
  const normalizedFirst = normalizeText(first)
  const normalizedSecond = normalizeText(second)

  if (!normalizedFirst || !normalizedSecond)
    return 0
  if (normalizedFirst === normalizedSecond)
    return 1
  if (normalizedFirst.length >= 8 && normalizedSecond.includes(normalizedFirst))
    return 0.95
  if (normalizedSecond.length >= 8 && normalizedFirst.includes(normalizedSecond))
    return 0.95

  const firstTokens = tokenize(first)
  const secondTokens = tokenize(second)
  const shared = intersectionSize(firstTokens, secondTokens)
  if (shared === 0)
    return 0

  return shared / new Set([...firstTokens, ...secondTokens]).size
}

function getPolarity(content: string) {
  const normalized = normalizeText(content)
  if (NEGATIVE_PATTERNS.some(pattern => normalized.includes(pattern)))
    return 'negative'
  if (POSITIVE_PATTERNS.some(pattern => normalized.includes(pattern)))
    return 'positive'
  return 'neutral'
}

function hasSharedTag(candidate: ElectronMemoryCreateRequest, item: ElectronMemoryItem) {
  const candidateTags = new Set(candidate.tags ?? [])
  return item.tags.some(tag => candidateTags.has(tag))
}

function shouldCompareAsSameTopic(candidate: ElectronMemoryCreateRequest, item: ElectronMemoryItem, score: number) {
  return candidate.type === item.type || hasSharedTag(candidate, item) || score >= 0.28
}

export async function detectMemoryConflicts(
  repository: MemoryRepository,
  candidate: ElectronMemoryCreateRequest,
): Promise<MemoryConflictDetectionResult> {
  const activeMemories = await repository.list({ status: 'active', limit: 200 })
  const findings: MemoryConflictFinding[] = []

  for (const item of activeMemories) {
    const score = getSimilarityScore(candidate.content, item.content)

    if (score >= 0.92) {
      findings.push({
        kind: 'duplicate',
        item,
        score,
        reason: '候选记忆与已有记忆高度重复。',
      })
      continue
    }

    const candidatePolarity = getPolarity(candidate.content)
    const itemPolarity = getPolarity(item.content)
    if (
      candidatePolarity !== 'neutral'
      && itemPolarity !== 'neutral'
      && candidatePolarity !== itemPolarity
      && shouldCompareAsSameTopic(candidate, item, score)
    ) {
      findings.push({
        kind: 'conflict',
        item,
        score,
        reason: '候选记忆与已有记忆可能表达相反偏好或相反事实。',
      })
    }
  }

  return { findings }
}
