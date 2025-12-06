<template>
  <div class="container max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <div class="h-10 bg-muted animate-pulse rounded"></div>
      <div class="h-48 bg-muted animate-pulse rounded"></div>
    </div>

    <!-- Exercise not found -->
    <div v-else-if="!exercise" class="text-center py-12">
      <h2 class="text-2xl font-bold mb-2">{{ t('errors.notFound') }}</h2>
      <p class="text-muted-foreground mb-4">{{ t('errors.exerciseNotFound') }}</p>
      <Button @click="handleBack">
        <ArrowLeft class="h-4 w-4 mr-2" />
        {{ t('exercises.detail.back') }}
      </Button>
    </div>

    <!-- Exercise details -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <!-- Back button -->
          <Button
            variant="ghost"
            size="sm"
            @click="handleBack"
            class="mb-2 -ml-2"
          >
            <ArrowLeft class="h-4 w-4 mr-2" />
            {{ t('exercises.detail.back') }}
          </Button>

          <!-- Exercise name -->
          <h1 class="text-3xl font-bold tracking-tight mb-2">
            {{ exerciseName }}
          </h1>

          <!-- Meta info -->
          <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div class="flex items-center gap-1.5">
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: muscleGroupColor }"
              ></span>
              <span>{{ muscleGroupLabel }}</span>
            </div>

            <span class="text-muted-foreground/50">•</span>
            <span>{{ equipmentLabel }}</span>

            <template v-if="exercise.type">
              <span class="text-muted-foreground/50">•</span>
              <span>{{ exerciseTypeLabel }}</span>
            </template>

            <Badge v-if="exercise.isCustom" variant="secondary" class="ml-2">
              {{ t('common.custom') }}
            </Badge>
          </div>

          <!-- Secondary muscles -->
          <div
            v-if="exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0"
            class="flex flex-wrap gap-1.5 mt-3"
          >
            <Badge
              v-for="muscle in exercise.secondaryMuscles"
              :key="muscle"
              variant="outline"
            >
              {{ getMuscleGroupLabel(muscle) }}
            </Badge>
          </div>

          <!-- Description -->
          <p v-if="exerciseDescription" class="mt-4 text-muted-foreground">
            {{ exerciseDescription }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-start gap-2 shrink-0">
          <FavoriteButton
            :exercise-id="exercise.id"
            :is-favorite="isFavorite"
          />

          <!-- Edit button (only for custom exercises) -->
          <Button
            v-if="exercise.isCustom"
            variant="outline"
            size="icon"
            @click="handleEdit"
            :aria-label="t('exercises.detail.edit')"
            class="min-h-11 min-w-11"
          >
            <Edit class="h-4 w-4" />
          </Button>

          <!-- Delete button (only for custom exercises) -->
          <Button
            v-if="exercise.isCustom"
            variant="outline"
            size="icon"
            @click="handleDelete"
            :aria-label="t('exercises.detail.delete')"
            class="min-h-11 min-w-11"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Video (if available) -->
      <Card v-if="exercise.videoUrl">
        <CardContent class="p-0">
          <div class="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
            <p class="text-sm text-muted-foreground">{{ t('common.video') }}</p>
            <!-- TODO: Embed video player -->
          </div>
        </CardContent>
      </Card>

      <!-- Tabs -->
      <Tabs default-value="stats" class="w-full">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="stats">
            {{ t('exercises.detail.stats') }}
          </TabsTrigger>
          <TabsTrigger value="history">
            {{ t('exercises.detail.history') }}
          </TabsTrigger>
          <TabsTrigger value="notes">
            {{ t('exercises.detail.notes') }}
          </TabsTrigger>
        </TabsList>

        <!-- Stats tab -->
        <TabsContent value="stats" class="mt-6">
          <ExerciseStats :exercise-id="id" />
        </TabsContent>

        <!-- History tab -->
        <TabsContent value="history" class="mt-6">
          <ExerciseHistory :exercise-id="id" />
        </TabsContent>

        <!-- Notes tab -->
        <TabsContent value="notes" class="mt-6">
          <ExerciseNotes :exercise-id="id" />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Exercise Form Dialog (Edit Mode) -->
    <ExerciseFormDialog
      v-model:open="showEditDialog"
      :exercise="exercise"
      @success="handleExerciseUpdated"
    />

    <!-- Delete Exercise Dialog -->
    <DeleteExerciseDialog
      v-model:open="showDeleteDialog"
      :exercise="exercise"
      @success="handleExerciseDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowLeft, Edit, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FavoriteButton from './components/FavoriteButton.vue'
import ExerciseStats from './components/ExerciseStats.vue'
import ExerciseHistory from './components/ExerciseHistory.vue'
import ExerciseNotes from './components/ExerciseNotes.vue'
import ExerciseFormDialog from './components/ExerciseFormDialog.vue'
import DeleteExerciseDialog from './components/DeleteExerciseDialog.vue'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useExerciseLibraryStore } from '@/stores/exerciseLibraryStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useI18n } from 'vue-i18n'
import { MUSCLE_GROUPS } from '@/shared/config/constants'

