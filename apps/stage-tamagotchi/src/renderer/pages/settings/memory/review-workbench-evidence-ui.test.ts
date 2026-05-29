import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench evidence UI', () => {
  it('renders and localizes review evidence rows for dream and persona candidates', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('reviewEvidenceRows')
    expect(component).toContain('settings.pages.memory.review-workbench.evidence.title')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.dream-session')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.requires-review')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.lora-dataset-candidate')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.persona-derived-from')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.persona-reason')
    expect(component).toContain('v-for="row in props.reviewEvidenceRows(entry)"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('dream-session')
      expect(locale).toContain('requires-review')
      expect(locale).toContain('lora-dataset-candidate')
      expect(locale).toContain('persona-derived-from')
      expect(locale).toContain('persona-reason')
    }
  })
})
