import type { ElectronRoutineDraft, ElectronRoutineItem } from '../../../../shared/eventa'
import type { RoutineManager } from './index'

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createContext, defineInvoke } from '@moeru/eventa'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  electronRoutineDelete,
  electronRoutineDraft,
  electronRoutineList,
  electronRoutineSave,
} from '../../../../shared/eventa'
import { createRoutineManager, createRoutineService } from './index'

const tmpRoots: string[] = []

async function createTempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'airi-routines-'))
  tmpRoots.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tmpRoots.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('routine manager', () => {
  it('drafts a routine from multiline task text without executing it', async () => {
    const manager = createRoutineManager({ routinesDir: await createTempDir() })

    const draft = manager.draft({
      text: [
        'Back up workspace',
        'Run pnpm typecheck',
        'Summarize the result',
      ].join('\n'),
    })

    expect(draft).toMatchObject({
      slug: 'back-up-workspace',
      title: 'Back up workspace',
      status: 'draft',
      steps: [
        'Back up workspace',
        'Run pnpm typecheck',
        'Summarize the result',
      ],
    })
    expect(draft.content).toContain('## Steps')
    expect(draft.content).toContain('- Run pnpm typecheck')
  })

  it('saves, lists, and deletes routines as Markdown files', async () => {
    const routinesDir = await createTempDir()
    const manager = createRoutineManager({ routinesDir })
    const draft = manager.draft({
      text: [
        'Publish release notes',
        '- Collect merged PRs',
        '- Write summary',
      ].join('\n'),
    })

    const saved = await manager.save(draft)

    expect(saved).toMatchObject({
      slug: 'publish-release-notes',
      title: 'Publish release notes',
      status: 'draft',
      steps: [
        'Publish release notes',
        'Collect merged PRs',
        'Write summary',
      ],
    })

    const markdown = await readFile(join(routinesDir, 'publish-release-notes.md'), 'utf-8')
    expect(markdown).toContain('---\n')
    expect(markdown).toContain('slug: publish-release-notes')
    expect(markdown).toContain('title: Publish release notes')
    expect(markdown).toContain('status: draft')
    expect(markdown).toContain('## Steps')
    expect(markdown).toContain('- Collect merged PRs')

    await expect(manager.list()).resolves.toEqual([expect.objectContaining({
      slug: 'publish-release-notes',
      title: 'Publish release notes',
      path: join(routinesDir, 'publish-release-notes.md'),
    })])

    await manager.delete({ slug: 'publish-release-notes' })

    await expect(manager.list()).resolves.toEqual([])
  })

  it('creates a stable fallback slug for non-latin routine titles', async () => {
    const manager = createRoutineManager({ routinesDir: await createTempDir() })

    const draft = manager.draft({
      text: [
        '整理本地记忆',
        '导出 LLMWiki',
        '检查待确认记忆',
      ].join('\n'),
    })

    expect(draft.slug).toMatch(/^routine-[a-z0-9]+$/)
    expect(draft.title).toBe('整理本地记忆')
  })
  it('skips malformed user-edited Markdown files when listing routines', async () => {
    const routinesDir = await createTempDir()
    const manager = createRoutineManager({ routinesDir })
    const draft = manager.draft({
      text: [
        'Check local stack',
        'Open status page',
      ].join('\n'),
    })
    await manager.save(draft)
    await writeFile(join(routinesDir, 'broken.md'), '---\nslug: broken\n---\n\nNo routine title here\n', 'utf-8')

    await expect(manager.list()).resolves.toEqual([
      expect.objectContaining({ slug: 'check-local-stack' }),
    ])
  })
})

describe('routine service eventa adapter', () => {
  it('registers routine invokes against the provided manager', async () => {
    const context = createContext()
    const draft: ElectronRoutineDraft = {
      slug: 'morning-check',
      title: 'Morning check',
      status: 'draft',
      steps: ['Open dashboard'],
      content: '## Steps\n\n- Open dashboard\n',
    }
    const saved: ElectronRoutineItem = {
      ...draft,
      path: 'F:/airi-memory/skills/morning-check.md',
      updatedAt: '2026-05-11T00:00:00.000Z',
    }
    const manager: RoutineManager = {
      routinesDir: 'F:/airi-memory/skills',
      draft: vi.fn(() => draft),
      save: vi.fn(async () => saved),
      list: vi.fn(async () => [saved]),
      delete: vi.fn(async () => {}),
    }

    createRoutineService({ context: context as never, manager })

    await expect(defineInvoke(context, electronRoutineDraft)({ text: 'Morning check\nOpen dashboard' })).resolves.toEqual(draft)
    await expect(defineInvoke(context, electronRoutineSave)(draft)).resolves.toEqual(saved)
    await expect(defineInvoke(context, electronRoutineList)()).resolves.toEqual({ items: [saved] })
    await expect(defineInvoke(context, electronRoutineDelete)({ slug: 'morning-check' })).resolves.toBeUndefined()

    expect(manager.draft).toHaveBeenCalledWith({ text: 'Morning check\nOpen dashboard' })
    expect(manager.save).toHaveBeenCalledWith(draft)
    expect(manager.list).toHaveBeenCalled()
    expect(manager.delete).toHaveBeenCalledWith({ slug: 'morning-check' })
  })
})
