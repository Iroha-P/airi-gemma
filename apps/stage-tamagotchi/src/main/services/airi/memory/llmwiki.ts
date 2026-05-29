import type { ElectronMemoryExportLlmWikiResult, ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

import { hasMemorySafetyRisk } from './safety'

interface ExportMemoryLlmWikiOptions {
  memories: ElectronMemoryItem[]
  outputDir: string
  exportedAt?: Date
}

interface LlmWikiPage {
  relativePath: string
  title: string
  description: string
  memories: ElectronMemoryItem[]
}

interface SearchMemoryLlmWikiOptions {
  inputDir: string
  query: string
  limit?: number
}

const SEARCH_TOKEN_RE = /[a-z0-9][a-z0-9-]*/giu
const SEARCH_HAN_RE = /\p{Script=Han}+/gu
const FRONTMATTER_RE = /^---[\s\S]*?---\s*/u
const SNIPPET_SPLIT_RE = /\n(?=##? )|\n{2,}/u

function isExportableMemory(memory: ElectronMemoryItem) {
  return memory.status === 'active' && memory.privacy !== 'secret' && !hasMemorySafetyRisk(memory)
}

function normalizeRelativePath(path: string) {
  return path.replaceAll('\\', '/')
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = await Promise.all(entries.map(async (entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory())
        return listMarkdownFiles(path)
      if (entry.isFile() && entry.name.endsWith('.md'))
        return [path]
      return []
    }))

    return files.flat()
  }
  catch {
    return []
  }
}

function tokenizeSearchText(text: string) {
  const tokens = new Set([...text.toLowerCase().matchAll(SEARCH_TOKEN_RE)].map(match => match[0]))

  for (const match of text.matchAll(SEARCH_HAN_RE)) {
    const value = match[0]
    if (value.length < 2) {
      tokens.add(value)
      continue
    }

    for (let index = 0; index < value.length - 1; index++)
      tokens.add(value.slice(index, index + 2))
  }

  return tokens
}

function scoreText(queryTokens: Set<string>, text: string) {
  const textTokens = tokenizeSearchText(text)
  let score = 0

  for (const token of queryTokens) {
    if (textTokens.has(token) || [...textTokens].some(textToken => textToken.includes(token) || token.includes(textToken)))
      score += 1
  }

  return score
}

function splitMarkdownSnippets(markdown: string) {
  return markdown
    .replace(FRONTMATTER_RE, '')
    .split(SNIPPET_SPLIT_RE)
    .map(part => part.trim())
    .filter(part => part && !part.startsWith('# '))
}

function hasTag(memory: ElectronMemoryItem, tags: string[]) {
  return memory.tags.some(tag => tags.includes(tag.toLowerCase()))
}

function compareMemories(first: ElectronMemoryItem, second: ElectronMemoryItem) {
  if (first.importance !== second.importance)
    return second.importance - first.importance

  return second.updatedAt.localeCompare(first.updatedAt)
}

function formatFrontmatter(page: LlmWikiPage, exportedAt: string) {
  return [
    '---',
    `title: ${page.title}`,
    'source: airi-memory-service',
    `updated: ${exportedAt}`,
    `memory_count: ${page.memories.length}`,
    '---',
    '',
  ].join('\n')
}

function formatMemory(memory: ElectronMemoryItem) {
  const tags = memory.tags.length > 0 ? ` #${memory.tags.join(' #')}` : ''
  const summary = memory.summary ? `\n  - 摘要：${memory.summary}` : ''

  return [
    `- ${memory.content}${tags}`,
    `  - 类型：${memory.type}；重要性：${memory.importance}；更新时间：${memory.updatedAt}`,
    summary,
  ].filter(Boolean).join('\n')
}

function formatPage(page: LlmWikiPage, exportedAt: string) {
  return [
    formatFrontmatter(page, exportedAt),
    `# ${page.title}`,
    '',
    page.description,
    '',
    '## 记忆条目',
    '',
    ...page.memories.map(formatMemory),
    '',
  ].join('\n')
}

function formatContentIndex(pages: LlmWikiPage[], exportedAt: string) {
  const memoryCount = pages.reduce((total, page) => total + page.memories.length, 0)

  return [
    formatFrontmatter({
      relativePath: 'index.md',
      title: 'AIRI LLMWiki Index',
      description: 'Generated navigation for AIRI LLMWiki exports.',
      memories: pages.flatMap(page => page.memories),
    }, exportedAt),
    '# AIRI LLMWiki Index',
    '',
    'Generated navigation for AIRI Memory LLMWiki exports. The Memory DB remains the source of truth.',
    '',
    '## Files',
    '',
    '- [Export Log](./log.md)',
    ...pages.map(page => `- [${page.title}](./${page.relativePath}) - ${page.description} (${page.memories.length})`),
    '',
    '## Summary',
    '',
    `- Pages: ${pages.length}`,
    `- Memories: ${memoryCount}`,
    `- Exported at: ${exportedAt}`,
    '',
  ].join('\n')
}

