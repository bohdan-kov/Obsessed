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
  trend: {
    type: String,
    default: null,
    validator: (value) => ['up', 'down', 'flat', 'insufficient_data', null].includes(value),
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
 * Generate unique gradient ID to avoid conflicts when multiple charts are on the page
 */
const gradientId = `sparklineGradient-${Math.random().toString(36).substr(2, 9)}`

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
 * If trend prop is provided, use it (from parent's linear regression calculation)
 * Otherwise fall back to simple first-to-last comparison
 */
const trendDirection = computed(() => {
  // Use parent-provided trend if available (more accurate - uses linear regression)
  if (props.trend) {
    return props.trend
  }

  // Fallback: simple first-to-last comparison (legacy behavior)
  if (dataPoints.value.length < 2) return 'flat'

  const first = dataPoints.value[0]
  const last = dataPoints.value[dataPoints.value.length - 1]
  const change = ((last - first) / first) * 100

  if (change > 2.5) return 'up'
  if (change < -2.5) return 'down'
  return 'flat'
})

/**
 * Get gradient colors based on trend direction
 * CRITICAL: SVG gradients require actual color values, not Tailwind classes
 * Colors match ExerciseProgressRow status badges:
 * - up → green (progressing)
 * - down → red (regressing)
 * - flat → yellow (stalled/stable)
 * - insufficient_data → gray (new exercise)
 */
const gradientColors = computed(() => {
  switch (trendDirection.value) {
    case 'up':
      return {
        start: 'rgb(34, 197, 94, 0.2)', // green-500 with 20% opacity
        end: 'rgb(34, 197, 94, 0)',     // green-500 with 0% opacity
      }
    case 'down':
      return {
        start: 'rgb(239, 68, 68, 0.2)', // red-500 with 20% opacity
        end: 'rgb(239, 68, 68, 0)',     // red-500 with 0% opacity
      }
    case 'insufficient_data':
      return {
        start: 'rgb(156, 163, 175, 0.2)', // gray-400 with 20% opacity
        end: 'rgb(156, 163, 175, 0)',     // gray-400 with 0% opacity
      }
    default: // 'flat'
      return {
        start: 'rgb(234, 179, 8, 0.2)', // yellow-500 with 20% opacity
        end: 'rgb(234, 179, 8, 0)',     // yellow-500 with 0% opacity
      }
  }
})

/**
 * Get stroke color based on trend direction
 * Matches status badge colors in ExerciseProgressRow
 */
const strokeColor = computed(() => {
  switch (trendDirection.value) {
    case 'up':
      return 'rgb(34, 197, 94)' // green-500
    case 'down':
      return 'rgb(239, 68, 68)' // red-500
    case 'insufficient_data':
      return 'rgb(156, 163, 175)' // gray-400
    default: // 'flat'
      return 'rgb(234, 179, 8)' // yellow-500
  }
})

/**
 * Get fill color for circles based on trend direction
 * Matches status badge colors in ExerciseProgressRow
 */
const fillColor = computed(() => {
  switch (trendDirection.value) {
    case 'up':
      return 'rgb(34, 197, 94)' // green-500
    case 'down':
      return 'rgb(239, 68, 68)' // red-500
    case 'insufficient_data':
      return 'rgb(156, 163, 175)' // gray-400
    default: // 'flat'
      return 'rgb(234, 179, 8)' // yellow-500
  }
})

/**
 * Get fill color for highlighted last point
 * Uses darker shade for better visibility
 */
const highlightFillColor = computed(() => {
  switch (trendDirection.value) {
    case 'up':
      return 'rgb(22, 163, 74)' // green-600
    case 'down':
      return 'rgb(220, 38, 38)' // red-600
    case 'insufficient_data':
      return 'rgb(107, 114, 128)' // gray-500
    default: // 'flat'
      return 'rgb(202, 138, 4)' // yellow-600
  }
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
          <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" :stop-color="gradientColors.start" />
            <stop offset="100%" :stop-color="gradientColors.end" />
          </linearGradient>
        </defs>

        <!-- Area under curve -->
        <path
          :d="`${sparklinePath} L ${width} ${height} L 0 ${height} Z`"
          :fill="`url(#${gradientId})`"
        />

        <!-- Main sparkline -->
        <path
          :d="sparklinePath"
          fill="none"
          :stroke="strokeColor"
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
            :fill="fillColor"
            stroke="hsl(var(--background))"
            stroke-width="1"
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
          :fill="highlightFillColor"
          stroke="hsl(var(--background))"
          stroke-width="2"
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
