import type { ElectronMemoryExportObsidianVaultResult, ElectronMemoryItem } from '../../../../shared/eventa'

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { compactMemoryProfile } from './profile-compactor'
import { hasMemorySafetyRisk } from './safety'

interface ExportMemoryObsidianVaultOptions {
  memories: ElectronMemoryItem[]
  outputDir: string
  exportedAt?: Date
}

interface ObsidianVaultPage {
  relativePath: string
  title: string
  description: string
  memories: ElectronMemoryItem[]
}

interface EvidenceRow {
  label: string
  value: string
}

interface ManifestFile {
  relativePath: string
  kind: string
  count: number
}

interface PersonaCandidateMetadata {
  derivedFrom?: unknown
  reason?: unknown
}

const MARKDOWN_EXTENSION_RE = /\.md$/u
const rawImportSourceTypes = new Set([
  'import_wechat',
  'import_lark',
  'import_qq',
])

function isExportableMemory(memory: ElectronMemoryItem) {
  return memory.status === 'active' && memory.privacy !== 'secret' && isMemorySafe(memory)
}

function isExportablePersonaCandidate(memory: ElectronMemoryItem) {
  return memory.status === 'needs_review'
    && memory.privacy !== 'secret'
    && isMemorySafe(memory)
    && (Boolean(memory.metadata?.personaCandidate) || hasTag(memory, ['persona-candidate']))
}

function isExportableDreamCandidate(memory: ElectronMemoryItem) {
  return memory.status === 'needs_review'
    && memory.privacy !== 'secret'
    && isMemorySafe(memory)
    && memory.sourceType === 'dream'
    && memory.metadata?.requiresReview === true
}

function getProfileVisibility(memory: ElectronMemoryItem) {
  const visibility = memory.metadata?.profileVisibility
  if (visibility === 'demo' || visibility === 'training_sanitized')
    return visibility

  return undefined
}

function isPublicProfilePreviewMemory(memory: ElectronMemoryItem) {
  return memory.status === 'active'
    && memory.privacy !== 'sensitive'
    && memory.privacy !== 'secret'
    && !rawImportSourceTypes.has(memory.sourceType)
    && isMemorySafe(memory)
    && Boolean(getProfileVisibility(memory))
}

function isMemorySafe(memory: ElectronMemoryItem) {
  return !hasMemorySafetyRisk(memory)
}

function hasTag(memory: ElectronMemoryItem, tags: string[]) {
  return memory.tags.some(tag => tags.includes(tag.toLowerCase()))
}

function compareMemories(first: ElectronMemoryItem, second: ElectronMemoryItem) {
  if (first.importance !== second.importance)
    return second.importance - first.importance

  return second.updatedAt.localeCompare(first.updatedAt)
}

function formatFrontmatter(page: Pick<ObsidianVaultPage, 'title'>, exportedAt: string, count: number) {
  return [
    '---',
    `title: ${page.title}`,
    'source: airi-memory-service',
    `updated: ${exportedAt}`,
    `memory_count: ${count}`,
    '---',
    '',
  ].join('\n')
}

function booleanLabel(value: boolean) {
  return value ? 'Yes' : 'No'
}

function metadataStringValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function formatEvidenceRows(memory: ElectronMemoryItem): EvidenceRow[] {
  const metadata = memory.metadata
  const rows: EvidenceRow[] = []

  if (isExportableDreamCandidate(memory)) {
    const dreamSessionId = metadataStringValue(metadata, 'dreamSessionId')
    if (dreamSessionId) {
      rows.push({
        label: 'Dream session',
        value: dreamSessionId,
      })
    }

    rows.push({
      label: 'Requires review',
      value: booleanLabel(metadata?.requiresReview === true),
    })
    rows.push({
      label: 'LoRA dataset candidate',
      value: booleanLabel(metadata?.loraDatasetCandidate === true),
    })
  }

  if (isExportablePersonaCandidate(memory)) {
    const candidate = metadata?.personaCandidate as PersonaCandidateMetadata | undefined
    if (typeof candidate?.derivedFrom === 'string' && candidate.derivedFrom.trim().length > 0) {
      rows.push({
        label: 'Persona derived from',
        value: candidate.derivedFrom,
      })
    }
    if (typeof candidate?.reason === 'string' && candidate.reason.trim().length > 0) {
      rows.push({
        label: 'Persona reason',
        value: candidate.reason,
      })
    }
  }

  return rows
}

