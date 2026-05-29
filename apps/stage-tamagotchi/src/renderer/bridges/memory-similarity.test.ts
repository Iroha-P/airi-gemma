import { describe, expect, it } from 'vitest'

import { getMemorySimilarityScore, isSimilarMemoryContent } from './memory-similarity'

describe('memory similarity', () => {
  it('matches semantically close Chinese education memories with different wording', () => {
    const score = getMemorySimilarityScore(
      '用户本科是土木工程。',
      '用户大学专业是土木。',
    )

    expect(score).toBeGreaterThanOrEqual(0.72)
    expect(isSimilarMemoryContent('用户本科是土木工程。', '用户大学专业是土木。')).toBe(true)
  })

  it('matches algorithm interview goals with role wording changes', () => {
    expect(isSimilarMemoryContent(
      '用户的目标是面试大厂算法岗。',
      '用户想准备算法工程师求职。',
    )).toBe(true)
  })

  it('does not match unrelated memories that only share generic user words', () => {
    expect(isSimilarMemoryContent(
      '用户喜欢分步骤解释。',
      '用户本科是土木工程。',
    )).toBe(false)
  })
})
