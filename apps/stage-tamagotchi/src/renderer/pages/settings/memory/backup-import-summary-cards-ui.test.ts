import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings backup import summary cards UI', () => {
  it('renders localized imported and skipped summary cards for backup import results', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/BackupImportResultPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(component).toContain('settings.pages.memory.backup-import.imported-items')
    expect(component).toContain('settings.pages.memory.backup-import.skipped-items')
    expect(page).toContain('backupImportImportedCount')
    expect(page).toContain('backupImportSkippedCount')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('imported-items')
      expect(locale).toContain('skipped-items')
    }

    expect(design).toContain('Backup Import Summary Cards')
    expect(design).toContain('导入成功项和跳过项数量')
  })
})
