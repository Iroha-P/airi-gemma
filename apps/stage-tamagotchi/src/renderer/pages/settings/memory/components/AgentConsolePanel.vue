<script setup lang="ts">
import type { ElectronAgentContextFragment, ElectronAgentRun, ElectronAgentToolDescriptor } from '../../../../../shared/eventa'

import { Button, FieldTextArea } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  canCancel: boolean
  canReflect: boolean
  canRun: boolean
  contextIds: string[]
  currentRun: ElectronAgentRun | null
  formatArguments: (value: Record<string, unknown> | undefined) => string
  formatContextLabel: (fragment: ElectronAgentContextFragment) => string
  lastError: string | null
  loading: boolean
  recentRuns: ElectronAgentRun[]
  tools: ElectronAgentToolDescriptor[]
  usedContextIds: string[]
  withheldContextIds: string[]
}>()

const emit = defineEmits<{
  cancel: []
  confirmAction: [approved: boolean]
  reflect: []
  refreshRun: [id: string]
  run: []
}>()

const input = defineModel<string>('input', { required: true })
const reflection = defineModel<string>('reflection', { required: true })

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h2 :class="['text-base font-semibold']">
          {{ t('settings.pages.memory.agent-console.title') }}
        </h2>
        <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.agent-console.description') }}
        </p>
      </div>
      <span
        v-if="props.currentRun"
        :class="['rounded-md bg-neutral-500/10 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300']"
      >
        {{ t('settings.pages.memory.agent-console.status') }}: {{ props.currentRun.status }}
      </span>
    </div>

    <FieldTextArea
      v-model="input"
      :label="t('settings.pages.memory.agent-console.input-label')"
      :placeholder="t('settings.pages.memory.agent-console.input-placeholder')"
      required
    />

    <div :class="['flex flex-wrap items-center justify-between gap-3']">
      <p :class="['text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.agent-console.tools', { count: props.tools.length }) }}
      </p>
      <div :class="['flex flex-wrap items-center gap-2']">
        <Button
          icon="i-solar:play-circle-bold-duotone"
          :label="t('settings.pages.memory.agent-console.run')"
          :disabled="!props.canRun"
          :loading="props.loading"
          @click="emit('run')"
        />
        <Button
          icon="i-solar:stop-circle-bold-duotone"
          :label="t('settings.pages.memory.agent-console.cancel')"
          :disabled="!props.canCancel"
          :loading="props.loading"
          @click="emit('cancel')"
        />
      </div>
    </div>

    <p
      v-if="props.lastError"
      :class="['text-xs leading-5 text-rose-600 dark:text-rose-300']"
    >
      {{ props.lastError }}
    </p>

    <div
      v-if="props.currentRun"
      :class="['flex flex-col gap-4 rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
    >
      <div :class="['grid gap-3 text-xs sm:grid-cols-2']">
        <div>
          <span :class="['text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.agent-console.mode') }}
          </span>
          <span :class="['ml-2 font-medium']">{{ props.currentRun.mode }}</span>
        </div>
        <div>
          <span :class="['text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.agent-console.run-id') }}
          </span>
          <span :class="['ml-2 font-mono']">{{ props.currentRun.id }}</span>
        </div>
      </div>

      <div v-if="props.currentRun.response">
        <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.agent-console.response') }}
        </div>
        <p :class="['mt-1 whitespace-pre-wrap text-sm leading-6']">
          {{ props.currentRun.response }}
        </p>
      </div>

      <div
        v-if="props.currentRun.pendingAction"
        :class="['rounded-lg border border-amber-300/70 bg-amber-500/10 p-3 text-sm dark:border-amber-700/70']"
      >
        <div :class="['font-medium text-amber-800 dark:text-amber-200']">
          {{ t('settings.pages.memory.agent-console.pending-action') }}: {{ props.currentRun.pendingAction.title }}
        </div>
        <div :class="['mt-2 text-xs leading-5 text-amber-800/80 dark:text-amber-100/80']">
          {{ props.currentRun.pendingAction.toolName }} - {{ props.currentRun.pendingAction.risk }}
        </div>
        <pre :class="['mt-2 overflow-auto rounded-md bg-white/70 p-2 text-xs dark:bg-black/30']">{{ props.formatArguments(props.currentRun.pendingAction.arguments) }}</pre>
        <div :class="['mt-3 flex flex-wrap gap-2']">
          <Button
            icon="i-solar:check-circle-bold-duotone"
            :label="t('settings.pages.memory.agent-console.approve-action')"
            :disabled="props.loading"
            :loading="props.loading"
            @click="emit('confirmAction', true)"
          />
          <Button
            icon="i-solar:close-circle-bold-duotone"
            :label="t('settings.pages.memory.agent-console.reject-action')"
            :disabled="props.loading"
            :loading="props.loading"
            @click="emit('confirmAction', false)"
          />
        </div>
      </div>

      <div :class="['grid gap-3 text-xs sm:grid-cols-3']">
        <div>
          <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.agent-console.context') }}
          </div>
          <div :class="['mt-1 flex flex-wrap gap-1']">
            <span
              v-for="fragment in props.currentRun.context"
              :key="fragment.id"
              :class="['rounded-md bg-neutral-500/10 px-2 py-1']"
            >
              {{ props.formatContextLabel(fragment) }}
            </span>
            <span v-if="props.contextIds.length === 0">
              {{ t('settings.pages.memory.agent-console.empty-context') }}
            </span>
          </div>
        </div>
        <div>
          <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.agent-console.used-context') }}
          </div>
          <div :class="['mt-1 flex flex-wrap gap-1']">
            <span
              v-for="id in props.usedContextIds"
              :key="id"
              :class="['rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-200']"
            >
              {{ id }}
            </span>
            <span v-if="props.usedContextIds.length === 0">
              {{ t('settings.pages.memory.agent-console.empty-context') }}
            </span>
          </div>
        </div>
        <div>
          <div :class="['font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.agent-console.withheld-context') }}
          </div>
          <div :class="['mt-1 flex flex-wrap gap-1']">
            <span
              v-for="id in props.withheldContextIds"
              :key="id"
              :class="['rounded-md bg-rose-500/10 px-2 py-1 text-rose-700 dark:text-rose-200']"
            >
              {{ id }}
            </span>
            <span v-if="props.withheldContextIds.length === 0">
              {{ t('settings.pages.memory.agent-console.empty-context') }}
            </span>
          </div>
        </div>
      </div>

      <FieldTextArea
        v-model="reflection"
        :label="t('settings.pages.memory.agent-console.reflection-label')"
        :placeholder="t('settings.pages.memory.agent-console.reflection-placeholder')"
      />

      <div :class="['flex justify-end']">
        <Button
          icon="i-solar:inbox-archive-bold-duotone"
          :label="t('settings.pages.memory.agent-console.reflect')"
          :disabled="!props.canReflect"
          :loading="props.loading"
          @click="emit('reflect')"
        />
      </div>
    </div>

    <div
      v-else
      :class="['rounded-lg border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
    >
      {{ t('settings.pages.memory.agent-console.no-run') }}
    </div>

    <div
      v-if="props.recentRuns.length > 0"
      :class="['flex flex-col gap-2 text-xs text-neutral-500 dark:text-neutral-400']"
    >
      <div :class="['font-medium']">
        {{ t('settings.pages.memory.agent-console.recent-runs') }}
      </div>
      <button
        v-for="run in props.recentRuns"
        :key="run.id"
        type="button"
        :class="['flex items-center justify-between gap-2 rounded-md px-2 py-1 text-left hover:bg-neutral-500/10']"
        @click="emit('refreshRun', run.id)"
      >
        <span :class="['truncate']">{{ run.input }}</span>
        <span :class="['shrink-0 font-mono']">{{ run.status }}</span>
      </button>
    </div>
  </section>
</template>
