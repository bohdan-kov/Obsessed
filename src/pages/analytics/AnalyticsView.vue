<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, Clock, Dumbbell, TrendingUp } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { usePageMeta } from '@/composables/usePageMeta'
import PeriodSelector from './components/shared/PeriodSelector.vue'
import MuscleVolumeChart from './components/muscles/MuscleVolumeChart.vue'
import DurationTrendChart from './components/duration/DurationTrendChart.vue'
import VolumeHeatmap from './components/volume/VolumeHeatmap.vue'
import ProgressiveOverloadChart from './components/volume/ProgressiveOverloadChart.vue'
import ExerciseProgressTable from './components/exercises/ExerciseProgressTable.vue'

const { t } = useI18n()

// Set page metadata for mobile header
usePageMeta(
  computed(() => t('analytics.title')),
  computed(() => t('analytics.description'))
)

const route = useRoute()
const router = useRouter()
const workoutStore = useWorkoutStore()
const analyticsStore = useAnalyticsStore()
const { handleError } = useErrorHandler()

// Valid tab values for validation
const VALID_TABS = ['muscles', 'duration', 'volume', 'exercises']

// Initialize active tab from URL query parameter or default to 'muscles'
const activeTab = ref(
  VALID_TABS.includes(route.query.tab) ? route.query.tab : 'muscles'
)

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
 * CRITICAL: Must await workout loading before rendering charts
 * to ensure firstWorkoutDate is calculated for "All time" period
 */
onMounted(async () => {
  // Initialize period from localStorage first
  analyticsStore.initializePeriod()

  // CRITICAL: Load workout data before charts render
  // This ensures completedWorkouts is populated for firstWorkoutDate calculation
  await loadWorkoutData()
})

/**
 * Cleanup Firebase subscriptions when component is unmounted
 * CRITICAL: Prevents memory leaks by unsubscribing from real-time listeners
 */
onUnmounted(() => {
  workoutStore.unsubscribe()
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
 * Watch for tab changes and update URL query parameter
 * Use router.replace() to avoid creating history entries for tab switches
 */
watch(activeTab, (newTab) => {
  // Only update URL if tab actually changed to avoid unnecessary router calls
  if (route.query.tab !== newTab) {
    router.replace({
      query: { ...route.query, tab: newTab }
    })
  }
})

/**
 * Watch for URL query param changes (e.g., browser back/forward) and update active tab
 * This ensures the tab state stays in sync when user uses browser navigation
 */
watch(
  () => route.query.tab,
  (newTab) => {
    // Validate and update active tab if URL changed
    if (newTab && VALID_TABS.includes(newTab) && newTab !== activeTab.value) {
      activeTab.value = newTab
    }
  }
)
</script>

<template>
  <div class="container max-w-7xl mx-auto py-6 px-4 sm:py-8 space-y-6 sm:space-y-8">
    <!-- Page Header - Title hidden on mobile, shown on desktop -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="hidden md:block">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('analytics.title') }}</h1>
        <p class="text-muted-foreground mt-1">{{ t('analytics.description') }}</p>
      </div>

      <!-- Period Selector -->
      <PeriodSelector variant="select" size="default" />
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
        <!-- Show loading skeleton while workouts are being fetched -->
        <div v-if="workoutStore.loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <MuscleVolumeChart v-else />
      </TabsContent>

      <!-- Duration Tab Content -->
      <TabsContent value="duration" class="mt-6 space-y-6">
        <div v-if="workoutStore.loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <DurationTrendChart v-else />
      </TabsContent>

      <!-- Volume Tab Content -->
      <TabsContent value="volume" class="mt-6 space-y-6">
        <div v-if="workoutStore.loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <template v-else>
          <VolumeHeatmap />
          <ProgressiveOverloadChart />
        </template>
      </TabsContent>

      <!-- Exercises Tab Content -->
      <TabsContent value="exercises" class="mt-6 space-y-6">
        <div v-if="workoutStore.loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <ExerciseProgressTable v-else />
      </TabsContent>
    </Tabs>
  </div>
</template>
