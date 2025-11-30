<template>
  <Card
    :class="
      cn(
        'group cursor-pointer transition-all hover:shadow-md active:scale-[0.98]',
        className
      )
    "
    @click="handleClick"
  >
    <CardContent class="p-4">
      <div class="flex items-start justify-between gap-3">
        <!-- Exercise info -->
        <div class="flex-1 min-w-0">
          <!-- Name and badges -->
          <div class="flex items-start gap-2 mb-2">
            <h3 class="text-base font-semibold leading-tight truncate flex-1">
              {{ exerciseName }}
            </h3>
            <Badge
              v-if="exercise.isCustom"
              variant="secondary"
              class="shrink-0 text-xs"
            >
              {{ t('common.custom') }}
            </Badge>
          </div>

          <!-- Muscle group and equipment -->
          <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <div class="flex items-center gap-1">
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: muscleGroupColor }"
                :aria-label="t('exercises.filters.muscleGroup')"
              ></span>
              <span class="truncate">{{ muscleGroupLabel }}</span>
            </div>

            <span class="text-muted-foreground/50">•</span>

            <span class="truncate">{{ equipmentLabel }}</span>

            <template v-if="exercise.type">
              <span class="text-muted-foreground/50">•</span>
              <span class="truncate">{{ exerciseTypeLabel }}</span>
            </template>
          </div>

          <!-- Secondary muscles (if any) -->
          <div
            v-if="exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0"
            class="flex flex-wrap gap-1"
          >
            <Badge
              v-for="muscle in exercise.secondaryMuscles"
              :key="muscle"
              variant="outline"
              class="text-xs"
            >
              {{ getMuscleGroupLabel(muscle) }}
            </Badge>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0">
          <FavoriteButton
            :exercise-id="exercise.id"
            :is-favorite="isFavorite"
            @toggle="handleFavoriteToggle"
          />
        </div>
      </div>

      <!-- Stats (if available) -->
      <div
        v-if="showStats && hasStats"
        class="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center"
      >
        <div>
          <div class="text-xs text-muted-foreground">{{ t('exercises.stats.personalRecord') }}</div>
          <div class="text-sm font-semibold">{{ personalRecord }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">{{ t('exercises.stats.totalVolume') }}</div>
          <div class="text-sm font-semibold">{{ totalVolume }}</div>
        </div>
        <div>
          <div class="text-xs text-muted-foreground">{{ t('exercises.stats.timesPerformed') }}</div>
          <div class="text-sm font-semibold">{{ timesPerformed }}</div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FavoriteButton from './FavoriteButton.vue'
import { useI18n } from 'vue-i18n'
import { useExerciseStats } from '@/composables/useExerciseStats'
import { MUSCLE_GROUPS } from '@/shared/config/constants'
import { cn } from '@/lib/utils'

const props = defineProps({
  /**
   * Exercise object
   */
  exercise: {
    type: Object,
    required: true,
  },
  /**
   * Whether exercise is favorite
   */
  isFavorite: {
    type: Boolean,
    default: false,
  },
  /**
   * Show statistics
   */
  showStats: {
    type: Boolean,
    default: false,
  },
  /**
   * Additional CSS classes
   */
  className: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['click', 'favorite-toggle'])

const { t, locale } = useI18n()

// Get exercise stats if showStats is enabled
const stats = props.showStats ? useExerciseStats(props.exercise.id) : null

/**
 * Get localized exercise name
 */
const exerciseName = computed(() => {
  if (typeof props.exercise.name === 'object') {
    return props.exercise.name[locale.value] || props.exercise.name.uk || props.exercise.name.en
  }
  return props.exercise.name || ''
})

/**
 * Get muscle group color
 */
const muscleGroupColor = computed(() => {
  const muscleGroupId = props.exercise.muscleGroup || props.exercise.muscleGroups?.[0]
  const muscleGroup = MUSCLE_GROUPS.find((g) => g.id === muscleGroupId)
  return muscleGroup?.color || '#666'
})

/**
 * Get muscle group label
 */
const muscleGroupLabel = computed(() => {
  const muscleGroupId = props.exercise.muscleGroup || props.exercise.muscleGroups?.[0]
  if (!muscleGroupId) return ''
  return t(`exercises.muscleGroups.${muscleGroupId}`)
})

/**
 * Get muscle group label by ID
 * @param {string} muscleId - Muscle group ID
 */
function getMuscleGroupLabel(muscleId) {
  if (!muscleId) return ''
  return t(`exercises.muscleGroups.${muscleId}`)
}

/**
 * Get equipment label
 */
const equipmentLabel = computed(() => {
  return t(`exercises.equipment.${props.exercise.equipment}`)
})

/**
 * Get exercise type label
 */
const exerciseTypeLabel = computed(() => {
  return t(`exercises.types.${props.exercise.type}`)
})

/**
 * Check if stats are available
 */
const hasStats = computed(() => {
  return stats && stats.hasData.value
})

/**
 * Personal record display
 */
const personalRecord = computed(() => {
  if (!stats || !stats.personalRecord.value) {
    return t('exercises.stats.noData')
  }
  return stats.personalRecord.value.formatted
})

/**
 * Total volume display
 */
const totalVolume = computed(() => {
  if (!stats || !stats.totalVolume.value) {
    return t('exercises.stats.noData')
  }
  return stats.totalVolume.value.formatted
})

/**
 * Times performed display
 */
const timesPerformed = computed(() => {
  if (!stats) {
    return '0'
  }
  return stats.timesPerformed.value.toString()
})

/**
 * Handle card click
 */
function handleClick() {
  emit('click', props.exercise)
}

/**
 * Handle favorite toggle
 */
function handleFavoriteToggle(newStatus) {
  emit('favorite-toggle', newStatus)
}
</script>
