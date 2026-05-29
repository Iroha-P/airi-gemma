import type { ElectronDreamReport } from '../../../../shared/eventa'

import { describe, expect, it } from 'vitest'

import { sanitizeDreamReportForCloudReview } from './sanitizer'

describe('dream sanitizer gate', () => {
  it('removes local paths, raw chat markers, and secret candidates from sanitized reports', () => {
    const result = sanitizeDreamReportForCloudReview(report({
      summary: '用户提到 F:\\project\\airi-gemma、/Users/me/airi-vault 和 [微信] 原始聊天，api_key=sk-local-dream-secret。',
      memoryCandidates: [
        {
          content: '整理 F:\\secret\\private.txt 中的 [微信] 原始聊天。',
          type: 'note',
          privacy: 'local',
          importance: 3,
          tags: ['dream'],
        },
        {
          content: 'secret candidate',
          type: 'note',
          privacy: 'secret',
          importance: 5,
          tags: ['secret'],
        },
      ],
      loraDatasetCandidates: [{
        messages: [
          { role: 'user', content: '读取 /home/user/private-notes.md' },
          { role: 'assistant', content: 'password=local-dream-password-123456' },
        ],
        tags: ['dream'],
      }],
    }))

    expect(result.sanitizedReport.summary).not.toContain('F:\\project')
    expect(result.sanitizedReport.summary).not.toContain('/Users/me')
    expect(result.sanitizedReport.summary).not.toContain('api_key')
    expect(result.sanitizedReport.summary).not.toContain('[微信]')
    expect(result.sanitizedReport.memoryCandidates).toEqual([{
      content: '整理 [local path] 中的 [chat archive] 原始聊天。',
      type: 'note',
      privacy: 'local',
      importance: 3,
      tags: ['dream'],
    }])
    expect(result.sanitizedReport.loraDatasetCandidates[0]?.messages).toEqual([
      { role: 'user', content: '读取 [local path]' },
      { role: 'assistant', content: '[credential]' },
    ])
    expect(result.redactionLog).toEqual(expect.arrayContaining([
      { field: 'summary', reason: 'credential' },
      { field: 'summary', reason: 'local_path' },
      { field: 'summary', reason: 'raw_chat' },
      { field: 'memoryCandidates[0].content', reason: 'local_path' },
      { field: 'memoryCandidates[0].content', reason: 'raw_chat' },
      { field: 'memoryCandidates[1]', reason: 'secret_memory' },
      { field: 'loraDatasetCandidates[0].messages[0].content', reason: 'local_path' },
      { field: 'loraDatasetCandidates[0].messages[1].content', reason: 'credential' },
    ]))
  })
})

function report(overrides: Partial<ElectronDreamReport>): ElectronDreamReport {
  return {
    id: 'dream-1',
    generatedAt: '2026-05-13T00:00:00.000Z',
    summary: 'Dream summary',
    memoryCandidates: [],
    routineCandidates: [],
    llmWikiDrafts: [],
    loraDatasetCandidates: [],
    evolutionSuggestionIds: [],
    withheld: [],
    ...overrides,
  }
}
