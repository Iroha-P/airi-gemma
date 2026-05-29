import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench stale evidence UI', () => {
  it('renders stale active memory timing evidence rows', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('entry.reasons.includes(\'stale_active\')')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.stale-updated')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.stale-last-accessed')
    expect(page).toContain('settings.pages.memory.review-workbench.evidence.stale-access-count')
    expect(page).toContain('formatDate(entry.item.updatedAt)')
    expect(page).toContain('formatOptionalDate(entry.item.lastAccessedAt)')
    expect(page).toContain('String(entry.item.accessCount)')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('stale-updated')
      expect(locale).toContain('stale-last-accessed')
      expect(locale).toContain('stale-access-count')
    }
  })
})