function formatEvidence(memory: ElectronMemoryItem) {
  const rows = formatEvidenceRows(memory)
  if (rows.length === 0)
    return ''

  return [
    '  - Evidence:',
    ...rows.map(row => `    - ${row.label}: ${row.value}`),
  ].join('\n')
}

function formatMemory(memory: ElectronMemoryItem) {
  const tags = memory.tags.length > 0 ? ` #${memory.tags.join(' #')}` : ''
  const summary = memory.summary ? `\n  - Summary: ${memory.summary}` : ''
  const evidence = formatEvidence(memory)

  return [
    `- ${memory.content}${tags}`,
    `  - Type: ${memory.type}; privacy: ${memory.privacy}; importance: ${memory.importance}; updated: ${memory.updatedAt}`,
    summary,
    evidence,
  ].filter(Boolean).join('\n')
}

function formatPage(page: ObsidianVaultPage, exportedAt: string) {
  return [
    formatFrontmatter(page, exportedAt, page.memories.length),
    `# ${page.title}`,
    '',
    page.description,
    '',
    '## Memories',
    '',
    ...page.memories.map(formatMemory),
    '',
  ].join('\n')
}

function createPages(memories: ElectronMemoryItem[]): ObsidianVaultPage[] {
  const exportable = memories.filter(isExportableMemory).sort(compareMemories)
  const personaCandidates = memories.filter(isExportablePersonaCandidate).sort(compareMemories)
  const dreamCandidates = memories.filter(isExportableDreamCandidate).sort(compareMemories)
  const publicProfilePreview = memories.filter(isPublicProfilePreviewMemory).sort(compareMemories)
  const profile = exportable.filter(memory =>
    memory.type === 'profile' || memory.type === 'preference' || memory.type === 'habit')
  const boundaries = exportable.filter(memory =>
    hasTag(memory, ['boundary', 'safety', 'privacy', 'forbidden', 'permission']))
  const airiProject = exportable.filter(memory =>
    memory.type === 'project' || hasTag(memory, ['project', 'airi', 'airi-gemma']))
  const knowledge = exportable.filter(memory =>
    memory.type === 'knowledge')
  const notes = exportable.filter(memory =>
    !profile.includes(memory)
    && !boundaries.includes(memory)
    && !airiProject.includes(memory)
    && !knowledge.includes(memory))

  return [
    {
      relativePath: '00-inbox/persona-candidates.md',
      title: 'Pending Persona Candidates',
      description: 'Imported persona-shaping memories that still need user review before AIRI can use them.',
      memories: personaCandidates,
    },
    {
      relativePath: '00-inbox/dream-candidates.md',
      title: 'Pending Dream Candidates',
      description: 'Local dream consolidation candidates that still need user review before AIRI can use them.',
      memories: dreamCandidates,
    },
    {
      relativePath: '10-profile/user-profile.md',
      title: 'User Profile',
      description: 'Reviewed long-term user profile memories exported from AIRI Memory Service.',
      memories: profile,
    },
    {
      relativePath: '20-boundaries/user-boundaries.md',
      title: 'User Boundaries',
      description: 'Reviewed user safety, privacy, and permission boundaries.',
      memories: boundaries,
    },
    {
      relativePath: '30-projects/airi-gemma.md',
      title: 'AIRI Gemma',
      description: 'Reviewed project memories for the local AIRI Gemma assistant.',
      memories: airiProject,
    },
    {
      relativePath: '40-knowledge/knowledge-base.md',
      title: 'Knowledge Base',
      description: 'Reviewed knowledge memories imported from local notes or curated by AIRI.',
      memories: knowledge,
    },
    {
      relativePath: '50-memories/memories.md',
      title: 'General Memories',
      description: 'Reviewed memories that do not yet belong to a more specific AIRI-Brain area.',
      memories: notes,
    },
    {
      relativePath: '80-public-profile/public-profile-preview.md',
      title: 'Public Profile Preview',
      description: 'Reviewed, explicitly visible, non-sensitive memories that may be safe for demos or sanitized training.',
      memories: publicProfilePreview,
    },
  ].filter(page => page.memories.length > 0)
}

