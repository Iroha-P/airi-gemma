import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench filters', () => {
  it('renders and localizes dream/persona review filters', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('reviewWorkbenchFilter')
    expect(page).toContain('reviewWorkbenchFilterOptions')
    expect(page).toContain('filteredReviewWorkbenchEntries')
    expect(page).toContain('settings.pages.memory.review-workbench.filters.dream-candidates')
    expect(page).toContain('settings.pages.memory.review-workbench.filters.persona-candidates')
    expect(page).toContain(':review-workbench-filtered-entries="filteredReviewWorkbenchEntries"')
    expect(resultsComponent).toContain(':filtered-entries="reviewWorkbenchFilteredEntries"')
    expect(component).toContain('v-for="entry in props.filteredEntries"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('dream-candidates')
      expect(locale).toContain('persona-candidates')
      expect(locale).toContain('filtered-description')
    }
  })
})
