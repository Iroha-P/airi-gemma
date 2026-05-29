<script setup lang="ts">
import type { SpeechProvider } from '@xsai-ext/providers/utils'

import {
  SpeechPlayground,
  SpeechProviderSettings,
} from '@proj-airi/stage-ui/components'
import { useSpeechStore } from '@proj-airi/stage-ui/stores/modules/speech'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { Callout, FieldInput, FieldRange } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const providerId = 'gpt-sovits-tts'
const defaultModel = 'gpt-sovits'
const TRAILING_SLASH_PATTERN = /\/$/

const speechStore = useSpeechStore()
const providersStore = useProvidersStore()
const { providers } = storeToRefs(providersStore)
const { t } = useI18n()

// Electron native file dialog via eventa IPC
async function browseFile(
  setter: (val: string) => void,
  filters: Array<{ name: string, extensions: string[] }>,
  title?: string,
) {
  try {
    const { defineInvoke, defineInvokeEventa } = await import('@moeru/eventa')
    const { createContext } = await import('@moeru/eventa/adapters/electron/renderer')

    const win = window as any
    if (!win.electron?.ipcRenderer)
      throw new Error('Not running in Electron')

    // Must match the same tag string used in main process handler
    const electronShowOpenDialog = defineInvokeEventa<
      { filePaths: string[], canceled: boolean },
      { title?: string, defaultPath?: string, filters?: Array<{ name: string, extensions: string[] }>, properties?: string[] }
    >('eventa:invoke:electron:dialog:show-open-dialog')

    const { context } = createContext(win.electron.ipcRenderer)
    const showOpenDialog = defineInvoke(context, electronShowOpenDialog)
    const result = await showOpenDialog({ title, filters, properties: ['openFile'] })
    if (!result.canceled && result.filePaths.length > 0) {
      setter(result.filePaths[0])
    }
  }
  catch (err) {
    console.warn('[GSV] Electron dialog not available, falling back to text input:', err)
  }
}

// Connection state
const serverOnline = ref(false)
const serverChecking = ref(false)
const modelLoading = ref(false)
const modelLoadResult = ref<{ success: boolean, message: string } | null>(null)

// Ensure provider config exists
function ensureConfig() {
  if (!providers.value[providerId])
    providers.value[providerId] = {}
  return providers.value[providerId]
}

// Config bindings
const baseUrl = computed({
  get: () => (providers.value[providerId]?.baseUrl as string) || 'http://127.0.0.1:9881',
  set: (val) => { ensureConfig().baseUrl = val },
})

const sovitsWeightsPath = computed({
  get: () => (providers.value[providerId]?.sovitsWeightsPath as string) || '',
  set: (val) => { ensureConfig().sovitsWeightsPath = val },
})

const gptWeightsPath = computed({
  get: () => (providers.value[providerId]?.gptWeightsPath as string) || '',
  set: (val) => { ensureConfig().gptWeightsPath = val },
})

const refAudioPath = computed({
  get: () => (providers.value[providerId]?.refAudioPath as string) || '',
  set: (val) => { ensureConfig().refAudioPath = val },
})

const promptText = computed({
  get: () => (providers.value[providerId]?.promptText as string) || '',
  set: (val) => { ensureConfig().promptText = val },
})

const promptLang = computed({
  get: () => (providers.value[providerId]?.promptLang as string) || 'ja',
  set: (val) => { ensureConfig().promptLang = val },
})

const textLang = computed({
  get: () => (providers.value[providerId]?.textLang as string) || 'ja',
  set: (val) => { ensureConfig().textLang = val },
})

const speed = computed({
  get: () => (providers.value[providerId]?.speed as number) ?? 1.0,
  set: (val) => { ensureConfig().speed = val },
})

const streamingMode = computed({
  get: () => providers.value[providerId]?.streamingMode === true,
  set: (val) => { ensureConfig().streamingMode = val },
})

// Advanced params
const showAdvanced = ref(false)

const topK = computed({
  get: () => (providers.value[providerId]?.topK as number) ?? 12,
  set: (val) => { ensureConfig().topK = val },
})

