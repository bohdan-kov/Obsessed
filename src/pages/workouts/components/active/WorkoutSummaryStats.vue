<template>
  <div class="grid grid-cols-3 gap-4">
    <!-- Exercises Count -->
    <div class="flex flex-col items-center gap-1">
      <div class="text-xs text-muted-foreground">
        {{ t('workout.activeWorkout.stats.exercises') }}
      </div>
      <div class="text-xl font-bold">
        {{ exercisesCount }}
      </div>
    </div>

    <!-- Sets Count -->
    <div class="flex flex-col items-center gap-1">
      <div class="text-xs text-muted-foreground">
        {{ t('workout.activeWorkout.stats.sets') }}
      </div>
      <div class="text-xl font-bold">
        {{ setsCount }}
      </div>
    </div>

    <!-- Total Volume -->
    <div class="flex flex-col items-center gap-1">
      <div class="text-xs text-muted-foreground">
        {{ t('workout.activeWorkout.stats.volume') }}
      </div>
      <div class="text-xl font-bold">
        {{ formattedVolume }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'

const props = defineProps({
  exercises: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
const { formatWeight } = useUnits()

// Calculate exercises count
const exercisesCount = computed(() => props.exercises.length)

// Calculate total sets count
const setsCount = computed(() => {
  return props.exercises.reduce((total, exercise) => {
    return total + (exercise.sets?.length || 0)
  }, 0)
})

// Calculate total volume (weight × reps across all sets)
const totalVolume = computed(() => {
  return props.exercises.reduce((total, exercise) => {
    const exerciseVolume =
      exercise.sets?.reduce((sum, set) => {
        return sum + set.weight * set.reps
      }, 0) || 0
    return total + exerciseVolume
  }, 0)
})

// Format volume with unit
const formattedVolume = computed(() => {
  // Volume is already in storage unit (kg), so we need to format it
  return formatWeight(totalVolume.value, { showUnit: false })
})
</script>
