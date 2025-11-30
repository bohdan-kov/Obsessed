<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Donut } from '@unovis/ts'
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { MUSCLE_COLOR_MAP } from '@/constants/chartTheme'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()
const { muscleDistribution } = storeToRefs(analyticsStore)

// Top 8 muscles for donut chart with translated names
// CRITICAL: Each item MUST have `fill: "var(--color-{muscle})"` property
const chartData = computed(() => {
  return muscleDistribution.value.slice(0, 8).map((muscle) => ({
    muscle: muscle.muscle,
    muscleName: t(`exercises.muscleGroups.${muscle.muscle}`),
    sets: muscle.sets,
    percentage: muscle.percentage,
    fill: `var(--color-${muscle.muscle})`, // CRITICAL: reference to CSS variable
  }))
})

// Chart configuration - maps muscle groups to colors
// CRITICAL: color values must be "hsl(var(--chart-X))" format
const chartConfig = computed(() => {
  const config = {
    sets: {
      label: t('dashboard.charts.sets'),
      color: undefined,
    },
  }

  // Add each muscle group to config using centralized color map
  chartData.value.forEach((muscle) => {
    config[muscle.muscle] = {
      label: muscle.muscleName,
      color: MUSCLE_COLOR_MAP[muscle.muscle] || MUSCLE_COLOR_MAP.back,
    }
  })

  return config
})

// Total sets
const totalSets = computed(() => {
  return chartData.value.reduce((sum, muscle) => sum + muscle.sets, 0)
})

// Tooltip formatter function
// CRITICAL: Tooltip is rendered in a portal outside .dark scope, so CSS variables don't work
// Use hardcoded OKLCH values for dark mode (matching design tokens in globals.css)
// CRITICAL: Unovis wraps chartData in d.data, not directly in d
const getTooltipContent = (d) => {
  // Extract actual data from Unovis wrapper
  const data = d.data
  const percentage = ((data.sets / totalSets.value) * 100).toFixed(1)

  // Dark mode colors (hardcoded from globals.css design tokens)
  // Using OKLCH color space as defined in theme
  const backgroundColor = 'oklch(0.35 0 0)' // --popover in dark mode (slightly lighter than background for better contrast)
  const foreground = 'oklch(0.985 0 0)' // --foreground in dark mode
  const border = 'oklch(0.269 0 0)' // --border in dark mode
  const mutedForeground = 'oklch(0.708 0 0)' // --muted-foreground in dark mode

  return `
    <div style="background: ${backgroundColor}; color: ${foreground}; border: 1px solid ${border}; border-radius: 0.5rem; padding: 0.75rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); min-width: 180px;">
      <div style="font-weight: 600; margin-bottom: 0.25rem; color: ${foreground};">${data.muscleName}</div>
      <div style="font-size: 0.875rem; color: ${mutedForeground};">${data.sets} ${t('dashboard.charts.setsShort')} (${percentage}%)</div>
    </div>
  `
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="pb-4">
      <CardTitle>{{ t('dashboard.charts.muscleTitle') }}</CardTitle>
      <CardDescription>
        {{ t('dashboard.charts.muscleDescription') }}
      </CardDescription>
    </CardHeader>

    <CardContent class="flex flex-col pb-6">
      <div v-if="chartData.length > 0" class="flex flex-col md:flex-row gap-6">
        <!-- Pie Chart -->
        <div class="shrink-0 mx-auto md:mx-0">
          <ChartContainer
            :config="chartConfig"
            class="aspect-square w-[200px] md:w-[250px]"
            :style="{
              '--vis-donut-central-label-font-size': 'var(--text-3xl)',
              '--vis-donut-central-label-font-weight': 'var(--font-weight-bold)',
              '--vis-donut-central-label-text-color': 'var(--foreground)',
              '--vis-donut-central-sub-label-text-color': 'var(--muted-foreground)',
            }"
          >
            <VisSingleContainer
              :data="chartData"
              :margin="{ top: 30, bottom: 30 }"
            >
              <VisDonut
                :value="(d) => d.sets"
                :color="(d) => chartConfig[d.muscle].color"
                :arc-width="30"
                :central-label-offset-y="10"
                :central-label="totalSets.toString()"
                :central-sub-label="t('dashboard.charts.totalSets')"
              />
              <ChartTooltip
                :triggers="{
                  [Donut.selectors.segment]: getTooltipContent,
                }"
              />
            </VisSingleContainer>
          </ChartContainer>
        </div>

        <!-- Legend with data -->
        <div class="flex-1 space-y-2">
          <div
            v-for="item in chartData"
            :key="item.muscle"
            class="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-center gap-2">
              <div
                class="h-3 w-3 rounded-full shrink-0"
                :style="{ backgroundColor: chartConfig[item.muscle].color }"
              />
              <span class="font-medium">{{ item.muscleName }}</span>
            </div>
            <div class="flex items-center gap-3 text-muted-foreground">
              <span class="font-mono">{{ item.sets }} {{ t('dashboard.charts.setsShort') }}</span>
              <span class="font-mono w-12 text-right">{{ item.percentage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center text-muted-foreground py-8"
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
        <p class="text-sm text-center">{{ t('dashboard.charts.noMuscleData') }}</p>
        <p class="text-xs text-center mt-1">
          {{ t('dashboard.charts.noMuscleDataSubtitle') }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