const props = defineProps({
  /**
   * Exercise ID from route params
   */
  id: {
    type: String,
    required: true,
  },
})

const { t, locale } = useI18n()
const router = useRouter()
const exerciseStore = useExerciseStore()
const exerciseLibraryStore = useExerciseLibraryStore()
const workoutStore = useWorkoutStore()
const { handleError } = useErrorHandler()

const { loading } = storeToRefs(exerciseStore)
const { favorites } = storeToRefs(exerciseLibraryStore)

// Track Firebase subscription for cleanup
let unsubscribeWorkouts = null

// Local state
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)

// Get exercise
const exercise = computed(() => exerciseStore.getExerciseById(props.id))

/**
 * Check if exercise is favorite
 */
const isFavorite = computed(() => favorites.value.includes(props.id))

/**
 * Get localized exercise name
 */
const exerciseName = computed(() => {
  if (!exercise.value) return ''

  if (typeof exercise.value.name === 'object') {
    return (
      exercise.value.name[locale.value] ||
      exercise.value.name.uk ||
      exercise.value.name.en
    )
  }
  return exercise.value.name || ''
})

/**
 * Get localized description
 */
const exerciseDescription = computed(() => {
  if (!exercise.value?.description) return ''

  if (typeof exercise.value.description === 'object') {
    return (
      exercise.value.description[locale.value] ||
      exercise.value.description.uk ||
      exercise.value.description.en
    )
  }
  return exercise.value.description || ''
})

/**
 * Get muscle group color
 */
const muscleGroupColor = computed(() => {
  const muscleGroupId = exercise.value?.muscleGroup || exercise.value?.muscleGroups?.[0]
  const muscleGroup = MUSCLE_GROUPS.find((g) => g.id === muscleGroupId)
  return muscleGroup?.color || '#666'
})

/**
 * Get muscle group label
 */
const muscleGroupLabel = computed(() => {
  const muscleGroupId = exercise.value?.muscleGroup || exercise.value?.muscleGroups?.[0]
  return muscleGroupId ? t(`exercises.muscleGroups.${muscleGroupId}`) : ''
})

/**
 * Get muscle group label by ID
 */
function getMuscleGroupLabel(muscleId) {
  if (!muscleId) return ''
  return t(`exercises.muscleGroups.${muscleId}`)
}

/**
 * Get equipment label
 */
const equipmentLabel = computed(() => {
  return exercise.value?.equipment
    ? t(`exercises.equipment.${exercise.value.equipment}`)
    : ''
})

/**
 * Get exercise type label
 */
const exerciseTypeLabel = computed(() => {
  return exercise.value?.type ? t(`exercises.types.${exercise.value.type}`) : ''
})

/**
 * Handle back navigation
 */
function handleBack() {
  router.push({ name: 'Exercises' })
}

/**
 * Handle edit exercise
 */
function handleEdit() {
  showEditDialog.value = true
}

/**
 * Handle exercise updated successfully
 */
function handleExerciseUpdated() {
  showEditDialog.value = false
  // Exercise will update automatically via reactive subscriptions
}

/**
 * Handle delete exercise
 */
function handleDelete() {
  showDeleteDialog.value = true
}

/**
 * Handle exercise deleted successfully
 */
function handleExerciseDeleted() {
  showDeleteDialog.value = false
  // Navigate back to exercises list
  handleBack()
}

/**
 * Load exercise on mount
 */
onMounted(async () => {
  try {
    // Select this exercise in the store
    exerciseLibraryStore.selectExercise(props.id)

    const results = await Promise.all([
      // Load exercises if not already loaded
      exerciseStore.exercises.length === 0
        ? exerciseStore.fetchExercises()
        : Promise.resolve(),
      // Load custom exercises
      exerciseStore.fetchCustomExercises(),
      // Load workout data for exercise stats
      workoutStore.ensureDataLoaded({ period: 'month', subscribe: true }),
    ])

    // Store unsubscribe function from ensureDataLoaded (3rd promise result)
    const unsubscribe = results[2]
    if (typeof unsubscribe === 'function') {
      unsubscribeWorkouts = unsubscribe
    }
  } catch (error) {
    handleError(error, t('errors.loadExercises'), {
      context: 'ExerciseDetailView.onMounted',
    })
  }
})

/**
 * Clean up Firebase subscriptions to prevent memory leaks
 */
onUnmounted(() => {
  if (unsubscribeWorkouts) {
    unsubscribeWorkouts()
    unsubscribeWorkouts = null
  }
})
</script>
