<script setup>
import { useI18n } from 'vue-i18n'
import WorkoutExerciseCard from './WorkoutExerciseCard.vue'

const props = defineProps({
  exercises: {
    type: Array,
    required: true,
  },
})

const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl sm:text-2xl font-semibold mb-4">{{ t('workout.detail.exercises') }}</h2>

    <WorkoutExerciseCard
      v-for="(exercise, index) in exercises"
      :key="index"
      :exercise="exercise"
      :index="index"
    />
  </div>
</template>
