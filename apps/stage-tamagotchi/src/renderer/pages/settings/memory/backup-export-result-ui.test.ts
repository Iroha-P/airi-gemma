import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings backup export result UI', () => {
  it('persists and renders the latest backup export result for migration review', async () => {
    const repoRoot = process.cwd()
    const store = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts'), 'utf8')
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ExportFileListPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(store).toContain('const backupExportResult = ref<ElectronMemoryExportBackupResult | null>(null)')
    expect(store).toContain('backupExportResult.value = result')
    expect(store).toContain('backupExportResult,')

    expect(page).toContain('backupExportResult')
    expect(page).toContain('backupExportMemoryCount')
    expect(resultsComponent).toContain('ExportFileListPanel')
    expect(resultsComponent).toContain('settings.pages.memory.backup-export.title')
    expect(resultsComponent).toContain('settings.pages.memory.backup-export.description')
    expect(resultsComponent).toContain('settings.pages.memory.backup-export.output-dir')
    expect(resultsComponent).toContain('settings.pages.memory.backup-export.total-memories')
    expect(resultsComponent).toContain('settings.pages.memory.backup-export.memory-count')
    expect(component).toContain('v-for="file in props.result.files"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('backup-export')
      expect(locale).toContain('total-memories')
      expect(locale).toContain('memory-count')
    }

    expect(design).toContain('Backup Export Result UI')
    expect(design).toContain('方便换电脑迁移前确认备份产物')
  })
})
