<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { VisXYContainer, VisScatter, VisAxis, VisLine } from '@unovis/vue'
import { Scatter } from '@unovis/ts'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useUnits } from '@/composables/useUnits'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import BaseChart from '@/pages/analytics/components/shared/BaseChart.vue'
import { formatDateShort } from '@/utils/dateUtils'

const { t, locale } = useI18n()
const { formatWeight } = useUnits()
const router = useRouter()

const analyticsStore = useAnalyticsStore()
const { durationTrendData, durationStats, loading } = storeToRefs(analyticsStore)

// Transform data for Unovis
const chartData = computed(() => {
  if (!durationTrendData.value?.length) return []

  const maxVolume = Math.max(...durationTrendData.value.map((d) => d.volume))
  const dataCount = durationTrendData.value.length

  // Dynamic size scaling: automatically reduce point size when there are many data points
  // This prevents overcrowding and overlap in charts with dense data
  // Scale factor ranges from 1.0 (few points, max size) to 0.375 (many points, min size)
  const scaleFactor = Math.max(0.375, 1 - (dataCount / 120))

  // Base sizes (when there are few data points)
  const baseMinSize = 16
  const baseMaxSize = 32

  // Apply scaling to size range
  const minSize = baseMinSize * scaleFactor
  const maxSize = baseMaxSize * scaleFactor

  const baseData = durationTrendData.value.map((point, index) => {
    // Size based on volume, with dynamic range that scales down with more data points
    // Examples:
    // - 10 workouts: 16-32px (scale: 0.92)
    // - 30 workouts: 12-24px (scale: 0.75)
    // - 60 workouts: 8-16px (scale: 0.50)
    // - 120+ workouts: 6-12px (scale: 0.375)
    const volumeRatio = point.volume / (maxVolume || 1)
    const size = minSize + volumeRatio * (maxSize - minSize)

    // Color based on volume quartile
    let volumeLevel = 'low'
    if (volumeRatio > 0.75) volumeLevel = 'high'
    else if (volumeRatio > 0.5) volumeLevel = 'medium'

    return {
      index,
      duration: point.duration,
      volume: point.volume,
      exerciseCount: point.exerciseCount,
      date: point.date,
      dateLabel: formatDateShort(point.date, locale.value),
      id: point.id,
      size,
      volumeLevel,
    }
  })

  // Calculate linear regression and add trendDuration to each point
  if (baseData.length >= 2) {
    const n = baseData.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0

    baseData.forEach((point, index) => {
      sumX += index
      sumY += point.duration
      sumXY += index * point.duration
      sumX2 += index * index
    })

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Add trendDuration to each data point
    baseData.forEach((point, index) => {
      point.trendDuration = slope * index + intercept
    })
  }

  return baseData
})

// Chart configuration for shadcn tooltips
const chartConfig = {
  duration: {
    label: t('common.duration'),
    color: 'var(--chart-1)',
  },
  volume: {
    label: t('common.volume'),
    color: 'var(--chart-2)',
  },
  exerciseCount: {
    label: t('common.exercises'),
    color: 'var(--chart-3)',
  },
}

// Color mapping for scatter points based on volume level
const getPointColor = (datum) => {
  const colors = {
    low: '#06b6d4', // cyan
    medium: '#f59e0b', // amber
    high: '#10b981', // green
  }
  return colors[datum.volumeLevel] || colors.low
}

// Y domain with some padding
const yDomain = computed(() => {
  if (!chartData.value.length) return [0, 100]
  const maxDuration = Math.max(...chartData.value.map((d) => d.duration), 100)
  return [0, maxDuration * 1.15]
})

// Tooltip formatters
const labelFormatter = (value) => {
  // componentToString passes datum.date (the actual date value), not the index
  if (!value) return ''

  const date = new Date(value)

  // Format: "Пт, 12 груд." or "Fri, Dec 12"
  return date.toLocaleDateString(locale.value, {
    weekday: 'short', // Пт or Fri
    day: 'numeric', // 12
    month: 'short', // груд. or Dec
  })
}

const valueFormatter = (value, key) => {
  if (key === 'duration') {
    const formatted = Math.round(value).toLocaleString(locale.value)
    return `${formatted} ${t('common.units.minutes')}`
  } else if (key === 'volume') {
    return formatWeight(value, { precision: 0 })
  } else if (key === 'exerciseCount') {
    return value.toString()
  }
  return String(value)
}

// Navigate to workout detail
// Unovis click events provide (datum, index, event) parameters
function handlePointClick(datum, index, event) {
  if (!datum?.id) {
    if (import.meta.env.DEV) {
      console.warn('[DurationTrendChart] No workout ID found in data point')
    }
    return
  }

  router.push({
    name: 'WorkoutDetail',
    params: { id: datum.id },
    query: {
      from: 'analytics',
      tab: 'duration'  // Include tab to preserve context when navigating back
    },
  })
}

// Configure Unovis scatter events
const scatterEvents = {
  [Scatter.selectors.point]: {
    click: handlePointClick,
  },
}

// Format trend direction
const trendLabel = computed(() => {
  if (!durationStats.value?.trend) return ''

  const { direction, value } = durationStats.value.trend

  if (direction === 'increasing') {
    return t('analytics.duration.trendChart.trendIncreasing', { value })
  } else if (direction === 'decreasing') {
    return t('analytics.duration.trendChart.trendDecreasing', { value })
  } else {
    return t('analytics.duration.trendChart.trendStable')
  }
})
</script>

