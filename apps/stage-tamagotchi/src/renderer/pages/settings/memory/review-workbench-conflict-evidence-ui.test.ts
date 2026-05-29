import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench conflict evidence UI', () => {
  it('renders concise conflict metadata as review evidence rows', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('entry.reasons.includes(\'conflict\')')
    expect(page).toContain('getMemoryConflicts(entry.item).forEach')
    expect(component).toContain('props.reviewEvidenceRows(entry)')
    expect(component).toContain('settings.pages.memory.review-workbench.evidence.title')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.conflict-related')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.conflict-reason')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.conflict-score')
    expect(page).toContain('formatConflictScore(conflict.score)')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('conflict-related')
      expect(locale).toContain('conflict-reason')
      expect(locale).toContain('conflict-score')
    }
  })
})
