<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useUnits } from '@/composables/useUnits'
import { CONFIG } from '@/constants/config'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Activity, Scale } from 'lucide-vue-next'

const { t } = useI18n()
const { unitLabel, formatWeight } = useUnits()
const analyticsStore = useAnalyticsStore()
const { quickStats } = storeToRefs(analyticsStore)

/**
 * Determine dynamic colors for RPE display based on value
 * Uses CONFIG.rpe.COLORS for consistent theming across the app
 */
const rpeColorClasses = computed(() => {
  const rpe = quickStats.value.avgRpe
  if (!rpe || rpe === 0) return CONFIG.rpe.COLORS.NONE
  if (rpe <= CONFIG.rpe.LOW_MAX) return CONFIG.rpe.COLORS.LOW
  if (rpe <= CONFIG.rpe.MEDIUM_MAX) return CONFIG.rpe.COLORS.MEDIUM
  return CONFIG.rpe.COLORS.HIGH
})
</script>

<template>
  <Card>
    <CardHeader class="pb-4">
      <CardTitle>{{ t('dashboard.personalStats.title') }}</CardTitle>
      <CardDescription>
        {{ t('dashboard.personalStats.description') }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Personal stats grid -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Avg RPE -->
        <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
          <div :class="['p-2 rounded-md', rpeColorClasses.bg]">
            <Activity :class="['w-4 h-4', rpeColorClasses.text]" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-muted-foreground">{{ t('dashboard.personalStats.avgRpe') }}</p>
            <p class="text-lg font-bold font-mono">
              {{ quickStats.avgRpe ? quickStats.avgRpe.toFixed(1) : '--' }}
            </p>
          </div>
        </div>

        <!-- Weight -->
        <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
          <div class="p-2 rounded-md bg-blue-500/10">
            <Scale class="w-4 h-4 text-blue-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-muted-foreground">{{ t('dashboard.personalStats.weight') }}</p>
            <p class="text-lg font-bold font-mono">
              {{ quickStats.weight !== null ? formatWeight(quickStats.weight, { showUnit: false }) : '--' }} {{ unitLabel }}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
