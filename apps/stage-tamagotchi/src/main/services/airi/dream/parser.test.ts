import { describe, expect, it } from 'vitest'

import { parseDreamModelOutput } from './parser'

describe('dream output parser', () => {
  it('parses valid local Gemma JSON into a normalized dream report', () => {
    const report = parseDreamModelOutput({
      id: 'dream-1',
      generatedAt: new Date('2026-05-13T00:00:00.000Z'),
      rawModelOutput: JSON.stringify({
        summary: 'AIRI整理了最近几个小时的记忆系统工作。',
        memoryCandidates: [
          {
            content: '用户希望 AIRI 用本地 Gemma 做梦整理近期经历。',
            type: 'preference',
            privacy: 'local',
            importance: 4,
            tags: ['dream', 'memory'],
            status: 'active',
          },
          {
            content: '   ',
            type: 'note',
          },
        ],
        routineCandidates: [{ title: '阶段收口', steps: ['跑测试', '更新文档'] }],
        llmWikiDrafts: [{ title: 'Local Dream', content: 'Dream Cycle 设计。' }],
        loraDatasetCandidates: [{
          messages: [
            { role: 'user', content: '让 AIRI 学会做梦。' },
            { role: 'assistant', content: '可以用本地 Gemma 生成候选记忆。' },
          ],
          tags: ['memory-use'],
        }],
      }),
      evolutionSuggestionIds: ['evolve-1'],
      withheld: [{ sourceId: 'secret-1', reason: 'secret_memory' }],
      includeLoraCandidates: true,
    })

    expect(report).toMatchObject({
      id: 'dream-1',
      generatedAt: '2026-05-13T00:00:00.000Z',
      summary: 'AIRI整理了最近几个小时的记忆系统工作。',
      evolutionSuggestionIds: ['evolve-1'],
      withheld: [{ sourceId: 'secret-1', reason: 'secret_memory' }],
    })
    expect(report.memoryCandidates).toEqual([{
      content: '用户希望 AIRI 用本地 Gemma 做梦整理近期经历。',
      type: 'preference',
      privacy: 'local',
      importance: 4,
      tags: ['dream', 'memory'],
    }])
    expect(report.loraDatasetCandidates).toHaveLength(1)
  })

  it('returns a fallback report when local Gemma output is invalid JSON', () => {
    const report = parseDreamModelOutput({
      id: 'dream-fallback',
      generatedAt: new Date('2026-05-13T00:00:00.000Z'),
      rawModelOutput: 'not json',
      evolutionSuggestionIds: [],
      withheld: [],
      includeLoraCandidates: true,
    })

    expect(report.summary).toContain('Local Gemma dream output could not be parsed')
    expect(report.rawModelOutput).toBe('not json')
    expect(report.memoryCandidates).toEqual([])
  })
})
