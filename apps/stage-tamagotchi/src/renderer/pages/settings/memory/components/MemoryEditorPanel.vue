<script setup lang="ts">
import type { ElectronMemoryPrivacy, ElectronMemoryType } from '../../../../../shared/eventa'

import { Button, FieldInput, FieldSelect, FieldTextArea } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

defineProps<{
  canSave: boolean
  isEditing: boolean
  privacyOptions: Array<{ label: string, value: ElectronMemoryPrivacy }>
  saving: boolean
  typeOptions: Array<{ label: string, value: ElectronMemoryType }>
}>()

const emit = defineEmits<{
  cancel: []
  save: []
}>()

const content = defineModel<string>('content', { required: true })
const summary = defineModel<string>('summary', { required: true })
const type = defineModel<ElectronMemoryType>('type', { required: true })
const privacy = defineModel<ElectronMemoryPrivacy>('privacy', { required: true })
const tagsInput = defineModel<string>('tagsInput', { required: true })
const importance = defineModel<number>('importance', { required: true })

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div>
      <h2 :class="['text-base font-semibold']">
        {{ isEditing ? t('settings.pages.memory.sections.create.edit-title') : t('settings.pages.memory.sections.create.title') }}
      </h2>
      <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
        {{ isEditing ? t('settings.pages.memory.sections.create.edit-description') : t('settings.pages.memory.sections.create.description') }}
      </p>
    </div>

    <FieldTextArea
      v-model="content"
      :label="t('settings.pages.memory.fields.content')"
      :placeholder="t('settings.pages.memory.fields.content-placeholder')"
      required
    />
    <FieldInput
      v-model="summary"
      :label="t('settings.pages.memory.fields.summary')"
      :placeholder="t('settings.pages.memory.fields.summary-placeholder')"
    />
    <div :class="['grid gap-4 sm:grid-cols-2']">
      <FieldSelect
        v-model="type"
        :label="t('settings.pages.memory.fields.type')"
        :options="typeOptions"
        layout="vertical"
      />
      <FieldSelect
        v-model="privacy"
        :label="t('settings.pages.memory.fields.privacy')"
        :options="privacyOptions"
        layout="vertical"
      />
    </div>
    <div :class="['grid gap-4 sm:grid-cols-2']">
      <FieldInput
        v-model="tagsInput"
        :label="t('settings.pages.memory.fields.tags')"
        :placeholder="t('settings.pages.memory.fields.tags-placeholder')"
      />
      <FieldInput
        v-model="importance"
        :label="t('settings.pages.memory.fields.importance')"
        type="number"
        :placeholder="t('settings.pages.memory.fields.importance-placeholder')"
      />
    </div>

    <div :class="['flex justify-end gap-2']">
      <Button
        v-if="isEditing"
        icon="i-solar:close-circle-bold-duotone"
        :label="t('settings.pages.memory.actions.cancel')"
        :disabled="saving"
        variant="secondary"
        @click="emit('cancel')"
      />
      <Button
        :icon="isEditing ? 'i-solar:diskette-bold-duotone' : 'i-solar:add-circle-bold-duotone'"
        :label="isEditing ? t('settings.pages.memory.actions.update') : t('settings.pages.memory.actions.save')"
        :disabled="!canSave"
        :loading="saving"
        @click="emit('save')"
      />
    </div>
  </section>
</template>
