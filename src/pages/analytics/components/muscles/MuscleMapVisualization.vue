<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { User } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MuscleAnatomy } from '@/components/ui/muscle-anatomy'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useUserStore } from '@/stores/userStore'
import { useUnits } from '@/composables/useUnits'
import { convertToAnatomicalMuscles, findMaxVolume } from '@/utils/muscleMapUtils'
import { getTooltipColors } from '@/constants/chartTheme'

const { t } = useI18n()
const { formatWeight } = useUnits()

const analyticsStore = useAnalyticsStore()
const workoutStore = useWorkoutStore()
const userStore = useUserStore()
const { muscleDistributionByVolume } = storeToRefs(analyticsStore)

// Tooltip state
const activeMuscle = ref(null)
const showTooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })

// Legend interaction state
const activeLegendLevel = ref(null)
const highlightedMuscles = ref(new Set())

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

// Convert app muscle groups to anatomical muscles with individual styling
const muscleData = computed(() => {
  if (!hasData.value) return {}

  const anatomicalMuscles = convertToAnatomicalMuscles(muscleDistributionByVolume.value)
  const result = {}
  const isFiltering = highlightedMuscles.value.size > 0

  // Build muscle data object: { muscleName: { color, opacity, volume, percentage, appGroup } }
  anatomicalMuscles.forEach((muscle) => {
    const isHighlighted = highlightedMuscles.value.has(muscle.name)

    result[muscle.name] = {
      // If filtering: highlighted muscles keep color, others get default color
      color: isFiltering && !isHighlighted ? defaultMuscleColor.value : primaryHighlightColor,
      // If filtering: highlighted muscles keep opacity, others get full opacity with default color
      opacity: isFiltering && !isHighlighted ? 1 : muscle.opacity,
      volume: muscle.volume,
      percentage: muscle.percentage,
      appGroup: muscle.appGroup, // Store original app group for tooltip
    }
  })

  return result
})

// Theme colors for muscle map
const isDark = computed(() => {
  if (typeof window === 'undefined') return false
  return document.documentElement.classList.contains('dark')
})

const backgroundColor = computed(() => (isDark.value ? '#18181b' : '#d4d4d8')) // zinc-300 for outline visibility on white card
const defaultMuscleColor = computed(() => (isDark.value ? '#27272a' : '#e5e5e5'))

// Primary highlight color - destructive red from project theme (oklch(0.637 0.237 25.331))
// Opacity will be controlled per-muscle based on their training volume
const primaryHighlightColor = '#ef4444' // red-500 (approximates oklch(0.637 0.237 25.331))

// Tooltip colors - theme aware
const tooltipColors = computed(() => getTooltipColors(isDark.value))

/**
 * Get max volume for legend
 */
const maxVolume = computed(() => {
  if (!muscleDistributionByVolume.value.length) return 0
  return findMaxVolume(muscleDistributionByVolume.value)
})

/**
 * Handle muscle hover (desktop)
 */
function handleMuscleHover(event) {
  const target = event.target

  // Try to find muscle ID from target or parent elements
  let muscleId = target.id

  // If target doesn't have ID, check parent <g> element
  if (!muscleId) {
    const parentGroup = target.closest('g[id], path[id]')
    muscleId = parentGroup?.id
  }

  if (!muscleId) {
    return
  }

  // Get muscle data directly by anatomical muscle name (key in muscleData)
  const muscle = muscleData.value[muscleId]

  if (!muscle) {
    return
  }

  activeMuscle.value = {
    name: muscleId,
    appGroup: muscle.appGroup,
    volume: muscle.volume,
    percentage: muscle.percentage,
  }
  showTooltip.value = true

  // Get bounding box from the actual muscle element
  const muscleElement = target.closest('[id]') || target
  const rect = muscleElement.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  }
}

/**
 * Handle muscle leave
 */
function handleMuscleLeave() {
  showTooltip.value = false
  activeMuscle.value = null
}

/**
 * Animate muscle flash on click
 * Simple gentle blink - just opacity fade
 */
function animateMuscleFlash(muscleElement) {
  if (!muscleElement) return

  const originalOpacity = muscleElement.style.opacity || '1'

  // Subtle gentle blink - minimal opacity change for smooth effect
  const frames = [
    { opacity: '1' },
    { opacity: '0.65' },
    { opacity: '1' },
  ]

  const timing = {
    duration: 800, // Longer, smoother animation
    iterations: 1,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Smooth project-standard easing
  }

  // Use Web Animations API for smooth animation
  const animation = muscleElement.animate(frames, timing)

  // Restore original styles after animation
  animation.onfinish = () => {
    muscleElement.style.opacity = originalOpacity
  }
}