function formatIndex(pages: ObsidianVaultPage[], exportedAt: string) {
  return [
    formatFrontmatter({ title: 'AIRI-Brain' }, exportedAt, pages.reduce((total, page) => total + page.memories.length, 0)),
    '# AIRI-Brain',
    '',
    'A local Obsidian-friendly view of reviewed AIRI memories. The Memory DB remains the source of truth.',
    '',
    '## Sections',
    '',
    '- [[05-compact-profile|Compact Profile]]',
    ...pages.map(page => `- [[${page.relativePath.replace(MARKDOWN_EXTENSION_RE, '')}|${page.title}]] (${page.memories.length})`),
    '',
  ].join('\n')
}

function formatContentIndex(pages: ObsidianVaultPage[], exportedAt: string) {
  return [
    formatFrontmatter({ title: 'AIRI-Brain Index' }, exportedAt, pages.reduce((total, page) => total + page.memories.length, 0)),
    '# AIRI-Brain Index',
    '',
    'Generated navigation for the Obsidian-compatible AIRI-Brain vault. Memory DB remains the source of truth.',
    '',
    '## Core',
    '',
    '- [[AIRI-Brain|AIRI-Brain Home]]',
    '- [[05-compact-profile|Compact Profile]]',
    '- [[log|Export Log]]',
    '',
    '## Sections',
    '',
    ...pages.map(page => [
      `### [[${page.relativePath.replace(MARKDOWN_EXTENSION_RE, '')}|${page.title}]]`,
      '',
      page.description,
      '',
      `- Memories: ${page.memories.length}`,
      `- Path: \`${page.relativePath}\``,
      '',
    ].join('\n')),
  ].join('\n')
}

function formatExportLog(pages: ObsidianVaultPage[], memories: ElectronMemoryItem[], exportedAt: string) {
  const activeMemories = memories.filter(isExportableMemory).length
  const inboxMemories = memories.filter(memory =>
    isExportablePersonaCandidate(memory) || isExportableDreamCandidate(memory)).length
  const publicProfilePreviewMemories = memories.filter(isPublicProfilePreviewMemory).length

  return [
    formatFrontmatter({ title: 'AIRI-Brain Export Log' }, exportedAt, activeMemories + inboxMemories + publicProfilePreviewMemories),
    '# AIRI-Brain Export Log',
    '',
    'Generated export timeline for the Obsidian-compatible AIRI-Brain vault.',
    '',
    `## [${exportedAt.slice(0, 10)}] export | AIRI-Brain vault`,
    '',
    `- Exported at: ${exportedAt}`,
    `- Active memories: ${activeMemories}`,
    `- Inbox candidates: ${inboxMemories}`,
    `- Public profile preview memories: ${publicProfilePreviewMemories}`,
    `- Generated sections: ${pages.length}`,
    '- Source of truth: Memory DB',
    '- Privacy: secret memories, unsafe content, and raw absolute paths are omitted from this generated vault.',
    '',
  ].join('\n')
}

function manifestFileKind(relativePath: string) {
  if (relativePath === 'AIRI-Brain.md')
    return 'home'
  if (relativePath === 'index.md')
    return 'index'
  if (relativePath === 'log.md')
    return 'export_log'
  if (relativePath === '05-compact-profile.md')
    return 'compact_profile'
  if (relativePath === '.airi/manifest.json')
    return 'manifest'
  if (relativePath.startsWith('00-inbox/'))
    return 'review_inbox'
  if (relativePath.startsWith('80-public-profile/'))
    return 'public_profile_preview'

  return 'memory_section'
}

