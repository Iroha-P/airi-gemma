import type { MemoryDatabase } from './database'
import type { MemoryRepository } from './repository'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createMemoryDatabase } from './database'
import { createMemoryRepository } from './repository'

describe('memory repository', () => {
  let database: MemoryDatabase
  let repository: MemoryRepository

  beforeEach(async () => {
    database = await createMemoryDatabase()
    repository = createMemoryRepository(database)
  })

  afterEach(async () => {
    await database.close()
  })

  it('creates, lists, updates, deletes, and clears memories', async () => {
    const first = await repository.create({
      content: 'User is moving from civil engineering to AI engineering.',
      type: 'profile',
      tags: ['career', 'ai', 'career'],
      importance: 5,
      privacy: 'local',
    })
    await repository.create({
      content: 'AIRI should avoid touching MiniBox files.',
      type: 'preference',
      tags: ['boundary'],
      importance: 5,
      privacy: 'sensitive',
    })

    expect(first.tags).toEqual(['career', 'ai'])

    const all = await repository.list()
    expect(all).toHaveLength(2)

    const searched = await repository.list({ query: 'MiniBox' })
    expect(searched).toHaveLength(1)
    expect(searched[0].type).toBe('preference')

    const updated = await repository.update({
      id: first.id,
      content: 'User is studying robotics and preparing for algorithm interviews.',
      tags: ['career', 'robotics'],
      importance: 4,
    })
    expect(updated.importance).toBe(4)
    expect(updated.tags).toEqual(['career', 'robotics'])

    await repository.delete(first.id)
    expect(await repository.list()).toHaveLength(1)

    const cleared = await repository.clear()
    expect(cleared.deleted).toBe(1)
    expect(await repository.list()).toHaveLength(0)
  })

  it('returns status counts by memory state', async () => {
    await repository.create({ content: 'Active memory' })
    await repository.create({ content: 'Needs review memory', status: 'needs_review' })
    await repository.create({ content: 'Archived memory', status: 'archived' })

    const status = await repository.getStatus()
    expect(status.total).toBe(3)
    expect(status.active).toBe(1)
    expect(status.needsReview).toBe(1)
    expect(status.archived).toBe(1)
  })

  it('tracks access count only when list requests opt in', async () => {
    const memory = await repository.create({
      content: 'User is preparing for algorithm interviews.',
      type: 'profile',
    })

    const passive = await repository.list({ query: 'algorithm' })
    expect(passive[0].accessCount).toBe(0)
    expect(passive[0].lastAccessedAt).toBeNull()

    const tracked = await repository.list({ query: 'algorithm', trackAccess: true })
    expect(tracked[0].id).toBe(memory.id)
    expect(tracked[0].accessCount).toBe(1)
    expect(tracked[0].lastAccessedAt).toEqual(expect.any(String))

    const trackedAgain = await repository.list({ query: 'algorithm', trackAccess: true })
    expect(trackedAgain[0].accessCount).toBe(2)
  })

  it('keeps unsafe memories out of active state at the write boundary', async () => {
    const created = await repository.create({
      content: 'User private file path is C:\\Users\\me\\chat-export.txt.',
      privacy: 'local',
      status: 'active',
    })

    expect(created.status).toBe('needs_review')
    expect(created.privacy).toBe('secret')
    expect(created.tags).toContain('safety-review')
    expect(created.metadata?.safety).toEqual(expect.objectContaining({
      safe: false,
    }))

    const updated = await repository.update({
      id: created.id,
      status: 'active',
    })

    expect(updated.status).toBe('needs_review')
    expect(updated.privacy).toBe('secret')

    const archived = await repository.update({
      id: created.id,
      status: 'archived',
    })

    expect(archived.status).toBe('archived')
    expect(archived.privacy).toBe('secret')
  })

  it('keeps memories with unsafe summaries out of active state at the write boundary', async () => {
    const created = await repository.create({
      content: 'Plain memory content.',
      privacy: 'local',
      status: 'active',
      summary: 'Imported from C:\\Users\\me\\wechat-export.txt.',
    })

    expect(created.status).toBe('needs_review')
    expect(created.privacy).toBe('secret')
    expect(created.tags).toContain('safety-review')
    expect(created.metadata?.safety).toEqual(expect.objectContaining({
      safe: false,
      findings: expect.arrayContaining([
        expect.objectContaining({ kind: 'local_path' }),
      ]),
    }))

    const reviewed = await repository.update({
      id: created.id,
      content: 'Safe edited content.',
      privacy: 'local',
      status: 'active',
      summary: 'Still imported from C:\\Users\\me\\wechat-export.txt.',
    })

    expect(reviewed.status).toBe('needs_review')
    expect(reviewed.privacy).toBe('secret')
  })

  it('rejects empty memory content', async () => {
    await expect(repository.create({ content: '   ' })).rejects.toThrow('Memory content cannot be empty')
  })
})
