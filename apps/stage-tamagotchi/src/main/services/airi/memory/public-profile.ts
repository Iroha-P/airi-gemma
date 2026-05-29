import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { isMemoryAllowedForExport } from './export-preflight'

export interface PublicProfileExportRequest {
  memories: ElectronMemoryItem[]
  outputDir: string
}

export interface PublicProfileExportResult {
  outputDir: string
  files: Array<{
    relativePath: string
    path: string
    count: number
  }>
  exportedAt: string
}

type PublicProfileVisibility = 'demo' | 'training_sanitized'

interface PublicProfileMemory {
  id: string
  type: ElectronMemoryItem['type']
  content: string
  summary?: string | null
  tags: string[]
  importance: number
  visibility: PublicProfileVisibility
  updatedAt: string
}

function getProfileVisibility(memory: ElectronMemoryItem): PublicProfileVisibility | undefined {
  const visibility = memory.metadata?.profileVisibility
  if (visibility === 'demo' || visibility === 'training_sanitized')
    return visibility

  return undefined
}

function toPublicProfileMemory(memory: ElectronMemoryItem): PublicProfileMemory {
  return {
    id: memory.id,
    type: memory.type,
    content: memory.content,
    summary: memory.summary,
    tags: memory.tags,
    importance: memory.importance,
    visibility: getProfileVisibility(memory)!,
    updatedAt: memory.updatedAt,
  }
}

function formatMarkdown(memories: PublicProfileMemory[], exportedAt: string) {
  return [
    '---',
    'source: airi-memory-service',
    'kind: public-profile',
    `memory_count: ${memories.length}`,
    `exported_at: ${exportedAt}`,
    '---',
    '',
    '# AIRI Public Profile',
    '',
    ...memories.flatMap(memory => [
      `## ${memory.id}`,
      '',
      `- Type: ${memory.type}`,
      `- Visibility: ${memory.visibility}`,
      `- Importance: ${memory.importance}`,
      `- Updated: ${memory.updatedAt}`,
      ...(memory.tags.length > 0 ? [`- Tags: ${memory.tags.join(', ')}`] : []),
      ...(memory.summary ? [`- Summary: ${memory.summary}`] : []),
      '',
      memory.content,
      '',
    ]),
  ].join('\n')
}

export async function exportPublicProfile(request: PublicProfileExportRequest): Promise<PublicProfileExportResult> {
  const exportedAt = new Date().toISOString()
  const memories = request.memories
    .filter(memory => isMemoryAllowedForExport(memory, 'public_profile'))
    .map(toPublicProfileMemory)

  await mkdir(request.outputDir, { recursive: true })

  const markdownPath = join(request.outputDir, 'public-profile.md')
  const jsonPath = join(request.outputDir, 'public-profile.json')

  await writeFile(markdownPath, formatMarkdown(memories, exportedAt), 'utf8')
  await writeFile(jsonPath, JSON.stringify({
    exportedAt,
    memories,
  }, null, 2), 'utf8')

  return {
    outputDir: request.outputDir,
    files: [
      { relativePath: 'public-profile.md', path: markdownPath, count: memories.length },
      { relativePath: 'public-profile.json', path: jsonPath, count: memories.length },
    ],
    exportedAt,
  }
}
