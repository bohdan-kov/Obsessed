<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import { CurveType } from '@unovis/ts'
import { VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import { Maximize2 } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useUnits } from '@/composables/useUnits'
import { useLocale } from '@/composables/useLocale'
import { useFullscreenChart } from '@/composables/useFullscreenChart'
import FullscreenChartOverlay from '@/components/charts/FullscreenChartOverlay.vue'
import { MUSCLE_COLORS } from '@/utils/chartUtils'
import { CONFIG } from '@/constants/config'
import { formatDateShort } from '@/utils/dateUtils'

const { t } = useI18n()
const { formatWeight } = useUnits()
const { currentLocale } = useLocale()

const analyticsStore = useAnalyticsStore()
const { muscleVolumeByDay, loading, period, currentRange } = storeToRefs(analyticsStore)

// Mobile detection for responsive behavior
const isMobile = useMediaQuery('(max-width: 768px)')

// Full-screen functionality
const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

// Ref for scroll container
const chartScrollRef = ref(null)

// All muscle groups
const MUSCLES = ['back', 'chest', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'calves']

// Visible muscles state (initially 3 main muscle groups)
const visibleMuscles = ref(new Set(['back', 'chest', 'legs']))

/**
 * Array of currently visible muscles
 * Used for v-for rendering and series index mapping
 */
const visibleMusclesArray = computed(() => Array.from(visibleMuscles.value))

/**
 * Chart configuration for all 8 muscle groups
 * Uses computed to ensure reactivity with locale changes
 */
const chartConfig = computed(() => {
  const config = {}
  MUSCLES.forEach((muscle) => {
    config[muscle] = {
      label: t(`common.muscleGroups.${muscle}`),
      color: MUSCLE_COLORS[muscle],
    }
  })
  return config
})

/**
 * Chart config filtered to only visible muscles
 * This ensures tooltip only shows active muscle groups
 */
const visibleChartConfig = computed(() => {
  const config = {}
  visibleMusclesArray.value.forEach((muscle) => {
    config[muscle] = chartConfig.value[muscle]
  })
  return config
})

/**
 * Chart data - muscleVolumeByDay in daily format
 * Format: [{ date: '2024-11-24', back: 1200, chest: 900, ... }, ...]
 * CRITICAL: Explicitly depends on period to ensure reactivity
 */
const chartData = computed(() => {
  if (!muscleVolumeByDay.value?.length) return []
  return muscleVolumeByDay.value
})

/**
 * DISABLED: Grouping logic removed to show individual dates on X-axis
 * Previous implementation grouped consecutive days with identical values into ranges,
 * but this caused confusion when periods had many zero-value days (no workouts).
 * Users expect to see individual dates on the muscle volume chart.
 */
// const dateGroupMap = computed(() => {
//   const result = groupConsecutiveIdenticalPoints(chartData.value, MUSCLES)
//   ...
// })

/**
 * DISABLED: No longer needed since grouping is disabled
 */
// const shownRangeLabels = ref(new Set())


/**
 * Y-axis domain - dynamic based on max muscle value
 * Only considers visible muscles for proper scaling
 */
const yDomain = computed(() => {
  if (!chartData.value.length) return [0, 100]

  let max = 0
  chartData.value.forEach((week) => {
    MUSCLES.forEach((muscle) => {
      // Only consider visible muscles for scaling
      if (visibleMuscles.value.has(muscle) && week[muscle] > max) {
        max = week[muscle]
      }
    })
  })

  // Add 10% padding to the top
  return [0, max * 1.1 || 100]
})

/**
 * Dynamic chart width calculation for mobile scroll
 * - On desktop: natural full width
 * - On mobile: ensure minimum spacing between data points
 */
const chartMinWidth = computed(() => {
  if (!isMobile.value) return 'auto'

  const dataPointCount = chartData.value.length

  // Small data sets - no scroll needed
  if (dataPointCount <= 5) return 'auto'

  // Calculate minimum width based on spacing
  const minSpacing = CONFIG.analytics.CHART_MIN_POINT_SPACING

  // For very large data sets, reduce spacing to avoid excessive width
  const spacing = dataPointCount > 90 ? minSpacing * 0.7 : minSpacing

  return `${dataPointCount * spacing}px`
})

/**
 * Format date label for X-axis
 * Shows individual dates in short format (e.g., "4 груд." or "4 Dec")
 */
function formatDateLabel(index) {
  const roundedIndex = Math.round(index)
  const dataPoint = chartData.value[roundedIndex]
  if (!dataPoint?.date) return ''

  // Use standard short date format for all points
  return formatDateShort(dataPoint.date, currentLocale.value)
}

/**
 * Format weight value for Y-axis
 */
function formatYAxisValue(value) {
  if (typeof value !== 'number') return String(value)

  return formatWeight(value, { precision: 0, showUnit: false, compact: 'auto' })
}

/**
 * Format weight value for tooltip with unit
 */
function formatTooltipValue(value, key) {
  if (typeof value !== 'number') return String(value)

  // Only format if the key is a muscle group (skip 'week' key)
  if (MUSCLES.includes(key)) {
    return formatWeight(value, { precision: 0, compact: false })
  }

  return String(value)
}

