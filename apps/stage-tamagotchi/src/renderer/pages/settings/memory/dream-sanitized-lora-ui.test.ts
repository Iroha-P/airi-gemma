import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const pagePath = join(process.cwd(), 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue')
const dreamPanelPath = join(process.cwd(), 'apps/stage-tamagotchi/src/renderer/pages/settings/memory/components/DreamCyclePanel.vue')

describe('memory settings dream sanitized candidate UI wiring', () => {
  it('enables dream review actions only from sanitized candidates', async () => {
    const page = await readFile(pagePath, 'utf8')
    const dreamPanel = await readFile(dreamPanelPath, 'utf8')

    expect(page).toContain('const dreamSanitizedMemoryCandidates = computed(() => dreamReport.value?.sanitizedReport?.memoryCandidates ?? [])')
    expect(page).toContain('const dreamSanitizedRoutineCandidates = computed(() => dreamReport.value?.sanitizedReport?.routineCandidates ?? [])')
    expect(page).toContain('const dreamSanitizedLoraDatasetCandidates = computed(() => dreamReport.value?.sanitizedReport?.loraDatasetCandidates ?? [])')
    expect(page).toContain('const canImportDreamMemoryCandidates = computed(() => dreamSanitizedMemoryCandidates.value.length > 0 && !dreamLoading.value)')
    expect(page).toContain('const canSaveDreamRoutineCandidates = computed(() => dreamSanitizedRoutineCandidates.value.length > 0 && !dreamLoading.value)')
    expect(page).toContain('const canImportDreamLoraCandidates = computed(() => dreamSanitizedLoraDatasetCandidates.value.length > 0 && !dreamLoading.value)')
    expect(page).toContain(':memory-candidates="dreamSanitizedMemoryCandidates"')
    expect(page).toContain(':routine-candidates="dreamSanitizedRoutineCandidates"')
    expect(page).toContain(':lora-dataset-candidates="dreamSanitizedLoraDatasetCandidates"')
    expect(dreamPanel).toContain('settings.pages.memory.dream.memory-candidates\', { count: props.memoryCandidates.length }')
    expect(dreamPanel).toContain('settings.pages.memory.dream.routine-candidates\', { count: props.routineCandidates.length }')
    expect(dreamPanel).toContain('v-for="candidate in props.memoryCandidates"')
    expect(dreamPanel).toContain('v-for="candidate in props.routineCandidates"')
    expect(dreamPanel).toContain('props.loraDatasetCandidates.length')
    expect(dreamPanel).toContain('v-for="(candidate, index) in props.loraDatasetCandidates"')
    expect(page).not.toContain('const canImportDreamMemoryCandidates = computed(() => Boolean(dreamReport.value?.memoryCandidates.length)')
    expect(page).not.toContain('const canSaveDreamRoutineCandidates = computed(() => Boolean(dreamReport.value?.routineCandidates.length)')
    expect(page).not.toContain('const canImportDreamLoraCandidates = computed(() => Boolean(dreamReport.value?.loraDatasetCandidates.length)')
    expect(page).not.toContain('v-for="candidate in dreamCurrentSession.report.memoryCandidates"')
    expect(page).not.toContain('v-for="candidate in dreamCurrentSession.report.routineCandidates"')
  })
})
