import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings import review workbench link UI', () => {
  it('links import result summaries to the review workbench section', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const importResultsPanel = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ImportResultsPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('reviewWorkbenchSection')
    expect(page).toContain('function scrollToReviewWorkbench()')
    expect(page).toContain('reviewWorkbenchFilter.value = \'all\'')
    expect(page).toContain('scrollIntoView')
    expect(page).toContain('ref="reviewWorkbenchSection"')
    expect(importResultsPanel).toContain('settings.pages.memory.import-review.open-review-workbench')

    const pageLinkCount = page.match(/@open-review-workbench="scrollToReviewWorkbench"|@click="scrollToReviewWorkbench"/g)?.length ?? 0
    const componentLinkCount = importResultsPanel.match(/@click="emit\('openReviewWorkbench'\)"/g)?.length ?? 0
    expect(pageLinkCount + componentLinkCount).toBeGreaterThanOrEqual(3)

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('open-review-workbench')
    }
  })
})
