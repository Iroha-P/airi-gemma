import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { describe, expect, it } from 'vitest'

import { compactMemoryProfile } from './profile-compactor'

describe('memory profile compactor', () => {
  it('groups active non-secret memories into a compact profile and withholds unsafe entries', () => {
    const result = compactMemoryProfile({
      generatedAt: new Date('2026-05-12T00:00:00.000Z'),
      memories: [
        memory({
          id: 'profile-1',
          type: 'profile',
          content: 'User is an FDU intelligent robotics student transitioning into software engineering.',
          tags: ['education'],
          importance: 5,
        }),
        memory({
          id: 'preference-1',
          type: 'preference',
          content: 'User prefers concise progress reports.',
          tags: ['communication'],
          importance: 4,
        }),
        memory({
          id: 'habit-1',
          type: 'habit',
          content: 'User studies algorithm interviews at night.',
          importance: 3,
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
          content: 'AIRI Gemma is building local-first long-term memory.',
          tags: ['airi-gemma'],
          importance: 4,
        }),
        memory({
          id: 'knowledge-1',
          type: 'knowledge',
          content: 'LoRA samples should be reviewed before training.',
          importance: 3,
        }),
        memory({
          id: 'secret-1',
          type: 'profile',
          content: 'secret token should not appear',
          privacy: 'secret',
        }),
        memory({
          id: 'pending-1',
          type: 'profile',
          content: 'pending memory should not appear',
          status: 'needs_review',
        }),
        memory({
          id: 'unsafe-1',
          type: 'profile',
          content: 'Local path C:\\Users\\me\\secret.txt should not appear',
        }),
      ],
    })

    expect(result.generatedAt).toBe('2026-05-12T00:00:00.000Z')
    expect(result.sourceIds).toEqual([
      'profile-1',
      'preference-1',
      'habit-1',
      'boundary-1',
      'project-1',
      'knowledge-1',
    ])
    expect(result.withheld).toEqual([
      { id: 'secret-1', reason: 'secret_memory' },
      { id: 'pending-1', reason: 'not_active' },
      { id: 'unsafe-1', reason: 'safety_risk' },
    ])
    expect(result.sections.map(section => section.key)).toEqual([
      'profile',
      'preferences',
      'habits',
      'boundaries',
      'projects',
      'knowledge',
    ])
    expect(result.markdown).toContain('# AIRI Compact Profile')
    expect(result.markdown).toContain('User is an FDU intelligent robotics student')
    expect(result.markdown).toContain('Ask before deleting user files.')
    expect(result.markdown).toContain('LoRA samples should be reviewed before training.')
    expect(result.markdown).not.toContain('secret token')
    expect(result.markdown).not.toContain('pending memory')
    expect(result.markdown).not.toContain('C:\\Users\\me')
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
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
    ...overrides,
  }
}
