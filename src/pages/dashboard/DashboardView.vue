<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useUnits } from '@/composables/useUnits'
import StatCard from './components/StatCard.vue'
import ChartSection from './components/ChartSection.vue'
import ExerciseTable from './components/ExerciseTable.vue'
import MuscleProgress from './components/MuscleProgress.vue'
import GlobalPeriodSelector from './components/GlobalPeriodSelector.vue'

const { t } = useI18n()
const { displayName } = useAuth()
const analyticsStore = useAnalyticsStore()
const workoutStore = useWorkoutStore()
const { handleError } = useErrorHandler()
const { formatWeight } = useUnits()

const {
  totalWorkouts,
  volumeLoad,
  restDays,
  currentStreak,
  periodWorkouts,
  periodVolume,
  periodLabel,
  hasTrend,
  workoutsTrend,
  volumeTrend,
  restDaysInsight,
  streakInsight,
  workoutsInsight,
  volumeInsight,
} = storeToRefs(analyticsStore)

// Stat cards configuration
const stats = computed(() => {
  return [
    {
      title: t('dashboard.stats.totalWorkouts'),
      value: periodWorkouts.value.length,
      trend: hasTrend.value ? workoutsTrend.value : null,
      periodLabel: t(periodLabel.value),
      insight: workoutsInsight.value,
      variant: workoutsInsight.value.status === 'warning' ? 'warning' : 'default',
    },
    {
      title: t('dashboard.stats.volumeLoad'),
      value: formatWeight(periodVolume.value),
      trend: hasTrend.value ? volumeTrend.value : null,
      periodLabel: t(periodLabel.value),
      insight: volumeInsight.value,
      variant: volumeInsight.value.status === 'warning' ? 'warning' : 'default',
    },
    {
      title: t('dashboard.stats.restDays'),
      value: restDays.value,
      trend: null,
      periodLabel: t('dashboard.stats.periods.sinceLast'),
      insight: restDaysInsight.value,
      variant: restDaysInsight.value.status === 'warning' ? 'warning' : 'default',
    },
    {
      title: t('dashboard.stats.currentStreak'),
      value: currentStreak.value,
      trend: null,
      periodLabel: t('dashboard.stats.periods.consecutive'),
      insight: streakInsight.value,
      variant: streakInsight.value.status === 'warning' ? 'warning' : 'default',
    },
  ]
})

// Subscription cleanup function
let unsubscribeWorkouts = null

/**
 * Fetch workout data and subscribe to real-time updates
 */
onMounted(async () => {
  // Initialize period from localStorage first
  analyticsStore.initializePeriod()

  try {
    await workoutStore.fetchWorkouts('month')
    // Subscribe to real-time updates and store unsubscribe function
    unsubscribeWorkouts = workoutStore.subscribeToWorkouts('month')
  } catch (error) {
    handleError(error, t('dashboard.errors.loadFailed'), {
      context: 'DashboardView.onMounted',
    })
  }
})

/**
 * Cleanup subscriptions on component unmount
 */
onUnmounted(() => {
  if (unsubscribeWorkouts) {
    unsubscribeWorkouts()
    unsubscribeWorkouts = null
  }
})
</script>

<template>
  <div class="container max-w-7xl mx-auto py-6 px-4 sm:py-8 space-y-6 sm:space-y-8">
    <!-- Header with Period Selector -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold">{{ t('dashboard.title') }}</h1>
        <p class="text-muted-foreground mt-1">
          {{ t('dashboard.welcomeBack') }}, {{ displayName || 'User' }}! 👋
        </p>
      </div>

      <!-- Global Period Selector -->
      <GlobalPeriodSelector />
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :trend="stat.trend"
        :period-label="stat.periodLabel"
        :insight="stat.insight"
        :variant="stat.variant"
      />
    </div>

    <!-- Chart Section -->
    <ChartSection />

    <!-- Bottom: Table + Progress -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <ExerciseTable />
      </div>
      <MuscleProgress />
    </div>
  </div>
</template>
