import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench safety evidence UI', () => {
  it('renders safety scanner findings as review evidence rows', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('function getSafetyFindings')
    expect(page).toContain('metadata?.safety')
    expect(page).toContain('entry.reasons.includes(\'safety_risk\')')
    expect(component).toContain('props.reviewEvidenceRows(entry)')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.safety-kind')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.safety-severity')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.safety-reason')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('safety-kind')
      expect(locale).toContain('safety-severity')
      expect(locale).toContain('safety-reason')
    }
  })
})
