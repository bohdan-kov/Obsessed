<template>
  <div class="space-y-4">
    <!-- Header with Timer and Stats -->
    <ActiveWorkoutHeader
      :started-at="activeWorkout?.startedAt"
      :exercises="activeWorkout?.exercises || []"
      :sync-status="syncStatus"
      @finish="showFinishSheet = true"
      @cancel="showCancelDialog = true"
    />

    <!-- Exercises List -->
    <div v-if="activeWorkout && activeWorkout.exercises?.length > 0" class="space-y-4">
      <ExerciseCard
        v-for="exercise in activeWorkout.exercises"
        :key="exercise.exerciseId"
        :exercise="exercise"
        @add-set="openAddSetSheet(exercise)"
        @delete-set="handleDeleteSet(exercise.exerciseId, $event)"
      />

      <!-- Add Exercise Button (shown only when exercises exist) -->
      <Button
        variant="outline"
        class="h-14 w-full"
        @click="showAddExerciseSheet = true"
      >
        <Plus class="mr-2 h-5 w-5" />
        {{ t('workout.activeWorkout.exercise.addExercise') }}
      </Button>
    </div>

    <!-- Empty State (shown when active workout exists but no exercises) -->
    <div
      v-else-if="activeWorkout"
      class="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
    >
      <Dumbbell class="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 class="mb-2 text-lg font-semibold">
        {{ t('workout.activeWorkout.exercise.noExercises') }}
      </h3>
      <p class="mb-4 text-sm text-muted-foreground">
        {{ t('workout.activeWorkout.exercise.noExercisesHint') }}
      </p>
      <Button @click="showAddExerciseSheet = true">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('workout.activeWorkout.exercise.addExercise') }}
      </Button>
    </div>

    <!-- Add Exercise Sheet -->
    <AddExerciseSheet
      :open="showAddExerciseSheet"
      @update:open="showAddExerciseSheet = $event"
      @select="handleAddExercise"
    />

    <!-- Add Set Sheet -->
    <AddSetSheet
      :open="showAddSetSheet"
      :exercise="selectedExercise"
      :previous-set="previousSet"
      @update:open="handleSetSheetClose"
      @submit="handleAddSet"
    />

    <!-- Finish Workout Sheet -->
    <FinishWorkoutSheet
      :open="showFinishSheet"
      :workout="activeWorkout"
      @update:open="showFinishSheet = $event"
      @confirm="handleFinishWorkout"
    />

    <!-- Cancel Workout Dialog -->
    <CancelWorkoutDialog
      :open="showCancelDialog"
      :sets-count="totalSetsCount"
      @update:open="showCancelDialog = $event"
      @confirm="handleCancelWorkout"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useActiveWorkout } from '@/composables/useActiveWorkout'
import { Button } from '@/components/ui/button'
import { Plus, Dumbbell } from 'lucide-vue-next'
import ActiveWorkoutHeader from './ActiveWorkoutHeader.vue'
import ExerciseCard from './ExerciseCard.vue'
import AddExerciseSheet from '../sheets/AddExerciseSheet.vue'
import AddSetSheet from '../sheets/AddSetSheet.vue'
import FinishWorkoutSheet from '../sheets/FinishWorkoutSheet.vue'
import CancelWorkoutDialog from '../sheets/CancelWorkoutDialog.vue'

const { t } = useI18n()
const {
  activeWorkout,
  addExercise,
  addSet,
  deleteSet,
  finishWorkout,
  cancelWorkout,
} = useActiveWorkout()

// Sheet/Dialog state
const showAddExerciseSheet = ref(false)
const showAddSetSheet = ref(false)
const showFinishSheet = ref(false)
const showCancelDialog = ref(false)

// Selected exercise for adding sets
const selectedExercise = ref(null)

// Sync status (placeholder - will be connected to real sync logic)
const syncStatus = ref(null)

// Get previous set for pre-filling form
const previousSet = computed(() => {
  if (!selectedExercise.value) return null

  const exercise = activeWorkout.value?.exercises.find(
    (ex) => ex.exerciseId === selectedExercise.value.exerciseId,
  )

  if (!exercise || !exercise.sets || exercise.sets.length === 0) {
    return null
  }

  // Return the last set
  return exercise.sets[exercise.sets.length - 1]
})

// Total sets count for cancel dialog
const totalSetsCount = computed(() => {
  if (!activeWorkout.value) return 0
  return activeWorkout.value.exercises.reduce((total, exercise) => {
    return total + (exercise.sets?.length || 0)
  }, 0)
})

// Open add set sheet for specific exercise
function openAddSetSheet(exercise) {
  selectedExercise.value = exercise
  showAddSetSheet.value = true
}

// Handle set sheet close
function handleSetSheetClose(isOpen) {
  showAddSetSheet.value = isOpen
  if (!isOpen) {
    selectedExercise.value = null
  }
}

// Handle add exercise
async function handleAddExercise(exercise) {
  try {
    // AddExerciseSheet emits the full exercise object
    // Pass the exercise ID (slug) to the composable
    await addExercise(exercise.id)
  } catch (error) {
    // Error already handled by useActiveWorkout with user-friendly toast
  }
}

// Handle add set
async function handleAddSet(setData) {
  if (!selectedExercise.value) return

  await addSet(selectedExercise.value.exerciseId, setData)

  // Close sheet on success
  showAddSetSheet.value = false
  selectedExercise.value = null
}

// Handle delete set
async function handleDeleteSet(exerciseId, setIndex) {
  await deleteSet(exerciseId, setIndex)
}

// Handle finish workout
async function handleFinishWorkout(data) {
  // data is an object with { notes, date }
  await finishWorkout(data)
  showFinishSheet.value = false
}

// Handle cancel workout
async function handleCancelWorkout() {
  await cancelWorkout()
  showCancelDialog.value = false
}
</script>