function formatExportLog(pages: LlmWikiPage[], exportedAt: string) {
  const memoryCount = pages.reduce((total, page) => total + page.memories.length, 0)

  return [
    formatFrontmatter({
      relativePath: 'log.md',
      title: 'AIRI LLMWiki Export Log',
      description: 'Generated export timeline for AIRI LLMWiki exports.',
      memories: pages.flatMap(page => page.memories),
    }, exportedAt),
    '# AIRI LLMWiki Export Log',
    '',
    `## [${exportedAt.slice(0, 10)}] export | AIRI LLMWiki`,
    '',
    `- Exported at: ${exportedAt}`,
    `- Pages: ${pages.length}`,
    `- Memories: ${memoryCount}`,
    '- Source of truth: Memory DB',
    '- Privacy: secret memories, unsafe content, and raw absolute paths are omitted from this generated LLMWiki.',
    '',
  ].join('\n')
}

function createPages(memories: ElectronMemoryItem[]): LlmWikiPage[] {
  const exportable = memories.filter(isExportableMemory).sort(compareMemories)
  const profile = exportable.filter(memory =>
    memory.type === 'profile' || memory.type === 'preference' || memory.type === 'habit')
  const boundaries = exportable.filter(memory =>
    hasTag(memory, ['boundary', 'safety', 'privacy', 'forbidden', 'permission']))
  const airiProject = exportable.filter(memory =>
    memory.type === 'project' || hasTag(memory, ['project', 'airi', 'airi-gemma']))

  return [
    {
      relativePath: 'profile.md',
      title: '用户画像',
      description: '由 AIRI Memory Service 导出的用户画像、偏好和长期习惯。内容只来自已确认的本地记忆。',
      memories: profile,
    },
    {
      relativePath: 'boundaries.md',
      title: '用户边界与安全规则',
      description: '由 AIRI Memory Service 导出的用户边界、安全偏好和高优先级约束。',
      memories: boundaries,
    },
    {
      relativePath: 'projects/airi-gemma.md',
      title: 'AIRI Gemma 项目状态',
      description: '由 AIRI Memory Service 导出的 AIRI Gemma 项目记忆和工程状态。',
      memories: airiProject,
    },
  ].filter(page => page.memories.length > 0)
}

export async function exportMemoryLlmWiki(options: ExportMemoryLlmWikiOptions): Promise<ElectronMemoryExportLlmWikiResult> {
  const exportedAt = (options.exportedAt ?? new Date()).toISOString()
  const pages = createPages(options.memories)
  const files: ElectronMemoryExportLlmWikiResult['files'] = []
  const memoryCount = pages.reduce((total, page) => total + page.memories.length, 0)

  const contentIndexPath = join(options.outputDir, 'index.md')
  await mkdir(dirname(contentIndexPath), { recursive: true })
  await writeFile(contentIndexPath, formatContentIndex(pages, exportedAt), 'utf8')
  files.push({
    relativePath: 'index.md',
    path: contentIndexPath,
    count: memoryCount,
  })

  const exportLogPath = join(options.outputDir, 'log.md')
  await writeFile(exportLogPath, formatExportLog(pages, exportedAt), 'utf8')
  files.push({
    relativePath: 'log.md',
    path: exportLogPath,
    count: memoryCount,
  })

  for (const page of pages) {
    const path = join(options.outputDir, page.relativePath)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, formatPage(page, exportedAt), 'utf8')
    files.push({
      relativePath: page.relativePath,
      path,
      count: page.memories.length,
    })
  }

  return {
    outputDir: options.outputDir,
    files,
    exportedAt,
  }
}

export async function searchMemoryLlmWiki(options: SearchMemoryLlmWikiOptions) {
  const inputStat = await stat(options.inputDir).catch(() => null)
  if (!inputStat?.isDirectory()) {
    return {
      inputDir: options.inputDir,
      scannedFiles: 0,
      snippets: [],
    }
  }

  const queryTokens = tokenizeSearchText(options.query)
  const files = await listMarkdownFiles(options.inputDir)
  const snippets: Array<{ relativePath: string, path: string, text: string, score: number }> = []

  for (const file of files) {
    const markdown = await readFile(file, 'utf8')
    const relativePath = normalizeRelativePath(relative(options.inputDir, file))

    for (const text of splitMarkdownSnippets(markdown)) {
      const score = scoreText(queryTokens, text)
      if (score > 0) {
        snippets.push({
          relativePath,
          path: file,
          text,
          score,
        })
      }
    }
  }

  return {
    inputDir: options.inputDir,
    scannedFiles: files.length,
    snippets: snippets
      .sort((first, second) => second.score - first.score)
      .slice(0, Math.max(1, options.limit ?? 3)),
  }
}
