<script setup lang="ts">
import type { ElectronAgentChatTarget } from '../../../../../shared/eventa'

import { Button, FieldCheckbox, FieldInput, FieldSelect } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

defineProps<{
  canSave: boolean
  canTest: boolean
  saving: boolean
  statusLabel: string
  targetOptions: Array<{ description: string, label: string, value: ElectronAgentChatTarget }>
  testOk: boolean | null
  testStatusLabel: string
}>()

const emit = defineEmits<{
  save: []
  test: []
}>()

const enabled = defineModel<boolean>('enabled', { required: true })
const target = defineModel<ElectronAgentChatTarget | undefined>('target', { required: true })
const baseURL = defineModel<string>('baseURL', { required: true })
const model = defineModel<string>('model', { required: true })
const apiKey = defineModel<string>('apiKey', { required: true })

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h2 :class="['text-base font-semibold']">
          {{ t('settings.pages.memory.agent-chat-runtime.title') }}
        </h2>
        <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.agent-chat-runtime.description') }}
        </p>
        <p :class="['mt-1 text-xs text-amber-600 dark:text-amber-300']">
          {{ t('settings.pages.memory.agent-chat-runtime.restart-note') }}
        </p>
      </div>
      <span :class="['rounded-md bg-neutral-500/10 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300']">
        {{ statusLabel }}
      </span>
    </div>

    <FieldCheckbox
      v-model="enabled"
      :label="t('settings.pages.memory.agent-chat-runtime.enabled-label')"
      :description="t('settings.pages.memory.agent-chat-runtime.enabled-description')"
    />

    <div :class="['grid gap-4 sm:grid-cols-2']">
      <FieldSelect
        v-model="target"
        :label="t('settings.pages.memory.agent-chat-runtime.target-label')"
        :description="t('settings.pages.memory.agent-chat-runtime.target-description')"
        :options="targetOptions"
        layout="vertical"
        :disabled="!enabled"
      />
      <FieldInput
        v-model="baseURL"
        :label="t('settings.pages.memory.agent-chat-runtime.base-url-label')"
        :description="t('settings.pages.memory.agent-chat-runtime.base-url-description')"
        :placeholder="t('settings.pages.memory.agent-chat-runtime.base-url-placeholder')"
      />
    </div>

    <div :class="['grid gap-4 sm:grid-cols-2']">
      <FieldInput
        v-model="model"
        :label="t('settings.pages.memory.agent-chat-runtime.model-label')"
        :description="t('settings.pages.memory.agent-chat-runtime.model-description')"
        :placeholder="t('settings.pages.memory.agent-chat-runtime.model-placeholder')"
      />
      <FieldInput
        v-model="apiKey"
        :label="t('settings.pages.memory.agent-chat-runtime.api-key-label')"
        :description="t('settings.pages.memory.agent-chat-runtime.api-key-description')"
        :placeholder="t('settings.pages.memory.agent-chat-runtime.api-key-placeholder')"
        type="password"
      />
    </div>

    <div :class="['flex flex-wrap items-center justify-between gap-3']">
      <p :class="['max-w-2xl text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.agent-chat-runtime.privacy-note') }}
      </p>
      <div :class="['flex flex-wrap items-center gap-2']">
        <Button
          icon="i-solar:bolt-circle-bold-duotone"
          :label="t('settings.pages.memory.agent-chat-runtime.test')"
          :disabled="!canTest"
          :loading="saving"
          @click="emit('test')"
        />
        <Button
          icon="i-solar:diskette-bold-duotone"
          :label="t('settings.pages.memory.agent-chat-runtime.save')"
          :disabled="!canSave"
          :loading="saving"
          @click="emit('save')"
        />
      </div>
    </div>

    <p
      v-if="testStatusLabel"
      :class="[
        'text-xs leading-5',
        testOk ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300',
      ]"
    >
      {{ testStatusLabel }}
    </p>
  </section>
</template>
