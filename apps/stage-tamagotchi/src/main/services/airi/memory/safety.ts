export type MemorySafetyFindingKind = 'credential' | 'invisible_unicode' | 'local_path' | 'prompt_injection' | 'raw_chat'
export type MemorySafetySeverity = 'medium' | 'high'

export interface MemorySafetyFinding {
  kind: MemorySafetyFindingKind
  severity: MemorySafetySeverity
  reason: string
}

export interface MemorySafetyScanResult {
  safe: boolean
  findings: MemorySafetyFinding[]
}

interface MemorySafetyMetadata {
  safe?: unknown
}

export interface MemorySafetyCandidate {
  content: string
  metadata?: {
    safety?: unknown
  } | null
  summary?: string | null
}

const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions?\b/iu,
  /\breveal\s+(the\s+)?(hidden\s+)?system\s+prompt\b/iu,
  /\bdisregard\s+(all\s+)?(previous|prior|above)\s+instructions?\b/iu,
  /\bforget\s+(all\s+)?(previous|prior|above)\s+instructions?\b/iu,
]

const CREDENTIAL_PATTERNS = [
  /\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|password)\s*[:=]\s*\S{8,}/iu,
  /\bsk-[\w-]{12,}\b/iu,
]

const INVISIBLE_UNICODE_RE = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/u
const LOCAL_PATH_RE = /[A-Za-z]:[\\/]|\/(?:Users|home|mnt|private|var|tmp)\//u
const RAW_CHAT_RE = /\[(?:微信|WeChat|飞书|Feishu|QQ)\]/iu

function hasAnyPattern(content: string, patterns: RegExp[]) {
  return patterns.some(pattern => pattern.test(content))
}

export function scanMemorySafety(content: string): MemorySafetyScanResult {
  const findings: MemorySafetyFinding[] = []

  if (hasAnyPattern(content, PROMPT_INJECTION_PATTERNS)) {
    findings.push({
      kind: 'prompt_injection',
      severity: 'high',
      reason: 'Content looks like an instruction to override or reveal system prompts.',
    })
  }

  if (hasAnyPattern(content, CREDENTIAL_PATTERNS)) {
    findings.push({
      kind: 'credential',
      severity: 'high',
      reason: 'Content looks like it may contain an API key, token, password, or secret.',
    })
  }

  if (INVISIBLE_UNICODE_RE.test(content)) {
    findings.push({
      kind: 'invisible_unicode',
      severity: 'medium',
      reason: 'Content contains invisible Unicode control characters.',
    })
  }

  if (LOCAL_PATH_RE.test(content)) {
    findings.push({
      kind: 'local_path',
      severity: 'medium',
      reason: 'Content looks like it may contain a local filesystem path.',
    })
  }

  if (RAW_CHAT_RE.test(content)) {
    findings.push({
      kind: 'raw_chat',
      severity: 'high',
      reason: 'Content looks like it may contain raw chat archive material.',
    })
  }

  return {
    safe: findings.length === 0,
    findings,
  }
}

function uniqueFindings(findings: MemorySafetyFinding[]) {
  const seen = new Set<string>()
  const result: MemorySafetyFinding[] = []

  for (const finding of findings) {
    const key = `${finding.kind}:${finding.severity}:${finding.reason}`
    if (seen.has(key))
      continue

    seen.add(key)
    result.push(finding)
  }

  return result
}

export function scanMemoryCandidateSafety(memory: Pick<MemorySafetyCandidate, 'content' | 'summary'>): MemorySafetyScanResult {
  const parts = [
    memory.content,
    ...(memory.summary?.trim() && memory.summary !== memory.content ? [memory.summary] : []),
  ]
  const findings = uniqueFindings(parts.flatMap(part => scanMemorySafety(part).findings))

  return {
    safe: findings.length === 0,
    findings,
  }
}

export function hasMemorySafetyRisk(memory: MemorySafetyCandidate) {
  const metadataSafety = memory.metadata?.safety as MemorySafetyMetadata | undefined
  return metadataSafety?.safe === false || !scanMemoryCandidateSafety(memory).safe
}
