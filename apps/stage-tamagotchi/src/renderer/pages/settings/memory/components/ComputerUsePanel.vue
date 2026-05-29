<script setup lang="ts">
import type {
  ElectronComputerUseActionKind,
  ElectronComputerUseActionPreview,
  ElectronComputerUseAuditEntry,
  ElectronComputerUseExecutionResult,
  ElectronComputerUsePolicySnapshot,
} from '../../../../../shared/eventa'

import { Button, FieldInput, FieldSelect, FieldTextArea } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

defineProps<{
  auditEntries: ElectronComputerUseAuditEntry[]
  canExecute: boolean
  canPreview: boolean
  execution: ElectronComputerUseExecutionResult | null
  formatDate: (value: string) => string
  kindOptions: Array<{ label: string, value: ElectronComputerUseActionKind }>
  lastError: string | null
  listLabel: (values: string[] | undefined) => string
  loading: boolean
  needsCommand: boolean
  needsTarget: boolean
  policy: ElectronComputerUsePolicySnapshot | null
  preview: ElectronComputerUseActionPreview | null
}>()

const emit = defineEmits<{
  execute: []
  preview: []
  refreshAudit: []
  refreshPolicy: []
}>()

const kind = defineModel<ElectronComputerUseActionKind>('kind', { required: true })
const target = defineModel<string>('target', { required: true })
const command = defineModel<string>('command', { required: true })
const cwd = defineModel<string>('cwd', { required: true })
const reason = defineModel<string>('reason', { required: true })

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h2 :class="['text-base font-semibold']">
          {{ t('settings.pages.memory.computer-use.title') }}
        </h2>
        <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.computer-use.description') }}
        </p>
      </div>
      <div :class="['flex flex-wrap gap-2']">
        <Button
          icon="i-solar:shield-check-bold-duotone"
          :label="t('settings.pages.memory.computer-use.refresh-policy')"
          :disabled="loading"
          :loading="loading"
          @click="emit('refreshPolicy')"
        />
        <Button
          icon="i-solar:history-bold-duotone"
          :label="t('settings.pages.memory.computer-use.refresh-audit')"
          :disabled="loading"
          :loading="loading"
          @click="emit('refreshAudit')"
        />
      </div>
    </div>

    <div
      v-if="policy"
      :class="['grid gap-3 text-xs sm:grid-cols-2']"
    >
      <div :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
        <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.computer-use.mode') }}
        </div>
        <div :class="['mt-1 font-mono']">
          {{ policy.mode }}
        </div>
      </div>
      <div :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
        <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.computer-use.high-risk-kinds') }}
        </div>
        <div :class="['mt-1 font-mono']">
          {{ listLabel(policy.highRiskKinds) }}
        </div>
      </div>
      <div :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
        <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.computer-use.allowed-read-roots') }}
        </div>
        <div :class="['mt-1 font-mono']">
          {{ listLabel(policy.allowedReadRoots) }}
        </div>
      </div>
      <div :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
        <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.computer-use.denied-roots') }}
        </div>
        <div :class="['mt-1 font-mono']">
          {{ listLabel(policy.deniedRoots) }}
        </div>
      </div>
    </div>

    <div :class="['grid gap-4 sm:grid-cols-2']">
      <FieldSelect
        v-model="kind"
        :label="t('settings.pages.memory.computer-use.kind-label')"
        :options="kindOptions"
        layout="vertical"
      />
      <FieldInput
        v-model="target"
        :label="t('settings.pages.memory.computer-use.target-label')"
        :placeholder="t('settings.pages.memory.computer-use.target-placeholder')"
        :disabled="!needsTarget"
      />
    </div>

    <div :class="['grid gap-4 sm:grid-cols-2']">
      <FieldInput
        v-model="command"
        :label="t('settings.pages.memory.computer-use.command-label')"
        :placeholder="t('settings.pages.memory.computer-use.command-placeholder')"
        :disabled="!needsCommand"
      />
      <FieldInput
        v-model="cwd"
        :label="t('settings.pages.memory.computer-use.cwd-label')"
        :placeholder="t('settings.pages.memory.computer-use.cwd-placeholder')"
      />
    </div>

    <FieldTextArea
      v-model="reason"
      :label="t('settings.pages.memory.computer-use.reason-label')"
      :placeholder="t('settings.pages.memory.computer-use.reason-placeholder')"
    />

    <div :class="['flex justify-end']">
      <Button
        icon="i-solar:shield-warning-bold-duotone"
        :label="t('settings.pages.memory.computer-use.preview')"
        :disabled="!canPreview"
        :loading="loading"
        @click="emit('preview')"
      />
    </div>

    <p
      v-if="lastError"
      :class="['text-xs leading-5 text-rose-600 dark:text-rose-300']"
    >
      {{ lastError }}
    </p>

    <div
      v-if="preview"
      :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
    >
      <div :class="['mb-3 flex flex-wrap items-start justify-between gap-2']">
        <div :class="['text-sm font-semibold']">
          {{ t('settings.pages.memory.computer-use.current-preview') }}
        </div>
        <Button
          size="sm"
          icon="i-solar:play-circle-bold-duotone"
          :label="t('settings.pages.memory.computer-use.execute-approved')"
          :disabled="!canExecute"
          :loading="loading"
          variant="secondary"
          @click="emit('execute')"
        />
      </div>
      <div :class="['grid gap-3 text-xs sm:grid-cols-4']">
        <div>
          <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.computer-use.risk') }}
          </div>
          <div :class="['mt-1 font-mono']">
            {{ preview.risk }}
          </div>
        </div>
        <div>
          <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.computer-use.decision') }}
          </div>
          <div :class="['mt-1 font-mono']">
            {{ preview.decision }}
          </div>
        </div>
        <div>
          <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.computer-use.requires-confirmation') }}
          </div>
          <div :class="['mt-1 font-mono']">
            {{ preview.requiresConfirmation }}
          </div>
        </div>
        <div>
          <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.computer-use.can-execute') }}
          </div>
          <div :class="['mt-1 font-mono']">
            {{ preview.canExecute }}
          </div>
        </div>
      </div>
      <ul :class="['mt-3 list-disc space-y-1 pl-5 text-sm leading-6']">
        <li
          v-for="entryReason in preview.reasons"
          :key="entryReason"
        >
          {{ entryReason }}
        </li>
      </ul>
      <div
        v-if="execution"
        :class="['mt-3 rounded-lg border border-neutral-200/70 p-3 text-xs dark:border-neutral-800/70']"
      >
        <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.computer-use.execution-result') }}: {{ execution.status }}
        </div>
        <pre
          v-if="execution.output || execution.errorMessage"
          :class="['mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-neutral-500/5 p-2 font-mono text-xs leading-5']"
        >{{ execution.output || execution.errorMessage }}</pre>
      </div>
    </div>

    <div :class="['flex flex-col gap-2']">
      <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.computer-use.audit-title', { count: auditEntries.length }) }}
      </div>
      <div
        v-if="auditEntries.length === 0"
        :class="['rounded-lg border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
      >
        {{ t('settings.pages.memory.computer-use.empty-audit') }}
      </div>
      <div
        v-for="entry in auditEntries.slice(0, 5)"
        :key="entry.id"
        :class="['rounded-lg border border-neutral-200/70 p-3 text-xs dark:border-neutral-800/70']"
      >
        <div :class="['flex flex-wrap items-center justify-between gap-2']">
          <span :class="['font-mono']">{{ entry.kind }}</span>
          <span>{{ formatDate(entry.createdAt) }}</span>
        </div>
        <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
          {{ entry.decision }} / {{ entry.risk }}
        </div>
      </div>
    </div>
  </section>
</template>
