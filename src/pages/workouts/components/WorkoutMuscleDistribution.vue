<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useExerciseStore } from '@/stores/exerciseStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MUSCLE_COLORS } from '@/utils/chartUtils'

const props = defineProps({
  exercises: {
    type: Array,
    required: true,
  },
})

const { t } = useI18n()
const exerciseStore = useExerciseStore()
const { exercises: exerciseDefinitions } = storeToRefs(exerciseStore)

onMounted(async () => {
  if (exerciseDefinitions.value.length === 0) {
    await exerciseStore.fetchExercises()
  }
})

/**
 * Calculate muscle distribution from exercises
 * Counts how many exercises target each muscle group
 */
const muscleDistribution = computed(() => {
  if (!props.exercises || props.exercises.length === 0) {
    return []
  }

  const distribution = {}
  let totalMuscles = 0

  props.exercises.forEach((exercise) => {
    const exerciseDef = exerciseDefinitions.value.find(
      (def) => def.id === exercise.exerciseId
    )

    if (!exerciseDef) {
      return
    }

    // Get all muscle groups for this exercise
    let muscles = []
    if (exerciseDef.muscleGroups) {
      muscles = exerciseDef.muscleGroups
    } else if (exerciseDef.muscleGroup) {
      muscles = [exerciseDef.muscleGroup, ...(exerciseDef.secondaryMuscles || [])]
    }

    // Count each muscle group
    muscles.forEach((muscle) => {
      if (!distribution[muscle]) {
        distribution[muscle] = 0
      }
      distribution[muscle] += 1
      totalMuscles += 1
    })
  })

  // Convert to array and calculate percentages
  return Object.entries(distribution)
    .map(([muscle, count]) => ({
      muscle,
      muscleName: t(`common.muscleGroups.${muscle}`),
      count: Number(count),
      percentage: totalMuscles > 0 ? (Number(count) / totalMuscles) * 100 : 0,
      color: MUSCLE_COLORS[muscle] || '#3b82f6',
    }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
})

/**
 * Get animation delay for staggered entrance
 */
function getAnimationDelay(index) {
  return `${index * 0.05}s`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('workout.muscleDistribution.title') }}</CardTitle>
      <CardDescription>
        {{ t('workout.muscleDistribution.description') }}
      </CardDescription>
    </CardHeader>

    <CardContent class="px-2 pt-4 sm:px-6 sm:pt-6 pb-6">
      <!-- Empty state -->
      <div
        v-if="muscleDistribution.length === 0"
        class="flex flex-col items-center justify-center h-[200px]"
      >
        <svg
          class="w-12 h-12 mb-2 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p class="text-sm text-muted-foreground">
          {{ t('workout.muscleDistribution.noMuscles') }}
        </p>
      </div>

      <!-- Progress Bars -->
      <div v-else class="space-y-4">
        <div
          v-for="(item, index) in muscleDistribution"
          :key="item.muscle"
          class="muscle-distribution-item"
          :style="{ animationDelay: getAnimationDelay(index) }"
        >
          <!-- Muscle name and stats -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <div
                class="h-3 w-3 rounded-full shrink-0"
                :style="{ backgroundColor: item.color }"
              />
              <span class="text-sm font-medium">{{ item.muscleName }}</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-muted-foreground">
              <span class="font-mono">{{ item.count }} {{ t('common.exercises') }}</span>
              <span class="font-mono w-12 text-right">{{ item.percentage.toFixed(1) }}%</span>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="progress-bar-container">
            <div
              class="progress-bar"
              :style="{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Staggered slide-in animation for each item */
.muscle-distribution-item {
  opacity: 0;
  animation: slideIn 0.4s ease-out forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Progress bar container with background */
.progress-bar-container {
  height: 8px;
  width: 100%;
  background-color: hsl(var(--muted));
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

/* Progress bar with smooth width transition */
.progress-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Hover effect for better interactivity */
.muscle-distribution-item:hover .progress-bar {
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}
</style>
