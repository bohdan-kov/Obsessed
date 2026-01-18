<template>
  <Card class="cursor-pointer transition-colors hover:bg-accent" @click="handleCardClick">
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

      <!-- Share Button -->
      <div class="mt-4 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          class="w-full"
          @click.stop="handleShareClick"
        >
          <Share2 class="h-4 w-4 mr-2" />
          {{ t('common.share') }}
        </Button>
      </div>
    </CardContent>

    <!-- Share Workout Modal -->
    <ShareWorkoutModal
      v-model:open="showShareModal"
      :workout="workout"
      @shared="handleWorkoutShared"
    />
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useUnits } from '@/composables/useUnits'
import { useExerciseStore } from '@/stores/exerciseStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dumbbell, Hash, Share2 } from 'lucide-vue-next'
import ShareWorkoutModal from '@/pages/community/components/share/ShareWorkoutModal.vue'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps({
  workout: {
    type: Object,
    required: true,
  },
})

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { formatWeight } = useUnits()
const { toast } = useToast()

const exerciseStore = useExerciseStore()
const { allExercises } = storeToRefs(exerciseStore)

const MAX_EXERCISES_DISPLAY = 3

// Share modal state
const showShareModal = ref(false)

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
    let date

    // Handle Firestore Timestamp (has toDate method)
    if (typeof props.workout.completedAt?.toDate === 'function') {
      date = props.workout.completedAt.toDate()
    }
    // Handle Firestore Timestamp object with seconds property
    else if (props.workout.completedAt?.seconds) {
      date = new Date(props.workout.completedAt.seconds * 1000)
    }
    // Handle Date object or date string
    else if (props.workout.completedAt instanceof Date) {
      date = props.workout.completedAt
    }
    // Handle ISO string or timestamp
    else {
      date = new Date(props.workout.completedAt)
    }

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
  return formatWeight(volume, { precision: 0, includeUnit: true, compact: true })
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

/**
 * Navigate to workout detail view when card is clicked
 * Preserve the active tab in query parameters for correct back navigation
 */
function handleCardClick() {
  const query = { from: 'workouts' }

  // Include current tab in query params if present
  if (route.query.tab) {
    query.tab = route.query.tab
  }

  router.push({
    name: 'WorkoutDetail',
    params: { id: props.workout.id },
    query,
  })
}

/**
 * Open share workout modal
 * Uses @click.stop to prevent card click navigation
 */
function handleShareClick() {
  showShareModal.value = true
}

/**
 * Handle successful workout share
 * @param {string} postId - ID of the created post
 */
function handleWorkoutShared(postId) {
  console.log('[WorkoutHistoryCard] Workout shared successfully:', postId)
  // Modal already shows toast and handles navigation
}
</script>
