<script setup>
import { ref, onMounted, watch } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, Clock, Dumbbell, TrendingUp } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import PeriodSelector from './components/shared/PeriodSelector.vue'
import MuscleVolumeChart from './components/muscles/MuscleVolumeChart.vue'
import DurationTrendChart from './components/duration/DurationTrendChart.vue'
import VolumeHeatmap from './components/volume/VolumeHeatmap.vue'
import ProgressiveOverloadChart from './components/volume/ProgressiveOverloadChart.vue'
import ExerciseProgressTable from './components/exercises/ExerciseProgressTable.vue'

const { t } = useI18n()
const workoutStore = useWorkoutStore()
const analyticsStore = useAnalyticsStore()
const { handleError } = useErrorHandler()

// Active tab state
const activeTab = ref('muscles')

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
    await workoutStore.ensureDataLoaded({
      period: fetchPeriod,
      subscribe: true,
      force, // Force reload when period changes
    })
  } catch (error) {
    handleError(error, t('analytics.errors.loadFailed'), {
      context: 'AnalyticsView.loadWorkoutData',
    })
  }
}

/**
 * Fetch workout data when Analytics page is accessed directly
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
</script>

<template>
  <div class="container max-w-7xl mx-auto py-6 px-4 sm:py-8 space-y-6 sm:space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-3xl font-bold sm:text-4xl">{{ t('analytics.title') }}</h1>

      <!-- Period Selector -->
      <div class="w-full sm:w-auto shrink-0">
        <PeriodSelector variant="select" size="default" />
      </div>
    </div>

    <!-- Analytics Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
        <!-- Muscles Tab -->
        <TabsTrigger
          value="muscles"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
        >
          <Target class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline truncate">{{ t('analytics.tabs.muscles') }}</span>
        </TabsTrigger>

        <!-- Duration Tab -->
        <TabsTrigger
          value="duration"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
        >
          <Clock class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline truncate">{{ t('analytics.tabs.duration') }}</span>
        </TabsTrigger>

        <!-- Volume Tab -->
        <TabsTrigger
          value="volume"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
        >
          <Dumbbell class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline truncate">{{ t('analytics.tabs.volume') }}</span>
        </TabsTrigger>

        <!-- Exercises Tab -->
        <TabsTrigger
          value="exercises"
          class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
        >
          <TrendingUp class="w-4 h-4 shrink-0" />
          <span class="hidden sm:inline truncate">{{ t('analytics.tabs.exercises') }}</span>
        </TabsTrigger>
      </TabsList>

      <!-- Muscles Tab Content -->
      <TabsContent value="muscles" class="mt-6 space-y-6">
        <MuscleVolumeChart />
      </TabsContent>

      <!-- Duration Tab Content -->
      <TabsContent value="duration" class="mt-6 space-y-6">
        <DurationTrendChart />
      </TabsContent>

      <!-- Volume Tab Content -->
      <TabsContent value="volume" class="mt-6 space-y-6">
        <VolumeHeatmap />
        <ProgressiveOverloadChart />
      </TabsContent>

      <!-- Exercises Tab Content -->
      <TabsContent value="exercises" class="mt-6 space-y-6">
        <ExerciseProgressTable />
      </TabsContent>
    </Tabs>
  </div>
</template>
