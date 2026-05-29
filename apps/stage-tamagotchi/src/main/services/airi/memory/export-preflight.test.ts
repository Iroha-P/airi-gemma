import type { ElectronMemoryItem } from '../../../../shared/eventa'

import { describe, expect, it } from 'vitest'

import { createMemoryExportPreflightReport, isMemoryAllowedForExport } from './export-preflight'

describe('memory export preflight', () => {
  it('explains public profile export eligibility before writing files', () => {
    const memories = [
      memory({
        id: 'demo-profile',
        content: 'AIRI can publicly say the user is building a local assistant.',
        privacy: 'public',
        metadata: { profileVisibility: 'demo' },
      }),
      memory({
        id: 'training-profile',
        content: 'AIRI can use this sanitized style profile in training reports.',
        privacy: 'local',
        metadata: { profileVisibility: 'training_sanitized' },
      }),
      memory({
        id: 'private-profile',
        content: 'Private active profile must stay out of public preview.',
        privacy: 'local',
      }),
      memory({
        id: 'raw-wechat',
        content: 'Raw imported WeChat message must stay out of public preview.',
        privacy: 'public',
        sourceType: 'import_wechat',
        metadata: { profileVisibility: 'demo' },
      }),
      memory({
        id: 'pending-demo',
        content: 'Pending public demo must wait for review.',
        privacy: 'public',
        status: 'needs_review',
        metadata: { profileVisibility: 'demo' },
      }),
      memory({
        id: 'secret-demo',
        content: 'Secret public demo marker must still be blocked.',
        privacy: 'secret',
        metadata: { profileVisibility: 'demo' },
      }),
      memory({
        id: 'path-demo',
        content: 'Public demo should not expose F:/private/chat.txt.',
        privacy: 'public',
        metadata: { profileVisibility: 'demo' },
      }),
      memory({
        id: 'summary-path-demo',
        content: 'Public demo text is otherwise safe.',
        privacy: 'public',
        summary: 'Imported from F:/private/chat.txt.',
        metadata: { profileVisibility: 'demo' },
      }),
      memory({
        id: 'manual-raw-chat-demo',
        content: '[微信] Alice: raw chat material should not be public.',
        privacy: 'public',
        metadata: { profileVisibility: 'demo' },
      }),
      memory({
        id: 'metadata-unsafe-demo',
        content: 'Edited public demo text looks plain now.',
        privacy: 'public',
        metadata: { profileVisibility: 'demo', safety: { safe: false } },
      }),
    ]

    const report = createMemoryExportPreflightReport({
      memories,
      surface: 'public_profile',
    })

    expect(report.summary).toEqual({
      total: 10,
      allowed: 2,
      blocked: 8,
    })
    expect(report.items.filter(item => item.allowed).map(item => item.id)).toEqual(['demo-profile', 'training-profile'])
    expect(reasonsById(report.items)).toEqual({
      'demo-profile': [],
      'training-profile': [],
      'private-profile': ['missing_public_visibility'],
      'raw-wechat': ['raw_chat_import'],
      'pending-demo': ['not_active'],
      'secret-demo': ['sensitive_or_secret'],
      'path-demo': ['unsafe_content'],
      'summary-path-demo': ['unsafe_content'],
      'manual-raw-chat-demo': ['unsafe_content'],
      'metadata-unsafe-demo': ['unsafe_content'],
    })
    expect(isMemoryAllowedForExport(memories[0]!, 'public_profile')).toBe(true)
    expect(isMemoryAllowedForExport(memories[2]!, 'public_profile')).toBe(false)
  })

  it('explains LoRA dataset export eligibility before writing files', () => {
    const memories = [
      memory({
        id: 'training-sanitized',
        content: 'A sanitized training profile can become a LoRA candidate.',
        metadata: { profileVisibility: 'training_sanitized' },
      }),
      memory({
        id: 'explicit-lora',
        content: 'An explicit LoRA candidate can become a dataset candidate.',
        privacy: 'public',
        metadata: { loraDatasetCandidate: true },
      }),
      memory({
        id: 'demo-only',
        content: 'Demo-only public profile must not become LoRA data.',
        privacy: 'public',
        metadata: { profileVisibility: 'demo' },
      }),
      memory({
        id: 'raw-qq',
        content: 'Raw imported QQ message must not become LoRA data.',
        sourceType: 'import_qq',
        metadata: { loraDatasetCandidate: true },
      }),
      memory({
        id: 'pending-lora',
        content: 'Pending candidate must wait for review.',
        status: 'needs_review',
        metadata: { loraDatasetCandidate: true },
      }),
      memory({
        id: 'sensitive-lora',
        content: 'Sensitive candidate must not become LoRA data.',
        privacy: 'sensitive',
        metadata: { loraDatasetCandidate: true },
      }),
      memory({
        id: 'credential-lora',
        content: 'OPENAI_API_KEY=sk-test-1234567890abcdef must not enter training.',
        privacy: 'public',
        metadata: { loraDatasetCandidate: true },
      }),
      memory({
        id: 'path-lora',
        content: 'LoRA data must not include C:\\Users\\me\\chat-export.txt.',
        privacy: 'public',
        metadata: { loraDatasetCandidate: true },
      }),
      memory({
        id: 'summary-path-lora',
        content: 'LoRA candidate content is otherwise safe.',
        privacy: 'public',
        summary: 'Imported from C:\\Users\\me\\chat-export.txt.',
        metadata: { loraDatasetCandidate: true },
      }),
      memory({
        id: 'manual-raw-chat-lora',
        content: '[QQ] raw chat material should not enter LoRA data.',
        privacy: 'public',
        metadata: { loraDatasetCandidate: true },
      }),
      memory({
        id: 'metadata-unsafe-lora',
        content: 'Edited LoRA candidate looks plain now.',
        privacy: 'public',
        metadata: { loraDatasetCandidate: true, safety: { safe: false } },
      }),
    ]

    const report = createMemoryExportPreflightReport({
      memories,
      surface: 'lora_dataset',
    })

    expect(report.summary).toEqual({
      total: 11,
      allowed: 2,
      blocked: 9,
    })
    expect(report.items.filter(item => item.allowed).map(item => item.id)).toEqual(['training-sanitized', 'explicit-lora'])
    expect(reasonsById(report.items)).toEqual({
      'training-sanitized': [],
      'explicit-lora': [],
      'demo-only': ['demo_only', 'missing_training_visibility'],
      'raw-qq': ['raw_chat_import'],
      'pending-lora': ['not_active'],
      'sensitive-lora': ['sensitive_or_secret'],
      'credential-lora': ['unsafe_content'],
      'path-lora': ['unsafe_content'],
      'summary-path-lora': ['unsafe_content'],
      'manual-raw-chat-lora': ['unsafe_content'],
      'metadata-unsafe-lora': ['unsafe_content'],
    })
    expect(isMemoryAllowedForExport(memories[0]!, 'lora_dataset')).toBe(true)
    expect(isMemoryAllowedForExport(memories[2]!, 'lora_dataset')).toBe(false)
  })
})

function reasonsById(items: Array<{ id: string, reasons: string[] }>) {
  return Object.fromEntries(items.map(item => [item.id, item.reasons]))
}

function memory(overrides: Partial<ElectronMemoryItem>): ElectronMemoryItem {
  return {
    id: 'memory-1',
    scope: 'user',
    type: 'profile',
    content: 'memory content',
    summary: null,
    tags: [],
    importance: 3,
    privacy: 'local',
    sourceType: 'manual',
    sourceId: null,
    status: 'active',
    createdAt: '2026-05-21T00:00:00.000Z',
    updatedAt: '2026-05-21T00:00:00.000Z',
    lastAccessedAt: null,
    accessCount: 0,
    archivedAt: null,
    metadata: null,
    ...overrides,
  }
}
