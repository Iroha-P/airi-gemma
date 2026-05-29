import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const pagePath = join(process.cwd(), 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue')
const computerUsePanelPath = join(process.cwd(), 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ComputerUsePanel.vue')

describe('memory settings computer-use execution UI', () => {
  it('uses the main-process canExecute decision for the approved execute button', async () => {
    const page = await readFile(pagePath, 'utf8')
    const computerUsePanel = await readFile(computerUsePanelPath, 'utf8')

    expect(page).toContain('return computerUsePreview.value.canExecute')
    expect(page).toContain(':can-execute="canExecuteComputerUseAction"')
    expect(computerUsePanel).toContain(':disabled="!canExecute"')
  })
})
