import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings llmwiki search result summary UI', () => {
  it('renders localized scanned file and snippet counts for llmwiki search results', async () => {
    const repoRoot = process.cwd()
    const contract = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/shared/eventa.ts'), 'utf8')
    const service = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/main/services/airi/memory/llmwiki.ts'), 'utf8')
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const panel = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/LlmWikiSearchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(contract).toContain('scannedFiles: number')
    expect(service).toContain('scannedFiles: 0')
    expect(service).toContain('scannedFiles: files.length')
    expect(page).toContain('llmWikiSearchSnippetCount')
    expect(page).toContain('llmWikiSearchResult.value?.snippets.length ?? 0')
    expect(page).toContain(':snippet-count="llmWikiSearchSnippetCount"')
    expect(panel).toContain('settings.pages.memory.llmwiki-search.result-summary')
    expect(panel).toContain('{ files: result.scannedFiles, snippets: snippetCount }')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('result-summary')
      expect(locale).toContain('{files}')
      expect(locale).toContain('{snippets}')
    }
  })
})
