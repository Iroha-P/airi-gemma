<script setup lang="ts">
import type { RemovableRef } from '@vueuse/core'
import type { TranscriptionProviderWithExtraOptions } from '@xsai-ext/providers/utils'

import {
  Alert,
  ProviderAdvancedSettings,
  ProviderBaseUrlInput,
  ProviderBasicSettings,
  ProviderSettingsContainer,
  ProviderSettingsLayout,
  TranscriptionPlayground,
} from '@proj-airi/stage-ui/components'
import { useProviderValidation } from '@proj-airi/stage-ui/composables/use-provider-validation'
import { useHearingStore } from '@proj-airi/stage-ui/stores/modules/hearing'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { FieldSelect } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const providerId = 'paraformer-local'
const OPENAI_V1_SUFFIX_PATTERN = /\/v1\/?$/
const TRAILING_SLASH_PATTERN = /\/$/
const hearingStore = useHearingStore()
const providersStore = useProvidersStore()
const { providers } = storeToRefs(providersStore) as { providers: RemovableRef<Record<string, any>> }
const { t } = useI18n()

const baseUrl = computed({
  get: () => providers.value[providerId]?.baseUrl || 'http://127.0.0.1:8000/v1/',
  set: (value) => {
    if (!providers.value[providerId])
      providers.value[providerId] = {}
    providers.value[providerId].baseUrl = value
  },
})

const device = computed({
  get: () => providers.value[providerId]?.device || 'cpu',
  set: (value) => {
    if (!providers.value[providerId])
      providers.value[providerId] = {}
    providers.value[providerId].device = value
  },
})

const serverStatus = ref<'unknown' | 'online' | 'offline'>('unknown')
const serverDevice = ref('')
const isSwitchingDevice = ref(false)

async function checkServerStatus() {
  try {
    // Health check at server root, not at /v1/
    const url = baseUrl.value.replace(OPENAI_V1_SUFFIX_PATTERN, '').replace(TRAILING_SLASH_PATTERN, '')
    const resp = await globalThis.fetch(url, { signal: AbortSignal.timeout(3000) })
    if (resp.ok) {
      const data = await resp.json()
      serverStatus.value = 'online'
      serverDevice.value = data.device || 'unknown'
    }
    else {
      serverStatus.value = 'offline'
    }
  }
  catch {
    serverStatus.value = 'offline'
  }
}

async function switchDevice(newDevice: string) {
  if (newDevice === serverDevice.value)
    return
  isSwitchingDevice.value = true
  try {
    const url = baseUrl.value.replace(OPENAI_V1_SUFFIX_PATTERN, '').replace(TRAILING_SLASH_PATTERN, '')
    const formData = new FormData()
    formData.append('device', newDevice)
    const resp = await globalThis.fetch(`${url}/config`, {
      method: 'POST',
      body: formData,
    })
    if (resp.ok) {
      device.value = newDevice
      await checkServerStatus()
    }
  }
  catch (err) {
    console.error('Failed to switch device:', err)
  }
  finally {
    isSwitchingDevice.value = false
  }
}

async function handleGenerateTranscription(file: File) {
  const provider = await providersStore.getProviderInstance<TranscriptionProviderWithExtraOptions<string, any>>(providerId)
  if (!provider)
    throw new Error('Failed to initialize transcription provider')

  return await hearingStore.transcription(
    providerId,
    provider,
    'paraformer-zh',
    file,
    'json',
  )
}

const {
  router,
  providerMetadata,
  isValidating,
  isValid,
  validationMessage,
  handleResetSettings,
  forceValid,
} = useProviderValidation(providerId)

onMounted(async () => {
  providersStore.initializeProvider(providerId)
  if (!providers.value[providerId]?.baseUrl) {
    baseUrl.value = 'http://127.0.0.1:8000/v1/'
  }
  if (!providers.value[providerId]?.apiKey) {
    providers.value[providerId] = { ...providers.value[providerId], apiKey: 'sk-local' }
  }
  if (!providers.value[providerId]?.model) {
    providers.value[providerId] = { ...providers.value[providerId], model: 'paraformer-zh' }
  }
  await checkServerStatus()
})

watch(baseUrl, async () => {
  await checkServerStatus()
})

