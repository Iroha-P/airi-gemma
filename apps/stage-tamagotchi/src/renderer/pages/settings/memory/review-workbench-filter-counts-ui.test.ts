import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench filter counts UI', () => {
  it('derives and renders counts for each review workbench source filter', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('reviewWorkbenchFilterCounts')
    expect(page).toContain('all: reviewWorkbenchEntries.value.length')
    expect(page).toContain('entry.reasons.includes(\'dream_candidate\')')
    expect(page).toContain('entry.reasons.includes(\'persona_candidate\')')
    expect(page).toContain('entry.reasons.includes(\'safety_risk\')')
    expect(page).toContain('entry.reasons.includes(\'conflict\')')
    expect(page).toContain('entry.reasons.includes(\'stale_active\')')
    expect(page).toContain('settings.pages.memory.review-workbench.filters.conflicts')
    expect(page).toContain('settings.pages.memory.review-workbench.filters.stale-active')
    expect(page).toContain('function reviewWorkbenchFilterLabel')
    expect(page).toContain('reviewWorkbenchFilterCounts.value[option.value]')
    expect(page).toContain(':review-workbench-filter-label="reviewWorkbenchFilterLabel"')
    expect(resultsComponent).toContain(':filter-label="reviewWorkbenchFilterLabel"')
    expect(component).toContain(':label="props.filterLabel(option)"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('conflicts')
      expect(locale).toContain('stale-active')
    }
  })
})
