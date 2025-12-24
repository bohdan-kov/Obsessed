<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useUnits } from '@/composables/useUnits'
import BaseChart from '../shared/BaseChart.vue'
import { formatDateShort } from '@/utils/dateUtils'

const { t, locale } = useI18n()
const { formatWeight } = useUnits()
const router = useRouter()

const analyticsStore = useAnalyticsStore()
const { durationTrendData, durationStats, loading } = storeToRefs(analyticsStore)

// SVG dimensions
const CHART_WIDTH = 800
const CHART_HEIGHT = 350
const PADDING = { top: 20, right: 20, bottom: 60, left: 60 }

const chartWidth = CHART_WIDTH - PADDING.left - PADDING.right
const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

// Find max values for scaling
const maxDuration = computed(() => {
  if (!durationTrendData.value?.length) return 0
  return Math.max(...durationTrendData.value.map((d) => d.duration))
})

const maxVolume = computed(() => {
  if (!durationTrendData.value?.length) return 0
  return Math.max(...durationTrendData.value.map((d) => d.volume))
})

// Generate scatter points (position + size based on volume)
const scatterPoints = computed(() => {
  if (!durationTrendData.value?.length) return []

  return durationTrendData.value.map((point, index) => {
    const x = PADDING.left + (index / (durationTrendData.value.length - 1 || 1)) * chartWidth
    const y = PADDING.top + chartHeight - (point.duration / (maxDuration.value || 1)) * chartHeight

    // Size based on volume (min 4px, max 12px)
    const volumeRatio = point.volume / (maxVolume.value || 1)
    const radius = 4 + volumeRatio * 8

    // Color based on volume quartile
    let color = '#06b6d4' // cyan (low)
    if (volumeRatio > 0.75)
      color = '#10b981' // green (high)
    else if (volumeRatio > 0.5) color = '#f59e0b' // amber (medium)

    return {
      x,
      y,
      radius,
      color,
      data: point,
    }
  })
})

// Generate trend line using linear regression
const trendLine = computed(() => {
  if (!durationTrendData.value?.length || durationTrendData.value.length < 2) return ''

  const n = durationTrendData.value.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  durationTrendData.value.forEach((point, index) => {
    sumX += index
    sumY += point.duration
    sumXY += index * point.duration
    sumX2 += index * index
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate line points
  const startY = intercept
  const endY = slope * (n - 1) + intercept

  const startYScaled = PADDING.top + chartHeight - (startY / (maxDuration.value || 1)) * chartHeight
  const endYScaled = PADDING.top + chartHeight - (endY / (maxDuration.value || 1)) * chartHeight

  return `M ${PADDING.left},${startYScaled} L ${PADDING.left + chartWidth},${endYScaled}`
})

// Y-axis labels
const yAxisLabels = computed(() => {
  const labels = []
  const steps = 5
  for (let i = 0; i <= steps; i++) {
    const value = (maxDuration.value / steps) * i
    const y = PADDING.top + chartHeight - (i / steps) * chartHeight
    labels.push({ value: Math.round(value), y })
  }
  return labels.reverse()
})

// X-axis labels
const xAxisLabels = computed(() => {
  if (!durationTrendData.value?.length) return []

  const step = Math.ceil(durationTrendData.value.length / 6)

  return durationTrendData.value
    .map((point, index) => ({
      label: formatDateShort(point.date, locale.value),
      x: PADDING.left + (index / (durationTrendData.value.length - 1 || 1)) * chartWidth,
      index,
    }))
    .filter((item, idx) => idx % step === 0 || idx === durationTrendData.value.length - 1)
})

// Navigate to workout detail
function navigateToWorkout(workoutId) {
  router.push(`/workouts/${workoutId}`)
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
      <div class="w-full overflow-x-auto">
        <svg
          :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
          class="w-full min-w-[600px] h-auto"
          role="img"
          :aria-label="t('analytics.duration.trendChart.title')"
        >
          <!-- Y-axis -->
          <g class="y-axis">
            <line
              :x1="PADDING.left"
              :y1="PADDING.top"
              :x2="PADDING.left"
              :y2="PADDING.top + chartHeight"
              stroke="currentColor"
              stroke-opacity="0.2"
              stroke-width="1"
            />

            <!-- Y-axis labels -->
            <g v-for="label in yAxisLabels" :key="label.value">
              <line
                :x1="PADDING.left"
                :y1="label.y"
                :x2="PADDING.left + chartWidth"
                :y2="label.y"
                stroke="currentColor"
                stroke-opacity="0.1"
                stroke-width="1"
                stroke-dasharray="4,4"
              />
              <text
                :x="PADDING.left - 10"
                :y="label.y"
                text-anchor="end"
                dominant-baseline="middle"
                class="text-[10px] fill-muted-foreground"
              >
                {{ label.value }}
              </text>
            </g>

            <!-- Y-axis label -->
            <text
              :x="15"
              :y="PADDING.top + chartHeight / 2"
              text-anchor="middle"
              class="text-[11px] font-medium fill-muted-foreground"
              transform="rotate(-90 15 175)"
            >
              {{ t('common.duration') }} ({{ t('common.minutes') }})
            </text>
          </g>

          <!-- X-axis -->
          <g class="x-axis">
            <line
              :x1="PADDING.left"
              :y1="PADDING.top + chartHeight"
              :x2="PADDING.left + chartWidth"
              :y2="PADDING.top + chartHeight"
              stroke="currentColor"
              stroke-opacity="0.2"
              stroke-width="1"
            />

            <!-- X-axis labels -->
            <g v-for="label in xAxisLabels" :key="label.index">
              <text
                :x="label.x"
                :y="PADDING.top + chartHeight + 20"
                text-anchor="middle"
                class="text-[10px] fill-muted-foreground"
              >
                {{ label.label }}
              </text>
            </g>

            <!-- X-axis label -->
            <text
              :x="PADDING.left + chartWidth / 2"
              :y="CHART_HEIGHT - 10"
              text-anchor="middle"
              class="text-[11px] font-medium fill-muted-foreground"
            >
              {{ t('common.date') }}
            </text>
          </g>

          <!-- Trend line -->
          <path
            v-if="trendLine"
            :d="trendLine"
            stroke="#94a3b8"
            stroke-width="2"
            stroke-dasharray="8,4"
            fill="none"
            opacity="0.5"
          />

          <!-- Scatter points -->
          <g class="points">
            <circle
              v-for="(point, index) in scatterPoints"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              :r="point.radius"
              :fill="point.color"
              opacity="0.7"
              class="transition-all duration-200 hover:opacity-100 hover:stroke-current hover:stroke-2 cursor-pointer"
              @click="navigateToWorkout(point.data.id)"
            >
              <title>
                {{ formatDateShort(point.data.date, locale) }}: {{ point.data.duration }}
                {{ t('common.minutes') }}, {{ formatWeight(point.data.volume) }},
                {{ point.data.exerciseCount }} {{ t('common.exercises').toLowerCase() }}
              </title>
            </circle>
          </g>
        </svg>
      </div>

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
@media (max-width: 640px) {
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }
}
</style>
