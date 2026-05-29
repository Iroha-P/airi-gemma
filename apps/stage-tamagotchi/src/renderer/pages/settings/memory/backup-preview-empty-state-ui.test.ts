import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings backup preview empty state UI', () => {
  it('renders an explicit empty state when a backup contains no memories', async () => {
    const repoRoot = process.cwd()
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/BackupPreviewPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(resultsComponent).toContain('BackupPreviewPanel')
    expect(component).toContain('props.result.items.length === 0')
    expect(component).toContain('settings.pages.memory.backup-preview.empty-backup')
    expect(component).toContain('<div v-else :class="[\'flex max-h-80 flex-col gap-2 overflow-auto pr-1\']">')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('empty-backup')
    }

    expect(design).toContain('Backup Preview Empty State')
    expect(design).toContain('预览面板会显示明确空状态')
  })
})
