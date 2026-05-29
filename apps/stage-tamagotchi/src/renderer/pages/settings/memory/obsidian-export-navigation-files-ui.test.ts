import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings Obsidian export navigation files UI', () => {
  it('renders localized AIRI-Brain navigation files from Obsidian export results', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ObsidianExportPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(page).toContain('obsidianNavigationExportFiles')
    expect(page).toContain('file.relativePath === \'index.md\' || file.relativePath === \'log.md\'')
    expect(component).toContain('settings.pages.memory.obsidian-export.navigation-title')
    expect(component).toContain('settings.pages.memory.obsidian-export.navigation-description')
    expect(component).toContain('settings.pages.memory.obsidian-export.empty-navigation')
    expect(component).toContain('v-for="file in props.navigationFiles"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('navigation-title')
      expect(locale).toContain('navigation-description')
      expect(locale).toContain('empty-navigation')
    }

    expect(design).toContain('Obsidian Export Navigation Files UI')
    expect(design).toContain('index.md` / `log.md')
  })
})
