<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-vue-next'
import WorkoutHeader from './components/WorkoutHeader.vue'
import WorkoutSummaryStats from './components/WorkoutSummaryStats.vue'
import WorkoutExerciseList from './components/WorkoutExerciseList.vue'
import WorkoutMuscleDistribution from './components/WorkoutMuscleDistribution.vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    default: 'workouts',
  },
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { handleError } = useErrorHandler()

const workoutStore = useWorkoutStore()
const { workouts, loading } = storeToRefs(workoutStore)

const exerciseStore = useExerciseStore()
const { allExercises } = storeToRefs(exerciseStore)

// Find workout by ID
const workout = computed(() => {
  return workouts.value.find((w) => w.id === props.id)
})

// Calculate summary stats
const summaryStats = computed(() => {
  if (!workout.value) return null

  const totalVolume = workout.value.exercises.reduce((sum, ex) => {
    return sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0)
  }, 0)

  const totalSets = workout.value.exercises.reduce((sum, ex) => {
    return sum + ex.sets.length
  }, 0)

  const totalExercises = workout.value.exercises.length

  return {
    totalVolume,
    totalSets,
    totalExercises,
    duration: workout.value.duration || 0,
  }
})

// Navigation
const backRoute = computed(() => {
  const from = props.from || route.query.from || 'workouts'
  const tab = route.query.tab // Get tab from query if present

  // If navigating back to analytics with a specific tab, include the tab query param
  if (from === 'analytics' && tab) {
    return { path: '/analytics', query: { tab } }
  }

  // Default route mapping
  const routeMap = {
    analytics: '/analytics',
    dashboard: '/',
    workouts: '/workouts',
  }
  return routeMap[from] || '/workouts'
})

function handleBack() {
  // If there's browser history (user navigated from another page in the app),
  // use router.back() to preserve exact navigation state (scroll position, filters, etc.)
  // Otherwise, fallback to the explicit route based on the 'from' query param
  if (window.history.state.back) {
    router.back()
  } else {
    // Direct URL access (no history) - navigate to fallback route
    router.push(backRoute.value)
  }
}

// Fetch workout and ensure exercise store is initialized
onMounted(async () => {
  // Ensure exercise store is initialized (needed for muscle distribution)
  if (allExercises.value.length === 0) {
    try {
      await exerciseStore.fetchExercises()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[WorkoutDetailView] Error fetching exercises:', error)
      }
      handleError(error, t('errors.loadExercises'), 'WorkoutDetailView')
    }
  }

  // Fetch workout if not already in store
  if (!workout.value) {
    try {
      await workoutStore.fetchWorkout(props.id)
    } catch (error) {
      handleError(error, t('workout.detail.loadError'), 'WorkoutDetailView')
      // Navigate back after 2 seconds
      setTimeout(() => router.push(backRoute.value), 2000)
    }
  }
})

// Adjacent workout navigation
const previousWorkout = computed(() => {
  const sortedWorkouts = [...workouts.value]
    .filter((w) => w.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt)
      const dateB = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt)
      return dateA - dateB
    })

  const index = sortedWorkouts.findIndex((w) => w.id === props.id)
  return index > 0 ? sortedWorkouts[index - 1] : null
})

const nextWorkout = computed(() => {
  const sortedWorkouts = [...workouts.value]
    .filter((w) => w.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt)
      const dateB = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt)
      return dateA - dateB
    })

  const index = sortedWorkouts.findIndex((w) => w.id === props.id)
  return index < sortedWorkouts.length - 1 ? sortedWorkouts[index + 1] : null
})

function navigateToWorkout(workoutId) {
  // Preserve both 'from' and 'tab' query params when navigating between workouts
  const query = { from: props.from || route.query.from }
  if (route.query.tab) {
    query.tab = route.query.tab
  }

  router.push({
    name: 'WorkoutDetail',
    params: { id: workoutId },
    query,
  })
}
</script>

<template>
  <div class="workout-detail-view container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
    <!-- Loading State -->
    <div v-if="loading && !workout" class="space-y-4">
      <Skeleton class="h-10 w-32" />
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-96 w-full" />
    </div>

    <!-- Error State (Workout Not Found) -->
    <div v-else-if="!workout" class="flex flex-col items-center justify-center min-h-[60vh]">
      <AlertCircle class="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
      <h2 class="text-xl sm:text-2xl font-bold mb-2">{{ t('workout.detail.notFound') }}</h2>
      <p class="text-sm sm:text-base text-muted-foreground mb-6 text-center px-4">
        {{ t('workout.detail.notFoundDescription') }}
      </p>
      <Button @click="handleBack" size="lg">
        <ArrowLeft class="mr-2 w-4 h-4" />
        {{ t('common.actions.goBack') }}
      </Button>
    </div>

    <!-- Workout Detail Content -->
    <div v-else class="space-y-4 sm:space-y-6">
      <!-- Back Button -->
      <Button variant="ghost" @click="handleBack" class="mb-2 min-h-11">
        <ArrowLeft class="mr-2 w-4 h-4" />
        {{ t('common.actions.back') }}
      </Button>

      <!-- Workout Header -->
      <WorkoutHeader :workout="workout" :stats="summaryStats" />

      <!-- Summary Stats Grid -->
      <WorkoutSummaryStats :stats="summaryStats" />

      <!-- Muscle Distribution -->
      <WorkoutMuscleDistribution v-if="workout.exercises.length > 0" :exercises="workout.exercises" />

      <!-- Exercise List -->
      <WorkoutExerciseList :exercises="workout.exercises" />

      <!-- Navigation to Adjacent Workouts -->
      <div class="flex justify-between items-center pt-4">
        <Button
          v-if="previousWorkout"
          variant="outline"
          @click="navigateToWorkout(previousWorkout.id)"
          class="min-h-11"
        >
          <ChevronLeft class="mr-1 w-4 h-4" />
          <span class="hidden sm:inline">{{ t('workout.detail.previousWorkout') }}</span>
        </Button>
        <div v-else></div>

        <Button
          v-if="nextWorkout"
          variant="outline"
          @click="navigateToWorkout(nextWorkout.id)"
          class="min-h-11"
        >
          <span class="hidden sm:inline">{{ t('workout.detail.nextWorkout') }}</span>
          <ChevronRight class="ml-1 w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
