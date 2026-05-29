import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createMemoryManager } from './index'

describe('memory workflow smoke', () => {
  let rootDir: string
  let manager: Awaited<ReturnType<typeof createMemoryManager>>

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'airi-memory-workflow-'))
    manager = await createMemoryManager({
      dataDir: join(rootDir, 'memory', 'pglite'),
      llmWikiDir: join(rootDir, 'airi-brain', '70-llmwiki'),
    })
  }, 30_000)

  afterEach(async () => {
    await manager.close()
    await rm(rootDir, { recursive: true, force: true })
  }, 30_000)

  it('runs a synthetic import, review, retrieval, export, and backup path', async () => {
    const knowledgeDir = join(rootDir, 'imports', 'knowledge')
    const chatDir = join(rootDir, 'imports', 'chat')
    await mkdir(knowledgeDir, { recursive: true })
    await mkdir(chatDir, { recursive: true })

    await writeFile(
      join(knowledgeDir, 'airi-project.md'),
      [
        '---',
        'tags: [airi, project]',
        '---',
        '# AIRI Project',
        '',
        'AIRI uses a local-first memory service and review workbench before long-term recall.',
      ].join('\n'),
      'utf8',
    )

    await writeFile(
      join(chatDir, 'synthetic-chat.txt'),
      '[2026-05-28 09:30] User: AIRI should remember that synthetic smoke data must stay reviewable first.\n',
      'utf8',
    )

    const knowledgeImport = await manager.importKnowledgeBase({
      rootDir: knowledgeDir,
      sourceId: 'synthetic-knowledge',
      defaults: {
        privacy: 'local',
        tags: ['knowledge-base'],
      },
    })
    const chatImport = await manager.importChatRecords({
      rootDir: chatDir,
      sourceType: 'import_wechat',
      sourceId: 'synthetic-chat',
      defaults: {
        privacy: 'sensitive',
        tags: ['chat-smoke'],
      },
    })

    expect(knowledgeImport.created).toHaveLength(1)
    expect(chatImport.created).toHaveLength(2)
    const chatMemory = chatImport.created.find(item => item.type === 'conversation')
    const personaCandidate = chatImport.created.find(item => item.tags.includes('persona-candidate'))
    expect(chatMemory).toEqual(expect.objectContaining({
      status: 'needs_review',
      privacy: 'sensitive',
    }))
    expect(personaCandidate).toEqual(expect.objectContaining({
      status: 'needs_review',
      privacy: 'sensitive',
    }))

    const reviewedKnowledge = await manager.update({
      id: knowledgeImport.created[0]!.id,
      status: 'active',
      importance: 5,
    })
    await manager.create({
      content: 'Public demo user builds a privacy-preserving AIRI memory agent.',
      type: 'profile',
      privacy: 'public',
      status: 'active',
      tags: ['profile', 'demo'],
      metadata: { profileVisibility: 'demo' },
    })

    expect(reviewedKnowledge.status).toBe('active')

    const reviewWorkbench = await manager.getReviewWorkbench()
    expect(reviewWorkbench.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        item: expect.objectContaining({ id: chatMemory!.id }),
        reasons: expect.arrayContaining(['pending_candidate']),
      }),
    ]))

    const llmWiki = await manager.exportLlmWiki({ outputDir: join(rootDir, 'airi-brain', '70-llmwiki') })
    expect(llmWiki.files.length).toBeGreaterThan(0)
    await expect(readFile(join(rootDir, 'airi-brain', '70-llmwiki', 'projects', 'airi-gemma.md'), 'utf8'))
      .resolves.toContain('local-first memory service')

    const ragPreview = await manager.previewRagContext({ query: 'local-first memory', target: 'local' })
    expect(ragPreview.fragments.map(item => item.id)).toContain(reviewedKnowledge.id)
    expect(ragPreview.fragments.some(item => item.kind === 'llmwiki')).toBe(true)

    const obsidianVault = await manager.exportObsidianVault({ outputDir: join(rootDir, 'airi-brain') })
    expect(obsidianVault.files.map(file => file.relativePath)).toEqual(expect.arrayContaining([
      '00-inbox/persona-candidates.md',
      '80-public-profile/public-profile-preview.md',
    ]))
    await expect(readFile(join(rootDir, 'airi-brain', '80-public-profile', 'public-profile-preview.md'), 'utf8'))
      .resolves.toContain('privacy-preserving AIRI memory agent')

    const backup = await manager.exportBackup({ outputDir: join(rootDir, 'airi-brain', '95-backups') })
    const backupPreview = await manager.previewBackup({ backupFile: backup.files[0]!.path })
    expect(backupPreview.items.map(item => item.originalId)).toEqual(expect.arrayContaining([
      reviewedKnowledge.id,
      chatMemory!.id,
      personaCandidate!.id,
    ]))

    const publicProfilePreflight = await manager.previewExportPreflight({ surface: 'public_profile' })
    expect(publicProfilePreflight.summary.allowed).toBe(1)
  }, 30_000)
})
