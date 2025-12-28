<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import { VisAxis, VisGroupedBar, VisXYContainer } from '@unovis/vue'
import { TrendingUp, TrendingDown, Minus, Maximize2 } from 'lucide-vue-next'
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
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useUnits } from '@/composables/useUnits'
import { useFullscreenChart } from '@/composables/useFullscreenChart'
import FullscreenChartOverlay from '@/components/charts/FullscreenChartOverlay.vue'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()
const { weeklyVolumeProgression, progressiveOverloadStats } = storeToRefs(analyticsStore)
const { formatWeight } = useUnits()

// Mobile detection and full-screen functionality
const isMobile = useMediaQuery('(max-width: 768px)')
const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

// Status colors matching the existing STATUS_COLORS pattern
const STATUS_COLORS = {
  progressing: 'hsl(142, 71%, 45%)', // Green
  maintaining: 'hsl(43, 96%, 56%)', // Amber
  regressing: 'hsl(0, 84%, 60%)', // Red
}

// Transform weekly volume data to chart-compatible format
// We'll use week index as x-axis since weeks are strings like "Jan 1-7"
const chartData = computed(() => {
  if (!weeklyVolumeProgression.value?.length) return []

  return weeklyVolumeProgression.value.map((week, index) => ({
    weekIndex: index,
    weekLabel: week.week,
    volume: week.volume,
    change: week.change,
    status: week.status,
  }))
})

// Chart configuration for shadcn charts
const chartConfig = {
  volume: {
    label: t('common.volume'),
    color: 'var(--chart-1)',
  },
}

// Get color based on status
const getBarColor = (datum) => {
  return STATUS_COLORS[datum.status] || STATUS_COLORS.maintaining
}

// Status label translation
function getStatusLabel(status) {
  return t(`analytics.volume.progressiveOverload.statusLabels.${status}`)
}

// Check if data is empty
const isEmpty = computed(() => {
  return !weeklyVolumeProgression.value || weeklyVolumeProgression.value.length === 0
})

// Y domain - dynamic based on max volume
const yDomain = computed(() => {
  if (!chartData.value.length) return [0, 100]
  const maxVolume = Math.max(...chartData.value.map((d) => d.volume), 100)
  return [0, maxVolume * 1.1]
})
</script>

