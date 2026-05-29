import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings backup preview bulk selection UI', () => {
  it('renders bulk select and clear selection actions for backup preview', async () => {
    const repoRoot = process.cwd()
    const store = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts'), 'utf8')
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/BackupPreviewPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(store).toContain('function selectAllBackupItems()')
    expect(store).toContain('.filter(item => !item.empty)')
    expect(store).toContain('function clearBackupSelection()')
    expect(store).toContain('selectAllBackupItems,')
    expect(store).toContain('clearBackupSelection,')

    expect(page).toContain('selectableBackupCount')
    expect(page).toContain('canSelectAllBackupItems')
    expect(page).toContain('selectedBackupCount.value < selectableBackupCount.value')
    expect(resultsComponent).toContain('BackupPreviewPanel')
    expect(component).toContain('settings.pages.memory.backup-preview.select-all')
    expect(component).toContain('settings.pages.memory.backup-preview.clear-selection')
    expect(component).toContain(':disabled="props.saving || !props.canSelectAll"')
    expect(component).toContain('@click="emit(\'selectAll\')"')
    expect(component).toContain('@click="emit(\'clearSelection\')"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('select-all')
      expect(locale).toContain('clear-selection')
    }

    expect(design).toContain('Backup Preview Bulk Selection')
    expect(design).toContain('一键全选所有非空可导入项')
  })
})
