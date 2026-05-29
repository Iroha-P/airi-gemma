import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const pagePath = join(process.cwd(), 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue')
const dreamPanelPath = join(process.cwd(), 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/DreamCyclePanel.vue')
const localeCodes = ['en', 'es', 'fr', 'ja', 'ko', 'ru', 'vi', 'zh-Hans', 'zh-Hant']

describe('memory settings dream withheld safety UI wiring', () => {
  it('renders localized dream withheld reasons for unsafe context', async () => {
    const page = await readFile(pagePath, 'utf8')
    const dreamPanel = await readFile(dreamPanelPath, 'utf8')

    expect(page).toContain('<DreamCyclePanel')
    expect(dreamPanel).toContain('settings.pages.memory.dream.withheld-reason.$' + '{item.reason}')

    for (const localeCode of localeCodes) {
      const locale = await readFile(join(process.cwd(), `packages/i18n/src/locales/${localeCode}/settings.yaml`), 'utf8')

      expect(locale).toContain('withheld-reason:')
      expect(locale).toContain('secret_memory:')
      expect(locale).toContain('safety_risk:')
    }
  })
})
