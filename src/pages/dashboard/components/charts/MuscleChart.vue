<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const analyticsStore = useAnalyticsStore()
const { muscleDistribution } = storeToRefs(analyticsStore)

// Chart colors for different muscle groups
const muscleColors = [
  'var(--chart-1, #ef4444)', // red
  'var(--chart-2, #f97316)', // orange
  'var(--chart-3, #eab308)', // yellow
  'var(--chart-4, #22c55e)', // green
  'var(--chart-5, #3b82f6)', // blue
  'var(--chart-6, #8b5cf6)', // purple
  'var(--chart-7, #ec4899)', // pink
  'var(--chart-8, #06b6d4)', // cyan
]

// Top 8 muscles for donut chart
const chartData = computed(() => {
  return muscleDistribution.value.slice(0, 8).map((muscle, index) => ({
    ...muscle,
    color: muscleColors[index % muscleColors.length],
  }))
})

// Calculate donut segments
const totalSets = computed(() => {
  return chartData.value.reduce((sum, muscle) => sum + muscle.sets, 0)
})

// Generate SVG path for donut segment
function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ')
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

// Generate donut segments
const donutSegments = computed(() => {
  if (chartData.value.length === 0) return []

  const centerX = 100
  const centerY = 100
  const radius = 70
  const innerRadius = 45

  let currentAngle = 0
  const segments = []

  chartData.value.forEach((muscle) => {
    const percentage = muscle.percentage
    const angle = (percentage / 100) * 360
    const endAngle = currentAngle + angle

    // Outer arc
    const outerStart = polarToCartesian(centerX, centerY, radius, currentAngle)
    const outerEnd = polarToCartesian(centerX, centerY, radius, endAngle)

    // Inner arc
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, currentAngle)
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle)

    const largeArcFlag = angle <= 180 ? '0' : '1'

    const pathData = [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ')

    segments.push({
      ...muscle,
      path: pathData,
      midAngle: currentAngle + angle / 2,
    })

    currentAngle = endAngle
  })

  return segments
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Розподіл по м'язах</CardTitle>
      <CardDescription>
        Кількість підходів по групах м'язів
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex flex-col lg:flex-row gap-8 items-center">
        <!-- Donut Chart -->
        <div class="flex-shrink-0">
          <div v-if="chartData.length > 0" class="relative w-[200px] h-[200px]">
            <svg viewBox="0 0 200 200" class="w-full h-full -rotate-90">
              <g
                v-for="(segment, index) in donutSegments"
                :key="index"
                class="transition-opacity hover:opacity-80 cursor-pointer"
              >
                <path
                  :d="segment.path"
                  :fill="segment.color"
                  :stroke="segment.color"
                  stroke-width="1"
                >
                  <title>{{ segment.muscle }}: {{ segment.sets }} підходів ({{ segment.percentage.toFixed(1) }}%)</title>
                </path>
              </g>
            </svg>

            <!-- Center text -->
            <div
              class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <div class="text-3xl font-bold">{{ totalSets }}</div>
              <div class="text-xs text-muted-foreground">підходів</div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else
            class="w-[200px] h-[200px] flex flex-col items-center justify-center text-muted-foreground"
          >
            <svg
              class="w-12 h-12 mb-2 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <p class="text-sm text-center">Немає даних</p>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex-1 space-y-2">
          <div
            v-for="(muscle, index) in chartData"
            :key="index"
            class="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: muscle.color }"
              />
              <span class="font-medium">{{ muscle.muscle }}</span>
            </div>
            <div class="flex items-center gap-3 text-muted-foreground">
              <span class="font-mono">{{ muscle.sets }} підх.</span>
              <span class="font-mono w-12 text-right">
                {{ muscle.percentage.toFixed(1) }}%
              </span>
            </div>
          </div>

          <div
            v-if="chartData.length === 0"
            class="text-center text-sm text-muted-foreground py-4"
          >
            Почніть тренуватися для перегляду розподілу
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
