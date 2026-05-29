import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const pagePath = join(process.cwd(), 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue')
const ragPreviewPanelPath = join(process.cwd(), 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/RagPreviewPanel.vue')
const enSettingsPath = join(process.cwd(), 'packages/i18n/src/locales/en/settings.yaml')
const zhHansSettingsPath = join(process.cwd(), 'packages/i18n/src/locales/zh-Hans/settings.yaml')
const localeCodes = ['es', 'fr', 'ja', 'ko', 'ru', 'vi', 'zh-Hant']

describe('memory settings RAG safety withheld UI wiring', () => {
  it('localizes safety-risk withheld reasons', async () => {
    const [page, ragPreviewPanel, enSettings, zhHansSettings] = await Promise.all([
      readFile(pagePath, 'utf8'),
      readFile(ragPreviewPanelPath, 'utf8'),
      readFile(enSettingsPath, 'utf8'),
      readFile(zhHansSettingsPath, 'utf8'),
    ])

    expect(page).toContain('<RagPreviewPanel')
    expect(ragPreviewPanel).toContain('settings.pages.memory.rag-preview.withheld-reason.$' + '{item.reason}')
    expect(enSettings).toContain('safety_risk: Safety-risk memory is blocked from retrieval.')
    expect(zhHansSettings).toContain('safety_risk: 安全风险记忆不会进入检索上下文。')

    for (const localeCode of localeCodes) {
      const locale = await readFile(join(process.cwd(), `packages/i18n/src/locales/${localeCode}/settings.yaml`), 'utf8')
      expect(locale).toContain('safety_risk:')
    }
  })
})
