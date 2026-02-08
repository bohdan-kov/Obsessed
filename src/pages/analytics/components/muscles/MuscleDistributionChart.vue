<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Orientation } from '@unovis/ts'
import { VisAxis, VisGroupedBar, VisXYContainer } from '@unovis/vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import { MUSCLE_COLORS } from '@/utils/chartUtils'

const { t } = useI18n()

const analyticsStore = useAnalyticsStore()
const { muscleDistribution, loading } = storeToRefs(analyticsStore)

/**
 * Chart data formatted for VisGroupedBar (horizontal orientation)
 * Sorted by percentage (descending) to show most trained muscles first
 */
const chartData = computed(() => {
  if (!muscleDistribution.value?.length) return []

  return muscleDistribution.value.map((item) => ({
    muscle: item.muscle,
    muscleName: t(`common.muscleGroups.${item.muscle}`),
    percentage: item.percentage,
    sets: item.sets || item.value || 0,
  }))
})

/**
 * Chart configuration
 * Uses computed to ensure reactivity with locale changes
 */
const chartConfig = computed(() => {
  const config = {}
  chartData.value.forEach((item) => {
    config[item.muscle] = {
      label: t(`common.muscleGroups.${item.muscle}`),
      color: MUSCLE_COLORS[item.muscle] || '#3b82f6',
    }
  })
  return config
})

/**
 * Get color for a specific muscle group
 */
function getBarColor(d) {
  return MUSCLE_COLORS[d.muscle] || '#3b82f6'
}

/**
 * Format Y-axis labels (muscle names)
 */
function formatMuscleLabel(index) {
  const roundedIndex = Math.round(index)
  const dataPoint = chartData.value[roundedIndex]
  return dataPoint?.muscleName || ''
}

/**
 * Format X-axis labels (percentages)
 */
function formatPercentageLabel(value) {
  return `${Math.round(value)}%`
}

/**
 * Format tooltip values
 */
function formatTooltipValue(value, key) {
  if (key === 'percentage') {
    return `${Math.round(value)}%`
  }
  if (key === 'sets') {
    return `${Math.round(value)} ${t('common.sets')}`
  }
  return String(value)
}
</script>

<template>
  <Card>
    <CardHeader class="pb-4">
      <CardTitle>{{ t('analytics.muscles.distribution.title') }}</CardTitle>
      <CardDescription>
        {{ t('analytics.muscles.distribution.description') }}
      </CardDescription>
    </CardHeader>

    <CardContent class="px-2 sm:px-6 pb-6">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center h-[300px]">
        <div class="text-muted-foreground">{{ t('common.loading') }}</div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="chartData.length === 0"
        class="flex flex-col items-center justify-center h-[300px]"
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
          {{ t('analytics.muscles.distribution.emptyState') }}
        </p>
      </div>

      <!-- Chart -->
      <ChartContainer v-else :config="chartConfig" class="w-full">
        <div class="aspect-auto w-full" :style="{ height: `${Math.max(300, chartData.length * 50)}px` }">
          <VisXYContainer
            :data="chartData"
            :margin="{ top: 10, left: 100, right: 40, bottom: 40 }"
            :y-domain="[0, chartData.length - 1]"
            :x-domain="[0, 100]"
          >
            <!-- Horizontal grouped bar -->
            <VisGroupedBar
              :x="[(d) => d.percentage]"
              :y="(_d, i) => i"
              :color="getBarColor"
              :rounded-corners="5"
              :orientation="Orientation.Horizontal"
              :bar-padding="0.2"
            />

            <!-- Y-Axis (Muscle names) -->
            <VisAxis
              type="y"
              :y="(_d, i) => i"
              :tick-line="false"
              :domain-line="false"
              :grid-line="false"
              :tick-format="formatMuscleLabel"
            />

            <!-- X-Axis (Percentages) -->
            <VisAxis
              type="x"
              :tick-line="false"
              :domain-line="false"
              :grid-line="false"
              :num-ticks="5"
              :tick-format="formatPercentageLabel"
            />

            <!-- Tooltip -->
            <ChartTooltip />

            <!-- Crosshair with formatted tooltip -->
            <ChartCrosshair
              :template="
                componentToString(chartConfig, ChartTooltipContent, {
                  labelFormatter: (d) => d?.muscleName || '',
                  valueFormatter: formatTooltipValue,
                })
              "
              :color="getBarColor"
            />
          </VisXYContainer>
        </div>
      </ChartContainer>
    </CardContent>
  </Card>
</template>
