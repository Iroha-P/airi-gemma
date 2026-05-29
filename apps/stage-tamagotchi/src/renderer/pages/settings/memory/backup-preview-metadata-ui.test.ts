import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings backup preview metadata UI', () => {
  it('renders backup file schema version and export time before import', async () => {
    const repoRoot = process.cwd()
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/BackupPreviewPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(component).toContain('settings.pages.memory.backup-preview.backup-file')
    expect(component).toContain('settings.pages.memory.backup-preview.schema-version')
    expect(component).toContain('settings.pages.memory.backup-preview.exported-at')
    expect(component).toContain('{{ props.result.backupFile }}')
    expect(component).toContain('{{ props.result.schemaVersion }}')
    expect(component).toContain('{{ props.formatDate(props.result.exportedAt) }}')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('backup-file')
      expect(locale).toContain('schema-version')
      expect(locale).toContain('exported-at')
    }

    expect(design).toContain('Backup Preview Metadata')
    expect(design).toContain('schema 版本和原始导出时间')
  })
})