/**
 * Handle muscle click (mobile)
 */
function handleMuscleClick(event) {
  const target = event.target

  // Try to find muscle ID from target or parent elements
  let muscleId = target.id
  let muscleElement = target

  if (!muscleId) {
    const parentGroup = target.closest('g[id], path[id]')
    muscleId = parentGroup?.id
    muscleElement = parentGroup
  }

  // If clicked outside a muscle, close tooltip
  if (!muscleId) {
    showTooltip.value = false
    activeMuscle.value = null
    return
  }

  // Get muscle data to check if it's a valid muscle
  const muscle = muscleData.value[muscleId]
  if (!muscle) {
    showTooltip.value = false
    activeMuscle.value = null
    return
  }

  // Find all muscles in the same app group
  const appGroup = muscle.appGroup
  const musclesToHighlight = []

  Object.keys(muscleData.value).forEach((anatomicalMuscleName) => {
    const muscleInfo = muscleData.value[anatomicalMuscleName]
    if (muscleInfo.appGroup === appGroup) {
      musclesToHighlight.push(anatomicalMuscleName)
    }
  })

  // Set highlighted muscles (this will dim all others via muscleData computed)
  highlightedMuscles.value = new Set(musclesToHighlight)

  // Animate highlighted muscles with a slight delay to allow color transition
  setTimeout(() => {
    musclesToHighlight.forEach((anatomicalMuscleName) => {
      const element = document.getElementById(anatomicalMuscleName)
      if (element) {
        animateMuscleFlash(element)
      }
    })
  }, 100)

  // Clear highlight after animation + display time
  setTimeout(() => {
    highlightedMuscles.value = new Set()
  }, 2500) // 2.5s total: 100ms delay + 800ms animation + 1600ms display

  if (activeMuscle.value?.name === muscleId && showTooltip.value) {
    showTooltip.value = false
    activeMuscle.value = null
  } else {
    handleMuscleHover(event)
  }
}

/**
 * Get opacity range for a given legend level
 * @param {number} level - Legend level (0.2, 0.4, 0.6, 0.8, 1.0)
 * @returns {[number, number]} - [min, max] opacity range
 */
function getOpacityRange(level) {
  const ranges = {
    0.2: [0.0, 0.3],
    0.4: [0.3, 0.5],
    0.6: [0.5, 0.7],
    0.8: [0.7, 0.9],
    1.0: [0.9, 1.01], // 1.01 to include 1.0
  }
  return ranges[level] || [0, 1]
}

/**
 * Get all muscles within a specific opacity range
 * @param {number} targetLevel - Legend level to filter by
 * @returns {string[]} - Array of muscle names (anatomical)
 */
function getMusclesInOpacityRange(targetLevel) {
  const [min, max] = getOpacityRange(targetLevel)
  const muscles = []

  Object.keys(muscleData.value).forEach((muscleName) => {
    const muscle = muscleData.value[muscleName]
    if (muscle.opacity >= min && muscle.opacity < max) {
      muscles.push(muscleName)
    }
  })

  return muscles
}

/**
 * Handle legend cell click - highlight all muscles in the opacity range
 * @param {number} level - Legend level clicked (0.2, 0.4, 0.6, 0.8, 1.0)
 */
