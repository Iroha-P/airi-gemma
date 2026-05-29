import type {
  ElectronDreamRedaction,
  ElectronDreamReport,
  ElectronSanitizedDreamReport,
} from '../../../../shared/eventa'

export interface SanitizedDreamResult {
  redactionLog: ElectronDreamRedaction[]
  sanitizedReport: ElectronSanitizedDreamReport
}

const CREDENTIAL_RE = /\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|password)\s*[:=]\s*\S{8,}|\bsk-[\w-]{12,}\b/giu
const LOCAL_PATH_RE = /[A-Za-z]:[\\/][^\s,;，。；]+|\/(?:Users|home|mnt|private|var|tmp)\/[^\s,;，。；]*/gu
const RAW_CHAT_RE = /\[(微信|WeChat|飞书|Feishu|QQ)\]/gi

function redactText(value: string, field: string, redactionLog: ElectronDreamRedaction[]) {
  let next = value

  if (CREDENTIAL_RE.test(next)) {
    next = next.replace(CREDENTIAL_RE, '[credential]')
    redactionLog.push({ field, reason: 'credential' })
  }

  if (LOCAL_PATH_RE.test(next)) {
    next = next.replace(LOCAL_PATH_RE, '[local path]')
    redactionLog.push({ field, reason: 'local_path' })
  }

  RAW_CHAT_RE.lastIndex = 0
  if (RAW_CHAT_RE.test(next)) {
    next = next.replace(RAW_CHAT_RE, '[chat archive]')
    redactionLog.push({ field, reason: 'raw_chat' })
  }

  CREDENTIAL_RE.lastIndex = 0
  LOCAL_PATH_RE.lastIndex = 0
  RAW_CHAT_RE.lastIndex = 0
  return next
}

export function sanitizeDreamReportForCloudReview(report: ElectronDreamReport): SanitizedDreamResult {
  const redactionLog: ElectronDreamRedaction[] = []
  const memoryCandidates = report.memoryCandidates
    .map((candidate, index) => {
      if (candidate.privacy === 'secret') {
        redactionLog.push({ field: `memoryCandidates[${index}]`, reason: 'secret_memory' })
        return null
      }

      return {
        ...candidate,
        content: redactText(candidate.content, `memoryCandidates[${index}].content`, redactionLog),
      }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))

  const sanitizedReport: ElectronSanitizedDreamReport = {
    id: report.id,
    generatedAt: report.generatedAt,
    summary: redactText(report.summary, 'summary', redactionLog),
    memoryCandidates,
    routineCandidates: report.routineCandidates.map((candidate, index) => ({
      title: redactText(candidate.title, `routineCandidates[${index}].title`, redactionLog),
      steps: candidate.steps.map((step, stepIndex) => redactText(step, `routineCandidates[${index}].steps[${stepIndex}]`, redactionLog)),
    })),
    llmWikiDrafts: report.llmWikiDrafts.map((draft, index) => ({
      title: redactText(draft.title, `llmWikiDrafts[${index}].title`, redactionLog),
      content: redactText(draft.content, `llmWikiDrafts[${index}].content`, redactionLog),
    })),
    loraDatasetCandidates: report.loraDatasetCandidates.map((candidate, index) => ({
      tags: candidate.tags,
      messages: candidate.messages.map((message, messageIndex) => ({
        ...message,
        content: redactText(message.content, `loraDatasetCandidates[${index}].messages[${messageIndex}].content`, redactionLog),
      })),
    })),
    visibility: 'training_sanitized',
  }

  return {
    redactionLog,
    sanitizedReport,
  }
}
