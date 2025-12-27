<template>
  <Card class="cursor-pointer transition-colors hover:bg-accent">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <CardTitle class="text-lg">
            {{ formattedDate }}
          </CardTitle>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ formattedDuration }}
          </p>
        </div>
        <Badge variant="outline" class="ml-2">
          {{ formatVolume(workout.totalVolume) }}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Workout Stats -->
      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-1 text-muted-foreground">
          <Dumbbell class="h-4 w-4" />
          <span>{{ t('workout.history.card.exercises', { count: exerciseCount }) }}</span>
        </div>
        <div class="flex items-center gap-1 text-muted-foreground">
          <Hash class="h-4 w-4" />
          <span>{{ t('workout.history.card.sets', { count: workout.totalSets || 0 }) }}</span>
        </div>
      </div>

      <!-- Exercise List -->
      <div v-if="workout.exercises?.length > 0" class="mt-3 space-y-1">
        <p
          v-for="(exercise, index) in displayExercises"
          :key="index"
          class="text-sm text-muted-foreground"
        >
          {{ getLocalizedExerciseName(exercise) }} - {{ exercise.sets?.length || 0 }} {{ t('workout.activeWorkout.stats.sets').toLowerCase() }}
        </p>
        <p v-if="remainingExercises > 0" class="text-sm text-muted-foreground">
          +{{ remainingExercises }} {{ t('common.more') }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { useExerciseStore } from '@/stores/exerciseStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Hash } from 'lucide-vue-next'

const props = defineProps({
  workout: {
    type: Object,
    required: true,
  },
})

const { t, locale } = useI18n()
const { formatWeight } = useUnits()

const exerciseStore = useExerciseStore()
const { allExercises } = storeToRefs(exerciseStore)

const MAX_EXERCISES_DISPLAY = 3

/**
 * Get localized exercise name
 * @param {Object} exercise - Exercise object from workout
 * @returns {string} Localized exercise name
 */
function getLocalizedExerciseName(exercise) {
  if (!exercise.exerciseId) {
    return exercise.exerciseName || ''
  }

  const exerciseData = allExercises.value.find(
    (ex) => ex.id === exercise.exerciseId || ex.slug === exercise.exerciseId
  )

  if (!exerciseData) {
    return exercise.exerciseName || ''
  }

  if (typeof exerciseData.name === 'object' && exerciseData.name !== null) {
    return exerciseData.name[locale.value] || exerciseData.name.uk || exerciseData.name.en || exercise.exerciseName || ''
  }

  return exerciseData.name || exercise.exerciseName || ''
}

// Format completed date
const formattedDate = computed(() => {
  if (!props.workout.completedAt) {
    return t('workout.history.card.dateUnknown', 'Unknown date')
  }

  try {
    // Convert Firestore Timestamp or parse date string
    const date =
      props.workout.completedAt?.toDate
        ? props.workout.completedAt.toDate()
        : new Date(props.workout.completedAt)

    // Validate that the date is valid
    if (isNaN(date.getTime())) {
      console.warn('[WorkoutHistoryCard] Invalid workout date:', props.workout.completedAt)
      return t('workout.history.card.dateUnknown', 'Unknown date')
    }

    return new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch (error) {
    console.error('[WorkoutHistoryCard] Error formatting workout date:', error, props.workout.completedAt)
    return t('workout.history.card.dateUnknown', 'Unknown date')
  }
})

// Format duration
const formattedDuration = computed(() => {
  const duration = props.workout.duration

  // Handle invalid/missing duration
  if (duration == null || duration < 0) {
    return t('workout.history.card.durationUnknown', 'Unknown duration')
  }

  // Handle very short workouts
  if (duration === 0) {
    return t('workout.history.card.durationMinutes', { minutes: 0 })
  }

  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)

  // If less than a minute, show "< 1 min"
  if (hours === 0 && minutes === 0) {
    return t('workout.history.card.durationLessThanMinute', '< 1 min')
  }

  if (hours > 0) {
    return t('workout.history.card.duration', { hours, minutes })
  }

  return t('workout.history.card.durationMinutes', { minutes })
})

// Format volume with unit
const formatVolume = (volume) => {
  return formatWeight(volume, { precision: 0, includeUnit: true })
}

// Exercise count
const exerciseCount = computed(() => {
  return props.workout.exercises?.length || 0
})

// Display exercises (max 3)
const displayExercises = computed(() => {
  if (!props.workout.exercises) return []
  return props.workout.exercises.slice(0, MAX_EXERCISES_DISPLAY)
})

// Remaining exercises count
const remainingExercises = computed(() => {
  const total = props.workout.exercises?.length || 0
  return Math.max(0, total - MAX_EXERCISES_DISPLAY)
})
</script>
