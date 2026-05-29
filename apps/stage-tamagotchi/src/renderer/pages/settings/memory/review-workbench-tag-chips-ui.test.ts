import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings review workbench tag chips UI', () => {
  it('renders review item tags without exposing source ids as chips', async () => {
    const repoRoot = process.cwd()
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ReviewWorkbenchPanel.vue'), 'utf8')

    expect(component).toContain('entry.item.tags.length > 0')
    expect(component).toContain('v-for="tag in entry.item.tags"')
    expect(component).toContain('-tag-')
    expect(component).toContain('#{{ tag }}')
    expect(component).not.toContain('v-for="sourceId in entry.item.sourceId"')
  })
})
