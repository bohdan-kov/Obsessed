<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { VisArea, VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
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

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()
const { volumeByDay, periodLabel, period } = storeToRefs(analyticsStore)

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
</script>

<template>
  <Card class="pt-0">
    <CardHeader class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
      <div class="grid flex-1 gap-1">
        <CardTitle>{{ t('dashboard.volumeChart.title') }}</CardTitle>
        <CardDescription>
          {{ t('dashboard.volumeChart.subtitlePeriod', { period: t(periodLabel) }) }}
        </CardDescription>
      </div>
    </CardHeader>

    <CardContent class="px-2 pt-4 sm:px-6 sm:pt-6 pb-6">
      <ChartContainer :config="chartConfig" class="w-full" :cursor="false">
        <!-- Chart visualization with fixed height -->
        <div class="aspect-auto h-[300px] w-full">
          <VisXYContainer
            :key="`volume-chart-${period}`"
            :data="chartData"
            :svg-defs="svgDefs"
            :margin="{ left: -40, right: 40 }"
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

                  // Add 'kg' unit for volume field
                  const formattedNumber = value.toLocaleString('uk-UA', {
                    maximumFractionDigits: 0
                  })

                  return key === 'volume'
                    ? `${formattedNumber} ${t('common.units.kg')}`
                    : formattedNumber
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

        <!-- Legend positioned after chart, inside ChartContainer so it can access injected config -->
        <ChartLegendContent class="mt-4 justify-center" />
      </ChartContainer>
    </CardContent>
  </Card>
</template>