function createManifest(params: {
  exportedAt: string
  files: ManifestFile[]
  memories: ElectronMemoryItem[]
  pages: ObsidianVaultPage[]
}) {
  const activeMemories = params.memories.filter(isExportableMemory).length
  const inboxMemories = params.memories.filter(memory =>
    isExportablePersonaCandidate(memory) || isExportableDreamCandidate(memory)).length
  const publicProfilePreviewMemories = params.memories.filter(isPublicProfilePreviewMemory).length

  return {
    schemaVersion: 1,
    generatedBy: 'airi-memory-service',
    exportedAt: params.exportedAt,
    sourceOfTruth: 'memory-db',
    totals: {
      activeMemories,
      inboxMemories,
      publicProfilePreviewMemories,
      files: params.files.length,
      sections: params.pages.length,
    },
    privacy: {
      excludesSecretMemories: true,
      excludesRawChatFromPublicProfile: true,
      inboxRequiresReview: true,
      memoryContentOmitted: true,
      absolutePathsOmitted: true,
      excludesUnsafeContent: true,
    },
    files: params.files,
  }
}

export async function exportMemoryObsidianVault(options: ExportMemoryObsidianVaultOptions): Promise<ElectronMemoryExportObsidianVaultResult> {
  const exportedAt = (options.exportedAt ?? new Date()).toISOString()
  const pages = createPages(options.memories)
  const files: ElectronMemoryExportObsidianVaultResult['files'] = []
  const manifestFiles: ManifestFile[] = []

  function recordFile(relativePath: string, path: string, count: number) {
    files.push({
      relativePath,
      path,
      count,
    })
    manifestFiles.push({
      relativePath,
      kind: manifestFileKind(relativePath),
      count,
    })
  }

  const indexPath = join(options.outputDir, 'AIRI-Brain.md')
  await mkdir(dirname(indexPath), { recursive: true })
  await writeFile(indexPath, formatIndex(pages, exportedAt), 'utf8')
  recordFile('AIRI-Brain.md', indexPath, pages.reduce((total, page) => total + page.memories.length, 0))

  const contentIndexPath = join(options.outputDir, 'index.md')
  await writeFile(contentIndexPath, formatContentIndex(pages, exportedAt), 'utf8')
  recordFile('index.md', contentIndexPath, pages.reduce((total, page) => total + page.memories.length, 0))

  const exportLogPath = join(options.outputDir, 'log.md')
  await writeFile(exportLogPath, formatExportLog(pages, options.memories, exportedAt), 'utf8')
  recordFile('log.md', exportLogPath, pages.reduce((total, page) => total + page.memories.length, 0))

  const compactProfile = compactMemoryProfile({
    memories: options.memories,
    generatedAt: new Date(exportedAt),
  })
  const compactProfilePath = join(options.outputDir, '05-compact-profile.md')
  await writeFile(compactProfilePath, compactProfile.markdown, 'utf8')
  recordFile('05-compact-profile.md', compactProfilePath, compactProfile.sourceIds.length)

  const manifestPath = join(options.outputDir, '.airi', 'manifest.json')
  await mkdir(dirname(manifestPath), { recursive: true })
  const manifestRelativePath = '.airi/manifest.json'
  const manifest = createManifest({
    exportedAt,
    files: [
      ...manifestFiles,
      {
        relativePath: manifestRelativePath,
        kind: manifestFileKind(manifestRelativePath),
        count: 0,
      },
      ...pages.map(page => ({
        relativePath: page.relativePath,
        kind: manifestFileKind(page.relativePath),
        count: page.memories.length,
      })),
    ],
    memories: options.memories,
    pages,
  })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  recordFile(manifestRelativePath, manifestPath, 0)

  for (const page of pages) {
    const path = join(options.outputDir, page.relativePath)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, formatPage(page, exportedAt), 'utf8')
    recordFile(page.relativePath, path, page.memories.length)
  }

  return {
    outputDir: options.outputDir,
    files,
    exportedAt,
  }
}
