import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { hasMemorySafetyRisk } from './safety'

export type MemoryExportSurface = 'public_profile' | 'lora_dataset'

export type MemoryExportPreflightReason
  = | 'not_active'
    | 'sensitive_or_secret'
    | 'raw_chat_import'
    | 'unsafe_content'
    | 'missing_public_visibility'
    | 'missing_training_visibility'
    | 'demo_only'

export interface MemoryExportPreflightItem {
  id: string
  type: ElectronMemoryItem['type']
  privacy: ElectronMemoryItem['privacy']
  sourceType: string
  status: ElectronMemoryItem['status']
  allowed: boolean
  reasons: MemoryExportPreflightReason[]
}

export interface MemoryExportPreflightReport {
  surface: MemoryExportSurface
  summary: {
    total: number
    allowed: number
    blocked: number
  }
  items: MemoryExportPreflightItem[]
}

const rawImportSourceTypes = new Set([
  'import_wechat',
  'import_lark',
  'import_qq',
])

export function isRawImportSourceType(sourceType: string) {
  return rawImportSourceTypes.has(sourceType)
}

function getProfileVisibility(memory: ElectronMemoryItem) {
  const visibility = memory.metadata?.profileVisibility
  if (visibility === 'demo' || visibility === 'training_sanitized')
    return visibility

  return undefined
}

function isTrainingVisible(memory: ElectronMemoryItem) {
  return memory.metadata?.loraDatasetCandidate === true
    || memory.metadata?.profileVisibility === 'training_sanitized'
}

function hasUnsafeContent(memory: ElectronMemoryItem) {
  return hasMemorySafetyRisk(memory)
}

function explainMemoryExport(memory: ElectronMemoryItem, surface: MemoryExportSurface): MemoryExportPreflightReason[] {
  const reasons: MemoryExportPreflightReason[] = []

  if (memory.status !== 'active')
    reasons.push('not_active')
  if (memory.privacy === 'sensitive' || memory.privacy === 'secret')
    reasons.push('sensitive_or_secret')
  if (isRawImportSourceType(memory.sourceType))
    reasons.push('raw_chat_import')
  if (hasUnsafeContent(memory))
    reasons.push('unsafe_content')

  if (surface === 'public_profile' && !getProfileVisibility(memory))
    reasons.push('missing_public_visibility')

  if (surface === 'lora_dataset') {
    if (memory.metadata?.profileVisibility === 'demo')
      reasons.push('demo_only')
    if (!isTrainingVisible(memory))
      reasons.push('missing_training_visibility')
  }

  return reasons
}

export function isMemoryAllowedForExport(memory: ElectronMemoryItem, surface: MemoryExportSurface) {
  return explainMemoryExport(memory, surface).length === 0
}

export function createMemoryExportPreflightReport(options: {
  memories: ElectronMemoryItem[]
  surface: MemoryExportSurface
}): MemoryExportPreflightReport {
  const items = options.memories.map((memory): MemoryExportPreflightItem => {
    const reasons = explainMemoryExport(memory, options.surface)

    return {
      id: memory.id,
      type: memory.type,
      privacy: memory.privacy,
      sourceType: memory.sourceType,
      status: memory.status,
      allowed: reasons.length === 0,
      reasons,
    }
  })
  const allowed = items.filter(item => item.allowed).length

  return {
    surface: options.surface,
    summary: {
      total: items.length,
      allowed,
      blocked: items.length - allowed,
    },
    items,
  }
}
