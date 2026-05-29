import type {
  ElectronMemoryItem,
  ElectronMemoryPrivacy,
} from '../../../../shared/eventa'
import type { MemoryRepository } from './repository'

export type MemoryActionRequest
  = | {
    action: 'replace'
    id: string
    content: string
    summary?: string | null
    reason?: string
  }
  | {
    action: 'archive'
    id: string
    reason?: string
  }
  | {
    action: 'reclassify'
    id: string
    privacy?: ElectronMemoryPrivacy
    importance?: number
    tags?: string[]
    reason?: string
  }
  | {
    action: 'correct'
    id: string
    correction: string
    reason?: string
  }
  | {
    action: 'explain_usage'
    id: string
    query?: string
  }

export interface MemoryActionResult {
  action: MemoryActionRequest['action']
  item: ElectronMemoryItem
  explanation?: string
}

type WritableMemoryActionRequest = Exclude<MemoryActionRequest, { action: 'explain_usage' }>

function actionMetadata(action: WritableMemoryActionRequest, extra: Record<string, unknown> = {}) {
  return {
    memoryAction: {
      action: action.action,
      reason: action.reason,
      ...extra,
    },
  }
}

export async function applyMemoryAction(repository: MemoryRepository, request: MemoryActionRequest): Promise<MemoryActionResult> {
  if (request.action === 'explain_usage') {
    const item = await repository.get(request.id)
    const queryPart = request.query
      ? `当前问题是“${request.query}”。`
      : '当前没有提供具体问题。'

    return {
      action: request.action,
      item,
      explanation: [
        `这条记忆的类型是 ${item.type}，来源是 ${item.sourceType}。`,
        `它的隐私等级是 ${item.privacy}，重要性 ${item.importance}。`,
        `它已经被使用过 ${item.accessCount} 次${item.lastAccessedAt ? `，最近一次使用时间是 ${item.lastAccessedAt}` : ''}。`,
        queryPart,
        'AIRI 只有在该记忆能帮助理解用户背景、偏好、项目或当前请求时才应该引用它。',
      ].join('\n'),
    }
  }

  if (request.action === 'replace') {
    return {
      action: request.action,
      item: await repository.update({
        id: request.id,
        content: request.content,
        summary: request.summary,
        metadata: actionMetadata(request),
      }),
    }
  }

  if (request.action === 'archive') {
    return {
      action: request.action,
      item: await repository.update({
        id: request.id,
        status: 'archived',
        metadata: actionMetadata(request),
      }),
    }
  }

  if (request.action === 'reclassify') {
    return {
      action: request.action,
      item: await repository.update({
        id: request.id,
        privacy: request.privacy,
        importance: request.importance,
        tags: request.tags,
        metadata: actionMetadata(request),
      }),
    }
  }

  await repository.update({
    id: request.id,
    status: 'archived',
    metadata: actionMetadata(request),
  })

  return {
    action: request.action,
    item: await repository.create({
      content: request.correction,
      type: 'note',
      tags: ['correction'],
      privacy: 'sensitive',
      sourceType: 'memory_action',
      sourceId: request.id,
      status: 'active',
      metadata: actionMetadata(request, {
        targetId: request.id,
      }),
    }),
  }
}
