import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings knowledge import result UI', () => {
  it('renders and localizes generated Obsidian file skip results', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ImportResultsPanel.vue'), 'utf8')
    const store = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(store).toContain('knowledgeBaseImportResult')
    expect(page).toContain('knowledgeBaseImportResult')
    expect(resultsComponent).toContain('ImportResultsPanel')
    expect(component).toContain('skippedGeneratedFiles')
    expect(component).toContain('knowledgeBaseImportResult.emptyFiles')
    expect(page).toContain('reviewWorkbenchTotal')
    expect(component).toContain('settings.pages.memory.import-review.updated')
    expect(component).toContain('settings.pages.memory.knowledge-import.empty-file-title')
    expect(component).toContain('settings.pages.memory.knowledge-import.no-empty-files')
    expect(component).toContain('settings.pages.memory.knowledge-import.generated-title')
    expect(component).toContain('settings.pages.memory.knowledge-import.empty-generated')
    expect(component).toContain('v-for="file in props.knowledgeBaseImportResult.emptyFiles"')
    expect(component).toContain('v-for="file in props.knowledgeBaseImportResult.skippedGeneratedFiles"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('knowledge-import')
      expect(locale).toContain('import-review')
      expect(locale).toContain('empty-file-title')
      expect(locale).toContain('no-empty-files')
      expect(locale).toContain('generated-title')
      expect(locale).toContain('empty-generated')
    }
  })
})
