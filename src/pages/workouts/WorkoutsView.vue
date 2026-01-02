<template>
  <div
    class="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8"
  >
    <!-- Page Header - Title hidden on mobile, shown on desktop -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="hidden md:block">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('workout.activeWorkout.title') }}
        </h1>
        <p class="text-muted-foreground mt-1">
          {{ t('workout.activeWorkout.description') }}
        </p>
      </div>

      <!-- Start Workout Button (only show when active workout exists or when on non-active tab) -->
      <Button
        v-if="!hasActiveWorkout && activeTab !== 'active'"
        size="lg"
        class="h-12 w-full sm:w-auto"
        @click="handleStartWorkout"
      >
        <Play class="mr-2 h-5 w-5" />
        {{ t('workout.activeWorkout.startWorkout') }}
      </Button>
    </div>

    <!-- Tabs for Active/History -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-1 sm:grid-cols-2">
        <TabsTrigger value="active">
          <div class="flex items-center gap-2">
            {{ t('workout.activeWorkout.title') }}
            <Badge v-if="hasActiveWorkout" variant="default" class="ml-1">
              {{ t('workout.activeWorkout.status.active') }}
            </Badge>
          </div>
        </TabsTrigger>
        <TabsTrigger value="history">
          {{ t('workout.history.title') }}
        </TabsTrigger>
      </TabsList>

      <!-- Active Workout Tab -->
      <TabsContent value="active" class="mt-6">
        <!-- Active Workout Panel -->
        <ActiveWorkoutPanel v-if="hasActiveWorkout" />

        <!-- No Active Workout State -->
        <Card v-else>
          <CardContent class="flex flex-col items-center justify-center p-12">
            <Dumbbell class="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 class="mb-2 text-xl font-semibold">
              {{ t('workout.activeWorkout.exercise.noExercises') }}
            </h3>
            <p class="mb-6 text-center text-muted-foreground">
              {{ t('workout.activeWorkout.exercise.noExercisesHint') }}
            </p>
            <Button size="lg" class="h-12" @click="handleStartWorkout">
              <Play class="mr-2 h-5 w-5" />
              {{ t('workout.activeWorkout.startWorkout') }}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- History Tab -->
      <TabsContent value="history" class="mt-6">
        <WorkoutHistoryList :workouts="recentWorkouts" :loading="loading" />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia' // cspell:disable-line
import { useActiveWorkout } from '@/composables/useActiveWorkout'
import { useWorkoutStore } from '@/stores/workoutStore'
import { usePageMeta } from '@/composables/usePageMeta'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Dumbbell } from 'lucide-vue-next'
import ActiveWorkoutPanel from './components/active/ActiveWorkoutPanel.vue'
import WorkoutHistoryList from './components/history/WorkoutHistoryList.vue'

const { t } = useI18n()

// Set page metadata for mobile header
usePageMeta(
  computed(() => t('workout.activeWorkout.title')),
  computed(() => t('workout.activeWorkout.description'))
)

const route = useRoute()
const router = useRouter()
const { activeWorkout, startWorkout } = useActiveWorkout()
const workoutStore = useWorkoutStore()

// Get reactive state from workoutStore
const { recentWorkouts, loading } = storeToRefs(workoutStore)

// Check if there's an active workout
const hasActiveWorkout = computed(() => !!activeWorkout.value)

// Valid tab values for validation
const VALID_TABS = ['active', 'history']

// Initialize active tab from URL query parameter or default to 'active'
const activeTab = ref(
  VALID_TABS.includes(route.query.tab) ? route.query.tab : 'active'
)

// Handle start workout
async function handleStartWorkout() {
  await startWorkout()
}

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

// Fetch workouts on mount and subscribe to real-time updates
onMounted(async () => {
  // Subscribe to workout updates (includes active and completed)
  workoutStore.subscribeToWorkouts('month')

  // Also fetch immediately to ensure we have data
  // The subscription will then keep it updated
  try {
    await workoutStore.fetchWorkouts('month')
  } catch (_error) {
    // Error handled by workoutStore
  }
})

// Cleanup subscriptions
onUnmounted(() => {
  workoutStore.unsubscribe()
})
</script>
