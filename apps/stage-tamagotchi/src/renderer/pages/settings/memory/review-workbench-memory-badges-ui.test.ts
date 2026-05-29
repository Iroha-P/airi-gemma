import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench memory badges UI', () => {
  it('renders type, privacy, and importance badges for review entries', async () => {
    const repoRoot = process.cwd()
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')

    expect(component).toContain('settings.pages.memory.types.')
    expect(component).toContain('entry.item.type')
    expect(component).toContain('settings.pages.memory.privacy.')
    expect(component).toContain('entry.item.privacy')
    expect(component).toContain('settings.pages.memory.status.importance')
    expect(component).toContain('entry.item.importance')
  })
})
