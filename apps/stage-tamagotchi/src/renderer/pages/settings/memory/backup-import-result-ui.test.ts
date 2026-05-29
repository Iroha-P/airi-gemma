import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings backup import result UI', () => {
  it('renders and localizes memory backup import results', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/BackupImportResultPanel.vue'), 'utf8')
    const store = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(store).toContain('backupImportResult')
    expect(page).toContain('backupImportResult')
    expect(page).toContain('backupImportImportedCount')
    expect(page).toContain('backupImportSkippedCount')
    expect(page).toContain('reviewWorkbenchTotal')
    expect(resultsComponent).toContain('BackupImportResultPanel')
    expect(component).toContain('settings.pages.memory.import-review.updated')
    expect(component).toContain('settings.pages.memory.backup-import.skipped-title')
    expect(component).toContain('settings.pages.memory.backup-import.skipped-item')
    expect(component).toContain('settings.pages.memory.backup-import.reason.')
    expect(component).toContain('v-for="item in props.result.skipped"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('backup-import')
      expect(locale).toContain('import-review')
      expect(locale).toContain('skipped-title')
      expect(locale).toContain('not_selected')
      expect(locale).toContain('empty_content')
    }
  })
})
