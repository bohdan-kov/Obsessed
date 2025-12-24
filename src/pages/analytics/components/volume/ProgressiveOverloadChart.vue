<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useUnits } from '@/composables/useUnits'
import BaseChart from '../shared/BaseChart.vue'
import { STATUS_COLORS } from '@/utils/chartUtils'

const { t } = useI18n()
const { formatWeight } = useUnits()

const analyticsStore = useAnalyticsStore()
const { weeklyVolumeProgression, progressiveOverloadStats, loading } = storeToRefs(analyticsStore)

// SVG dimensions
const CHART_WIDTH = 800
const CHART_HEIGHT = 350
const PADDING = { top: 20, right: 20, bottom: 80, left: 60 }

const chartWidth = CHART_WIDTH - PADDING.left - PADDING.right
const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

// Find max volume for scaling
const maxVolume = computed(() => {
  if (!weeklyVolumeProgression.value?.length) return 0
  return Math.max(...weeklyVolumeProgression.value.map((w) => w.volume))
})

// Bar width based on number of weeks
const barWidth = computed(() => {
  if (!weeklyVolumeProgression.value?.length) return 0
  const spacing = 8
  const totalSpacing = (weeklyVolumeProgression.value.length - 1) * spacing
  return Math.min(60, (chartWidth - totalSpacing) / weeklyVolumeProgression.value.length)
})

// Generate bars
const bars = computed(() => {
  if (!weeklyVolumeProgression.value?.length) return []

  const spacing = 8
  const effectiveBarWidth = barWidth.value

  return weeklyVolumeProgression.value.map((week, index) => {
    const x = PADDING.left + index * (effectiveBarWidth + spacing)
    const barHeight = (week.volume / (maxVolume.value || 1)) * chartHeight
    const y = PADDING.top + chartHeight - barHeight

    return {
      x,
      y,
      width: effectiveBarWidth,
      height: barHeight,
      color: STATUS_COLORS[week.status] || STATUS_COLORS.maintaining,
      data: week,
    }
  })
})

// Y-axis labels
const yAxisLabels = computed(() => {
  const labels = []
  const steps = 5
  for (let i = 0; i <= steps; i++) {
    const value = (maxVolume.value / steps) * i
    const y = PADDING.top + chartHeight - (i / steps) * chartHeight
    labels.push({ value: Math.round(value), y })
  }
  return labels.reverse()
})

// X-axis labels (show all week labels but rotate on mobile)
const xAxisLabels = computed(() => {
  if (!weeklyVolumeProgression.value?.length) return []

  const effectiveBarWidth = barWidth.value
  const spacing = 8

  return weeklyVolumeProgression.value.map((week, index) => ({
    label: week.week, // Fixed: property name is 'week' not 'weekLabel'
    x: PADDING.left + index * (effectiveBarWidth + spacing) + effectiveBarWidth / 2,
    index,
  }))
})

// Status label translation
function getStatusLabel(status) {
  return t(`analytics.volume.progressiveOverload.statusLabels.${status}`)
}

// Check if data is empty
const isEmpty = computed(() => {
  return !weeklyVolumeProgression.value || weeklyVolumeProgression.value.length === 0
})
</script>

<template>
  <BaseChart
    :title="t('analytics.volume.progressiveOverload.title')"
    :description="t('analytics.volume.progressiveOverload.description')"
    :data="weeklyVolumeProgression"
    :loading="loading"
    empty-icon="trending-up"
    height="550px"
  >
    <template #header>
      <!-- Stats Panel -->
      <div v-if="progressiveOverloadStats" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
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
    </template>

    <template #default>
      <div class="w-full overflow-x-auto">
        <svg
          :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
          class="w-full min-w-[600px] h-auto"
          role="img"
          :aria-label="t('analytics.volume.progressiveOverload.title')"
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
              {{ t('common.volume') }} ({{ t('common.kg') }})
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
                :y="PADDING.top + chartHeight + 15"
                text-anchor="middle"
                class="text-[9px] fill-muted-foreground"
                :transform="`rotate(-45 ${label.x} ${PADDING.top + chartHeight + 15})`"
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
              {{ t('common.week') }}
            </text>
          </g>

          <!-- Bars -->
          <g class="bars">
            <g v-for="(bar, index) in bars" :key="index">
              <!-- Bar -->
              <rect
                :x="bar.x"
                :y="bar.y"
                :width="bar.width"
                :height="bar.height"
                :fill="bar.color"
                opacity="0.8"
                rx="2"
                class="transition-all duration-200 hover:opacity-100 cursor-pointer"
              >
                <title>
                  {{ bar.data.week }}: {{ formatWeight(bar.data.volume) }} ({{
                    bar.data.change >= 0 ? '+' : ''
                  }}{{ bar.data.change.toFixed(1) }}%)
                </title>
              </rect>

              <!-- Percentage label (show for larger bars) -->
              <text
                v-if="bar.height > 30"
                :x="bar.x + bar.width / 2"
                :y="bar.y + 15"
                text-anchor="middle"
                class="text-[10px] font-semibold fill-white pointer-events-none"
              >
                {{ bar.data.change >= 0 ? '+' : '' }}{{ bar.data.change.toFixed(1) }}%
              </text>
            </g>
          </g>
        </svg>
      </div>

      <!-- Legend -->
      <div
        class="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap"
      >
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded" :style="{ backgroundColor: STATUS_COLORS.progressing }" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.progressing') }} (≥2.5%)</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded" :style="{ backgroundColor: STATUS_COLORS.maintaining }" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.maintaining') }} (±2.5%)</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded" :style="{ backgroundColor: STATUS_COLORS.regressing }" />
          <span
            >{{ t('analytics.volume.progressiveOverload.statusLabels.regressing') }} (≤-2.5%)</span
          >
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
