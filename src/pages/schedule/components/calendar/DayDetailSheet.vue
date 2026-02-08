<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useSchedule } from '@/composables/useSchedule'
import { useWeekNavigation } from '@/composables/useWeekNavigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import StatusBadge from '@/pages/schedule/components/shared/StatusBadge.vue'
import MuscleGroupBadges from '@/pages/schedule/components/shared/MuscleGroupBadges.vue'
import QuickStartButton from '@/pages/schedule/components/shared/QuickStartButton.vue'
import { Calendar, Edit, Dumbbell, CheckCircle, ExternalLink, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  dayName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  dayData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'change-template', 'quick-start'])

const { t, locale } = useI18n()
const router = useRouter()
const scheduleStore = useScheduleStore()
const { toast } = useToast()
const { isDayInPast, getDayStatus } = useSchedule()
const { currentWeekId } = useWeekNavigation()

const status = computed(() => getDayStatus(props.dayData, isDayInPast(props.dayName)))

const dayLabel = computed(() => {
  return props.date.toLocaleDateString(locale.value, { weekday: 'long' })
})

const dateLabel = computed(() => {
  return props.date.toLocaleDateString(locale.value, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const isRestDay = computed({
  get: () => !props.dayData.templateId,
  set: async (value) => {
    if (value) {
      // Mark as rest day (remove template)
      await scheduleStore.removeTemplateFromDay(currentWeekId.value, props.dayName)
    }
  }
})

const hasTemplate = computed(() => !!props.dayData.templateId)
const isCompleted = computed(() => props.dayData.completed)

async function handleChangeTemplate() {
  emit('change-template', props.dayName)
}

function handleQuickStart() {
  if (props.dayData.templateId) {
    emit('quick-start', props.dayData.templateId)
  }
}

function viewWorkout() {
  if (props.dayData.workoutId) {
    router.push(`/workouts/${props.dayData.workoutId}`)
    emit('close')
  }
}

async function handleRemoveCompletion() {
  try {
    await scheduleStore.unmarkDayCompleted(currentWeekId.value, props.dayName)
    toast({
      title: t('schedule.success.dayCleared'),
      variant: 'default'
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to remove completion:', error)
    }
    toast({
      title: t('schedule.errors.failedToClearDay'),
      variant: 'destructive'
    })
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="(value) => !value && emit('close')">
    <SheetContent side="right" class="w-full sm:max-w-md">
      <SheetHeader class="space-y-3">
        <div class="flex items-center justify-between">
          <SheetTitle class="text-2xl">{{ dayLabel }}</SheetTitle>
          <StatusBadge :status="status" />
        </div>
        <SheetDescription class="text-base">{{ dateLabel }}</SheetDescription>
      </SheetHeader>

      <div class="mt-6 space-y-6">
        <!-- Rest Day Toggle -->
        <div class="flex items-center justify-between p-4 border rounded-lg">
          <div class="flex items-center gap-3">
            <Calendar class="w-5 h-5 text-muted-foreground" />
            <div>
              <Label for="rest-day-toggle" class="font-medium">
                {{ t('schedule.calendar.markRestDay') }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t('schedule.dayDetail.restDayDescription') }}
              </p>
            </div>
          </div>
          <Switch
            id="rest-day-toggle"
            v-model:checked="isRestDay"
            :disabled="isCompleted"
          />
        </div>

        <Separator />

        <!-- Template Section -->
        <div v-if="hasTemplate" class="space-y-4">
          <div class="flex items-start justify-between">
            <div class="space-y-2 flex-1">
              <div class="flex items-center gap-2">
                <Dumbbell class="w-5 h-5 text-primary" />
                <h3 class="font-semibold text-lg">{{ dayData.templateName }}</h3>
              </div>
              <MuscleGroupBadges :muscle-groups="dayData.muscleGroups" />
            </div>
          </div>

          <!-- Template Actions -->
          <div class="space-y-3">
            <!-- Quick Start (if not completed) -->
            <QuickStartButton
              v-if="!isCompleted"
              :template-id="dayData.templateId"
              :template-name="dayData.templateName"
              class="w-full"
              @click="handleQuickStart"
            />

            <!-- View Completed Workout -->
            <Button
              v-if="isCompleted && dayData.workoutId"
              variant="outline"
              class="w-full"
              @click="viewWorkout"
            >
              <CheckCircle class="w-4 h-4 mr-2" />
              {{ t('schedule.dayDetail.viewWorkout') }}
              <ExternalLink class="w-4 h-4 ml-2" />
            </Button>

            <!-- Change Template -->
            <Button
              variant="outline"
              class="w-full"
              @click="handleChangeTemplate"
              :disabled="isCompleted"
            >
              <Edit class="w-4 h-4 mr-2" />
              {{ t('schedule.calendar.changeTemplate') }}
            </Button>

            <!-- Remove Completion (only if completed) -->
            <AlertDialog v-if="isCompleted">
              <AlertDialogTrigger as-child>
                <Button
                  variant="outline"
                  class="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 class="w-4 h-4 mr-2" />
                  {{ t('schedule.dayDetail.removeCompletion') }}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ t('schedule.dayDetail.removeCompletion') }}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {{ t('schedule.dayDetail.removeCompletionConfirm') }}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel as-child>
                    <Button variant="outline" class="min-h-11 min-w-11">
                      {{ t('common.cancel') }}
                    </Button>
                  </AlertDialogCancel>
                  <AlertDialogAction as-child>
                    <Button
                      variant="destructive"
                      class="min-h-11 min-w-11"
                      @click="handleRemoveCompletion"
                    >
                      {{ t('schedule.dayDetail.removeCompletion') }}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <!-- Completed Badge -->
          <div
            v-if="isCompleted"
            class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p class="text-sm font-medium text-green-900 dark:text-green-100">
                {{ t('schedule.dayDetail.workoutCompleted') }}
              </p>
              <p class="text-xs text-green-700 dark:text-green-300">
                {{ t('schedule.dayDetail.wellDone') }}
              </p>
            </div>
          </div>
        </div>

        <!-- No Template (Rest Day) -->
        <div v-else class="space-y-4">
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <Calendar class="w-12 h-12 text-muted-foreground mb-3" />
            <h3 class="font-semibold text-lg mb-1">
              {{ t('schedule.calendar.restDay') }}
            </h3>
            <p class="text-sm text-muted-foreground max-w-xs">
              {{ t('schedule.dayDetail.noWorkoutPlanned') }}
            </p>
          </div>

          <!-- Assign Template Button -->
          <Button variant="default" class="w-full" @click="handleChangeTemplate">
            <Dumbbell class="w-4 h-4 mr-2" />
            {{ t('schedule.dayDetail.assignTemplate') }}
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
