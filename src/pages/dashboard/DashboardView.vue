<script setup>
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth } from '@/composables/useAuth'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import StatCard from './components/StatCard.vue'
import ChartSection from './components/ChartSection.vue'
import ExerciseTable from './components/ExerciseTable.vue'
import MuscleProgress from './components/MuscleProgress.vue'
import { Activity, TrendingUp, Calendar, Award } from 'lucide-vue-next'
import { STRINGS } from '@/constants/strings'

const { displayName } = useAuth()
const analyticsStore = useAnalyticsStore()
const workoutStore = useWorkoutStore()
const { handleError } = useErrorHandler()

const t = STRINGS.dashboard

const {
  totalWorkouts,
  volumeLoad,
  restDays,
  currentStreak,
  weekComparison,
} = storeToRefs(analyticsStore)

// Stat cards configuration
const stats = [
  {
    title: 'Total Workouts',
    value: totalWorkouts,
    description: 'All time',
    icon: Activity,
    trend: weekComparison.value.change.workouts,
    trendLabel: 'vs last week',
  },
  {
    title: 'Volume Load',
    value: `${volumeLoad.value.toLocaleString()} kg`,
    description: 'Total lifted',
    icon: TrendingUp,
    trend: weekComparison.value.change.volumePercentage,
    trendLabel: 'vs last week',
  },
  {
    title: 'Rest Days',
    value: restDays,
    description: 'This period',
    icon: Calendar,
    trend: null,
  },
  {
    title: 'Current Streak',
    value: `${currentStreak.value} days`,
    description: 'Keep it up!',
    icon: Award,
    trend: null,
  },
]

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
    handleError(error, 'Не вдалося завантажити дані дашборду', {
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
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Analytics Dashboard</h1>
        <p class="text-muted-foreground mt-1">
          Welcome back, {{ displayName || 'User' }}! 👋
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
