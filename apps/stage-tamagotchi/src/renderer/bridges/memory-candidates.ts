import type { ElectronMemoryCreateRequest, ElectronMemoryItem } from '../../shared/eventa'

import { useChatOrchestratorStore } from '@proj-airi/stage-ui/stores/chat'

import { useMemorySettingsStore } from '../stores/settings/memory'
import { isSimilarMemoryContent } from './memory-similarity'

interface ExtractMemoryCandidatesOptions {
  userText: string
  assistantText?: string
  sessionId?: string
}

const CLEAN_PREFIX_RE = /^[\s:：,，。.!！]+/
const WHITESPACE_RE = /\s+/g
const STATEMENT_SPLIT_RE = /(?<=[。.!！？?])\s*|\n+/u
const EXPLICIT_MEMORY_PREFIX_RE = /^请?(?:帮我)?记住(?:一下)?/u
const ENGLISH_EXPLICIT_MEMORY_PREFIX_RE = /^remember/iu
const LIKE_RE = /^我(?:比较|很|特别)?喜欢(.+)$/u
const DISLIKE_RE = /^我(?:比较|很|特别)?不喜欢(.+)$/u
const ENGLISH_LIKE_RE = /^I like (.+)$/iu
const GOAL_RE = /^我的目标是(.+)$/u
const IDENTITY_RE = /^我是(.+)$/u
const BACKGROUND_RE = /^我(.{0,12}(?:本科|研究生|专业|学校|学院).+)$/u

let initialized = false

function cleanContent(content: string) {
  return content
    .replace(CLEAN_PREFIX_RE, '')
    .replace(WHITESPACE_RE, ' ')
    .trim()
    .slice(0, 240)
}

function splitStatements(text: string) {
  return text
    .split(STATEMENT_SPLIT_RE)
    .map(cleanContent)
    .filter(Boolean)
}

function createCandidate(
  content: string,
  type: ElectronMemoryCreateRequest['type'],
  options: ExtractMemoryCandidatesOptions,
  tags: string[],
): ElectronMemoryCreateRequest | undefined {
  const cleaned = cleanContent(content)
  if (!cleaned)
    return

  return {
    content: cleaned,
    type,
    tags,
    privacy: 'local',
    importance: type === 'profile' ? 4 : 3,
    sourceType: 'chat_turn',
    sourceId: options.sessionId,
    status: 'needs_review',
    metadata: {
      assistantText: options.assistantText?.slice(0, 500),
      extractedBy: 'rule:v1',
    },
  }
}

function isSimilarMemory(candidate: ElectronMemoryCreateRequest, item: Pick<ElectronMemoryItem, 'content'>) {
  return isSimilarMemoryContent(candidate.content, item.content)
}

function mergeTags(first: string[], second: string[]) {
  return [...new Set([...first, ...second])]
}

async function saveOrMergeCandidate(
  candidate: ElectronMemoryCreateRequest,
  memoryStore: ReturnType<typeof useMemorySettingsStore>,
) {
  const similarItems = await memoryStore.findSimilarMemories({
    limit: 50,
  })
  const duplicate = similarItems.find(item => isSimilarMemory(candidate, item))

  if (!duplicate) {
    await memoryStore.addMemory(candidate)
    return
  }

  if (duplicate.status === 'active')
    return

  if (duplicate.status === 'needs_review') {
    await memoryStore.editMemory({
      id: duplicate.id,
      content: duplicate.content.length >= candidate.content.length ? duplicate.content : candidate.content,
      tags: mergeTags(duplicate.tags, candidate.tags ?? []),
      importance: Math.max(duplicate.importance, candidate.importance ?? 3),
      metadata: {
        ...duplicate.metadata,
        ...candidate.metadata,
        mergedBy: 'rule:v1',
      },
    })
  }
}

function maybeExplicitMemory(statement: string, options: ExtractMemoryCandidatesOptions) {
  const isExplicit = EXPLICIT_MEMORY_PREFIX_RE.test(statement)
    || ENGLISH_EXPLICIT_MEMORY_PREFIX_RE.test(statement)
  if (!isExplicit)
    return

  return createCandidate(
    statement
      .replace(EXPLICIT_MEMORY_PREFIX_RE, '')
      .replace(ENGLISH_EXPLICIT_MEMORY_PREFIX_RE, ''),
    'note',
    options,
    ['explicit'],
  )
}

function maybePreference(statement: string, options: ExtractMemoryCandidatesOptions) {
  const likeMatch = statement.match(LIKE_RE)
  if (likeMatch?.[1])
    return createCandidate(`用户喜欢${cleanContent(likeMatch[1])}`, 'preference', options, ['preference'])

  const dislikeMatch = statement.match(DISLIKE_RE)
  if (dislikeMatch?.[1])
    return createCandidate(`用户不喜欢${cleanContent(dislikeMatch[1])}`, 'preference', options, ['preference'])

  const englishLikeMatch = statement.match(ENGLISH_LIKE_RE)
  if (englishLikeMatch?.[1])
    return createCandidate(`User likes ${cleanContent(englishLikeMatch[1])}`, 'preference', options, ['preference'])
}

function maybeProfile(statement: string, options: ExtractMemoryCandidatesOptions) {
  const goalMatch = statement.match(GOAL_RE)
  if (goalMatch?.[1])
    return createCandidate(`用户的目标是${cleanContent(goalMatch[1])}`, 'profile', options, ['profile', 'goal'])

  const identityMatch = statement.match(IDENTITY_RE)
  if (identityMatch?.[1])
    return createCandidate(`用户是${cleanContent(identityMatch[1])}`, 'profile', options, ['profile'])

  const backgroundMatch = statement.match(BACKGROUND_RE)
  if (backgroundMatch?.[1])
    return createCandidate(`用户${cleanContent(backgroundMatch[1])}`, 'profile', options, ['profile', 'background'])
}

export function extractMemoryCandidates(options: ExtractMemoryCandidatesOptions) {
  const candidates: ElectronMemoryCreateRequest[] = []
  const seen = new Set<string>()

  for (const statement of splitStatements(options.userText)) {
    const candidate = maybeExplicitMemory(statement, options)
      ?? maybePreference(statement, options)
      ?? maybeProfile(statement, options)

    if (!candidate || seen.has(candidate.content))
      continue

    seen.add(candidate.content)
    candidates.push(candidate)
  }

  return candidates.slice(0, 3)
}

export function initializeMemoryCandidateBridge() {
  if (initialized)
    return

  initialized = true

  const chatOrchestrator = useChatOrchestratorStore()
  const memoryStore = useMemorySettingsStore()

  chatOrchestrator.onChatTurnComplete(async (chat, context) => {
    if (typeof context.message.content !== 'string')
      return

    const candidates = extractMemoryCandidates({
      userText: context.message.content,
      assistantText: chat.outputText,
      sessionId: context.message.id,
    })

    for (const candidate of candidates)
      await saveOrMergeCandidate(candidate, memoryStore)
  })
}

export function resetMemoryCandidateBridgeForTest() {
  initialized = false
}
