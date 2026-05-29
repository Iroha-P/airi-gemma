import type { createContext } from '@moeru/eventa/adapters/electron/main'

import type {
  ElectronRoutineDraft,
  ElectronRoutineDraftRequest,
  ElectronRoutineItem,
  ElectronRoutineSaveRequest,
} from '../../../../shared/eventa'

import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { defineInvokeHandler } from '@moeru/eventa'
import { createContext as createElectronMainContext } from '@moeru/eventa/adapters/electron/main'
import { app, ipcMain } from 'electron'

import {
  electronRoutineDelete,
  electronRoutineDraft,
  electronRoutineList,
  electronRoutineSave,
} from '../../../../shared/eventa'

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const LIST_PREFIX_PATTERN = /^(?:[-*]|\d+[.)])\s+/u
const NEWLINE_PATTERN = /\r?\n/u
const DIACRITIC_PATTERN = /[\u0300-\u036F]/gu
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/gu
const EDGE_DASH_PATTERN = /^-+|-+$/gu
const STEPS_HEADING_PATTERN = /^##[^\S\r\n]+Steps[^\S\r\n]*$/imu

function normalizeStep(line: string) {
  return line.trim().replace(LIST_PREFIX_PATTERN, '').trim()
}

function collectSteps(text: string) {
  return text
    .split(NEWLINE_PATTERN)
    .map(normalizeStep)
    .filter(Boolean)
}

function slugify(input: string) {
  const slug = input
    .normalize('NFKD')
    .replace(DIACRITIC_PATTERN, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, '-')
    .replace(EDGE_DASH_PATTERN, '')

  if (!slug)
    return `routine-${createHash('sha256').update(input).digest('hex').slice(0, 10)}`

  return slug
}

function renderDraftContent(draft: Pick<ElectronRoutineDraft, 'steps' | 'title'>) {
  return [
    `# ${draft.title}`,
    '',
    '## Steps',
    '',
    ...draft.steps.map(step => `- ${step}`),
    '',
  ].join('\n')
}

function renderFrontmatter(item: Pick<ElectronRoutineItem, 'slug' | 'status' | 'title' | 'updatedAt'>) {
  return [
    '---',
    `slug: ${item.slug}`,
    `title: ${item.title}`,
    `status: ${item.status}`,
    `updatedAt: ${item.updatedAt}`,
    '---',
    '',
  ].join('\n')
}

function parseFrontmatter(markdown: string) {
  const match = markdown.match(FRONTMATTER_PATTERN)
  if (!match) {
    return {
      attributes: {} as Record<string, string>,
      body: markdown,
    }
  }

  const attributes = Object.fromEntries(
    match[1]
      .split(NEWLINE_PATTERN)
      .map((line) => {
        const separatorIndex = line.indexOf(':')
        if (separatorIndex === -1)
          return undefined

        const key = line.slice(0, separatorIndex).trim()
        const value = line.slice(separatorIndex + 1).trim()
        return key ? [key, value] : undefined
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  )

  return {
    attributes,
    body: markdown.slice(match[0].length),
  }
}

function findMarkdownTitle(body: string) {
  const titleLine = body
    .split(NEWLINE_PATTERN)
    .find(line => line.startsWith('# ') && !line.startsWith('## '))

  return titleLine?.slice(2).trim()
}

function parseRoutineMarkdown(markdown: string, path: string): ElectronRoutineItem {
  const { attributes, body } = parseFrontmatter(markdown)
  const stepsSection = body.split(STEPS_HEADING_PATTERN)[1] ?? ''
  const steps = collectSteps(stepsSection)
  const title = attributes.title || findMarkdownTitle(body)

  if (!title)
    throw new Error(`Routine title missing: ${path}`)

  const slug = slugify(attributes.slug || title)
  const updatedAt = attributes.updatedAt || new Date().toISOString()
  const draft = {
    slug,
    title,
    status: 'draft' as const,
    steps,
    content: body,
  }

  return {
    ...draft,
    path,
    updatedAt,
  }
}

function routinePath(routinesDir: string, slug: string) {
  return join(routinesDir, `${slugify(slug)}.md`)
}

export function createRoutineManager(options: { routinesDir: string }) {
  const routinesDir = options.routinesDir

  return {
    routinesDir,

    draft(payload: ElectronRoutineDraftRequest): ElectronRoutineDraft {
      const steps = collectSteps(payload.text)
      if (steps.length === 0)
        throw new Error('Routine draft text cannot be empty')

      const title = steps[0]
      const draft = {
        slug: slugify(title),
        title,
        status: 'draft' as const,
        steps,
        content: '',
      }

      return {
        ...draft,
        content: renderDraftContent(draft),
      }
    },

    async save(payload: ElectronRoutineSaveRequest): Promise<ElectronRoutineItem> {
      const title = payload.title.trim()
      if (!title)
        throw new Error('Routine title cannot be empty')

      const steps = payload.steps.map(normalizeStep).filter(Boolean)
      if (steps.length === 0)
        throw new Error('Routine steps cannot be empty')

      const updatedAt = new Date().toISOString()
      const item: ElectronRoutineItem = {
        slug: slugify(payload.slug || title),
        title,
        status: payload.status ?? 'draft',
        steps,
        content: '',
        path: '',
        updatedAt,
      }
      item.content = renderDraftContent(item)
      item.path = routinePath(routinesDir, item.slug)

      await mkdir(routinesDir, { recursive: true })
      await writeFile(item.path, `${renderFrontmatter(item)}${item.content}`, 'utf-8')

      return item
    },

    async list(): Promise<ElectronRoutineItem[]> {
      await mkdir(routinesDir, { recursive: true })
      const entries = await readdir(routinesDir, { withFileTypes: true })
      const routines: ElectronRoutineItem[] = []

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.md'))
          continue

        const path = join(routinesDir, entry.name)
        try {
          routines.push(parseRoutineMarkdown(await readFile(path, 'utf-8'), path))
        }
        catch {
          // User-edited routine files should not break the whole routine index.
        }
      }

      return routines.sort((a, b) => a.slug.localeCompare(b.slug))
    },

    async delete(payload: { slug: string }): Promise<void> {
      await rm(routinePath(routinesDir, payload.slug), { force: true })
    },
  }
}

export async function setupRoutineManager() {
  return createRoutineManager({
    routinesDir: join(app.getPath('userData'), 'airi-memory', 'skills'),
  })
}

export type RoutineManager = ReturnType<typeof createRoutineManager>

let routineServiceRegistered = false

export function createRoutineService(params: {
  context: ReturnType<typeof createContext>['context']
  manager: RoutineManager
}) {
  defineInvokeHandler(params.context, electronRoutineDraft, payload => params.manager.draft(payload))
  defineInvokeHandler(params.context, electronRoutineSave, payload => params.manager.save(payload))
  defineInvokeHandler(params.context, electronRoutineList, async () => ({ items: await params.manager.list() }))
  defineInvokeHandler(params.context, electronRoutineDelete, payload => params.manager.delete(payload))
}

export function registerGlobalRoutineService(params: { manager: RoutineManager }) {
  if (routineServiceRegistered)
    return

  routineServiceRegistered = true
  const { context } = createElectronMainContext(ipcMain)
  createRoutineService({ context, manager: params.manager })
}
