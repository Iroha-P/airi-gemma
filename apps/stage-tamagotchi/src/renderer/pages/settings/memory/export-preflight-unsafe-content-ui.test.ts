import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings export preflight unsafe content UI', () => {
  it('renders the unsafe_content preflight reason through localized labels', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ExportPreflightPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const eventa = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/shared/eventa.ts'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(page).toContain(':format-preflight-reason="exportPreflightReasonLabel"')
    expect(resultsComponent).toContain(':format-reason="formatPreflightReason"')
    expect(component).toContain('props.formatReason(reason)')
    expect(eventa).toContain('\'unsafe_content\'')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('unsafe_content')
    }

    expect(en).toContain('unsafe_content: Unsafe content')
    expect(zhHans).toContain('unsafe_content: 正文含敏感风险')
    expect(design).toContain('`unsafe_content`')
  })
})
