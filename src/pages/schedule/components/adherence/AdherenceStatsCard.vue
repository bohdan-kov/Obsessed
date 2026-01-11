<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdherence } from '@/composables/useAdherence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Flame, Trophy, Target } from 'lucide-vue-next'

const { t } = useI18n()
const {
  overallAdherence,
  currentStreak,
  longestStreak,
  averageWorkoutsPerWeek,
  consistencyScore,
  trend,
} = useAdherence()

const trendIcon = computed(() => {
  switch (trend.value) {
    case 'improving':
      return TrendingUp
    case 'declining':
      return TrendingDown
    default:
      return Minus
  }
})

const trendColor = computed(() => {
  switch (trend.value) {
    case 'improving':
      return 'text-green-600 dark:text-green-400'
    case 'declining':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-muted-foreground'
  }
})

const adherenceColor = computed(() => {
  const percentage = overallAdherence.value.percentage
  if (percentage >= 90) return 'text-green-600 dark:text-green-400'
  if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
})

const consistencyColor = computed(() => {
  const score = consistencyScore.value
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
})
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <Target class="w-5 h-5" />
          {{ t('schedule.adherence.title') }}
        </CardTitle>
        <component
          :is="trendIcon"
          :class="['w-5 h-5', trendColor]"
        />
      </div>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- Overall Adherence -->
      <div class="space-y-2">
        <div class="flex items-baseline justify-between">
          <span class="text-sm text-muted-foreground">
            {{ t('schedule.adherence.overallRate') }}
          </span>
          <span :class="['text-3xl font-bold', adherenceColor]">
            {{ overallAdherence.percentage }}%
          </span>
        </div>
        <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-500"
            :style="{ width: `${overallAdherence.percentage}%` }"
          />
        </div>
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {{ t('schedule.adherence.completed') }}: {{ overallAdherence.completed }}
          </span>
          <span>
            {{ t('schedule.adherence.planned') }}: {{ overallAdherence.planned }}
          </span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <!-- Current Streak -->
        <div class="space-y-1 text-center p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div class="flex items-center justify-center gap-1">
            <Flame class="w-4 h-4 text-orange-500" />
            <span class="text-2xl font-bold">{{ currentStreak }}</span>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('schedule.adherence.currentStreak') }}
          </p>
        </div>

        <!-- Longest Streak -->
        <div class="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
          <div class="flex items-center justify-center gap-1">
            <Trophy class="w-4 h-4 text-yellow-500" />
            <span class="text-2xl font-bold">{{ longestStreak }}</span>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('schedule.adherence.longestStreak') }}
          </p>
        </div>

        <!-- Average Workouts -->
        <div class="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
          <span class="text-2xl font-bold block">{{ averageWorkoutsPerWeek }}</span>
          <p class="text-xs text-muted-foreground">
            {{ t('schedule.adherence.avgPerWeek') }}
          </p>
        </div>

        <!-- Consistency Score -->
        <div class="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
          <span :class="['text-2xl font-bold block', consistencyColor]">
            {{ consistencyScore }}%
          </span>
          <p class="text-xs text-muted-foreground">
            {{ t('schedule.adherence.consistency') }}
          </p>
        </div>
      </div>

      <!-- Trend Badge -->
      <div class="flex items-center justify-center">
        <Badge
          :variant="trend === 'improving' ? 'default' : 'secondary'"
          class="text-xs"
        >
          <component :is="trendIcon" class="w-3 h-3 mr-1" />
          {{ t(`schedule.adherence.trend.${trend}`) }}
        </Badge>
      </div>
    </CardContent>
  </Card>
</template>