const topP = computed({
  get: () => (providers.value[providerId]?.topP as number) ?? 0.8,
  set: (val) => { ensureConfig().topP = val },
})

const temperature = computed({
  get: () => (providers.value[providerId]?.temperature as number) ?? 0.8,
  set: (val) => { ensureConfig().temperature = val },
})

const repetitionPenalty = computed({
  get: () => (providers.value[providerId]?.repetitionPenalty as number) ?? 1.35,
  set: (val) => { ensureConfig().repetitionPenalty = val },
})

const languageOptions = [
  { label: '日本語 (Japanese)', value: 'ja' },
  { label: '中文 (Chinese)', value: 'zh' },
  { label: 'English', value: 'en' },
  { label: '한국어 (Korean)', value: 'ko' },
]

// Check if GPT-SoVITS server is online
async function checkServerStatus() {
  serverChecking.value = true
  try {
    const url = baseUrl.value.replace(TRAILING_SLASH_PATTERN, '')
    const resp = await globalThis.fetch(url, { signal: AbortSignal.timeout(3000) })
    // GPT-SoVITS root returns 404 but that means the server IS running
    serverOnline.value = resp.ok || resp.status === 404
  }
  catch {
    serverOnline.value = false
  }
  finally {
    serverChecking.value = false
  }
}

// Load model weights via GPT-SoVITS API
async function loadModelWeights() {
  if (!sovitsWeightsPath.value && !gptWeightsPath.value) {
    modelLoadResult.value = { success: false, message: 'Please fill in at least one weights path.' }
    return
  }

  modelLoading.value = true
  modelLoadResult.value = null
  const url = baseUrl.value.replace(TRAILING_SLASH_PATTERN, '')

  try {
    // Load SoVITS weights
    if (sovitsWeightsPath.value) {
      const params = new URLSearchParams({ weights_path: sovitsWeightsPath.value })
      const resp = await globalThis.fetch(`${url}/set_sovits_weights?${params}`, { signal: AbortSignal.timeout(30000) })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`SoVITS weights load failed (HTTP ${resp.status}): ${text}`)
      }
    }

    // Load GPT weights
    if (gptWeightsPath.value) {
      const params = new URLSearchParams({ weights_path: gptWeightsPath.value })
      const resp = await globalThis.fetch(`${url}/set_gpt_weights?${params}`, { signal: AbortSignal.timeout(30000) })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`GPT weights load failed (HTTP ${resp.status}): ${text}`)
      }
    }

    modelLoadResult.value = { success: true, message: 'Model weights loaded successfully!' }
  }
  catch (err) {
    modelLoadResult.value = { success: false, message: String(err) }
  }
  finally {
    modelLoading.value = false
  }
}

async function handleGenerateSpeech(input: string, _voiceId: string, _useSSML: boolean) {
  const provider = await providersStore.getProviderInstance(providerId) as SpeechProvider
  if (!provider)
    throw new Error('Failed to initialize GPT-SoVITS provider')

  const config = providersStore.getProviderConfig(providerId)
  return await speechStore.speech(
    provider,
    defaultModel,
    input,
    'default',
    { ...config },
  )
}

onMounted(() => {
  const config = ensureConfig()
  if (!config.baseUrl)
    config.baseUrl = 'http://127.0.0.1:9881'
  if (!config.model)
    config.model = defaultModel

  providersStore.fetchModelsForProvider(providerId)
  checkServerStatus()
})

// Re-check server status when baseUrl changes
watch(baseUrl, () => {
  checkServerStatus()
})
</script>

