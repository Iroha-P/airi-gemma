import type {
  ElectronMemoryIngestRequest,
  ElectronMemoryIngestResult,
  ElectronMemorySourceType,
} from '../../../../shared/eventa'

import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'

export interface ChatRecordArchiveImportRequest {
  rootDir: string
  sourceType: Extract<ElectronMemorySourceType, 'import_wechat' | 'import_lark' | 'import_qq'>
  ingest: (request: ElectronMemoryIngestRequest) => Promise<ElectronMemoryIngestResult>
  defaults?: ElectronMemoryIngestRequest['defaults']
  sourceId?: string
  sourceLabel?: string
}

export interface ChatRecordArchiveImportResult extends ElectronMemoryIngestResult {
  filesScanned: number
  messagesImported: number
  emptyFiles: string[]
  unsupportedFiles: string[]
}

interface ChatMessage {
  line: number
  speaker: string
  timestamp: string
  text: string
}

const LINE_BREAK_PATTERN = /\r?\n/
const SUPPORTED_CHAT_EXTENSIONS = new Set(['.txt', '.md'])

function normalizeRelativePath(path: string) {
  return path.split(sep).join('/')
}

function shouldSkipDirectory(name: string) {
  return name.startsWith('.')
}

function isSupportedChatFile(name: string) {
  return SUPPORTED_CHAT_EXTENSIONS.has(extname(name).toLowerCase())
}

function platformTag(sourceType: ChatRecordArchiveImportRequest['sourceType']) {
  if (sourceType === 'import_lark')
    return 'feishu'
  if (sourceType === 'import_qq')
    return 'qq'
  return 'wechat'
}

async function listArchiveFiles(rootDir: string): Promise<{ supported: string[], unsupported: string[] }> {
  const supported: string[] = []
  const unsupported: string[] = []

  async function visit(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const path = join(dir, entry.name)

      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name))
          await visit(path)
        continue
      }

      if (!entry.isFile())
        continue

      if (isSupportedChatFile(entry.name))
        supported.push(path)
      else
        unsupported.push(path)
    }
  }

  await visit(rootDir)
  return {
    supported: supported.sort(),
    unsupported: unsupported.sort(),
  }
}

function isDigits(value: string) {
  if (!value)
    return false

  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code < 48 || code > 57)
      return false
  }

  return true
}

function isValidTimestamp(value: string) {
  const spaceIndex = value.indexOf(' ')
  if (spaceIndex === -1)
    return false

  const datePart = value.slice(0, spaceIndex)
  const timePart = value.slice(spaceIndex + 1)
  const dateSeparator = datePart.includes('-') ? '-' : '/'
  const dateSegments = datePart.split(dateSeparator)
  const timeSegments = timePart.split(':')

  return dateSegments.length === 3
    && timeSegments.length >= 2
    && timeSegments.length <= 3
    && dateSegments.every(isDigits)
    && timeSegments.every(isDigits)
}

function normalizeTimestamp(value: string) {
  const trimmed = value.trim()
  const spaceIndex = trimmed.indexOf(' ')
  const datePart = trimmed.slice(0, spaceIndex)
  const timePart = trimmed.slice(spaceIndex + 1)
  const normalizedDate = datePart.replaceAll('/', '-')
  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart
  return {
    label: `${normalizedDate} ${normalizedTime}`,
    iso: `${normalizedDate}T${normalizedTime}.000+08:00`,
  }
}

function parseSpeakerAndText(rest: string) {
  const asciiColonIndex = rest.indexOf(':')
  const fullWidthColonIndex = rest.indexOf('\uFF1A')
  const colonIndex = asciiColonIndex === -1
    ? fullWidthColonIndex
    : fullWidthColonIndex === -1
      ? asciiColonIndex
      : Math.min(asciiColonIndex, fullWidthColonIndex)

  if (colonIndex === -1)
    return undefined

  const speaker = rest.slice(0, colonIndex).trim()
  const text = rest.slice(colonIndex + 1).trim()
  if (!speaker || !text)
    return undefined

  return { speaker, text }
}

function parseChatLine(line: string, lineNumber: number): ChatMessage | undefined {
  if (line.startsWith('[')) {
    const closingIndex = line.indexOf(']')
    if (closingIndex === -1)
      return undefined

    const timestamp = line.slice(1, closingIndex).trim()
    if (!isValidTimestamp(timestamp))
      return undefined

    const parsed = parseSpeakerAndText(line.slice(closingIndex + 1).trimStart())
    if (!parsed)
      return undefined

    return {
      line: lineNumber,
      timestamp,
      speaker: parsed.speaker,
      text: parsed.text,
    }
  }

  const firstSpaceIndex = line.indexOf(' ')
  if (firstSpaceIndex === -1)
    return undefined

  const secondSpaceIndex = line.indexOf(' ', firstSpaceIndex + 1)
  if (secondSpaceIndex === -1)
    return undefined

  const timestamp = line.slice(0, secondSpaceIndex)
  if (!isValidTimestamp(timestamp))
    return undefined

  const parsed = parseSpeakerAndText(line.slice(secondSpaceIndex + 1).trimStart())
  if (!parsed)
    return undefined

  return {
    line: lineNumber,
    timestamp,
    speaker: parsed.speaker,
    text: parsed.text,
  }
}

function parseChatMessages(content: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  let current: ChatMessage | undefined

  for (const [index, rawLine] of content.split(LINE_BREAK_PATTERN).entries()) {
    const line = rawLine.trim()
    if (!line)
      continue

    const message = parseChatLine(line, index + 1)
    if (message) {
      current = message
      messages.push(current)
      continue
    }

    if (current)
      current.text = `${current.text}\n${line}`
  }

  return messages.filter(message => message.text.trim().length > 0)
}

export async function importChatRecordArchive(request: ChatRecordArchiveImportRequest): Promise<ChatRecordArchiveImportResult> {
  const platform = platformTag(request.sourceType)
  const files = await listArchiveFiles(request.rootDir)
  const emptyFiles: string[] = []
  const entries: ElectronMemoryIngestRequest['entries'] = []

  for (const path of files.supported) {
    const relativePath = normalizeRelativePath(relative(request.rootDir, path))
    const messages = parseChatMessages(await readFile(path, 'utf8'))

    if (messages.length === 0) {
      emptyFiles.push(relativePath)
      continue
    }

    for (const message of messages) {
      const timestamp = normalizeTimestamp(message.timestamp)
      entries.push({
        externalId: `${relativePath}:${message.line}`,
        content: `${message.speaker}: ${message.text}`,
        summary: `${message.speaker} / ${timestamp.label}`,
        type: 'conversation',
        tags: [platform],
        occurredAt: timestamp.iso,
        metadata: {
          chat: {
            line: message.line,
            platform,
            speaker: message.speaker,
          },
          file: {
            path,
            relativePath,
          },
        },
      })
    }
  }

  const result = await request.ingest({
    source: {
      type: request.sourceType,
      id: request.sourceId ?? request.rootDir,
      label: request.sourceLabel ?? `${platform} chat archive`,
    },
    defaults: {
      ...request.defaults,
      status: request.defaults?.status ?? 'needs_review',
      tags: [
        'chat-record',
        ...(request.defaults?.tags ?? []),
      ],
    },
    entries,
  })

  return {
    ...result,
    filesScanned: files.supported.length - emptyFiles.length,
    messagesImported: entries.length,
    emptyFiles,
    unsupportedFiles: files.unsupported.map(path => normalizeRelativePath(relative(request.rootDir, path))),
  }
}
