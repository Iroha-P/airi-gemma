import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench active filter reset UI', () => {
  it('renders a show-all reset button whenever a review workbench filter is active', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')

    expect(page).toContain('isReviewWorkbenchFiltered')
    expect(page).toContain('reviewWorkbenchFilter.value !== \'all\'')
    expect(page).toContain(':is-review-workbench-filtered="isReviewWorkbenchFiltered"')
    expect(resultsComponent).toContain(':is-filtered="isReviewWorkbenchFiltered"')
    expect(component).toContain('v-if="props.isFiltered"')
    expect(component).toContain('settings.pages.memory.review-workbench.show-all')
    expect(component).toContain('@click="filter = \'all\'"')
  })
})
