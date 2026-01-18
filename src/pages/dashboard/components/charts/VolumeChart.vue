<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import { VisArea, VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import { Maximize2 } from 'lucide-vue-next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartCrosshair,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useFullscreenChart } from '@/composables/useFullscreenChart'
import { useUnits } from '@/composables/useUnits'
import FullscreenChartOverlay from '@/components/charts/FullscreenChartOverlay.vue'
import { CONFIG } from '@/constants/config'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()
const { volumeByDay, periodLabel, period } = storeToRefs(analyticsStore)
const { formatWeight } = useUnits()

// Mobile detection
const isMobile = useMediaQuery('(max-width: 640px)')

// Full-screen functionality
const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

// Ref for scroll container
const chartScrollRef = ref(null)

// Chart data from analytics store
const chartData = computed(() => {
  // Use analyticsStore.volumeByDay which already handles date filtering and volume calculation
  return volumeByDay.value.map(dataPoint => {
    return {
      date: new Date(dataPoint.date),
      volume: dataPoint.volume,
      exercises: dataPoint.exercises, // Number of exercises
    }
  })
})

const chartConfig = {
  volume: {
    label: t('dashboard.volumeChart.volume'),
    color: 'var(--chart-1)', // Primary color
  },
  exercises: {
    label: t('dashboard.volumeChart.exercises'),
    color: 'var(--chart-2)', // Secondary color for reference
  },
}

const svgDefs = `
  <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-volume)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-volume)" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="fillExercises" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-exercises)" stop-opacity="0.6" />
    <stop offset="95%" stop-color="var(--color-exercises)" stop-opacity="0.05" />
  </linearGradient>
`

// Y domain - dynamic based on max volume (primary Y-axis)
const yDomain = computed(() => {
  const maxVolume = Math.max(...chartData.value.map(d => d.volume), 100)
  return [0, maxVolume * 1.1]
})

// Max values for scaling exercises to volume range
const maxExercises = computed(() =>
  Math.max(...chartData.value.map(d => d.exercises || 0), 1)
)

const maxVolume = computed(() =>
  Math.max(...chartData.value.map(d => d.volume), 100)
)

// Scale exercises to volume range for visualization (30% of volume scale)
const scaleExercisesToVolume = computed(() => (exerciseValue) => {
  return (exerciseValue / maxExercises.value) * maxVolume.value * 0.3
})

// Convert scaled value back to actual exercise count for axis labels
const formatExerciseAxisValue = computed(() => (value) => {
  const actualValue = (value / (maxVolume.value * 0.3)) * maxExercises.value
  return Math.round(actualValue).toString()
})

/**
 * Dynamic chart width calculation for mobile scroll
 * - On desktop: natural full width
 * - On mobile: ensure minimum spacing between data points
 * - For small data sets (< 5 points): let chart fit naturally
 * - For large data sets (90+ points): reduce spacing to keep reasonable width
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
        <CardTitle>{{ t('dashboard.volumeChart.title') }}</CardTitle>
        <CardDescription>
          {{ t('dashboard.volumeChart.subtitlePeriod', { period: t(periodLabel) }) }}
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
      <ChartContainer :config="chartConfig" class="w-full" :cursor="false">
        <!-- Scroll wrapper for mobile -->
        <div
          ref="chartScrollRef"
          class="chart-scroll-wrapper"
          :class="{ 'mobile-scroll': isMobile && chartMinWidth !== 'auto' }"
        >
          <!-- Chart visualization with fixed height -->
          <div
            class="aspect-auto h-[300px] w-full"
            :style="{ minWidth: chartMinWidth }"
          >
            <VisXYContainer
              :key="`volume-chart-${period}`"
              :data="chartData"
              :svg-defs="svgDefs"
              :margin="{ top: 10, left: 0, right: 40, bottom: 60 }"
              :y-domain="yDomain"
            >
            <!-- Volume Area Chart (Primary Y-axis) -->
            <VisArea
              :x="(d) => d.date"
              :y="(d) => d.volume"
              :color="'url(#fillVolume)'"
              :opacity="0.6"
            />
            <VisLine
              :x="(d) => d.date"
              :y="(d) => d.volume"
              :color="chartConfig.volume.color"
              :line-width="2"
            />

            <!-- Exercise Count Line (Secondary Y-axis) -->
            <!-- Note: We'll scale exercises to fit the volume range visually -->
            <VisLine
              :x="(d) => d.date"
              :y="(d) => scaleExercisesToVolume(d.exercises)"
              :color="chartConfig.exercises.color"
              :line-width="2"
              :opacity="0.8"
            />

            <!-- X-Axis -->
            <VisAxis
              type="x"
              :x="(d) => d.date"
              :tick-line="false"
              :domain-line="false"
              :grid-line="false"
              :num-ticks="6"
              :tick-format="(d) => {
                const date = new Date(d)
                return date.toLocaleDateString('uk-UA', {
                  month: 'short',
                  day: 'numeric',
                })
              }"
            />

            <!-- Primary Y-Axis (Volume) - Left -->
            <VisAxis
              type="y"
              :num-ticks="3"
              :tick-line="false"
              :domain-line="false"
              :grid-line="true"
              :tick-format="(value) => formatWeight(value, { precision: 0, showUnit: false, compact: 'auto' })"
            />

            <!-- Secondary Y-Axis (Exercises) - Right -->
            <VisAxis
              type="y"
              position="right"
              :num-ticks="3"
              :tick-line="false"
              :domain-line="false"
              :grid-line="false"
              :tick-format="formatExerciseAxisValue"
            />

            <ChartTooltip />
            <ChartCrosshair
              :template="componentToString(chartConfig, ChartTooltipContent, {
                indicator: 'line',
                labelFormatter: (d) => {
                  return new Date(d).toLocaleDateString('uk-UA', {
                    month: 'short',
                    day: 'numeric',
                  })
                },
                valueFormatter: (value, key) => {
                  if (typeof value !== 'number') return String(value)

                  // Use formatWeight for volume with full precision (no compact)
                  if (key === 'volume') {
                    return formatWeight(value, { precision: 0, compact: false })
                  }

                  // Format other values (exercises) normally
                  return value.toLocaleString('uk-UA', { maximumFractionDigits: 0 })
                },
              })"
              :color="(_d, i) => {
                // Explicitly map series index to chart config colors
                // CRITICAL: VisArea takes index 0, so VisLine components start at index 1
                // Index 0 = VisArea (volume) - not shown in crosshair
                // Index 1 = VisLine (volume) → should be blue (chart-1)
                // Index 2 = VisLine (exercises) → should be green (chart-2)
                const colorMap = [
                  null, // Index 0: VisArea (not used for crosshair)
                  chartConfig.volume.color, // Index 1: volume line
                  chartConfig.exercises.color, // Index 2: exercises line
                ]
                return colorMap[i] || 'currentColor'
              }"
            />
          </VisXYContainer>
          </div>

          <!-- Gradient overlay for scroll indicator (mobile only) -->
          <div
            v-if="isMobile && chartMinWidth !== 'auto'"
            class="scroll-gradient"
          />
        </div>

        <!-- Legend positioned after chart, inside ChartContainer so it can access injected config -->
        <ChartLegendContent class="mt-4 justify-center" />
      </ChartContainer>
    </CardContent>

    <!-- Full-screen overlay -->
    <FullscreenChartOverlay
      :is-open="isFullscreen"
      :title="t('dashboard.volumeChart.title')"
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
              :key="`volume-chart-${period}`"
              :data="chartData"
              :svg-defs="svgDefs"
              :margin="{ top: 10, left: 0, right: 40, bottom: 60 }"
              :y-domain="yDomain"
            >
              <!-- Volume Area Chart (Primary Y-axis) -->
              <VisArea
                :x="(d) => d.date"
                :y="(d) => d.volume"
                :color="'url(#fillVolume)'"
                :opacity="0.6"
              />
              <VisLine
                :x="(d) => d.date"
                :y="(d) => d.volume"
                :color="chartConfig.volume.color"
                :line-width="2"
              />

              <!-- Exercise Count Line (Secondary Y-axis) -->
              <VisLine
                :x="(d) => d.date"
                :y="(d) => scaleExercisesToVolume(d.exercises)"
                :color="chartConfig.exercises.color"
                :line-width="2"
                :opacity="0.8"
              />

              <!-- X-Axis -->
              <VisAxis
                type="x"
                :x="(d) => d.date"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :num-ticks="6"
                :tick-format="(d) => {
                  const date = new Date(d)
                  return date.toLocaleDateString('uk-UA', {
                    month: 'short',
                    day: 'numeric',
                  })
                }"
              />

              <!-- Primary Y-Axis (Volume) - Left -->
              <VisAxis
                type="y"
                :num-ticks="3"
                :tick-line="false"
                :domain-line="false"
                :grid-line="true"
                :tick-format="(value) => formatWeight(value, { precision: 0, showUnit: false, compact: 'auto' })"
              />

              <!-- Secondary Y-Axis (Exercises) - Right -->
              <VisAxis
                type="y"
                position="right"
                :num-ticks="3"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :tick-format="formatExerciseAxisValue"
              />

              <ChartTooltip />
              <ChartCrosshair
                :template="componentToString(chartConfig, ChartTooltipContent, {
                  indicator: 'line',
                  labelFormatter: (d) => {
                    return new Date(d).toLocaleDateString('uk-UA', {
                      month: 'short',
                      day: 'numeric',
                    })
                  },
                  valueFormatter: (value, key) => {
                    if (typeof value !== 'number') return String(value)

                    // Use formatWeight for volume with full precision (no compact)
                    if (key === 'volume') {
                      return formatWeight(value, { precision: 0, compact: false })
                    }

                    // Format other values (exercises) normally
                    return value.toLocaleString('uk-UA', { maximumFractionDigits: 0 })
                  },
                })"
                :color="(_d, i) => {
                  // Explicitly map series index to chart config colors
                  const colorMap = [
                    null, // Index 0: VisArea (not used for crosshair)
                    chartConfig.volume.color, // Index 1: volume line
                    chartConfig.exercises.color, // Index 2: exercises line
                  ]
                  return colorMap[i] || 'currentColor'
                }"
              />
            </VisXYContainer>
          </div>

          <!-- Gradient overlay for scroll indicator (mobile only) -->
          <div
            v-if="isMobile && chartMinWidth !== 'auto'"
            class="scroll-gradient"
          />
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

/* Gradient overlay to indicate scrollability */
.scroll-gradient {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(
    to left,
    hsl(var(--background)) 0%,
    transparent 100%
  );
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
