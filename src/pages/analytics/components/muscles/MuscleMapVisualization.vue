<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { User } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HumanMuscleAnatomy } from '@lucawahlen/vue-human-muscle-anatomy'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useUserStore } from '@/stores/userStore'
import { useUnits } from '@/composables/useUnits'
import {
  convertToAnatomicalMuscles,
  groupMusclesByIntensity,
  findMaxVolume,
} from '@/utils/muscleMapUtils'

const { t } = useI18n()
const { formatWeight } = useUnits()

const analyticsStore = useAnalyticsStore()
const workoutStore = useWorkoutStore()
const userStore = useUserStore()
const { muscleDistributionByVolume } = storeToRefs(analyticsStore)

// Loading state from workoutStore
const loading = computed(() => workoutStore.loading)

// Check if we have data
const hasData = computed(() => muscleDistributionByVolume.value.length > 0)

// User's gender from profile (default to 'male' if not set or 'other'/'prefer-not-to-say')
const userGender = computed(() => {
  const profileGender = userStore.profile?.personalInfo?.gender
  // Only return 'female' if explicitly set, otherwise default to 'male'
  return profileGender === 'female' ? 'female' : 'male'
})

// Convert app muscle groups to anatomical muscles
const anatomicalData = computed(() => {
  if (!hasData.value) return []
  return convertToAnatomicalMuscles(muscleDistributionByVolume.value)
})

// Group muscles by intensity
const groupedMuscles = computed(() => {
  if (!anatomicalData.value.length) {
    return { primary: [], secondary: [] }
  }
  return groupMusclesByIntensity(anatomicalData.value)
})

// WORKAROUND: Package bug - show all muscles for now with single color
// User can still see intensity difference through muscle group sizes
const allMuscles = computed(() => {
  return [...groupedMuscles.value.primary, ...groupedMuscles.value.secondary]
})

// Theme colors for muscle map
const isDark = computed(() => {
  if (typeof window === 'undefined') return false
  return document.documentElement.classList.contains('dark')
})

const backgroundColor = computed(() => (isDark.value ? '#18181b' : '#ffffff'))
const defaultMuscleColor = computed(() => (isDark.value ? '#27272a' : '#e5e5e5'))

// Primary highlight color - destructive red from project theme (oklch(0.637 0.237 25.331))
// This is a vibrant red that stands out against the default muscle color
const primaryHighlightColor = '#ef4444' // red-500 (approximates oklch(0.637 0.237 25.331))

// Secondary highlight color - darker red for lower intensity muscles
// Creates a subtle gradient effect from high to low volume
const secondaryHighlightColor = '#b91c1c' // red-700 (darker shade)

/**
 * Get max volume for legend
 */
const maxVolume = computed(() => {
  if (!muscleDistributionByVolume.value.length) return 0
  return findMaxVolume(muscleDistributionByVolume.value)
})
</script>

<template>
  <Card class="muscle-map-card">
    <CardHeader>
      <CardTitle>{{ t('analytics.muscles.map.title') }}</CardTitle>
      <CardDescription>{{ t('analytics.muscles.map.description') }}</CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!hasData"
        class="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <User class="mb-2 h-12 w-12 opacity-50" />
        <p class="text-sm">{{ t('analytics.muscles.map.emptyState') }}</p>
      </div>

      <!-- Muscle Map -->
      <div v-else class="muscle-map-container muscle-map-entrance">
        <!-- Muscle Anatomy Visualization -->
        <!-- NOTE: Package bug - selectedSecondaryMuscleGroups doesn't work -->
        <!-- Showing all muscles with primaryHighlightColor as workaround -->
        <div class="muscle-map-wrapper mx-auto">
          <HumanMuscleAnatomy
            :gender="userGender"
            :default-muscle-color="defaultMuscleColor"
            :background-color="backgroundColor"
            :primary-highlight-color="primaryHighlightColor"
            :primary-opacity="0.9"
            :selected-primary-muscle-groups="allMuscles"
          />
        </div>

        <!-- Legend -->
        <div class="muscle-map-legend">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>{{ t('analytics.muscles.map.legend.low') }}</span>
            <span class="font-medium">{{ t('analytics.muscles.map.legend.title') }}</span>
            <span>{{ t('analytics.muscles.map.legend.high') }}</span>
          </div>
          <div class="mt-2 flex items-center gap-1">
            <div
              v-for="level in [0.3, 0.45, 0.6, 0.75, 0.9, 1.0]"
              :key="level"
              class="legend-cell h-4 flex-1 rounded-sm"
              :style="{ backgroundColor: primaryHighlightColor, opacity: level }"
            />
          </div>
          <div
            v-if="maxVolume > 0"
            class="mt-2 flex items-center justify-between text-xs text-muted-foreground"
          >
            <span>0</span>
            <span class="font-medium">{{ formatWeight(maxVolume, { precision: 0 }) }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Container entrance animation */
.muscle-map-entrance {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Muscle map wrapper - responsive sizing */
.muscle-map-wrapper {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .muscle-map-wrapper {
    max-width: 350px;
  }
}

@media (max-width: 427px) {
  .muscle-map-wrapper {
    max-width: 320px;
  }
}

/* Legend styling */
.muscle-map-legend {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid hsl(var(--border));
}

.legend-cell {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid hsl(var(--border) / 0.3);
}

.legend-cell:hover {
  transform: scale(1.15);
  border-color: hsl(var(--border));
  box-shadow: 0 2px 4px -1px hsl(var(--primary) / 0.15);
}

/* Accessibility - reduced motion */
@media (prefers-reduced-motion: reduce) {
  .muscle-map-entrance {
    animation: none !important;
  }

  .legend-cell {
    transition: opacity 100ms ease;
  }

  .legend-cell:hover {
    transform: none;
    opacity: 0.8;
  }
}
</style>
