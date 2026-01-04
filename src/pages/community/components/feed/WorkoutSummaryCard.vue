<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Dumbbell, Zap, Clock } from 'lucide-vue-next'
import { useUnits } from '@/composables/useUnits'

/**
 * WorkoutSummaryCard - Embedded workout stats in feed post
 *
 * Features:
 * - Stats row: exercises, volume, duration
 * - Exercise list (expandable: top 3, then "Show all")
 * - Mobile-optimized layout
 * - i18n support with weight unit conversion
 */

const props = defineProps({
  workout: {
    type: Object,
    required: true,
    validator: (workout) =>
      workout && workout.exercises && Array.isArray(workout.exercises),
  },
  defaultExpanded: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const { formatWeight } = useUnits()

const isExpanded = ref(props.defaultExpanded)

const exerciseCount = computed(() => props.workout.exercises?.length || 0)
const totalVolume = computed(() => props.workout.totalVolume || 0)
const duration = computed(() => props.workout.duration || 0)

// Show first 3 exercises when collapsed
const visibleExercises = computed(() => {
  if (isExpanded.value) {
    return props.workout.exercises || []
  }
  return (props.workout.exercises || []).slice(0, 3)
})

const hasMoreExercises = computed(() => exerciseCount.value > 3)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// Format duration (minutes)
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}${t('common.min')}`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}${t('common.h')} ${mins}${t('common.min')}` : `${hours}${t('common.h')}`
}
</script>

<template>
  <Card class="border-muted/50">
    <CardContent class="p-3 space-y-3">
      <!-- Stats row -->
      <div class="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <div class="flex items-center gap-1.5">
          <Dumbbell class="w-4 h-4" />
          <span>{{ t('community.feed.exercises', { count: exerciseCount }) }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Zap class="w-4 h-4" />
          <span>{{ formatWeight(totalVolume, { precision: 0 }) }}</span>
        </div>
        <div v-if="duration" class="flex items-center gap-1.5">
          <Clock class="w-4 h-4" />
          <span>{{ formatDuration(duration) }}</span>
        </div>
      </div>

      <!-- Exercise list -->
      <div v-if="exerciseCount > 0" class="space-y-2">
        <div
          v-for="(exercise, index) in visibleExercises"
          :key="index"
          class="flex items-center justify-between text-sm"
        >
          <span class="font-medium">{{ exercise.name || exercise.exerciseName }}</span>
          <span class="text-muted-foreground">
            {{ exercise.sets?.length || 0 }} {{ t('community.workout.sets', { count: exercise.sets?.length || 0 }) }}
          </span>
        </div>

        <!-- Show all / Hide button -->
        <Button
          v-if="hasMoreExercises"
          variant="ghost"
          size="sm"
          class="w-full h-8 mt-2"
          @click="toggleExpanded"
        >
          <component :is="isExpanded ? ChevronUp : ChevronDown" class="w-4 h-4 mr-2" />
          {{ isExpanded ? t('community.feed.hideExercises') : t('community.feed.showAll') }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
