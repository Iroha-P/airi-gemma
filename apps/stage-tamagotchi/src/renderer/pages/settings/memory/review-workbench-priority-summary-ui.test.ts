import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench priority summary UI', () => {
  it('derives and renders high medium low review priority counts', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('reviewWorkbenchPriorityCounts')
    expect(page).toContain('entry.priority === \'high\'')
    expect(page).toContain('entry.priority === \'medium\'')
    expect(page).toContain('entry.priority === \'low\'')
    expect(component).toContain('settings.pages.memory.review-workbench.priority-summary')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('priority-summary')
      expect(locale).toContain('{high}')
      expect(locale).toContain('{medium}')
      expect(locale).toContain('{low}')
    }
  })
})
