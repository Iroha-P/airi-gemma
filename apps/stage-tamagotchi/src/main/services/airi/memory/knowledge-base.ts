import type {
  ElectronMemoryIngestRequest,
  ElectronMemoryIngestResult,
} from '../../../../shared/eventa'

import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

export interface MarkdownKnowledgeBaseImportRequest {
  rootDir: string
  ingest: (request: ElectronMemoryIngestRequest) => Promise<ElectronMemoryIngestResult>
  defaults?: ElectronMemoryIngestRequest['defaults']
  sourceId?: string
  sourceLabel?: string
}

export interface MarkdownKnowledgeBaseImportResult extends ElectronMemoryIngestResult {
  filesScanned: number
  emptyFiles: string[]
  skippedGeneratedFiles: string[]
}

interface MarkdownDocument {
  body: string
  generatedByAiriMemoryService: boolean
  title: string | null
  tags: string[]
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const LINE_BREAK_PATTERN = /\r?\n/
const TAG_QUOTE_PATTERN = /^["']|["']$/g

function normalizeRelativePath(path: string) {
  return path.split(sep).join('/')
}

function shouldSkipDirectory(name: string) {
  return name.startsWith('.')
}

function isMarkdownFile(name: string) {
  return name.toLowerCase().endsWith('.md')
}

async function listMarkdownFiles(rootDir: string): Promise<string[]> {
  const files: string[] = []

  async function visit(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const path = join(dir, entry.name)

      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name))
          await visit(path)
        continue
      }

      if (entry.isFile() && isMarkdownFile(entry.name))
        files.push(path)
    }
  }

  await visit(rootDir)
  return files.sort()
}

function parseFrontmatterTags(frontmatter: string) {
  const tags: string[] = []
  const line = frontmatter
    .split(LINE_BREAK_PATTERN)
    .map(line => line.trim())
    .find(line => line.startsWith('tags:'))

  if (line) {
    const value = line.slice('tags:'.length).trim()
    const normalized = value.startsWith('[') && value.endsWith(']')
      ? value.slice(1, -1)
      : value
    tags.push(...normalized.split(',').map(tag => tag.trim()))
  }

  return tags.map(tag => tag.replace(TAG_QUOTE_PATTERN, '')).filter(Boolean)
}

function hasAiriMemoryServiceSource(frontmatter: string) {
  return frontmatter
    .split(LINE_BREAK_PATTERN)
    .map(line => line.trim())
    .some((line) => {
      if (!line.startsWith('source:'))
        return false

      return line
        .slice('source:'.length)
        .trim()
        .replace(TAG_QUOTE_PATTERN, '') === 'airi-memory-service'
    })
}

function extractMarkdownTitle(body: string) {
  const heading = body
    .split(LINE_BREAK_PATTERN)
    .map(line => line.trim())
    .find(line => line.startsWith('# '))

  return heading?.slice(2).trim() || null
}

function parseMarkdown(content: string): MarkdownDocument {
  let body = content.trim()
  let generatedByAiriMemoryService = false
  let tags: string[] = []

  const frontmatterMatch = body.match(FRONTMATTER_PATTERN)
  if (frontmatterMatch) {
    generatedByAiriMemoryService = hasAiriMemoryServiceSource(frontmatterMatch[1])
    tags = parseFrontmatterTags(frontmatterMatch[1])
    body = body.slice(frontmatterMatch[0].length).trim()
  }

  const title = extractMarkdownTitle(body)

  return { body, generatedByAiriMemoryService, title, tags }
}

export async function importMarkdownKnowledgeBase(request: MarkdownKnowledgeBaseImportRequest): Promise<MarkdownKnowledgeBaseImportResult> {
  const files = await listMarkdownFiles(request.rootDir)
  const emptyFiles: string[] = []
  const skippedGeneratedFiles: string[] = []
  const entries: ElectronMemoryIngestRequest['entries'] = []

  for (const path of files) {
    const relativePath = normalizeRelativePath(relative(request.rootDir, path))
    const markdown = parseMarkdown(await readFile(path, 'utf8'))

    if (markdown.generatedByAiriMemoryService) {
      skippedGeneratedFiles.push(relativePath)
      continue
    }

    if (!markdown.body) {
      emptyFiles.push(relativePath)
      continue
    }

    entries.push({
      externalId: relativePath,
      content: markdown.body,
      summary: markdown.title,
      type: 'knowledge',
      tags: markdown.tags,
      metadata: {
        file: {
          path,
          relativePath,
          title: markdown.title,
        },
      },
    })
  }

  const result = await request.ingest({
    source: {
      type: 'knowledge_base',
      id: request.sourceId ?? request.rootDir,
      label: request.sourceLabel ?? 'Markdown knowledge base',
    },
    defaults: request.defaults,
    entries,
  })

  return {
    ...result,
    filesScanned: entries.length,
    emptyFiles,
    skippedGeneratedFiles,
  }
}
