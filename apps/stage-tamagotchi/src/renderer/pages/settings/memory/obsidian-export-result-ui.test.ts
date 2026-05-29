import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings Obsidian export result UI', () => {
  it('renders and localizes Obsidian inbox export files', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const actionsPanel = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryActionsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ObsidianExportPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('obsidianVaultExportResult')
    expect(page).toContain('obsidianInboxExportFiles')
    expect(page).toContain('obsidianManifestExportFile')
    expect(page).toContain('obsidianNavigationExportFiles')
    expect(page).toContain('00-inbox/')
    expect(page).toContain('.airi/manifest.json')
    expect(resultsComponent).toContain('ObsidianExportPanel')
    expect(component).toContain('settings.pages.memory.obsidian-export.inbox-title')
    expect(component).toContain('settings.pages.memory.obsidian-export.manifest-title')
    expect(component).toContain('settings.pages.memory.obsidian-export.output-dir')
    expect(component).toContain('v-for="file in props.inboxFiles"')
    expect(page).toContain(':total-count="status?.total ?? 0"')
    expect(actionsPanel).toContain('props.totalCount === 0')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('obsidian-export')
      expect(locale).toContain('inbox-title')
      expect(locale).toContain('manifest-title')
      expect(locale).toContain('output-dir')
      expect(locale).toContain('empty-inbox')
    }
  })
})