<template>
  <SpeechProviderSettings
    :provider-id="providerId"
    :default-model="defaultModel"
  >
    <template #voice-settings>
      <div class="space-y-5">
        <!-- Server Connection -->
        <div class="border border-neutral-200 rounded-lg p-4 dark:border-neutral-700">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">
              {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.base-url.label') }}
            </h3>
            <div class="flex items-center gap-2">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                :class="serverChecking ? 'bg-yellow-400 animate-pulse' : serverOnline ? 'bg-green-500' : 'bg-red-500'"
              />
              <span class="text-xs text-neutral-500">
                {{ serverChecking ? 'Checking...' : serverOnline ? 'Online' : 'Offline' }}
              </span>
              <button
                class="rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                :disabled="serverChecking"
                @click="checkServerStatus"
              >
                Refresh
              </button>
            </div>
          </div>
          <p class="mt-1 text-xs text-neutral-500">
            {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.base-url.description') }}
          </p>
          <FieldInput
            v-model="baseUrl"
            class="mt-2"
            placeholder="http://127.0.0.1:9881"
          />
        </div>

        <!-- Model Weights Loading -->
        <div class="border border-neutral-200 rounded-lg p-4 dark:border-neutral-700">
          <h3 class="text-sm font-semibold">
            Model Weights
          </h3>
          <p class="mt-1 text-xs text-neutral-500">
            Fill in the absolute paths to your model weights on the GPT-SoVITS server machine, then click "Load" to switch models.
          </p>

          <div class="mt-3 space-y-3">
            <div>
              <label class="text-xs text-neutral-600 font-medium dark:text-neutral-400">SoVITS Weights (.pth)</label>
              <div class="mt-1 flex gap-2">
                <FieldInput
                  v-model="sovitsWeightsPath"
                  class="flex-1"
                  placeholder="E:\GPT-SoVITS\SoVITS_weights_v2\character_e8_s120.pth"
                />
                <button
                  class="shrink-0 border border-neutral-300 rounded-lg bg-neutral-50 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  @click="browseFile(v => sovitsWeightsPath = v, [{ name: 'SoVITS Weights', extensions: ['pth'] }], 'Select SoVITS Weights')"
                >
                  Browse
                </button>
              </div>
            </div>
            <div>
              <label class="text-xs text-neutral-600 font-medium dark:text-neutral-400">GPT Weights (.ckpt)</label>
              <div class="mt-1 flex gap-2">
                <FieldInput
                  v-model="gptWeightsPath"
                  class="flex-1"
                  placeholder="E:\GPT-SoVITS\GPT_weights_v2\character-e15.ckpt"
                />
                <button
                  class="shrink-0 border border-neutral-300 rounded-lg bg-neutral-50 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  @click="browseFile(v => gptWeightsPath = v, [{ name: 'GPT Weights', extensions: ['ckpt'] }], 'Select GPT Weights')"
                >
                  Browse
                </button>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                class="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="modelLoading || !serverOnline || (!sovitsWeightsPath && !gptWeightsPath)"
                @click="loadModelWeights"
              >
                {{ modelLoading ? 'Loading...' : 'Load Model' }}
              </button>
              <span
                v-if="modelLoadResult"
                class="text-xs"
                :class="modelLoadResult.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ modelLoadResult.message }}
              </span>
            </div>
          </div>
        </div>

        <!-- Reference Audio -->
        <div class="border border-neutral-200 rounded-lg p-4 dark:border-neutral-700">
          <h3 class="text-sm font-semibold">
            {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.ref-audio-path.label') }}
          </h3>
          <p class="mt-1 text-xs text-neutral-500">
            {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.ref-audio-path.description') }}
          </p>

          <div class="mt-3 space-y-3">
            <div class="flex gap-2">
              <FieldInput
                v-model="refAudioPath"
                class="flex-1"
                placeholder="F:\project\airi-gemma\gsv\酒寄彩叶\训练集\ref.wav"
              />
              <button
                class="shrink-0 border border-neutral-300 rounded-lg bg-neutral-50 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                @click="browseFile(v => refAudioPath = v, [{ name: 'Audio Files', extensions: ['wav', 'mp3', 'flac', 'ogg'] }], 'Select Reference Audio')"
              >
                Browse
              </button>
            </div>
            <p v-if="refAudioPath && !/^[A-Za-z]:[/\\\\]/.test(refAudioPath) && !refAudioPath.startsWith('/')" class="mt-1 text-xs text-red-500">
              Path must be absolute (e.g. F:\project\airi-gemma\gsv\...\ref.wav). Use the Browse button to select.
            </p>

            <div>
              <Callout :label="t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.prompt-text.label')">
                <p>{{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.prompt-text.description') }}</p>
              </Callout>
              <FieldInput
                v-model="promptText"
                class="mt-2"
                placeholder="参考音频的文字内容..."
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-neutral-600 font-medium dark:text-neutral-400">
                  {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.prompt-lang.label') }}
                </label>
                <select
                  v-model="promptLang"
                  class="mt-1 w-full border border-neutral-300 rounded-lg bg-transparent px-3 py-2 text-sm dark:border-neutral-600"
                >
                  <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-xs text-neutral-600 font-medium dark:text-neutral-400">
                  {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.text-lang.label') }}
                </label>
                <select
                  v-model="textLang"
                  class="mt-1 w-full border border-neutral-300 rounded-lg bg-transparent px-3 py-2 text-sm dark:border-neutral-600"
                >
                  <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Speech Settings -->
        <div class="border border-neutral-200 rounded-lg p-4 dark:border-neutral-700">
          <h3 class="text-sm font-semibold">
            Speech Settings
          </h3>

          <div class="mt-3 space-y-3">
            <!-- Speed -->
            <div>
              <label class="text-xs text-neutral-600 font-medium dark:text-neutral-400">
                {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.speed.label') }}
                <span class="ml-2 text-neutral-400">{{ speed.toFixed(1) }}</span>
              </label>
              <FieldRange
                v-model="speed"
                :min="0.5"
                :max="2.0"
                :step="0.1"
              />
            </div>

            <!-- Streaming Mode -->
            <div class="flex items-center gap-2">
              <input
                :id="`${providerId}-streaming`"
                v-model="streamingMode"
                type="checkbox"
                class="border-neutral-300 rounded dark:border-neutral-600"
              >
              <label :for="`${providerId}-streaming`" class="text-sm">
                {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.streaming-mode.label') }}
                <span class="text-neutral-500 dark:text-neutral-400">
                  — {{ t('settings.pages.providers.provider.gpt-sovits-tts.fields.field.streaming-mode.description') }}
                </span>
              </label>
            </div>

            <!-- Advanced Settings -->
            <div>
              <button
                class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                @click="showAdvanced = !showAdvanced"
              >
                {{ showAdvanced ? '▼' : '▶' }} Advanced
              </button>
              <div v-if="showAdvanced" class="mt-3 border border-neutral-200 rounded-lg p-3 space-y-3 dark:border-neutral-700">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs font-medium">Top K <span class="text-neutral-400">{{ topK }}</span></label>
                    <FieldRange v-model="topK" :min="1" :max="50" :step="1" />
                  </div>
                  <div>
                    <label class="text-xs font-medium">Top P <span class="text-neutral-400">{{ topP.toFixed(2) }}</span></label>
                    <FieldRange v-model="topP" :min="0.1" :max="1.0" :step="0.05" />
                  </div>
                  <div>
                    <label class="text-xs font-medium">Temperature <span class="text-neutral-400">{{ temperature.toFixed(2) }}</span></label>
                    <FieldRange v-model="temperature" :min="0.1" :max="1.5" :step="0.05" />
                  </div>
                  <div>
                    <label class="text-xs font-medium">Repetition Penalty <span class="text-neutral-400">{{ repetitionPenalty.toFixed(2) }}</span></label>
                    <FieldRange v-model="repetitionPenalty" :min="1.0" :max="2.0" :step="0.05" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #playground>
      <SpeechPlayground
        :available-voices="[]"
        :generate-speech="handleGenerateSpeech"
        :api-key-configured="serverOnline"
        :voices-loading="false"
        :default-text="t('settings.pages.providers.provider.gpt-sovits-tts.playground.default-text')"
      />
    </template>
  </SpeechProviderSettings>
</template>

<route lang="yaml">
  meta:
    layout: settings
    stageTransition:
      name: slide
</route>
