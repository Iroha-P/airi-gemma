import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('memory settings public profile and lora export result UI', () => {
  it('persists and renders public profile and lora export summaries without sample content', async () => {
    const repoRoot = process.cwd()
    const store = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/stores/settings/memory.ts'), 'utf8')
    const page = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue'), 'utf8')
    const resultsComponent = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/MemoryResultsPanel.vue'), 'utf8')
    const component = await readFile(join(repoRoot, 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/ExportFileListPanel.vue'), 'utf8')
    const en = await readFile(join(repoRoot, 'packages/i18n/src/locales/en/settings.yaml'), 'utf8')
    const zhHans = await readFile(join(repoRoot, 'packages/i18n/src/locales/zh-Hans/settings.yaml'), 'utf8')
    const design = await readFile(join(repoRoot, 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md'), 'utf8')

    expect(store).toContain('const publicProfileExportResult = ref<ElectronMemoryExportPublicProfileResult | null>(null)')
    expect(store).toContain('const loraDatasetCandidatesExportResult = ref<ElectronMemoryExportLoraDatasetCandidatesResult | null>(null)')
    expect(store).toContain('publicProfileExportResult.value = result')
    expect(store).toContain('loraDatasetCandidatesExportResult.value = result')
    expect(store).toContain('publicProfileExportResult,')
    expect(store).toContain('loraDatasetCandidatesExportResult,')

    expect(page).toContain('publicProfileExportResult')
    expect(page).toContain('loraDatasetCandidatesExportResult')
    expect(page).toContain('publicProfileExportMemoryCount')
    expect(page).toContain('loraDatasetCandidatesExportRecordCount')
    expect(resultsComponent).toContain('settings.pages.memory.public-profile-export.title')
    expect(resultsComponent).toContain('settings.pages.memory.public-profile-export.total-memories')
    expect(resultsComponent).toContain('settings.pages.memory.lora-dataset-export.title')
    expect(resultsComponent).toContain('settings.pages.memory.lora-dataset-export.total-records')
    expect(page).toContain(':public-profile-export-result="publicProfileExportResult"')
    expect(page).toContain(':lora-dataset-candidates-export-result="loraDatasetCandidatesExportResult"')
    expect(component).toContain('v-for="file in props.result.files"')

    for (const locale of [en, zhHans]) {
      expect(locale).toContain('public-profile-export')
      expect(locale).toContain('lora-dataset-export')
      expect(locale).toContain('total-memories')
      expect(locale).toContain('total-records')
    }

    expect(design).toContain('Public Profile / LoRA Export Result UI')
    expect(design).toContain('页面不展示样本正文')
  })
})
