import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { hasMemorySafetyRisk } from './safety'

export type CompactProfileSectionKey = 'profile' | 'preferences' | 'habits' | 'boundaries' | 'projects' | 'knowledge'
export type CompactProfileWithheldReason = 'not_active' | 'secret_memory' | 'safety_risk'

export interface CompactProfileMemory {
  id: string
  content: string
  importance: number
  privacy: ElectronMemoryItem['privacy']
  tags: string[]
  type: ElectronMemoryItem['type']
  updatedAt: string
}

export interface CompactProfileSection {
  key: CompactProfileSectionKey
  title: string
  items: CompactProfileMemory[]
}

export interface CompactProfileResult {
  generatedAt: string
  markdown: string
  sections: CompactProfileSection[]
  sourceIds: string[]
  withheld: Array<{
    id: string
    reason: CompactProfileWithheldReason
  }>
}

export interface CompactMemoryProfileOptions {
  generatedAt?: Date
  maxItemsPerSection?: number
  memories: ElectronMemoryItem[]
}

interface SectionDefinition {
  key: CompactProfileSectionKey
  title: string
  matches: (memory: ElectronMemoryItem) => boolean
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    key: 'profile',
    title: 'Profile',
    matches: memory => memory.type === 'profile',
  },
  {
    key: 'preferences',
    title: 'Preferences',
    matches: memory => memory.type === 'preference' && !hasTag(memory, ['boundary', 'safety', 'privacy', 'forbidden', 'permission']),
  },
  {
    key: 'habits',
    title: 'Habits',
    matches: memory => memory.type === 'habit',
  },
  {
    key: 'boundaries',
    title: 'Boundaries',
    matches: memory => hasTag(memory, ['boundary', 'safety', 'privacy', 'forbidden', 'permission']),
  },
  {
    key: 'projects',
    title: 'Projects',
    matches: memory => memory.type === 'project',
  },
  {
    key: 'knowledge',
    title: 'Knowledge',
    matches: memory => memory.type === 'knowledge',
  },
]

function hasTag(memory: ElectronMemoryItem, tags: string[]) {
  return memory.tags.some(tag => tags.includes(tag.toLowerCase()))
}

function compareMemories(first: ElectronMemoryItem, second: ElectronMemoryItem) {
  if (first.importance !== second.importance)
    return second.importance - first.importance

  return second.updatedAt.localeCompare(first.updatedAt)
}

function toCompactMemory(memory: ElectronMemoryItem): CompactProfileMemory {
  return {
    id: memory.id,
    content: memory.content,
    importance: memory.importance,
    privacy: memory.privacy,
    tags: memory.tags,
    type: memory.type,
    updatedAt: memory.updatedAt,
  }
}

function hasSafetyRisk(memory: ElectronMemoryItem) {
  return hasMemorySafetyRisk(memory)
}

function formatSection(section: CompactProfileSection) {
  return [
    `## ${section.title}`,
    '',
    ...section.items.map((item) => {
      const tags = item.tags.length > 0 ? ` #${item.tags.join(' #')}` : ''
      return `- ${item.content}${tags}\n  - id: ${item.id}; type: ${item.type}; privacy: ${item.privacy}; importance: ${item.importance}; updated: ${item.updatedAt}`
    }),
    '',
  ].join('\n')
}

function formatMarkdown(sections: CompactProfileSection[], generatedAt: string, sourceIds: string[], withheld: CompactProfileResult['withheld']) {
  return [
    '---',
    'source: airi-memory-service',
    'kind: compact-profile',
    `generated_at: ${generatedAt}`,
    `source_count: ${sourceIds.length}`,
    `withheld_count: ${withheld.length}`,
    '---',
    '',
    '# AIRI Compact Profile',
    '',
    'This is a generated local summary of reviewed AIRI memories. The Memory DB remains the source of truth.',
    '',
    ...sections.flatMap(formatSection),
  ].join('\n')
}

export function compactMemoryProfile(options: CompactMemoryProfileOptions): CompactProfileResult {
  const generatedAt = (options.generatedAt ?? new Date()).toISOString()
  const maxItemsPerSection = Math.max(1, Math.round(options.maxItemsPerSection ?? 8))
  const withheld: CompactProfileResult['withheld'] = []
  const exportable: ElectronMemoryItem[] = []

  for (const memory of options.memories) {
    if (memory.privacy === 'secret') {
      withheld.push({ id: memory.id, reason: 'secret_memory' })
      continue
    }
    if (memory.status !== 'active') {
      withheld.push({ id: memory.id, reason: 'not_active' })
      continue
    }
    if (hasSafetyRisk(memory)) {
      withheld.push({ id: memory.id, reason: 'safety_risk' })
      continue
    }

    exportable.push(memory)
  }

  const consumed = new Set<string>()
  const sections = SECTION_DEFINITIONS.map((definition) => {
    const items = exportable
      .filter(memory => !consumed.has(memory.id) && definition.matches(memory))
      .sort(compareMemories)
      .slice(0, maxItemsPerSection)

    for (const item of items)
      consumed.add(item.id)

    return {
      key: definition.key,
      title: definition.title,
      items: items.map(toCompactMemory),
    }
  }).filter(section => section.items.length > 0)

  const sourceIds = sections.flatMap(section => section.items.map(item => item.id))

  return {
    generatedAt,
    markdown: formatMarkdown(sections, generatedAt, sourceIds, withheld),
    sections,
    sourceIds,
    withheld,
  }
}
