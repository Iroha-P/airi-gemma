import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench filtered empty state UI', () => {
  it('distinguishes an empty filter from an empty review queue', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('hasHiddenReviewWorkbenchEntries')
    expect(page).toContain('reviewWorkbenchEntries.value.length > 0')
    expect(page).toContain('filteredReviewWorkbenchEntries.value.length === 0')
    expect(component).toContain('settings.pages.memory.review-workbench.filtered-empty')
    expect(component).toContain('settings.pages.memory.review-workbench.show-all')
    expect(component).toContain('@click="filter = \'all\'"')
    expect(component).toContain('v-else-if="props.filteredEntries.length === 0"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('filtered-empty')
      expect(locale).toContain('show-all')
    }
  })
})
