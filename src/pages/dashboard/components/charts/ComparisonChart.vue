<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useUnits } from '@/composables/useUnits'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const { t } = useI18n()
const { formatWeight } = useUnits()
const analyticsStore = useAnalyticsStore()
const { periodComparison, periodConfig, hasTrend, period } = storeToRefs(analyticsStore)

// Format comparison data for visualization
const comparisonData = computed(() => {
  const current = periodComparison.value.currentPeriod
  const previous = periodComparison.value.previousPeriod
  const change = periodComparison.value.change

  // Calculate max values for each metric for scaling
  const maxVolume = Math.max(current.volume, previous.volume)
  const maxWorkouts = Math.max(current.workouts, previous.workouts)

  return [
    {
      label: t('dashboard.charts.volumeKg'),
      current: current.volume,
      previous: previous.volume,
      max: maxVolume,
      change: change.volumePercentage,
      format: (val) => formatWeight(val, { precision: 0, compact: 'auto' }),
    },
    {
      label: t('dashboard.charts.workoutsCount'),
      current: current.workouts,
      previous: previous.workouts,
      max: maxWorkouts,
      change: change.workouts,
      format: (val) => val.toString(),
    },
    {
      label: t('dashboard.charts.avgVolume'),
      current: current.avgVolume,
      previous: previous.avgVolume,
      max: Math.max(current.avgVolume, previous.avgVolume),
      change:
        previous.avgVolume > 0
          ? Math.round(
              ((current.avgVolume - previous.avgVolume) / previous.avgVolume) *
                100
            )
          : 0,
      format: (val) => formatWeight(val, { precision: 0, compact: 'auto' }),
    },
  ]
})

// Dynamic labels based on selected period
const currentPeriodLabel = computed(() => {
  return t(`dashboard.stats.periods.${periodConfig.value.id}`)
})

const previousPeriodLabel = computed(() => {
  if (!hasTrend.value) return ''

  // Map comparison type to translation key
  const comparisonType = periodConfig.value.comparisonType
  switch (comparisonType) {
    case 'rolling':
      return t('dashboard.charts.comparisonPrevious', { period: currentPeriodLabel.value })
    case 'previousMonth':
      return t('dashboard.stats.periods.lastMonth')
    case 'monthBeforeLast':
      return t('dashboard.stats.periods.monthBeforeLast')
    case 'previousYear':
      return t('dashboard.stats.periods.lastYear')
    default:
      return t('dashboard.charts.previousPeriod')
  }
})
</script>

<template>
  <Card>
    <CardHeader class="pb-4">
      <CardTitle>{{ t('dashboard.charts.comparisonTitle') }}</CardTitle>
      <CardDescription>
        {{ t('dashboard.charts.comparisonDescription') }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-6 comparison-entrance" :key="`comparison-chart-${period}`">
        <!-- Each metric comparison -->
        <div
          v-for="(item, index) in comparisonData"
          :key="index"
          class="space-y-3 metric-item"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- Label and change -->
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">{{ item.label }}</span>
            <span
              :class="[
                'text-sm font-medium',
                item.change >= 0 ? 'text-green-500' : 'text-red-500',
              ]"
            >
              {{ item.change >= 0 ? '+' : '' }}{{ item.change }}%
            </span>
          </div>

          <!-- Previous week bar -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-6 bg-muted/20 rounded-md overflow-hidden">
              <div
                class="h-full bg-muted rounded-md bar-fill"
                :style="{
                  width: item.max > 0 ? `${(item.previous / item.max) * 100}%` : '0%',
                }"
              />
            </div>
            <span class="text-sm font-mono w-24 text-right text-muted-foreground">
              {{ item.format(item.previous) }}
            </span>
          </div>

          <!-- Current week bar -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-6 bg-muted/20 rounded-md overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary to-primary/70 rounded-md bar-fill"
                :style="{
                  width: item.max > 0 ? `${(item.current / item.max) * 100}%` : '0%',
                }"
              />
            </div>
            <span class="text-sm font-mono w-24 text-right font-semibold">
              {{ item.format(item.current) }}
            </span>
          </div>

          <!-- Divider between metrics -->
          <div v-if="index < comparisonData.length - 1" class="pt-3 border-b" />
        </div>

        <!-- Legend -->
        <div class="flex gap-6 pt-4 border-t legend-item">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-muted" />
            <span class="text-xs text-muted-foreground">{{ previousPeriodLabel }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-gradient-to-r from-primary to-primary/70" />
            <span class="text-xs text-muted-foreground">{{ currentPeriodLabel }}</span>
          </div>
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-2 gap-4 pt-4">
          <div class="p-4 rounded-lg bg-muted/20 space-y-1 summary-card">
            <p class="text-xs text-muted-foreground">{{ currentPeriodLabel }}</p>
            <p class="text-2xl font-bold">
              {{ periodComparison.currentPeriod.workouts }}
            </p>
            <p class="text-xs text-muted-foreground">{{ t('dashboard.charts.workouts') }}</p>
          </div>
          <div class="p-4 rounded-lg bg-muted/20 space-y-1 summary-card" style="animation-delay: 50ms;">
            <p class="text-xs text-muted-foreground">{{ t('dashboard.charts.volumeChange') }}</p>
            <p
              :class="[
                'text-2xl font-bold',
                periodComparison.change.volumePercentage >= 0
                  ? 'text-green-500'
                  : 'text-red-500',
              ]"
            >
              {{ periodComparison.change.volumePercentage >= 0 ? '+' : '' }}{{ periodComparison.change.volumePercentage }}%
            </p>
            <p class="text-xs text-muted-foreground">{{ t('dashboard.charts.vsPreviousPeriod') }}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Container entrance animation - 300ms fade-in */
.comparison-entrance {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Metric items - staggered entrance with 50ms delay between items */
.metric-item {
  animation: itemFadeIn 0.3s ease-out backwards;
}

@keyframes itemFadeIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Bar fill animation - smooth width transition */
.bar-fill {
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Legend - delayed entrance after metric items (150ms delay) */
.legend-item {
  animation: fadeIn 0.3s ease-out 0.15s backwards;
}

/* Summary cards - staggered entrance */
.summary-card {
  animation: cardFadeIn 0.3s ease-out 0.2s backwards;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Respect user's motion preferences - accessibility */
@media (prefers-reduced-motion: reduce) {
  /* Disable all entrance animations */
  .comparison-entrance,
  .metric-item,
  .legend-item,
  .summary-card {
    animation: none !important;
  }

  /* Disable bar transitions but keep basic functionality */
  .bar-fill {
    transition: none;
  }
}
</style>