<template>
  <Card data-testid="progressive-overload-chart">
    <CardHeader class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
      <div class="grid flex-1 gap-1">
        <CardTitle>{{ t('analytics.volume.progressiveOverload.title') }}</CardTitle>
        <CardDescription>
          {{ t('analytics.volume.progressiveOverload.description') }}
        </CardDescription>
      </div>

      <!-- Full-screen button (mobile only, hidden when no data) -->
      <button
        v-if="isMobile && !isFullscreen && chartData.length > 0"
        type="button"
        @click="enterFullscreen"
        class="inline-flex items-center justify-center w-11 h-11 rounded-md hover:bg-muted transition-colors touch-manipulation shrink-0"
        :aria-label="t('charts.fullscreen.open')"
      >
        <Maximize2 class="w-5 h-5" />
      </button>
    </CardHeader>

    <!-- Stats Panel (hidden in full-screen) -->
    <div v-if="progressiveOverloadStats && !isEmpty && !isFullscreen" class="px-6 pt-6">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <!-- Weeks Progressing -->
        <div class="rounded-lg border bg-card p-3">
          <div class="text-xs text-muted-foreground">
            {{ t('analytics.volume.progressiveOverload.stats.weeksProgressing') }}
          </div>
          <div class="text-lg font-semibold mt-1">
            {{ progressiveOverloadStats.weeksProgressing }}/{{
              progressiveOverloadStats.totalWeeks
            }}
            <span class="text-xs font-normal text-muted-foreground">
              ({{ Math.round(progressiveOverloadStats.progressRate) }}%)
            </span>
          </div>
        </div>

        <!-- Average Increase -->
        <div class="rounded-lg border bg-card p-3">
          <div class="text-xs text-muted-foreground">
            {{ t('analytics.volume.progressiveOverload.stats.avgIncrease') }}
          </div>
          <div
            class="text-lg font-semibold mt-1"
            :class="{
              'text-green-500': progressiveOverloadStats.avgIncrease >= 2.5,
              'text-amber-500':
                progressiveOverloadStats.avgIncrease >= 0 &&
                progressiveOverloadStats.avgIncrease < 2.5,
              'text-red-500': progressiveOverloadStats.avgIncrease < 0,
            }"
          >
            {{ progressiveOverloadStats.avgIncrease >= 0 ? '+' : ''
            }}{{ progressiveOverloadStats.avgIncrease.toFixed(1) }}%
          </div>
        </div>

        <!-- Overall Status -->
        <div class="rounded-lg border bg-card p-3">
          <div class="text-xs text-muted-foreground">
            {{ t('analytics.volume.progressiveOverload.stats.status') }}
          </div>
          <div
            class="text-sm font-medium mt-1"
            :class="{
              'text-green-500': progressiveOverloadStats.overallStatus === 'on_track',
              'text-amber-500': progressiveOverloadStats.overallStatus === 'maintaining',
              'text-red-500': progressiveOverloadStats.overallStatus === 'regressing',
            }"
          >
            {{ getStatusLabel(progressiveOverloadStats.overallStatus) }}
          </div>
        </div>

        <!-- Next Week Target -->
        <div class="rounded-lg border bg-card p-3">
          <div class="text-xs text-muted-foreground">
            {{ t('analytics.volume.progressiveOverload.stats.nextTarget') }}
          </div>
          <div class="text-lg font-semibold mt-1">
            {{ formatWeight(progressiveOverloadStats.nextWeekTarget, { precision: 0 }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Normal view -->
    <CardContent v-if="!isEmpty && !isFullscreen">
      <ChartContainer :config="chartConfig" class="w-full">
        <!-- Chart visualization -->
        <div class="aspect-auto h-[350px] w-full overflow-x-auto">
          <div class="min-w-[600px] h-full">
            <VisXYContainer
              :data="chartData"
              :margin="{ left: 10, right: 40, top: 20, bottom: 60 }"
              :y-domain="yDomain"
            >
              <!-- Bar Chart -->
              <VisGroupedBar
                :x="(d) => d.weekIndex"
                :y="(d) => d.volume"
                :color="getBarColor"
                :rounded-corners="4"
              />

              <!-- X-Axis with week labels -->
              <VisAxis
                type="x"
                :x="(d) => d.weekIndex"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :num-ticks="6"
                :tick-format="(index) => {
                  const dataPoint = chartData[Math.round(index)]
                  return dataPoint?.weekLabel || ''
                }"
              />

              <!-- Y-Axis with volume labels -->
              <VisAxis
                type="y"
                :num-ticks="5"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :tick-format="(value) => Math.round(value).toString()"
              />

              <ChartTooltip />
              <ChartCrosshair
                :template="componentToString(chartConfig, ChartTooltipContent, {
                  indicator: 'line',
                  labelFormatter: (index) => {
                    const dataPoint = chartData[Math.round(index)]
                    return dataPoint?.weekLabel || ''
                  },
                  valueFormatter: (value, key) => {
                    if (key === 'volume') {
                      return formatWeight(value, { precision: 0 })
                    }
                    return String(value)
                  },
                })"
                :color="(d) => getBarColor(d)"
              />
            </VisXYContainer>
          </div>
        </div>
      </ChartContainer>

      <!-- Legend -->
      <div
        class="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap"
      >
        <div class="flex items-center gap-1.5">
          <TrendingUp class="w-4 h-4 text-green-500" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.progressing') }} (≥2.5%)</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <Minus class="w-4 h-4 text-amber-500" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.maintaining') }} (±2.5%)</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <TrendingDown class="w-4 h-4 text-red-500" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.regressing') }} (≤-2.5%)</span
          >
        </div>
      </div>
    </CardContent>

    <!-- Empty State -->
    <CardContent v-else-if="isEmpty">
      <div
        class="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <TrendingUp class="w-12 h-12 mb-2 opacity-50" />
        <p class="text-sm font-medium">{{ t('analytics.emptyStates.noData') }}</p>
        <p class="text-xs mt-1">{{ t('analytics.emptyStates.noWorkouts') }}</p>
      </div>
    </CardContent>

    <!-- Full-screen overlay -->
    <FullscreenChartOverlay
      :is-open="isFullscreen"
      :title="t('analytics.volume.progressiveOverload.title')"
      @close="exitFullscreen"
    >
      <ChartContainer :config="chartConfig" class="w-full max-w-full h-full">
        <!-- Chart visualization with optimized height for landscape -->
        <div class="aspect-auto h-[calc(100vh-120px)] w-full overflow-x-auto">
          <div class="min-w-[600px] h-full">
            <VisXYContainer
              :data="chartData"
              :margin="{ left: 10, right: 40, top: 20, bottom: 60 }"
              :y-domain="yDomain"
            >
              <!-- Bar Chart -->
              <VisGroupedBar
                :x="(d) => d.weekIndex"
                :y="(d) => d.volume"
                :color="getBarColor"
                :rounded-corners="4"
              />

              <!-- X-Axis with week labels -->
              <VisAxis
                type="x"
                :x="(d) => d.weekIndex"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :num-ticks="6"
                :tick-format="(index) => {
                  const dataPoint = chartData[Math.round(index)]
                  return dataPoint?.weekLabel || ''
                }"
              />

              <!-- Y-Axis with volume labels -->
              <VisAxis
                type="y"
                :num-ticks="5"
                :tick-line="false"
                :domain-line="false"
                :grid-line="false"
                :tick-format="(value) => Math.round(value).toString()"
              />

              <ChartTooltip />
              <ChartCrosshair
                :template="componentToString(chartConfig, ChartTooltipContent, {
                  indicator: 'line',
                  labelFormatter: (index) => {
                    const dataPoint = chartData[Math.round(index)]
                    return dataPoint?.weekLabel || ''
                  },
                  valueFormatter: (value, key) => {
                    if (key === 'volume') {
                      return formatWeight(value, { precision: 0 })
                    }
                    return String(value)
                  },
                })"
                :color="(d) => getBarColor(d)"
              />
            </VisXYContainer>
          </div>
        </div>
      </ChartContainer>

      <!-- Legend -->
      <div
        class="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap"
      >
        <div class="flex items-center gap-1.5">
          <TrendingUp class="w-4 h-4 text-green-500" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.progressing') }} (≥2.5%)</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <Minus class="w-4 h-4 text-amber-500" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.maintaining') }} (±2.5%)</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <TrendingDown class="w-4 h-4 text-red-500" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.regressing') }} (≤-2.5%)</span
          >
        </div>
      </div>
    </FullscreenChartOverlay>
  </Card>
</template>
