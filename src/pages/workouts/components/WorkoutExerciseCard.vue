<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { useExerciseStore } from '@/stores/exerciseStore'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})

const { t, locale } = useI18n()
const { formatWeight } = useUnits()

const exerciseStore = useExerciseStore()
const { allExercises } = storeToRefs(exerciseStore)

/**
 * Get localized exercise name
 * Looks up the exercise by exerciseId from the exercise store to get the localized name
 * Falls back to the stored exerciseName if exercise not found in store
 */
const localizedExerciseName = computed(() => {
  if (!props.exercise.exerciseId) {
    // No exerciseId, use the raw name
    return props.exercise.exerciseName || ''
  }

  // Find exercise in store by ID
  const exerciseData = allExercises.value.find(
    (ex) => ex.id === props.exercise.exerciseId || ex.slug === props.exercise.exerciseId
  )

  if (!exerciseData) {
    // Exercise not found in store, fall back to stored name
    return props.exercise.exerciseName || ''
  }

  // Exercise found - get localized name
  if (typeof exerciseData.name === 'object' && exerciseData.name !== null) {
    return exerciseData.name[locale.value] || exerciseData.name.uk || exerciseData.name.en || props.exercise.exerciseName || ''
  }

  // Legacy string name
  return exerciseData.name || props.exercise.exerciseName || ''
})

const exerciseVolume = computed(() => {
  return props.exercise.sets.reduce((sum, set) => {
    return sum + set.weight * set.reps
  }, 0)
})
</script>

<template>
  <Card class="p-3 sm:p-4">
    <h3 class="text-base sm:text-lg font-semibold mb-3">
      {{ index + 1 }}. {{ localizedExerciseName }}
    </h3>

    <div class="overflow-x-auto -mx-3 sm:-mx-4">
      <div class="inline-block min-w-full align-middle px-3 sm:px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="text-xs sm:text-sm">{{ t('workout.exerciseTable.sets') }}</TableHead>
              <TableHead class="text-xs sm:text-sm">{{ t('workout.exerciseTable.weight') }}</TableHead>
              <TableHead class="text-xs sm:text-sm">{{ t('workout.exerciseTable.reps') }}</TableHead>
              <TableHead class="text-xs sm:text-sm">{{ t('workout.exerciseTable.volume') }}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-for="(set, setIndex) in exercise.sets" :key="setIndex">
              <TableCell class="text-xs sm:text-sm">{{ setIndex + 1 }}</TableCell>
              <TableCell class="text-xs sm:text-sm">{{ formatWeight(set.weight) }}</TableCell>
              <TableCell class="text-xs sm:text-sm">{{ set.reps }}</TableCell>
              <TableCell class="text-xs sm:text-sm">
                {{ formatWeight(set.weight * set.reps) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <div class="mt-3 text-right font-semibold text-sm">
      {{ t('workout.detail.exerciseTotal') }}: {{ formatWeight(exerciseVolume) }}
    </div>
  </Card>
</template>
