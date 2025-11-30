<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="bottom" class="h-[85vh]">
      <SheetHeader>
        <SheetTitle>{{ t('workout.activeWorkout.finish.title') }}</SheetTitle>
        <SheetDescription>{{
          t('workout.activeWorkout.finish.summary')
        }}</SheetDescription>
      </SheetHeader>

      <div class="mt-6 space-y-6">
        <!-- Workout Date Picker -->
        <div class="space-y-2">
          <Label>{{ t('workout.activeWorkout.finish.date') }}</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-12 w-full justify-start text-left font-normal"
              >
                <CalendarIcon class="mr-2 h-5 w-5" />
                {{ formattedDate }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                v-model="workoutDate"
                :max-value="today"
                initial-focus
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-2 gap-4 rounded-lg border p-4">
          <!-- Duration -->
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">
              {{ t('workout.activeWorkout.finish.duration') }}
            </div>
            <div class="text-lg font-bold">
              {{ formattedDuration }}
            </div>
          </div>

          <!-- Total Sets -->
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">
              {{ t('workout.activeWorkout.finish.totalSets') }}
            </div>
            <div class="text-lg font-bold">
              {{ totalSets }}
            </div>
          </div>

          <!-- Exercises Performed -->
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">
              {{ t('workout.activeWorkout.finish.exercisesPerformed') }}
            </div>
            <div class="text-lg font-bold">
              {{ totalExercises }}
            </div>
          </div>

          <!-- Total Volume -->
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">
              {{ t('workout.activeWorkout.finish.totalVolume') }}
            </div>
            <div class="text-lg font-bold">
              {{ formattedVolume }}
            </div>
          </div>
        </div>

        <!-- Workout Notes -->
        <div class="space-y-2">
          <Label>{{
            t('workout.activeWorkout.finish.workoutNotes')
          }}</Label>
          <Textarea
            v-model="workoutNotes"
            :placeholder="t('workout.activeWorkout.finish.workoutNotesPlaceholder')"
            rows="4"
            class="resize-none"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <SheetFooter class="mt-6 flex-col gap-2 sm:flex-col">
        <Button
          class="h-12 w-full text-lg"
          :disabled="saving"
          @click="handleConfirm"
        >
          {{ saving ? t('common.saving') : t('workout.activeWorkout.finish.confirm') }}
        </Button>

        <Button
          variant="outline"
          class="h-12 w-full"
          :disabled="saving"
          @click="$emit('update:open', false)"
        >
          {{ t('workout.activeWorkout.finish.cancel') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'
import { useUnits } from '@/composables/useUnits'
import { useWorkoutTimer } from '@/composables/useWorkoutTimer'
import { CalendarDate, today as getTodayDate } from '@internationalized/date'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  workout: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'confirm'])

const { t } = useI18n()
const { currentLocale } = useLocale()
const { formatWeight } = useUnits()

const workoutNotes = ref('')
const saving = ref(false)
const workoutDate = ref(null)

// Get today's date as CalendarDate for max validation
const today = getTodayDate(Intl.DateTimeFormat().resolvedOptions().timeZone)

// Get formatted elapsed time
const { formattedElapsedTime } = useWorkoutTimer(
  () => props.workout?.startedAt,
)

const formattedDuration = computed(() => formattedElapsedTime.value)

// Calculate total sets
const totalSets = computed(() => {
  if (!props.workout) return 0
  return props.workout.exercises.reduce((total, exercise) => {
    return total + (exercise.sets?.length || 0)
  }, 0)
})

// Calculate total exercises
const totalExercises = computed(() => {
  if (!props.workout) return 0
  return props.workout.exercises.length
})

// Calculate total volume
const totalVolume = computed(() => {
  if (!props.workout) return 0
  return props.workout.exercises.reduce((total, exercise) => {
    const exerciseVolume =
      exercise.sets?.reduce((sum, set) => {
        return sum + set.weight * set.reps
      }, 0) || 0
    return total + exerciseVolume
  }, 0)
})

// Format volume with unit
const formattedVolume = computed(() => {
  return formatWeight(totalVolume.value)
})

// Format selected date for display
const formattedDate = computed(() => {
  if (!workoutDate.value) {
    return new Date().toLocaleDateString(currentLocale.value, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Convert CalendarDate to JavaScript Date
  const date = new Date(
    workoutDate.value.year,
    workoutDate.value.month - 1,
    workoutDate.value.day,
  )

  return date.toLocaleDateString(currentLocale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Reset notes and date when sheet opens/closes
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Initialize with today's date when opening
      const now = new Date()
      workoutDate.value = new CalendarDate(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
      )
    } else {
      workoutNotes.value = ''
      workoutDate.value = null
      saving.value = false
    }
  },
)

// Handle confirm
async function handleConfirm() {
  saving.value = true

  // Convert CalendarDate to JavaScript Date
  const selectedDate = workoutDate.value
    ? new Date(
        workoutDate.value.year,
        workoutDate.value.month - 1,
        workoutDate.value.day,
      )
    : new Date()

  emit('confirm', {
    notes: workoutNotes.value,
    date: selectedDate,
  })
  // Parent will close the sheet after successful save
}
</script>