function handleLegendClick(level) {
  if (!hasData.value) return

  const musclesToHighlight = getMusclesInOpacityRange(level)

  if (musclesToHighlight.length === 0) {
    return
  }

  // Set highlighted muscles (this will dim all others via muscleData computed)
  highlightedMuscles.value = new Set(musclesToHighlight)

  // Animate highlighted muscles with a slight delay to allow color transition
  setTimeout(() => {
    musclesToHighlight.forEach((muscleName) => {
      const element = document.getElementById(muscleName)
      if (element) {
        animateMuscleFlash(element)
      }
    })
  }, 100)

  // Set active legend level for visual feedback
  activeLegendLevel.value = level

  // Clear highlight after animation + display time
  setTimeout(() => {
    highlightedMuscles.value = new Set()
    activeLegendLevel.value = null
  }, 2500) // 2.5s total: 100ms delay + 800ms animation + 1600ms display
}
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
        <div
          class="muscle-map-wrapper mx-auto"
          @mouseenter="handleMuscleHover"
          @mouseleave="handleMuscleLeave"
          @click="handleMuscleClick"
        >
          <MuscleAnatomy
            :gender="userGender"
            view="both"
            :muscle-data="muscleData"
            :default-color="defaultMuscleColor"
            :background-color="backgroundColor"
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
              v-for="level in [0.2, 0.4, 0.6, 0.8, 1.0]"
              :key="level"
              class="legend-cell h-4 flex-1 rounded-sm cursor-pointer"
              :class="{ 'legend-cell-active': activeLegendLevel === level }"
              :style="{ backgroundColor: primaryHighlightColor, opacity: level }"
              :tabindex="hasData ? 0 : -1"
              role="button"
              :aria-label="`${t('analytics.muscles.map.legend.filterByLevel')}: ${(level * 100).toFixed(0)}%`"
              @click="handleLegendClick(level)"
              @keydown.enter="handleLegendClick(level)"
              @keydown.space.prevent="handleLegendClick(level)"
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

        <!-- Tooltip -->
        <Teleport to="body">
          <div
            v-if="showTooltip && activeMuscle"
            class="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
            :style="{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }"
          >
            <!-- Tooltip container with inline styles matching chart tooltips -->
            <div
              data-tooltip-content="true"
              :style="{
                background: tooltipColors.background,
                border: `1px solid ${tooltipColors.border}`,
                borderRadius: '8px',
                padding: '12px',
                color: tooltipColors.text,
                fontSize: '14px',
                boxShadow: isDark
                  ? '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.3)'
                  : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                margin: '0',
              }"
            >
              <!-- Muscle name header -->
              <div
                :style="{
                  fontWeight: '500',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${tooltipColors.border}`,
                }"
              >
                {{ t(`common.muscles.${activeMuscle.appGroup}`) }}
              </div>

              <!-- Tooltip rows -->
              <div :style="{ display: 'flex', flexDirection: 'column', gap: '6px' }">
                <!-- Volume row -->
                <div :style="{ display: 'flex', alignItems: 'center', gap: '8px' }">
                  <div
                    :style="{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: primaryHighlightColor,
                    }"
                  />
                  <span :style="{ color: tooltipColors.muted, flex: '1' }">
                    {{ t('common.volume') }}:
                  </span>
                  <span :style="{ fontWeight: '600' }">
                    {{ formatWeight(activeMuscle.volume, { precision: 0 }) }}
                  </span>
                </div>

                <!-- Percentage row -->
                <div :style="{ display: 'flex', alignItems: 'center', gap: '8px' }">
                  <div
                    :style="{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: primaryHighlightColor,
                      opacity: '0.6',
                    }"
                  />
                  <span :style="{ color: tooltipColors.muted, flex: '1' }">
                    {{ t('analytics.muscles.percentage') }}:
                  </span>
                  <span :style="{ fontWeight: '600' }">
                    {{ activeMuscle.percentage.toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Teleport>
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

/* Make SVG muscles interactive */
.muscle-map-wrapper :deep(svg) {
  pointer-events: bounding-box;
}

.muscle-map-wrapper :deep(svg path[id]),
.muscle-map-wrapper :deep(svg g[id] path) {
  cursor: pointer;
  transition:
    opacity 150ms ease,
    fill 300ms ease;
  pointer-events: auto;
}

.muscle-map-wrapper :deep(svg path[id]:hover),
.muscle-map-wrapper :deep(svg g[id] path:hover) {
  opacity: 0.85;
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
  cursor: pointer;
}

.legend-cell:hover,
.legend-cell:focus-visible {
  transform: scale(1.15);
  border-color: hsl(var(--border));
  box-shadow: 0 2px 4px -1px hsl(var(--primary) / 0.15);
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Active legend cell during animation */
.legend-cell-active {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3);
}

/* Accessibility - reduced motion */
@media (prefers-reduced-motion: reduce) {
  .muscle-map-entrance {
    animation: none !important;
  }

  .legend-cell {
    transition: opacity 100ms ease;
  }

  .legend-cell:hover,
  .legend-cell:focus-visible {
    transform: none;
    opacity: 0.8;
  }

  .legend-cell-active {
    animation: none;
  }

  .muscle-map-wrapper :deep(svg path[id]),
  .muscle-map-wrapper :deep(svg g[id] path) {
    transition: none;
  }
}
</style>
