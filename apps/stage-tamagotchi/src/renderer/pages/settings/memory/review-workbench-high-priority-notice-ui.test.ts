import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench high priority notice UI', () => {
  it('renders a localized notice when high priority review items exist', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('hasHighPriorityReviewItems')
    expect(page).toContain('reviewWorkbenchPriorityCounts.value.high > 0')
    expect(page).toContain(':has-high-priority-review-items="hasHighPriorityReviewItems"')
    expect(resultsComponent).toContain(':has-high-priority-items="hasHighPriorityReviewItems"')
    expect(component).toContain('v-if="props.hasHighPriorityItems"')
    expect(component).toContain('settings.pages.memory.review-workbench.high-priority-notice')
    expect(component).toContain('props.priorityCounts.high')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('high-priority-notice')
      expect(locale).toContain('{count}')
    }
  })
})
