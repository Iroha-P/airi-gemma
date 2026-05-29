import type { ElectronMemoryIngestRequest, ElectronMemoryIngestResult } from '../../../../shared/eventa'

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { importChatRecordArchive } from './chat-records'

describe('chat record archive importer', () => {
  let rootDir: string

  beforeEach(async () => {
    rootDir = join(tmpdir(), `airi-memory-chat-${crypto.randomUUID()}`)
    await mkdir(join(rootDir, 'wechat'), { recursive: true })
    await mkdir(join(rootDir, '.cache'), { recursive: true })
    await writeFile(join(rootDir, 'wechat', 'room.txt'), [
      '[2026-05-01 12:30:00] Alice: 我今天在整理 AIRI 的长期记忆方案。',
      '这是一条换行延续内容。',
      '[2026-05-01 12:31:00] Bob: 记得把微信、飞书、QQ 都先做本地审查。',
      '',
    ].join('\n'))
    await writeFile(join(rootDir, '.cache', 'ignored.txt'), '[2026-05-01 12:00:00] Hidden: ignored')
    await writeFile(join(rootDir, 'empty.txt'), '   ')
    await writeFile(join(rootDir, 'image.png'), 'ignored')
  })

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true })
  })

  it('imports exported chat text as reviewable conversation memories', async () => {
    const ingest = vi.fn(async (_request: ElectronMemoryIngestRequest): Promise<ElectronMemoryIngestResult> => ({
      created: [],
      skipped: [],
    }))

    const result = await importChatRecordArchive({
      rootDir,
      sourceType: 'import_wechat',
      sourceLabel: 'WeChat chat archive',
      defaults: {
        privacy: 'sensitive',
        tags: ['wechat'],
      },
      ingest,
    })

    expect(result.filesScanned).toBe(1)
    expect(result.messagesImported).toBe(2)
    expect(result.emptyFiles).toEqual(['empty.txt'])
    expect(result.unsupportedFiles).toEqual(['image.png'])
    expect(ingest).toHaveBeenCalledWith({
      source: {
        type: 'import_wechat',
        id: rootDir,
        label: 'WeChat chat archive',
      },
      defaults: {
        privacy: 'sensitive',
        status: 'needs_review',
        tags: ['chat-record', 'wechat'],
      },
      entries: [
        {
          externalId: 'wechat/room.txt:1',
          content: 'Alice: 我今天在整理 AIRI 的长期记忆方案。\n这是一条换行延续内容。',
          summary: 'Alice / 2026-05-01 12:30:00',
          type: 'conversation',
          tags: ['wechat'],
          occurredAt: '2026-05-01T12:30:00.000+08:00',
          metadata: {
            chat: {
              line: 1,
              platform: 'wechat',
              speaker: 'Alice',
            },
            file: {
              path: join(rootDir, 'wechat', 'room.txt'),
              relativePath: 'wechat/room.txt',
            },
          },
        },
        {
          externalId: 'wechat/room.txt:3',
          content: 'Bob: 记得把微信、飞书、QQ 都先做本地审查。',
          summary: 'Bob / 2026-05-01 12:31:00',
          type: 'conversation',
          tags: ['wechat'],
          occurredAt: '2026-05-01T12:31:00.000+08:00',
          metadata: {
            chat: {
              line: 3,
              platform: 'wechat',
              speaker: 'Bob',
            },
            file: {
              path: join(rootDir, 'wechat', 'room.txt'),
              relativePath: 'wechat/room.txt',
            },
          },
        },
      ],
    })
  })
})
