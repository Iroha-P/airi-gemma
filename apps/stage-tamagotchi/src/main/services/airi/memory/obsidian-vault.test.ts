import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { exportMemoryObsidianVault } from './obsidian-vault'

describe('memory obsidian vault export', () => {
  let outputDir: string

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'airi-obsidian-vault-'))
  })

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true })
  })

  it('exports active non-secret memories into an obsidian-friendly AIRI-Brain vault', async () => {
    const result = await exportMemoryObsidianVault({
      outputDir,
      exportedAt: new Date('2026-05-12T00:00:00.000Z'),
      memories: [
        memory({
          id: 'profile-1',
          type: 'profile',
          content: 'The user studies intelligent robotics and is transitioning into software engineering.',
          tags: ['profile', 'education'],
          importance: 5,
        }),
        memory({
          id: 'boundary-1',
          type: 'preference',
          content: 'Ask before deleting user files.',
          tags: ['boundary', 'safety'],
          importance: 5,
        }),
        memory({
          id: 'project-1',
          type: 'project',
          content: 'AIRI Gemma has a local memory service MVP.',
          tags: ['airi-gemma', 'project'],
          importance: 4,
        }),
        memory({
          id: 'knowledge-1',
          type: 'knowledge',
          content: 'LoRA training data should keep private facts out of public exports.',
          tags: ['lora', 'privacy'],
          importance: 4,
        }),
        memory({
          id: 'note-1',
          type: 'note',
          content: 'The user prefers concise progress reports.',
          tags: ['communication'],
          importance: 3,
        }),
        memory({
          id: 'secret-1',
          type: 'note',
          content: 'secret token should not be exported',
          privacy: 'secret',
        }),
        memory({
          id: 'pending-1',
          type: 'profile',
          content: 'pending memory should not be exported',
          status: 'needs_review',
        }),
        memory({
          id: 'unsafe-1',
          type: 'profile',
          content: 'Local path C:\\Users\\me\\private-notes.md should not be exported',
        }),
      ],
    })

    expect(result.files.map(file => file.relativePath)).toEqual([
      'AIRI-Brain.md',
      'index.md',
      'log.md',
      '05-compact-profile.md',
      '.airi/manifest.json',
      '10-profile/user-profile.md',
      '20-boundaries/user-boundaries.md',
      '30-projects/airi-gemma.md',
      '40-knowledge/knowledge-base.md',
      '50-memories/memories.md',
    ])

    const index = await readFile(join(outputDir, 'AIRI-Brain.md'), 'utf8')
    const contentIndex = await readFile(join(outputDir, 'index.md'), 'utf8')
    const exportLog = await readFile(join(outputDir, 'log.md'), 'utf8')
    const compactProfile = await readFile(join(outputDir, '05-compact-profile.md'), 'utf8')
    const manifest = JSON.parse(await readFile(join(outputDir, '.airi', 'manifest.json'), 'utf8')) as {
      schemaVersion: number
      sourceOfTruth: string
      totals: {
        activeMemories: number
        inboxMemories: number
        publicProfilePreviewMemories: number
      }
      privacy: {
        excludesSecretMemories: boolean
        excludesRawChatFromPublicProfile: boolean
        inboxRequiresReview: boolean
        excludesUnsafeContent: boolean
      }
      files: Array<{ relativePath: string, count: number }>
    }
    const profile = await readFile(join(outputDir, '10-profile', 'user-profile.md'), 'utf8')
    const boundaries = await readFile(join(outputDir, '20-boundaries', 'user-boundaries.md'), 'utf8')
    const project = await readFile(join(outputDir, '30-projects', 'airi-gemma.md'), 'utf8')
    const knowledge = await readFile(join(outputDir, '40-knowledge', 'knowledge-base.md'), 'utf8')
    const notes = await readFile(join(outputDir, '50-memories', 'memories.md'), 'utf8')

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      sourceOfTruth: 'memory-db',
      totals: {
        activeMemories: 5,
        inboxMemories: 0,
        publicProfilePreviewMemories: 0,
      },
      privacy: {
        excludesSecretMemories: true,
        excludesRawChatFromPublicProfile: true,
        inboxRequiresReview: true,
        excludesUnsafeContent: true,
      },
    })
    expect(manifest.files.map(file => file.relativePath)).toContain('10-profile/user-profile.md')
    expect(manifest.files.map(file => file.relativePath)).toContain('index.md')
    expect(manifest.files.map(file => file.relativePath)).toContain('log.md')
    expect(manifest.files).toContainEqual(expect.objectContaining({
      relativePath: 'index.md',
      kind: 'index',
    }))
    expect(manifest.files).toContainEqual(expect.objectContaining({
      relativePath: 'log.md',
      kind: 'export_log',
    }))
    expect(JSON.stringify(manifest)).not.toContain('secret token')
    expect(JSON.stringify(manifest)).not.toContain(outputDir)
    expect(index).toContain('[[10-profile/user-profile|User Profile]]')
    expect(index).toContain('[[05-compact-profile|Compact Profile]]')
    expect(index).toContain('source: airi-memory-service')
    expect(contentIndex).toContain('# AIRI-Brain Index')
    expect(contentIndex).toContain('[[10-profile/user-profile|User Profile]]')
    expect(contentIndex).toContain('Path: `10-profile/user-profile.md`')
    expect(contentIndex).not.toContain('secret token')
    expect(exportLog).toContain('# AIRI-Brain Export Log')
    expect(exportLog).toContain('## [2026-05-12] export | AIRI-Brain vault')
    expect(exportLog).toContain('Active memories: 5')
    expect(exportLog).toContain('Inbox candidates: 0')
    expect(exportLog).not.toContain(outputDir)
    expect(compactProfile).toContain('# AIRI Compact Profile')
    expect(compactProfile).toContain('transitioning into software engineering')
    expect(profile).toContain('transitioning into software engineering')
    expect(profile).not.toContain('C:\\Users\\me')
    expect(compactProfile).not.toContain('C:\\Users\\me')
    expect(boundaries).toContain('Ask before deleting user files')
    expect(project).toContain('local memory service MVP')
    expect(knowledge).toContain('LoRA training data')
    expect(notes).toContain('concise progress reports')
    expect(profile).not.toContain('secret token')
    expect(profile).not.toContain('pending memory')
  })

  it('separates pending persona candidates and public-safe profile previews', async () => {
    const result = await exportMemoryObsidianVault({
      outputDir,
      exportedAt: new Date('2026-05-21T00:00:00.000Z'),
      memories: [
        memory({
          id: 'private-profile',
          type: 'profile',
          content: 'The real private user profile stays local.',
          tags: ['profile'],
          privacy: 'sensitive',
          status: 'active',
        }),
        memory({
          id: 'pending-persona',
          type: 'profile',
          content: 'Candidate from imported chat needs review.',
          tags: ['persona-candidate', 'profile'],
          privacy: 'sensitive',
          status: 'needs_review',
          metadata: {
            personaCandidate: {
              derivedFrom: 'import_lark:msg-1',
              kind: 'profile',
              reason: 'imported_self_description',
              reviewRequired: true,
            },
          },
        }),
        memory({
          id: 'public-demo',
          type: 'profile',
          content: 'Public demo user is a privacy-preserving AI agent builder.',
          tags: ['profile'],
          privacy: 'local',
          status: 'active',
          metadata: { profileVisibility: 'demo' },
        }),
        memory({
          id: 'raw-chat-demo',
          type: 'profile',
          content: 'Raw imported chat must not enter the public preview.',
          tags: ['profile'],
          privacy: 'local',
          sourceType: 'import_wechat',
          status: 'active',
          metadata: { profileVisibility: 'demo' },
        }),
        memory({
          id: 'unsafe-demo',
          type: 'profile',
          content: 'Public demo password=super-secret-token must not enter any vault page.',
          tags: ['profile'],
          privacy: 'local',
          status: 'active',
          metadata: { profileVisibility: 'demo' },
        }),
        memory({
          id: 'secret-candidate',
          type: 'profile',
          content: 'Secret persona candidate must not be exported.',
          tags: ['persona-candidate'],
          privacy: 'secret',
          status: 'needs_review',
          metadata: {
            personaCandidate: {
              derivedFrom: 'import_qq:msg-1',
              kind: 'profile',
              reason: 'imported_self_description',
              reviewRequired: true,
            },
          },
        }),
      ],
    })

    expect(result.files.map(file => file.relativePath)).toContain('00-inbox/persona-candidates.md')
    expect(result.files.map(file => file.relativePath)).toContain('80-public-profile/public-profile-preview.md')

    const index = await readFile(join(outputDir, 'AIRI-Brain.md'), 'utf8')
    const privateProfile = await readFile(join(outputDir, '10-profile', 'user-profile.md'), 'utf8')
    const pendingPersona = await readFile(join(outputDir, '00-inbox', 'persona-candidates.md'), 'utf8')
    const publicPreview = await readFile(join(outputDir, '80-public-profile', 'public-profile-preview.md'), 'utf8')

    expect(index).toContain('[[00-inbox/persona-candidates|Pending Persona Candidates]]')
    expect(index).toContain('[[80-public-profile/public-profile-preview|Public Profile Preview]]')
    expect(privateProfile).toContain('The real private user profile stays local.')
    expect(privateProfile).toContain('Public demo user is a privacy-preserving AI agent builder.')
    expect(privateProfile).not.toContain('Candidate from imported chat needs review.')
    expect(privateProfile).not.toContain('super-secret-token')
    expect(pendingPersona).toContain('Candidate from imported chat needs review.')
    expect(pendingPersona).toContain('Persona derived from: import_lark:msg-1')
    expect(pendingPersona).toContain('Persona reason: imported_self_description')
    expect(pendingPersona).not.toContain('Secret persona candidate')
    expect(publicPreview).toContain('Public demo user is a privacy-preserving AI agent builder.')
    expect(publicPreview).not.toContain('The real private user profile stays local.')
    expect(publicPreview).not.toContain('Raw imported chat')
    expect(publicPreview).not.toContain('import_wechat')
    expect(publicPreview).not.toContain('super-secret-token')
  })

  it('exports pending local dream candidates into a separate inbox page', async () => {
    const result = await exportMemoryObsidianVault({
      outputDir,
      exportedAt: new Date('2026-05-25T00:00:00.000Z'),
      memories: [
        memory({
          id: 'dream-candidate',
          type: 'event',
          content: 'Local dream suggests reviewing an evening memory consolidation habit.',
          tags: ['dream', 'memory-candidate'],
          privacy: 'local',
          sourceType: 'dream',
          status: 'needs_review',
          metadata: {
            dreamSessionId: 'dream-session-1',
            loraDatasetCandidate: true,
            requiresReview: true,
          },
        }),
        memory({
          id: 'secret-dream-candidate',
          type: 'event',
          content: 'Secret local dream candidate must stay out of Obsidian.',
          tags: ['dream', 'memory-candidate'],
          privacy: 'secret',
          sourceType: 'dream',
          status: 'needs_review',
          metadata: {
            dreamSessionId: 'dream-session-2',
            requiresReview: true,
          },
        }),
        memory({
          id: 'unsafe-dream-candidate',
          type: 'event',
          content: 'Local dream candidate has api_key=sk-local-dream-secret and must stay out.',
          tags: ['dream', 'memory-candidate'],
          privacy: 'local',
          sourceType: 'dream',
          status: 'needs_review',
          metadata: {
            dreamSessionId: 'dream-session-3',
            requiresReview: true,
          },
        }),
      ],
    })

    expect(result.files.map(file => file.relativePath)).toContain('00-inbox/dream-candidates.md')

    const index = await readFile(join(outputDir, 'AIRI-Brain.md'), 'utf8')
    const dreamCandidates = await readFile(join(outputDir, '00-inbox', 'dream-candidates.md'), 'utf8')

    expect(index).toContain('[[00-inbox/dream-candidates|Pending Dream Candidates]]')
    expect(dreamCandidates).toContain('Local dream suggests reviewing an evening memory consolidation habit.')
    expect(dreamCandidates).toContain('#dream #memory-candidate')
    expect(dreamCandidates).toContain('Dream session: dream-session-1')
    expect(dreamCandidates).toContain('Requires review: Yes')
    expect(dreamCandidates).toContain('LoRA dataset candidate: Yes')
    expect(dreamCandidates).not.toContain('Secret local dream candidate')
    expect(dreamCandidates).not.toContain('sk-local-dream-secret')
  })
})

function memory(overrides: Partial<ElectronMemoryItem>): ElectronMemoryItem {
  return {
    id: 'memory-1',
    scope: 'user',
    type: 'note',
    content: 'memory content',
    summary: null,
    tags: [],
    importance: 3,
    privacy: 'local',
    sourceType: 'manual',
    sourceId: null,
    status: 'active',
    createdAt: '2026-05-07T00:00:00.000Z',
    updatedAt: '2026-05-07T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
    ...overrides,
  }
}
