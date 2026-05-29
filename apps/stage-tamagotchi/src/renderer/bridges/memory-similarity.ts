const NORMALIZE_RE = /[\s:：,，。.!！？?（）()[\]{}'"“”‘’、；;]+/gu
const ENGLISH_WORD_RE = /[a-z0-9][a-z0-9-]*/giu
const CJK_RE = /[\u3400-\u9FFF]+/gu

const SEMANTIC_PHRASES: Array<[string, string]> = [
  ['本科', 'education_undergrad'],
  ['大学', 'education_undergrad'],
  ['本科学历', 'education_undergrad'],
  ['研究生', 'education_grad'],
  ['硕士', 'education_grad'],
  ['专业', 'education_major'],
  ['学院', 'education_school'],
  ['学校', 'education_school'],
  ['土木工程', 'civil_engineering'],
  ['土木', 'civil_engineering'],
  ['智能机器人', 'robotics'],
  ['机器人', 'robotics'],
  ['先进制造', 'advanced_manufacturing'],
  ['算法岗', 'algorithm_role'],
  ['算法工程师', 'algorithm_role'],
  ['算法岗位', 'algorithm_role'],
  ['大厂', 'big_tech'],
  ['互联网大厂', 'big_tech'],
  ['面试', 'interview'],
  ['求职', 'interview'],
  ['准备', 'prepare'],
  ['目标', 'goal'],
  ['想', 'goal'],
  ['喜欢', 'preference_like'],
  ['偏好', 'preference_like'],
  ['不喜欢', 'preference_dislike'],
  ['讨厌', 'preference_dislike'],
  ['分步骤', 'step_by_step'],
  ['步骤', 'step_by_step'],
  ['解释', 'explanation'],
]

const STOP_TOKENS = new Set([
  '用户',
  '的是',
  '现在',
  'the',
  'and',
  'for',
  'with',
])

export function normalizeMemoryText(content: string) {
  return content
    .normalize('NFKC')
    .toLowerCase()
    .replace(NORMALIZE_RE, '')
    .trim()
}

function addCjkBigrams(tokens: Set<string>, text: string) {
  const cjkMatches = text.matchAll(CJK_RE)

  for (const match of cjkMatches) {
    const value = match[0]
    if (value.length < 2) {
      tokens.add(value)
      continue
    }

    for (let index = 0; index < value.length - 1; index++) {
      const token = value.slice(index, index + 2)
      if (!STOP_TOKENS.has(token))
        tokens.add(token)
    }
  }
}

export function tokenizeMemoryText(content: string) {
  const normalized = normalizeMemoryText(content)
  const tokens = new Set<string>()

  for (const [phrase, token] of SEMANTIC_PHRASES) {
    if (normalized.includes(normalizeMemoryText(phrase)))
      tokens.add(`concept:${token}`)
  }

  for (const match of normalized.matchAll(ENGLISH_WORD_RE)) {
    const token = match[0]
    if (!STOP_TOKENS.has(token))
      tokens.add(token)
  }

  addCjkBigrams(tokens, normalized)

  return tokens
}

function getConceptTokens(tokens: Set<string>) {
  return new Set([...tokens].filter(token => token.startsWith('concept:')))
}

function intersectionSize(first: Set<string>, second: Set<string>) {
  let count = 0

  for (const token of first) {
    if (second.has(token))
      count += 1
  }

  return count
}

export function getMemorySimilarityScore(first: string, second: string) {
  const normalizedFirst = normalizeMemoryText(first)
  const normalizedSecond = normalizeMemoryText(second)

  if (!normalizedFirst || !normalizedSecond)
    return 0

  if (normalizedFirst === normalizedSecond)
    return 1

  if (normalizedFirst.length >= 8 && normalizedSecond.includes(normalizedFirst))
    return 0.95
  if (normalizedSecond.length >= 8 && normalizedFirst.includes(normalizedSecond))
    return 0.95

  const firstTokens = tokenizeMemoryText(first)
  const secondTokens = tokenizeMemoryText(second)
  const shared = intersectionSize(firstTokens, secondTokens)

  if (shared === 0)
    return 0

  const union = new Set([...firstTokens, ...secondTokens]).size
  const jaccard = shared / union
  const overlap = shared / Math.min(firstTokens.size, secondTokens.size)
  const firstConcepts = getConceptTokens(firstTokens)
  const secondConcepts = getConceptTokens(secondTokens)
  const sharedConcepts = intersectionSize(firstConcepts, secondConcepts)

  if (sharedConcepts >= 2) {
    const conceptOverlap = sharedConcepts / Math.min(firstConcepts.size, secondConcepts.size)
    return Math.max(jaccard, overlap * 0.85, conceptOverlap * 0.92)
  }

  return Math.max(jaccard, overlap * 0.85)
}

export function isSimilarMemoryContent(first: string, second: string) {
  return getMemorySimilarityScore(first, second) >= 0.68
}
