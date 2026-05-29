import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings LoRA dry-run contract UI', () => {
  it('renders and localizes the external script contract summary', async () => {
    const repoRoot = process.cwd()
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/LoraTrainingDryRunPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')

    expect(page).toContain('loraTrainingDryRunContractRows')
    expect(page).toContain('loraTrainingDryRunArtifactRows')
    expect(resultsComponent).toContain('LoraTrainingDryRunPanel')
    expect(component).toContain('settings.pages.memory.lora-training-dry-run.contract-title')
    expect(component).toContain('settings.pages.memory.lora-training-dry-run.artifacts-title')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('contract-title')
      expect(locale).toContain('artifacts-title')
      expect(locale).toContain('success-schema')
      expect(locale).toContain('success-checks')
      expect(locale).toContain('error-format')
      expect(locale).toContain('validation-error-type')
      expect(locale).toContain('validation-error-exit-code')
      expect(locale).toContain('training-runbook-path')
      expect(locale).toContain('post-training-checklist-path')
    }
  })
})
