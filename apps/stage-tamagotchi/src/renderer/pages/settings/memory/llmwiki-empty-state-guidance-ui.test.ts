import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings llmwiki empty state guidance UI', () => {
  it('distinguishes zero scanned files from zero matched snippets', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const panel = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/LlmWikiSearchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(page).toContain('llmWikiSearchEmptyMessageKey')
    expect(page).toContain('llmWikiSearchResult.value.scannedFiles === 0')
    expect(page).toContain('settings.pages.memory.llmwiki-search.empty-no-files')
    expect(page).toContain('settings.pages.memory.llmwiki-search.empty-no-match')
    expect(panel).toContain('emptyMessageKey ?? \'settings.pages.memory.llmwiki-search.empty-no-match\'')
    expect(panel).not.toContain('t(\'settings.pages.memory.llmwiki-search.empty\')')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('empty-no-files')
      expect(locale).toContain('empty-no-match')
    }

    expect(design).toContain('尚未扫描到 Markdown 文件')
    expect(design).toContain('已扫描但未命中 query')
  })
})
