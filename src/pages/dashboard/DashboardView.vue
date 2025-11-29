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
import { Activity, TrendingUp, Calendar, Award } from 'lucide-vue-next'

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
  weekComparison,
} = storeToRefs(analyticsStore)

// Stat cards configuration
const stats = computed(() => [
  {
    title: t('dashboard.stats.totalWorkouts'),
    value: totalWorkouts.value,
    description: t('dashboard.stats.allTime'),
    icon: Activity,
    trend: weekComparison.value.change.workouts,
    trendLabel: t('dashboard.stats.vsLastWeek'),
  },
  {
    title: t('dashboard.stats.volumeLoad'),
    value: formatWeight(volumeLoad.value),
    description: t('dashboard.stats.totalLifted'),
    icon: TrendingUp,
    trend: weekComparison.value.change.volumePercentage,
    trendLabel: t('dashboard.stats.vsLastWeek'),
  },
  {
    title: t('dashboard.stats.restDays'),
    value: restDays.value,
    description: t('dashboard.stats.thisPeriod'),
    icon: Calendar,
    trend: null,
  },
  {
    title: t('dashboard.stats.currentStreak'),
    value: `${currentStreak.value} ${t('dashboard.stats.days')}`,
    description: t('dashboard.stats.keepItUp'),
    icon: Award,
    trend: null,
  },
])

// Subscription cleanup function
let unsubscribeWorkouts = null

/**
 * Fetch workout data and subscribe to real-time updates
 */
onMounted(async () => {
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
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">{{ t('dashboard.title') }}</h1>
        <p class="text-muted-foreground mt-1">
          {{ t('dashboard.welcomeBack') }}, {{ displayName || 'User' }}! 👋
        </p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :description="stat.description"
        :icon="stat.icon"
        :trend="stat.trend"
        :trend-label="stat.trendLabel"
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