watch(device, async (newDevice) => {
  if (newDevice && serverStatus.value === 'online' && newDevice !== serverDevice.value)
    await switchDevice(newDevice)
})
</script>

<template>
  <ProviderSettingsLayout
    :provider-name="providerMetadata?.localizedName"
    :provider-icon-color="providerMetadata?.iconColor"
    :on-back="() => router.back()"
  >
    <div flex="~ col md:row gap-6">
      <ProviderSettingsContainer class="w-full md:w-[40%]">
        <ProviderBasicSettings
          :title="t('settings.pages.providers.common.section.basic.title')"
          :description="t('settings.pages.providers.common.section.basic.description')"
          :on-reset="handleResetSettings"
        >
          <!-- Server Status -->
          <div class="flex items-center gap-2 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
            <div
              class="h-2.5 w-2.5 rounded-full"
              :class="{
                'bg-green-500': serverStatus === 'online',
                'bg-red-500': serverStatus === 'offline',
                'bg-yellow-500': serverStatus === 'unknown',
              }"
            />
            <span class="text-sm">
              {{ serverStatus === 'online' ? t('settings.pages.providers.provider.paraformer-local.fields.field.status.online') : serverStatus === 'offline' ? t('settings.pages.providers.provider.paraformer-local.fields.field.status.offline') : t('settings.pages.providers.provider.paraformer-local.fields.field.status.checking') }}
              <span v-if="serverStatus === 'online' && serverDevice" class="text-neutral-500">
                ({{ serverDevice.toUpperCase() }})
              </span>
            </span>
          </div>

          <!-- Model (fixed for Paraformer) -->
          <div class="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
            <div class="text-sm font-medium">
              {{ t('settings.pages.providers.provider.paraformer-local.fields.field.model.label') }}
            </div>
            <div class="text-xs text-neutral-500">
              Paraformer-zh (VAD + Punctuation)
            </div>
          </div>

          <!-- CPU/GPU Toggle -->
          <FieldSelect
            v-model="device"
            :label="t('settings.pages.providers.provider.paraformer-local.fields.field.device.label')"
            :description="t('settings.pages.providers.provider.paraformer-local.fields.field.device.description')"
            :options="[
              { label: 'CPU', value: 'cpu' },
              { label: 'CUDA (GPU)', value: 'cuda' },
            ]"
            :disabled="isSwitchingDevice || serverStatus !== 'online'"
          />
        </ProviderBasicSettings>

        <ProviderAdvancedSettings
          :title="t('settings.pages.providers.common.section.advanced.title')"
        >
          <ProviderBaseUrlInput
            v-model="baseUrl"
            placeholder="http://127.0.0.1:8000/v1/"
            required
          />
        </ProviderAdvancedSettings>

        <!-- Validation Status -->
        <Alert v-if="!isValid && isValidating === 0 && validationMessage" type="error">
          <template #title>
            <div class="w-full flex items-center justify-between">
              <span>{{ t('settings.dialogs.onboarding.validationFailed') }}</span>
              <button
                type="button"
                class="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-600 font-medium transition-colors dark:bg-red-800/30 hover:bg-red-200 dark:text-red-300 dark:hover:bg-red-700/40"
                @click="forceValid"
              >
                {{ t('settings.pages.providers.common.continueAnyway') }}
              </button>
            </div>
          </template>
          <template v-if="validationMessage" #content>
            <div class="whitespace-pre-wrap break-all">
              {{ validationMessage }}
            </div>
          </template>
        </Alert>
        <Alert v-if="isValid && isValidating === 0" type="success">
          <template #title>
            {{ t('settings.dialogs.onboarding.validationSuccess') }}
          </template>
        </Alert>
      </ProviderSettingsContainer>

      <!-- Playground section -->
      <div flex="~ col gap-6" class="w-full md:w-[60%]">
        <div w-full rounded-xl>
          <TranscriptionPlayground
            :generate-transcription="handleGenerateTranscription"
            :api-key-configured="true"
          />
        </div>
      </div>
    </div>
  </ProviderSettingsLayout>
</template>

<route lang="yaml">
meta:
  layout: settings
  stageTransition:
    name: slide
</route>
