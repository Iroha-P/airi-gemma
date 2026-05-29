import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings llmwiki export result UI', () => {
  it('persists and renders the latest llmwiki export result', async () => {
    const repoRoot = process.cwd()
    const store = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts'), 'utf8')
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/LlmWikiExportPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(store).toContain('const llmWikiExportResult = ref<ElectronMemoryExportLlmWikiResult | null>(null)')
    expect(store).toContain('llmWikiExportResult.value = result')
    expect(store).toContain('llmWikiExportResult,')
    expect(page).toContain('llmWikiExportResult')
    expect(page).toContain('llmWikiNavigationExportFiles')
    expect(page).toContain('llmWikiContentExportFiles')
    expect(page).toContain('llmWikiExportMemoryCount')
    expect(page).toContain('file.relativePath === \'index.md\' || file.relativePath === \'log.md\'')
    expect(page).toContain('file.relativePath !== \'index.md\' && file.relativePath !== \'log.md\'')
    expect(page).toContain('llmWikiContentExportFiles.value.reduce((total, file) => total + file.count, 0)')
    expect(resultsComponent).toContain('LlmWikiExportPanel')
    expect(component).toContain('settings.pages.memory.llmwiki-export.title')
    expect(component).toContain('settings.pages.memory.llmwiki-export.description')
    expect(component).toContain('settings.pages.memory.llmwiki-export.output-dir')
    expect(component).toContain('settings.pages.memory.llmwiki-export.total-memories')
    expect(component).toContain('settings.pages.memory.llmwiki-export.navigation-title')
    expect(component).toContain('settings.pages.memory.llmwiki-export.navigation-description')
    expect(component).toContain('settings.pages.memory.llmwiki-export.empty-navigation')
    expect(component).toContain('settings.pages.memory.llmwiki-export.memory-count')
    expect(component).toContain('v-for="file in props.navigationFiles"')
    expect(component).toContain('v-for="file in props.contentFiles"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('llmwiki-export')
      expect(locale).toContain('empty-files')
      expect(locale).toContain('navigation-title')
      expect(locale).toContain('navigation-description')
      expect(locale).toContain('empty-navigation')
      expect(locale).toContain('total-memories')
      expect(locale).toContain('memory-count')
    }
  })
})
