import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings backup selected conflict warning UI', () => {
  it('warns when selected backup items contain conflict findings', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/BackupPreviewPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(page).toContain('selectedBackupConflictCount')
    expect(page).toContain('selectedBackupOriginalIds.value.includes(item.originalId) && item.conflicts.length > 0')
    expect(component).toContain('props.selectedConflictCount > 0')
    expect(component).toContain('settings.pages.memory.backup-preview.selected-conflict-warning')
    expect(component).toContain('{ count: props.selectedConflictCount }')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('selected-conflict-warning')
      expect(locale).toContain('{count}')
    }

    expect(design).toContain('Backup Selected Conflict Warning')
    expect(design).toContain('当前选中的备份导入项中包含冲突发现')
  })
})
