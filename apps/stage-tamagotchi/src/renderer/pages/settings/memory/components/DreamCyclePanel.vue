<script setup lang="ts">
import type {
  ElectronDreamLoraDatasetCandidate,
  ElectronDreamMemoryCandidate,
  ElectronDreamRoutineCandidate,
  ElectronDreamScheduleState,
  ElectronDreamSession,
} from '../../../../../shared/eventa'

import { Button, FieldCheckbox, FieldInput } from '@proj-airi/ui'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  canCancelLocalDream: boolean
  canImportDreamLoraCandidates: boolean
  canImportDreamMemoryCandidates: boolean
  canSaveDreamRoutineCandidates: boolean
  canSaveDreamSchedule: boolean
  canStartLocalDream: boolean
  canTriggerScheduledDream: boolean
  currentSession: ElectronDreamSession | null
  formatDate: (value: string) => string
  lastError: string | null
  loading: boolean
  loraDatasetCandidates: ElectronDreamLoraDatasetCandidate[]
  memoryCandidates: ElectronDreamMemoryCandidate[]
  routineCandidates: ElectronDreamRoutineCandidate[]
  schedule: ElectronDreamScheduleState | null
}>()

const emit = defineEmits<{
  cancelLocalDream: []
  importDreamLoraCandidates: []
  importDreamMemoryCandidates: []
  saveDreamRoutineCandidates: []
  saveDreamSchedule: []
  startLocalDream: []
  triggerScheduledDreamNow: []
}>()

const dreamWindowHours = defineModel<number>('dreamWindowHours', { required: true })
const includeLoraCandidates = defineModel<boolean>('includeLoraCandidates', { required: true })
const scheduleEnabled = defineModel<boolean>('scheduleEnabled', { required: true })
const scheduleIncludeLoraCandidates = defineModel<boolean>('scheduleIncludeLoraCandidates', { required: true })
const scheduleIntervalHours = defineModel<number>('scheduleIntervalHours', { required: true })
const scheduleWindowHours = defineModel<number>('scheduleWindowHours', { required: true })

const { t } = useI18n()
</script>

