import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench snapshot time UI', () => {
  it('renders and localizes the review workbench snapshot timestamp', async () => {
    const repoRoot = process.cwd()
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(component).toContain('settings.pages.memory.review-workbench.generated-at')
    expect(component).toContain('props.formatDate(props.result.generatedAt)')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('generated-at')
      expect(locale).toContain('{time}')
    }
  })
})
