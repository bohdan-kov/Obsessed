<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TrendingUp } from 'lucide-vue-next'
import { VisArea, VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import { useUnits } from '@/composables/useUnits'

const props = defineProps({
  /**
   * Progress data from useExerciseStats
   * Array of { date, maxWeight, volume, sets }
   */
  data: {
    type: Array,
    required: true,
  },
})

const { t, locale } = useI18n()
const { formatWeight } = useUnits()

/**
 * Chart data mapped to the format expected by VisXYContainer
 */
const chartData = computed(() => {
  return props.data.map((session) => ({
    date: new Date(session.date),
    maxWeight: session.maxWeight, // Already converted to user's preferred unit
  }))
})

/**
 * Chart configuration for series
 */
const chartConfig = {
  maxWeight: {
    label: t('exercises.history.chartTitle'),
    color: 'var(--chart-1)', // Primary color
  },
}

/**
 * SVG gradient definition for area fill
 */
const svgDefs = `
  <linearGradient id="fillMaxWeight" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-maxWeight)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-maxWeight)" stop-opacity="0.1" />
  </linearGradient>
`

/**
 * Dynamic Y-axis domain with padding
 * Floor to 0, ceiling to 110% of max weight
 */
const yDomain = computed(() => {
  if (chartData.value.length === 0) return [0, 100]

  const maxWeight = Math.max(...chartData.value.map((d) => d.maxWeight), 0)
  const minWeight = Math.min(...chartData.value.map((d) => d.maxWeight), maxWeight)

  // Add 10% padding to the top, floor at 0 or 90% of min if min > 0
  const floor = minWeight > 10 ? minWeight * 0.9 : 0
  const ceiling = maxWeight * 1.1

  return [floor, ceiling]
})

/**
 * Format date for X-axis (short format: month + day)
 */
function formatAxisDate(date) {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format weight for Y-axis (rounded number)
 */
function formatAxisWeight(value) {
  if (typeof value !== 'number') return String(value)

  return value.toLocaleString(locale.value, {
    maximumFractionDigits: 0,
  })
}

/**
 * Format date for tooltip (full date)
 */
function formatTooltipDate(date) {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format value for tooltip (with unit)
 */
function formatTooltipValue(value) {
  if (typeof value !== 'number') return String(value)

  // Use formatWeight to get the value with the proper unit
  return formatWeight(value)
}
</script>

<template>
  <!-- Empty state: need at least 2 data points -->
  <div
    v-if="data.length < 2"
    role="status"
    aria-live="polite"
    :aria-label="t('exercises.history.emptyStateTitle')"
    class="h-[200px] sm:h-[250px] md:h-[300px] bg-muted/30 rounded-lg
           flex flex-col items-center justify-center p-6 gap-3
           transition-opacity duration-100"
  >
    <TrendingUp
      class="h-12 w-12 text-muted-foreground/50 mb-3"
      aria-hidden="true"
    />
    <p class="text-base font-medium text-foreground text-center max-w-[300px]">
      {{ t('exercises.history.emptyStateTitle') }}
    </p>
    <p class="text-sm text-muted-foreground text-center max-w-[350px] leading-relaxed">
      {{ t('exercises.history.emptyStateDescription') }}
    </p>
  </div>

  <!-- Chart visualization -->
  <ChartContainer v-else :config="chartConfig" class="w-full" :cursor="false">
    <div class="aspect-auto h-[200px] sm:h-[250px] md:h-[300px] w-full">
      <VisXYContainer
        :data="chartData"
        :svg-defs="svgDefs"
        :margin="{ left: -40, right: 40 }"
        :y-domain="yDomain"
      >
        <!-- Area Chart with gradient -->
        <VisArea
          :x="(d) => d.date"
          :y="(d) => d.maxWeight"
          :color="'url(#fillMaxWeight)'"
          :opacity="0.6"
        />

        <!-- Line Chart -->
        <VisLine
          :x="(d) => d.date"
          :y="(d) => d.maxWeight"
          :color="chartConfig.maxWeight.color"
          :line-width="2"
        />

        <!-- X-Axis (Date) -->
        <VisAxis
          type="x"
          :x="(d) => d.date"
          :tick-line="false"
          :domain-line="false"
          :grid-line="false"
          :num-ticks="5"
          :tick-format="formatAxisDate"
        />

        <!-- Y-Axis (Weight) -->
        <VisAxis
          type="y"
          :num-ticks="4"
          :tick-line="false"
          :domain-line="false"
          :grid-line="true"
          :tick-format="formatAxisWeight"
        />

        <!-- Tooltip -->
        <ChartTooltip />

        <!-- Crosshair with formatted tooltip -->
        <ChartCrosshair
          :template="
            componentToString(chartConfig, ChartTooltipContent, {
              indicator: 'line',
              labelFormatter: formatTooltipDate,
              valueFormatter: formatTooltipValue,
            })
          "
          :color="(_d, i) => {
            // Map series index to colors
            // Index 0: VisArea (not used for crosshair)
            // Index 1: VisLine (maxWeight) → chart-1
            const colorMap = [null, chartConfig.maxWeight.color]
            return colorMap[i] || 'currentColor'
          }"
        />
      </VisXYContainer>
    </div>
  </ChartContainer>
</template>