/**
 * Toggle muscle visibility
 * Minimum 1 muscle must remain visible
 */
function toggleMuscle(muscle) {
  if (visibleMuscles.value.has(muscle)) {
    // Don't allow disabling the last muscle
    if (visibleMuscles.value.size > 1) {
      visibleMuscles.value.delete(muscle)
      visibleMuscles.value = new Set(visibleMuscles.value) // Trigger reactivity
    }
  } else {
    visibleMuscles.value.add(muscle)
    visibleMuscles.value = new Set(visibleMuscles.value) // Trigger reactivity
  }
}

/**
 * Auto-scroll to the latest data (rightmost point) on mount
 */
onMounted(async () => {
  if (isMobile.value && chartScrollRef.value) {
    // Wait for DOM to settle and chart to render
    await nextTick()

    // Small delay to ensure chart SVG is fully rendered
    setTimeout(() => {
      if (chartScrollRef.value) {
        chartScrollRef.value.scrollLeft = chartScrollRef.value.scrollWidth
      }
    }, 100)
  }
})
</script>

<template>
  <Card class="pt-0">
    <CardHeader class="flex flex-row items-center gap-2 space-y-0 border-b py-5">
      <div class="grid flex-1 gap-1">
        <CardTitle>{{ t('analytics.muscles.volumeOverTime.title') }}</CardTitle>
        <CardDescription>
          {{ t('analytics.muscles.volumeOverTime.description') }}
        </CardDescription>
      </div>

      <!-- Full-screen button (mobile only, hidden when no data) -->
      <button
        v-if="isMobile && !isFullscreen && chartData.length > 0"
        type="button"
        @click="enterFullscreen"
        class="inline-flex items-center justify-center w-11 h-11 rounded-md hover:bg-muted transition-colors touch-manipulation shrink-0"
        :aria-label="t('charts.fullscreen.open')"
      >
        <Maximize2 class="w-5 h-5" />
      </button>
    </CardHeader>

    <!-- Normal view -->
    <CardContent v-if="!isFullscreen" class="px-2 pt-4 sm:px-6 sm:pt-6 pb-6">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center h-[400px]">
        <div class="text-muted-foreground">{{ t('common.loading') }}</div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!chartData.length"
        class="flex flex-col items-center justify-center h-[400px]"
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
          {{ t('analytics.muscles.volumeOverTime.emptyState') }}
        </p>
      </div>

      <!-- Chart -->
      <ChartContainer v-else :config="chartConfig" class="w-full" :cursor="false">
        <!-- Scroll wrapper for mobile -->
        <div
          ref="chartScrollRef"
          class="chart-scroll-wrapper"
          :class="{ 'mobile-scroll': isMobile && chartMinWidth !== 'auto' }"
        >
          <!-- Chart visualization with fixed height -->
          <div class="aspect-auto h-[400px] w-full" :style="{ minWidth: chartMinWidth }">
            <!--
              CRITICAL FIX: :key forces VisXYContainer to re-mount when period or data changes
              Bug: Unovis chart library doesn't always react to :data prop changes
              Solution: Use :key with period value + currentRange dates to ensure uniqueness
              This ensures chart updates when user changes period (7/30/90 days/all time)
              Including period directly guarantees the key changes even if date ranges have timing overlaps
            -->
            <VisXYContainer
              :key="`chart-${period}-${currentRange.start?.getTime()}-${currentRange.end?.getTime()}`"
              :data="chartData"
              :margin="{ top: 10, left: 0, right: 40, bottom: 60 }"
              :y-domain="yDomain"
            >
              <!-- Lines for each muscle group (only visible ones) -->
              <VisLine
                v-for="muscle in visibleMusclesArray"
                :key="muscle"
                :x="(_d, i) => i"
                :y="(d) => d[muscle]"
                :color="MUSCLE_COLORS[muscle]"
                :line-width="3"
                :curve-type="CurveType.MonotoneX"
              />

              <!-- X-Axis (Dates) with daily labels -->
              <VisAxis
                type="x"
                :x="(_d, i) => i"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :num-ticks="6"
                :tick-format="formatDateLabel"
              />

              <!-- Y-Axis (Volume) -->
              <VisAxis
                type="y"
                :num-ticks="3"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :tick-format="formatYAxisValue"
              />

              <!-- Tooltip -->
              <ChartTooltip />

              <!-- Crosshair with formatted tooltip -->
              <!--
                CRITICAL: :key forces ChartCrosshair to re-render when visible muscles change
                Bug fix: componentToString caches the template, so without :key, toggling muscles
                updates the chart lines but NOT the tooltip content. The key ensures the component
                re-mounts and regenerates the template with updated visibleChartConfig.
              -->
              <ChartCrosshair
                :key="visibleMusclesArray.join(',')"
                :template="
                  componentToString(visibleChartConfig, ChartTooltipContent, {
                    indicator: 'line',
                    labelFormatter: (dateValue) => dateValue ? formatDateShort(dateValue, currentLocale) : '',
                    valueFormatter: formatTooltipValue,
                  })
                "
                :color="
                  (_d, i) => {
                    // Map series index to visible muscle colors
                    // Series indices correspond to visibleMusclesArray order
                    return visibleMusclesArray[i] ? MUSCLE_COLORS[visibleMusclesArray[i]] : 'currentColor'
                  }
                "
              />
            </VisXYContainer>
          </div>

          <!-- Gradient overlay for scroll indicator (mobile only) -->
          <div v-if="isMobile && chartMinWidth !== 'auto'" class="scroll-gradient" />
        </div>

        <!-- Custom interactive legend -->
        <div class="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            v-for="muscle in MUSCLES"
            :key="muscle"
            type="button"
            @click="toggleMuscle(muscle)"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
            :class="
              visibleMuscles.has(muscle)
                ? 'bg-muted/50 hover:bg-muted'
                : 'bg-background border border-border opacity-50 hover:opacity-75'
            "
            :aria-pressed="visibleMuscles.has(muscle)"
            :aria-label="`Toggle ${t(`common.muscleGroups.${muscle}`)}`"
          >
            <span
              class="inline-block w-3 h-3 rounded-sm shrink-0"
              :style="{ backgroundColor: MUSCLE_COLORS[muscle] }"
              aria-hidden="true"
            />
            <span>{{ t(`common.muscleGroups.${muscle}`) }}</span>
          </button>
        </div>
      </ChartContainer>
    </CardContent>

    <!-- Full-screen overlay -->
    <FullscreenChartOverlay
      :is-open="isFullscreen"
      :title="t('analytics.muscles.volumeOverTime.title')"
      @close="exitFullscreen"
    >
      <ChartContainer :config="chartConfig" class="w-full h-full" :cursor="false">
        <!-- Scroll wrapper for mobile -->
        <div
          ref="chartScrollRef"
          class="chart-scroll-wrapper h-full"
          :class="{ 'mobile-scroll': isMobile && chartMinWidth !== 'auto' }"
        >
          <!-- Chart visualization with optimized height for landscape -->
          <div class="h-full w-full" :style="{ minWidth: chartMinWidth }">
            <VisXYContainer
              :key="`chart-${period}-${currentRange.start?.getTime()}-${currentRange.end?.getTime()}`"
              :data="chartData"
              :margin="{ top: 10, left: 0, right: 40, bottom: 60 }"
              :y-domain="yDomain"
            >
              <!-- Lines for each muscle group (only visible ones) -->
              <VisLine
                v-for="muscle in visibleMusclesArray"
                :key="muscle"
                :x="(_d, i) => i"
                :y="(d) => d[muscle]"
                :color="MUSCLE_COLORS[muscle]"
                :line-width="3"
                :curve-type="CurveType.MonotoneX"
              />

              <!-- X-Axis (Dates) with daily labels -->
              <VisAxis
                type="x"
                :x="(_d, i) => i"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :num-ticks="6"
                :tick-format="formatDateLabel"
              />

              <!-- Y-Axis (Volume) -->
              <VisAxis
                type="y"
                :num-ticks="3"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :tick-format="formatYAxisValue"
              />

              <!-- Tooltip -->
              <ChartTooltip />

              <!-- Crosshair with formatted tooltip -->
              <ChartCrosshair
                :key="visibleMusclesArray.join(',')"
                :template="
                  componentToString(visibleChartConfig, ChartTooltipContent, {
                    indicator: 'line',
                    labelFormatter: (dateValue) => dateValue ? formatDateShort(dateValue, currentLocale) : '',
                    valueFormatter: formatTooltipValue,
                  })
                "
                :color="
                  (_d, i) => {
                    // Map series index to visible muscle colors
                    return visibleMusclesArray[i] ? MUSCLE_COLORS[visibleMusclesArray[i]] : 'currentColor'
                  }
                "
              />
            </VisXYContainer>
          </div>

          <!-- Gradient overlay for scroll indicator (mobile only) -->
          <div v-if="isMobile && chartMinWidth !== 'auto'" class="scroll-gradient" />
        </div>
      </ChartContainer>
    </FullscreenChartOverlay>
  </Card>
</template>

<style scoped>
/* Chart scroll wrapper */
.chart-scroll-wrapper {
  position: relative;
  width: 100%;
}

/* Mobile scroll mode */
.chart-scroll-wrapper.mobile-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* Smooth touch scrolling on iOS/Android */
  -webkit-overflow-scrolling: touch;
  /* Allow horizontal pan without interfering with tooltips/crosshair */
  touch-action: pan-x;
}

.chart-scroll-wrapper.mobile-scroll::-webkit-scrollbar {
  display: none;
}

/* Gradient overlay to indicate that content is scrollable */
.scroll-gradient {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(to left, hsl(var(--background)) 0%, transparent 100%);
  pointer-events: none;
  z-index: 10;
}

/* Ensure gradient doesn't show on desktop */
@media (min-width: 640px) {
  .scroll-gradient {
    display: none;
  }
}
</style>
