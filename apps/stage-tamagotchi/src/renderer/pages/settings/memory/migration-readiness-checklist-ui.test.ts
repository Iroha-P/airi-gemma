import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings migration readiness checklist UI', () => {
  it('renders a migration checklist from active memory and export results', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const actionsPanel = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryActionsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MigrationReadinessChecklist.vue'), 'utf8')
    const types = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/migration-readiness.ts'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(types).toContain('interface MigrationReadinessItem')
    expect(page).toContain('migrationReadinessItems')
    expect(page).toContain('migrationReadinessReadyCount')
    expect(resultsComponent).toContain('MemoryActionsPanel')
    expect(actionsPanel).toContain('MigrationReadinessChecklist')
    expect(component).toContain('settings.pages.memory.migration-readiness.title')
    expect(component).toContain('settings.pages.memory.migration-readiness.ready-count')
    expect(page).toContain('settings.pages.memory.migration-readiness.items.memory-backup.title')
    expect(page).toContain('settings.pages.memory.migration-readiness.items.llmwiki.title')
    expect(page).toContain('settings.pages.memory.migration-readiness.items.obsidian.title')
    expect(component).toContain('v-for="item in items"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('migration-readiness')
      expect(locale).toContain('active-memory')
      expect(locale).toContain('memory-backup')
      expect(locale).toContain('llmwiki')
      expect(locale).toContain('obsidian')
    }

    expect(design).toContain('Migration Readiness Checklist UI')
  })
})
