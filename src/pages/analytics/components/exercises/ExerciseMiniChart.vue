<script setup>
import { computed } from 'vue'
import { calculate1RM } from '@/utils/strengthUtils'
import { useUnits } from '@/composables/useUnits'

const props = defineProps({
  history: {
    type: Array,
    required: true,
    validator: (value) => Array.isArray(value),
  },
  height: {
    type: Number,
    default: 40,
  },
  width: {
    type: Number,
    default: 100,
  },
})

const { formatWeight } = useUnits()

/**
 * Calculate 1RM for each workout in history
 */
const dataPoints = computed(() => {
  return props.history
    .map((entry) => {
      if (!entry.bestSet?.weight || !entry.bestSet?.reps) return null
      const e1rm = calculate1RM(entry.bestSet.weight, entry.bestSet.reps)
      return e1rm ? Math.round(e1rm) : null
    })
    .filter((val) => val !== null)
})

/**
 * Calculate min and max for scaling
 */
const yMin = computed(() => {
  if (dataPoints.value.length === 0) return 0
  const min = Math.min(...dataPoints.value)
  return Math.floor(min * 0.9) // 10% padding below
})

const yMax = computed(() => {
  if (dataPoints.value.length === 0) return 100
  const max = Math.max(...dataPoints.value)
  return Math.ceil(max * 1.1) // 10% padding above
})

/**
 * Generate SVG path for sparkline
 */
const sparklinePath = computed(() => {
  if (dataPoints.value.length === 0) return ''

  const points = dataPoints.value
  const count = points.length
  const xStep = props.width / Math.max(count - 1, 1)
  const yRange = yMax.value - yMin.value || 1

  const pathData = points.map((value, index) => {
    const x = index * xStep
    const y = props.height - ((value - yMin.value) / yRange) * props.height
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  })

  return pathData.join(' ')
})

/**
 * Generate circle points for data points
 */
const circlePoints = computed(() => {
  if (dataPoints.value.length === 0) return []

  const points = dataPoints.value
  const count = points.length
  const xStep = props.width / Math.max(count - 1, 1)
  const yRange = yMax.value - yMin.value || 1

  return points.map((value, index) => {
    const x = index * xStep
    const y = props.height - ((value - yMin.value) / yRange) * props.height
    return { x, y, value }
  })
})

/**
 * Determine trend direction (up/down/flat)
 */
const trendDirection = computed(() => {
  if (dataPoints.value.length < 2) return 'flat'

  const first = dataPoints.value[0]
  const last = dataPoints.value[dataPoints.value.length - 1]
  const change = ((last - first) / first) * 100

  if (change > 2.5) return 'up'
  if (change < -2.5) return 'down'
  return 'flat'
})

const isEmpty = computed(() => dataPoints.value.length === 0)
</script>

<template>
  <div
    class="exercise-mini-chart"
    :class="{
      'opacity-50': isEmpty,
    }"
  >
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      class="overflow-visible"
    >
      <!-- Empty state -->
      <template v-if="isEmpty">
        <text
          :x="width / 2"
          :y="height / 2"
          text-anchor="middle"
          dominant-baseline="middle"
          class="fill-muted-foreground text-xs"
        >
          No data
        </text>
      </template>

      <!-- Sparkline with data -->
      <template v-else>
        <!-- Background area (gradient fill) -->
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              :class="{
                'stop-green-500/20': trendDirection === 'up',
                'stop-red-500/20': trendDirection === 'down',
                'stop-gray-500/20': trendDirection === 'flat',
              }"
            />
            <stop
              offset="100%"
              :class="{
                'stop-green-500/0': trendDirection === 'up',
                'stop-red-500/0': trendDirection === 'down',
                'stop-gray-500/0': trendDirection === 'flat',
              }"
            />
          </linearGradient>
        </defs>

        <!-- Area under curve -->
        <path
          :d="`${sparklinePath} L ${width} ${height} L 0 ${height} Z`"
          fill="url(#sparklineGradient)"
        />

        <!-- Main sparkline -->
        <path
          :d="sparklinePath"
          fill="none"
          :class="{
            'stroke-green-500': trendDirection === 'up',
            'stroke-red-500': trendDirection === 'down',
            'stroke-gray-400': trendDirection === 'flat',
          }"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Data points -->
        <g v-for="(point, index) in circlePoints" :key="index">
          <circle
            :cx="point.x"
            :cy="point.y"
            r="2"
            :class="{
              'fill-green-500': trendDirection === 'up',
              'fill-red-500': trendDirection === 'down',
              'fill-gray-400': trendDirection === 'flat',
            }"
            class="stroke-background stroke-1"
          >
            <title>{{ formatWeight(point.value) }}</title>
          </circle>
        </g>

        <!-- Highlight last point (most recent) -->
        <circle
          v-if="circlePoints.length > 0"
          :cx="circlePoints[circlePoints.length - 1].x"
          :cy="circlePoints[circlePoints.length - 1].y"
          r="3"
          :class="{
            'fill-green-600': trendDirection === 'up',
            'fill-red-600': trendDirection === 'down',
            'fill-gray-500': trendDirection === 'flat',
          }"
          class="stroke-background stroke-2"
        />
      </template>
    </svg>
  </div>
</template>

<style scoped>
.exercise-mini-chart {
  display: inline-block;
  vertical-align: middle;
}

/* Ensure SVG scales properly */
svg {
  display: block;
}
</style>
