<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const { t, locale } = useI18n()
const analyticsStore = useAnalyticsStore()
const { weekComparison } = storeToRefs(analyticsStore)

// Format comparison data for visualization
const comparisonData = computed(() => {
  const current = weekComparison.value.currentWeek
  const previous = weekComparison.value.previousWeek
  const change = weekComparison.value.change

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
      format: (val) => val.toLocaleString(locale.value),
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
      format: (val) => val.toLocaleString(locale.value) + ' ' + t('common.units.kg'),
    },
  ]
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('dashboard.charts.comparisonTitle') }}</CardTitle>
      <CardDescription>
        {{ t('dashboard.charts.comparisonDescription') }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-6">
        <!-- Each metric comparison -->
        <div
          v-for="(item, index) in comparisonData"
          :key="index"
          class="space-y-3"
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
                class="h-full bg-muted rounded-md transition-all"
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
                class="h-full bg-gradient-to-r from-primary to-primary/70 rounded-md transition-all"
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
        <div class="flex gap-6 pt-4 border-t">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-muted" />
            <span class="text-xs text-muted-foreground">{{ t('dashboard.charts.previousWeek') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-gradient-to-r from-primary to-primary/70" />
            <span class="text-xs text-muted-foreground">{{ t('dashboard.charts.currentWeek') }}</span>
          </div>
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-2 gap-4 pt-4">
          <div class="p-4 rounded-lg bg-muted/20 space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('dashboard.charts.currentWeek') }}</p>
            <p class="text-2xl font-bold">
              {{ weekComparison.currentWeek.workouts }}
            </p>
            <p class="text-xs text-muted-foreground">{{ t('dashboard.charts.workouts') }}</p>
          </div>
          <div class="p-4 rounded-lg bg-muted/20 space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('dashboard.charts.volumeChange') }}</p>
            <p
              :class="[
                'text-2xl font-bold',
                weekComparison.change.volumePercentage >= 0
                  ? 'text-green-500'
                  : 'text-red-500',
              ]"
            >
              {{ weekComparison.change.volumePercentage >= 0 ? '+' : '' }}{{ weekComparison.change.volumePercentage }}%
            </p>
            <p class="text-xs text-muted-foreground">{{ t('dashboard.charts.vsLastWeek') }}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