<template>
  <BaseChart
    data-testid="duration-trend-chart"
    :title="t('analytics.duration.trendChart.title')"
    :description="t('analytics.duration.trendChart.description')"
    :data="durationTrendData"
    :loading="loading"
    empty-icon="clock"
    height="500px"
  >
    <template #header>
      <!-- Stats Panel -->
      <div v-if="durationStats" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
        <!-- Average -->
        <div class="rounded-lg border bg-card p-3">
          <div class="text-xs text-muted-foreground">
            {{ t('analytics.duration.trendChart.stats.average') }}
          </div>
          <div class="text-lg font-semibold mt-1">
            {{ durationStats.average }}
            <span class="text-xs font-normal text-muted-foreground">
              {{ t('common.minutes') }}
            </span>
          </div>
        </div>

        <!-- Shortest -->
        <div class="rounded-lg border bg-card p-3">
          <div class="text-xs text-muted-foreground">
            {{ t('analytics.duration.trendChart.stats.shortest') }}
          </div>
          <div class="text-lg font-semibold mt-1">
            {{ durationStats.shortest.value }}
            <span class="text-xs font-normal text-muted-foreground">
              {{ t('common.minutes') }}
            </span>
          </div>
          <div class="text-xs text-muted-foreground mt-0.5">
            {{ formatDateShort(durationStats.shortest.date, locale) }}
          </div>
        </div>

        <!-- Longest -->
        <div class="rounded-lg border bg-card p-3">
          <div class="text-xs text-muted-foreground">
            {{ t('analytics.duration.trendChart.stats.longest') }}
          </div>
          <div class="text-lg font-semibold mt-1">
            {{ durationStats.longest.value }}
            <span class="text-xs font-normal text-muted-foreground">
              {{ t('common.minutes') }}
            </span>
          </div>
          <div class="text-xs text-muted-foreground mt-0.5">
            {{ formatDateShort(durationStats.longest.date, locale) }}
          </div>
        </div>

        <!-- Trend -->
        <div class="rounded-lg border bg-card p-3">
          <div class="text-xs text-muted-foreground">
            {{ t('analytics.duration.trendChart.stats.trend') }}
          </div>
          <div
            class="text-sm font-medium mt-1"
            :class="{
              'text-green-500': durationStats.trend.direction === 'decreasing',
              'text-red-500': durationStats.trend.direction === 'increasing',
              'text-muted-foreground': durationStats.trend.direction === 'stable',
            }"
          >
            {{ trendLabel }}
          </div>
        </div>
      </div>
    </template>

    <template #default>
      <ChartContainer :config="chartConfig" class="w-full">
        <div class="aspect-auto h-[350px] w-full overflow-x-auto">
          <div class="min-w-[600px] h-full">
            <VisXYContainer
              :data="chartData"
              :margin="{ left: 60, right: 20, top: 20, bottom: 60 }"
              :y-domain="yDomain"
            >
              <!-- Trend line (rendered first so it appears behind points) -->
              <!-- VisLine uses the container's data, no separate :data prop needed -->
              <VisLine
                v-if="chartData.length >= 2"
                :x="(d) => d.index"
                :y="(d) => d.trendDuration"
                color="#64748b"
                :line-width="2"
              />

              <!-- Scatter plot -->
              <VisScatter
                :x="(d) => d.index"
                :y="(d) => d.duration"
                :size="(d) => d.size"
                :color="getPointColor"
                :cursor="'pointer'"
                :events="scatterEvents"
              />

              <!-- X-Axis -->
              <VisAxis
                type="x"
                :x="(d) => d.index"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :num-ticks="6"
                :tick-format="(index) => {
                  const dataPoint = chartData[Math.round(index)]
                  return dataPoint?.dateLabel || ''
                }"
              />

              <!-- Y-Axis -->
              <VisAxis
                type="y"
                :num-ticks="5"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :tick-format="(value) => Math.round(value).toString()"
              />

              <!-- Tooltip -->
              <ChartTooltip />
              <ChartCrosshair
                :color="(d) => getPointColor(d)"
                :template="componentToString(chartConfig, ChartTooltipContent, {
                  labelFormatter: labelFormatter,
                  valueFormatter: valueFormatter,
                })"
              />
            </VisXYContainer>
          </div>
        </div>
      </ChartContainer>

      <!-- Legend -->
      <div class="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-[#06b6d4]" />
          <span>{{ t('analytics.duration.trendChart.volumeLow') }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-[#f59e0b]" />
          <span>{{ t('analytics.duration.trendChart.volumeMedium') }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-[#10b981]" />
          <span>{{ t('analytics.duration.trendChart.volumeHigh') }}</span>
        </div>
      </div>
    </template>
  </BaseChart>
</template>

<style scoped>
/* Style the trend line with dashed stroke for better visual distinction */
/* Use multiple selectors to ensure the style is applied */
:deep(.vis-line),
:deep(.vis-line path),
:deep(.vis-line line) {
  stroke-dasharray: 8, 4 !important;
  stroke-dashoffset: 0 !important;
  opacity: 0.7;
}

/* Additional fallback selectors for Unovis */
:deep(svg line.vis-line),
:deep(svg path.vis-line),
:deep(.unovis-xy-container line),
:deep(.unovis-xy-container path:not(.vis-scatter-point)) {
  stroke-dasharray: 8, 4 !important;
}

/* Make scatter points visually interactive */
:deep(.vis-scatter-point) {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

:deep(.vis-scatter-point:hover) {
  opacity: 0.8;
  stroke: currentColor;
  stroke-width: 2px;
}
</style>
