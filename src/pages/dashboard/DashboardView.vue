<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useUnits } from '@/composables/useUnits'
import { usePageMeta } from '@/composables/usePageMeta'
import StatCard from './components/StatCard.vue'
import ChartSection from './components/ChartSection.vue'
import ExerciseTable from './components/ExerciseTable.vue'
import PersonalStatsCard from './components/PersonalStatsCard.vue'
import PeriodSelector from '@/pages/analytics/components/shared/PeriodSelector.vue'

const { t } = useI18n()
const { displayName } = useAuth()

// Set page metadata for mobile header
usePageMeta(
  computed(() => t('dashboard.title')),
  computed(() => `${t('dashboard.welcomeBack')}, ${displayName.value || 'User'}! 👋`)
)

const analyticsStore = useAnalyticsStore()
const workoutStore = useWorkoutStore()
const { handleError } = useErrorHandler()
const { formatWeight } = useUnits()

const {
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

// Track Firebase subscription for cleanup
let unsubscribeWorkouts = null

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

/**
 * Map analytics period to workout store fetch period
 * Analytics periods can be longer (90 days, 1 year), so we need to ensure
 * workoutStore loads enough data to cover the selected analytics period
 * @param {string} analyticsPeriod - Analytics period ID (e.g., 'last90Days', 'thisYear')
 * @returns {'week'|'month'|'quarter'|'year'} Workout fetch period
 */
function getWorkoutFetchPeriod(analyticsPeriod) {
  switch (analyticsPeriod) {
    case 'last7Days':
    case 'thisWeek':
      return 'week'

    case 'last14Days':
    case 'last30Days':
    case 'thisMonth':
    case 'lastMonth':
      return 'month'

    case 'last90Days':
      return 'quarter'

    case 'thisYear':
    case 'allTime':
      return 'year'

    default:
      return 'month'
  }
}

/**
 * Load workout data based on analytics period
 */
async function loadWorkoutData(force = false) {
  const fetchPeriod = getWorkoutFetchPeriod(analyticsStore.period)

  try {
    // ensureDataLoaded returns the unsubscribe function when subscribe: true
    const unsubscribe = await workoutStore.ensureDataLoaded({
      period: fetchPeriod,
      subscribe: true,
      force, // Force reload when period changes
    })

    // Store unsubscribe function for cleanup
    if (typeof unsubscribe === 'function') {
      unsubscribeWorkouts = unsubscribe
    }
  } catch (error) {
    handleError(error, t('dashboard.errors.loadFailed'), {
      context: 'DashboardView.loadWorkoutData',
    })
  }
}

/**
 * Fetch workout data and subscribe to real-time updates
 */
onMounted(async () => {
  // Initialize period from localStorage first
  analyticsStore.initializePeriod()

  // Load workout data for the selected period
  await loadWorkoutData()
})

/**
 * Watch for period changes and reload workout data
 * This ensures workoutStore has enough data to cover the selected analytics period
 */
watch(
  () => analyticsStore.period,
  async () => {
    // Reload workout data with new period
    await loadWorkoutData(true) // Force reload to ensure fresh data
  }
)

/**
 * Clean up Firebase subscriptions to prevent memory leaks
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
    <!-- Header with Period Selector - Title hidden on mobile, shown on desktop -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="hidden md:block">
        <h1 class="text-3xl font-bold">{{ t('dashboard.title') }}</h1>
        <p class="text-muted-foreground mt-1">
          {{ t('dashboard.welcomeBack') }}, {{ displayName || 'User' }}! 👋
        </p>
      </div>

      <!-- Period Selector -->
      <PeriodSelector variant="select" size="default" />
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
    <div class="grid grid-cols-1 2xl:grid-cols-3 gap-6">
      <div class="2xl:col-span-2">
        <ExerciseTable />
      </div>
      <PersonalStatsCard />
    </div>
  </div>
</template>
