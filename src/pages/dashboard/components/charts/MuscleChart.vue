<script setup>
import { ref, computed } from 'vue'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()
const { muscleDistribution, muscleDistributionByVolume, periodLabel, period } = storeToRefs(analyticsStore)

// Toggle state for Sets/Volume display
const displayMode = ref('sets')

// Top 8 muscles for donut chart with translated names
// Conditionally uses sets or volume based on displayMode
// CRITICAL: Each item MUST have `fill: "var(--color-{muscle})"` property
const chartData = computed(() => {
  const source = displayMode.value === 'sets'
    ? muscleDistribution.value
    : muscleDistributionByVolume.value

  return source.slice(0, 8).map((muscle) => ({
    muscle: muscle.muscle,
    muscleName: t(`exercises.muscleGroups.${muscle.muscle}`),
    value: displayMode.value === 'sets' ? muscle.sets : muscle.value,
    percentage: muscle.percentage,
    fill: `var(--color-${muscle.muscle})`, // CRITICAL: reference to CSS variable
  }))
})

// Chart configuration - maps muscle groups to colors
// CRITICAL: color values must be "hsl(var(--chart-X))" format
const chartConfig = computed(() => {
  const config = {
    value: {
      label: displayMode.value === 'sets'
        ? t('dashboard.charts.sets')
        : t('dashboard.charts.volumeKg'),
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

// Total value (sets or volume depending on mode)
const totalValue = computed(() => {
  return chartData.value.reduce((sum, muscle) => sum + muscle.value, 0)
})

// Label for center of donut and legend
const valueLabel = computed(() => {
  return displayMode.value === 'sets'
    ? t('dashboard.charts.totalSets')
    : 'kg'
})

// Tooltip formatter function
// CRITICAL: Unovis wraps chartData in d.data, not directly in d
// Uses Tailwind classes that automatically adapt to light/dark theme
const getTooltipContent = (d) => {
  // Extract actual data from Unovis wrapper
  const data = d.data
  const percentage = ((data.value / totalValue.value) * 100).toFixed(1)
  const unit = displayMode.value === 'sets'
    ? t('dashboard.charts.setsShort')
    : 'kg'

  // Use Tailwind classes that work with theme switching
  // The bg-popover, text-popover-foreground, etc. classes will adapt based on theme
  return `
    <div class="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-lg min-w-[180px]" data-tooltip-content="true">
      <div class="font-semibold mb-1">${data.muscleName}</div>
      <div class="text-sm text-muted-foreground">${Math.round(data.value)} ${unit} (${percentage}%)</div>
    </div>
  `
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="pb-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <CardTitle>{{ t('dashboard.charts.muscleTitle') }}</CardTitle>
          <CardDescription>
            {{ t('dashboard.charts.muscleDescriptionPeriod', { period: t(periodLabel) }) }}
          </CardDescription>
        </div>
        <Tabs v-model="displayMode" class="shrink-0">
          <TabsList>
            <TabsTrigger value="sets">
              {{ t('dashboard.charts.muscleModes.sets') }}
            </TabsTrigger>
            <TabsTrigger value="volume">
              {{ t('dashboard.charts.muscleModes.volume') }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
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
              :key="`muscle-chart-${period}-${displayMode}`"
              :data="chartData"
              :margin="{ top: 30, bottom: 30 }"
            >
              <VisDonut
                :value="(d) => d.value"
                :color="(d) => chartConfig[d.muscle].color"
                :arc-width="30"
                :central-label-offset-y="10"
                :central-label="Math.round(totalValue).toString()"
                :central-sub-label="valueLabel"
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
              <span class="font-mono">
                {{ Math.round(item.value) }}
                {{ displayMode === 'sets' ? t('dashboard.charts.setsShort') : 'kg' }}
              </span>
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

