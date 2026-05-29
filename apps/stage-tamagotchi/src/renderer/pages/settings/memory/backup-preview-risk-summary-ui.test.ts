import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings backup preview risk summary UI', () => {
  it('renders selected empty and conflict counts before backup import', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/BackupPreviewPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(page).toContain('backupPreviewEmptyCount')
    expect(page).toContain('backupPreview.value?.items.filter(item => item.empty).length ?? 0')
    expect(page).toContain('backupPreviewConflictCount')
    expect(page).toContain('backupPreview.value?.items.filter(item => item.conflicts.length > 0).length ?? 0')
    expect(component).toContain('settings.pages.memory.backup-preview.selected')
    expect(component).toContain('settings.pages.memory.backup-preview.empty-items')
    expect(component).toContain('settings.pages.memory.backup-preview.conflict-items')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('selected')
      expect(locale).toContain('empty-items')
      expect(locale).toContain('conflict-items')
    }

    expect(design).toContain('Backup Preview Risk Summary')
    expect(design).toContain('空内容项和冲突项数量')
  })
})
