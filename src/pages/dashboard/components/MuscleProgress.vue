<script setup>
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
import { Heart, Scale } from 'lucide-vue-next'

const { t } = useI18n()
const { unitLabel } = useUnits()
const analyticsStore = useAnalyticsStore()
const { muscleProgress, quickStats } = storeToRefs(analyticsStore)
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t('dashboard.muscleProgress.title') }}</CardTitle>
      <CardDescription>
        {{ t('dashboard.muscleProgress.description') }}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Muscle progress bars -->
      <div v-if="muscleProgress.length > 0" class="space-y-4">
        <div
          v-for="(muscle, index) in muscleProgress"
          :key="index"
          class="space-y-2"
        >
          <!-- Muscle name and percentage -->
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">
              {{ t(`exercises.muscleGroups.${muscle.muscle}`) }}
            </span>
            <span class="text-sm text-muted-foreground font-mono">
              {{ muscle.percent }}%
            </span>
          </div>

          <!-- Progress bar -->
          <div class="relative h-2 bg-muted/20 rounded-full overflow-hidden">
            <div
              :class="[
                'h-full rounded-full transition-all duration-500',
                muscle.color,
              ]"
              :style="{ width: `${muscle.percent}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-8 text-muted-foreground"
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p class="text-sm">{{ t('dashboard.muscleProgress.noMuscleData') }}</p>
        <p class="text-xs mt-1">{{ t('dashboard.muscleProgress.startTraining') }}</p>
      </div>

      <!-- Quick stats -->
      <div class="grid grid-cols-2 gap-4 pt-4 border-t">
        <!-- Avg BPM -->
        <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
          <div class="p-2 rounded-md bg-red-500/10">
            <Heart class="w-4 h-4 text-red-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-muted-foreground">{{ t('dashboard.muscleProgress.avgBpm') }}</p>
            <p class="text-lg font-bold font-mono">
              {{ quickStats.avgBpm || '--' }}
            </p>
          </div>
        </div>

        <!-- Weight -->
        <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
          <div class="p-2 rounded-md bg-blue-500/10">
            <Scale class="w-4 h-4 text-blue-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-muted-foreground">{{ t('dashboard.muscleProgress.weight') }}</p>
            <p class="text-lg font-bold font-mono">
              {{ quickStats.weight || '--' }} {{ unitLabel }}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