<template>
  <section :class="['flex flex-col gap-4 border-y border-neutral-200/70 py-4 dark:border-neutral-800/70']">
    <div :class="['flex flex-wrap items-start justify-between gap-3']">
      <div>
        <h2 :class="['text-base font-semibold']">
          {{ t('settings.pages.memory.dream.title') }}
        </h2>
        <p :class="['mt-1 text-sm text-neutral-500 dark:text-neutral-400']">
          {{ t('settings.pages.memory.dream.description') }}
        </p>
      </div>
      <div :class="['flex flex-wrap gap-2']">
        <Button
          icon="i-solar:moon-stars-bold-duotone"
          :label="t('settings.pages.memory.dream.start')"
          :disabled="!props.canStartLocalDream"
          :loading="props.loading"
          @click="emit('startLocalDream')"
        />
        <Button
          icon="i-solar:stop-circle-bold-duotone"
          :label="t('settings.pages.memory.dream.cancel')"
          :disabled="!props.canCancelLocalDream"
          :loading="props.loading"
          @click="emit('cancelLocalDream')"
        />
      </div>
    </div>

    <div :class="['grid gap-4 sm:grid-cols-[1fr_220px]']">
      <FieldInput
        v-model="dreamWindowHours"
        :label="t('settings.pages.memory.dream.window-hours-label')"
        type="number"
        placeholder="4"
      />
      <FieldCheckbox
        v-model="includeLoraCandidates"
        :label="t('settings.pages.memory.dream.include-lora-candidates')"
      />
    </div>

    <div :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']">
      <div :class="['flex flex-wrap items-start justify-between gap-3']">
        <div>
          <h3 :class="['text-sm font-semibold']">
            {{ t('settings.pages.memory.dream.schedule-title') }}
          </h3>
          <p :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.dream.schedule-description') }}
          </p>
        </div>
        <div :class="['flex flex-wrap gap-2']">
          <Button
            size="sm"
            icon="i-solar:diskette-bold-duotone"
            :label="t('settings.pages.memory.dream.save-schedule')"
            :disabled="!props.canSaveDreamSchedule"
            :loading="props.loading"
            variant="secondary"
            @click="emit('saveDreamSchedule')"
          />
          <Button
            size="sm"
            icon="i-solar:play-circle-bold-duotone"
            :label="t('settings.pages.memory.dream.trigger-schedule-now')"
            :disabled="!props.canTriggerScheduledDream"
            :loading="props.loading"
            variant="secondary"
            @click="emit('triggerScheduledDreamNow')"
          />
        </div>
      </div>

      <div :class="['mt-3 grid gap-4 sm:grid-cols-[1fr_160px_160px]']">
        <FieldCheckbox
          v-model="scheduleEnabled"
          :label="t('settings.pages.memory.dream.schedule-enabled')"
        />
        <FieldInput
          v-model="scheduleIntervalHours"
          :label="t('settings.pages.memory.dream.schedule-interval-hours')"
          type="number"
          placeholder="6"
        />
        <FieldInput
          v-model="scheduleWindowHours"
          :label="t('settings.pages.memory.dream.schedule-window-hours')"
          type="number"
          placeholder="4"
        />
      </div>

      <FieldCheckbox
        v-model="scheduleIncludeLoraCandidates"
        :class="['mt-3']"
        :label="t('settings.pages.memory.dream.schedule-include-lora-candidates')"
      />

      <div
        v-if="props.schedule"
        :class="['mt-3 grid gap-2 text-xs text-neutral-500 dark:text-neutral-400 sm:grid-cols-3']"
      >
        <span>
          {{ t('settings.pages.memory.dream.schedule-active') }}:
          {{ props.schedule.active ? t('settings.pages.memory.dream.yes') : t('settings.pages.memory.dream.no') }}
        </span>
        <span>
          {{ t('settings.pages.memory.dream.schedule-next-run') }}:
          {{ props.schedule.nextRunAt ? props.formatDate(props.schedule.nextRunAt) : t('settings.pages.memory.dream.none') }}
        </span>
        <span>
          {{ t('settings.pages.memory.dream.schedule-last-run') }}:
          {{ props.schedule.lastRunAt ? props.formatDate(props.schedule.lastRunAt) : t('settings.pages.memory.dream.none') }}
        </span>
      </div>
    </div>

    <div
      v-if="props.currentSession"
      :class="['rounded-lg border border-neutral-200/70 p-3 dark:border-neutral-800/70']"
    >
      <div :class="['flex flex-wrap items-center justify-between gap-2']">
        <div :class="['text-sm font-medium']">
          {{ t('settings.pages.memory.dream.session') }}: {{ props.currentSession.id }}
        </div>
        <span :class="['rounded border border-neutral-200/70 px-2 py-1 text-xs dark:border-neutral-800/70']">
          {{ t(`settings.pages.memory.dream.status.${props.currentSession.status}`) }}
        </span>
      </div>
      <div :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']">
        {{ t('settings.pages.memory.dream.window-hours', { hours: props.currentSession.windowHours }) }}
        <span v-if="props.currentSession.localModel">
          / {{ props.currentSession.localModel }}
        </span>
      </div>

      <p
        v-if="props.currentSession.errorMessage"
        :class="['mt-3 rounded border border-rose-200/70 bg-rose-500/10 p-2 text-sm text-rose-700 dark:border-rose-800/70 dark:text-rose-300']"
      >
        {{ props.currentSession.errorMessage }}
      </p>

      <div
        v-if="props.currentSession.report"
        :class="['mt-4 flex flex-col gap-4']"
      >
        <div>
          <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.dream.summary') }}
          </div>
          <p :class="['mt-1 whitespace-pre-wrap text-sm leading-6']">
            {{ props.currentSession.report.summary }}
          </p>
        </div>

        <div :class="['flex flex-wrap gap-2']">
          <Button
            size="sm"
            icon="i-solar:inbox-in-bold-duotone"
            :label="t('settings.pages.memory.dream.import-memory-candidates')"
            :disabled="!props.canImportDreamMemoryCandidates"
            :loading="props.loading"
            variant="secondary"
            @click="emit('importDreamMemoryCandidates')"
          />
          <Button
            size="sm"
            icon="i-solar:list-check-bold-duotone"
            :label="t('settings.pages.memory.dream.save-routine-candidates')"
            :disabled="!props.canSaveDreamRoutineCandidates"
            :loading="props.loading"
            variant="secondary"
            @click="emit('saveDreamRoutineCandidates')"
          />
          <Button
            size="sm"
            icon="i-solar:document-add-bold-duotone"
            :label="t('settings.pages.memory.dream.import-lora-candidates')"
            :disabled="!props.canImportDreamLoraCandidates"
            :loading="props.loading"
            variant="secondary"
            @click="emit('importDreamLoraCandidates')"
          />
        </div>

        <div :class="['grid gap-4 lg:grid-cols-2']">
          <div>
            <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
              {{ t('settings.pages.memory.dream.memory-candidates', { count: props.memoryCandidates.length }) }}
            </div>
            <div
              v-if="props.memoryCandidates.length === 0"
              :class="['mt-2 rounded border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
            >
              {{ t('settings.pages.memory.dream.empty') }}
            </div>
            <div
              v-for="candidate in props.memoryCandidates"
              :key="`${candidate.type}:${candidate.content}`"
              :class="['mt-2 rounded border border-neutral-200/70 p-3 text-sm dark:border-neutral-800/70']"
            >
              <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
                {{ candidate.type }} / {{ candidate.privacy }} / {{ candidate.importance }}
              </div>
              <p :class="['mt-1 whitespace-pre-wrap leading-6']">
                {{ candidate.content }}
              </p>
            </div>
          </div>

          <div>
            <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
              {{ t('settings.pages.memory.dream.routine-candidates', { count: props.routineCandidates.length }) }}
            </div>
            <div
              v-if="props.routineCandidates.length === 0"
              :class="['mt-2 rounded border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
            >
              {{ t('settings.pages.memory.dream.empty') }}
            </div>
            <div
              v-for="candidate in props.routineCandidates"
              :key="candidate.title"
              :class="['mt-2 rounded border border-neutral-200/70 p-3 text-sm dark:border-neutral-800/70']"
            >
              <div :class="['font-medium']">
                {{ candidate.title }}
              </div>
              <ul :class="['mt-2 list-disc pl-5 text-xs leading-5 text-neutral-600 dark:text-neutral-300']">
                <li
                  v-for="step in candidate.steps"
                  :key="step"
                >
                  {{ step }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
            {{ t('settings.pages.memory.dream.lora-candidates', { count: props.loraDatasetCandidates.length }) }}
          </div>
          <div
            v-if="props.loraDatasetCandidates.length === 0"
            :class="['mt-2 rounded border border-dashed border-neutral-300/80 p-3 text-sm text-neutral-500 dark:border-neutral-700/80 dark:text-neutral-400']"
          >
            {{ t('settings.pages.memory.dream.empty') }}
          </div>
          <div>
            <div
              v-for="(candidate, index) in props.loraDatasetCandidates"
              :key="`lora-${index}`"
              :class="['mt-2 rounded border border-neutral-200/70 p-3 text-xs dark:border-neutral-800/70']"
            >
              <div :class="['font-medium']">
                {{ candidate.tags.join(', ') || t('settings.pages.memory.dream.no-tags') }}
              </div>
              <div
                v-for="message in candidate.messages"
                :key="`${index}-${message.role}-${message.content}`"
                :class="['mt-2']"
              >
                <span :class="['font-mono']">{{ message.role }}</span>: {{ message.content }}
              </div>
            </div>
          </div>
        </div>

        <div :class="['grid gap-4 lg:grid-cols-2']">
          <div>
            <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
              {{ t('settings.pages.memory.dream.withheld', { count: props.currentSession.report.withheld.length }) }}
            </div>
            <div
              v-for="item in props.currentSession.report.withheld"
              :key="item.sourceId"
              :class="['mt-2 rounded border border-rose-200/70 bg-rose-500/10 p-2 text-xs dark:border-rose-800/70']"
            >
              {{ item.sourceId }} / {{ t(`settings.pages.memory.dream.withheld-reason.${item.reason}`) }}
            </div>
          </div>
          <div>
            <div :class="['text-xs font-medium text-neutral-500 dark:text-neutral-400']">
              {{ t('settings.pages.memory.dream.redactions', { count: props.currentSession.report.redactionLog?.length ?? 0 }) }}
            </div>
            <div
              v-for="redaction in props.currentSession.report.redactionLog ?? []"
              :key="`${redaction.field}-${redaction.reason}`"
              :class="['mt-2 rounded border border-amber-200/70 bg-amber-500/10 p-2 text-xs dark:border-amber-800/70']"
            >
              {{ redaction.field }} / {{ redaction.reason }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="props.lastError"
      :class="['text-sm text-rose-600 dark:text-rose-300']"
    >
      {{ props.lastError }}
    </p>
  </section>
</template>
