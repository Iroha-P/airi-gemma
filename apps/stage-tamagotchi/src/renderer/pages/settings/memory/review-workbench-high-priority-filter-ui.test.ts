import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench high priority filter UI', () => {
  it('derives and renders a manual high priority review filter', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('high_priority')
    expect(page).toContain('settings.pages.memory.review-workbench.filters.high-priority')
    expect(page).toContain('filter === \'high_priority\'')
    expect(page).toContain('entry.priority === \'high\'')
    expect(page).toContain('high_priority: reviewWorkbenchEntries.value.filter')
    expect(page).toContain('reviewWorkbenchFilterCounts.value[option.value]')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('high-priority')
    }
  })
})
