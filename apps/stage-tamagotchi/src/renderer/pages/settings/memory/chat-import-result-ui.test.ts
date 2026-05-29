import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings chat import result UI', () => {
  it('renders and localizes chat record import results', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ImportResultsPanel.vue'), 'utf8')
    const store = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(store).toContain('chatRecordsImportResult')
    expect(page).toContain('chatRecordsImportResult')
    expect(resultsComponent).toContain('ImportResultsPanel')
    expect(component).toContain('chatRecordsImportResult.messagesImported')
    expect(component).toContain('chatRecordsImportResult.unsupportedFiles')
    expect(page).toContain('reviewWorkbenchTotal')
    expect(component).toContain('settings.pages.memory.import-review.updated')
    expect(component).toContain('settings.pages.memory.chat-import.unsupported-file-title')
    expect(component).toContain('settings.pages.memory.chat-import.no-unsupported-files')
    expect(component).toContain('v-for="file in props.chatRecordsImportResult.emptyFiles"')
    expect(component).toContain('v-for="file in props.chatRecordsImportResult.unsupportedFiles"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('chat-import')
      expect(locale).toContain('import-review')
      expect(locale).toContain('unsupported-file-title')
      expect(locale).toContain('no-unsupported-files')
    }
  })
})
