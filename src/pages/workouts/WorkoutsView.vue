<template>
  <div
    class="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8"
  >
    <!-- Page Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-3xl font-bold sm:text-4xl">
        {{ t('workout.activeWorkout.title') }}
      </h1>

      <!-- Start Workout Button (when no active workout) -->
      <Button
        v-if="!hasActiveWorkout"
        size="lg"
        class="h-12 w-full sm:w-auto"
        @click="handleStartWorkout"
      >
        <Play class="mr-2 h-5 w-5" />
        {{ t('workout.activeWorkout.startWorkout') }}
      </Button>
    </div>

    <!-- Tabs for Active/History/Plans -->
    <Tabs :default-value="defaultTab" class="w-full">
      <TabsList class="grid w-full grid-cols-1 sm:grid-cols-3">
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
        <TabsTrigger value="plans">
          {{ t('plans.title') }}
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

      <!-- Plans Tab -->
      <TabsContent value="plans" class="mt-6">
        <PlansTabView />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia' // cspell:disable-line
import { useActiveWorkout } from '@/composables/useActiveWorkout'
import { useWorkoutStore } from '@/stores/workoutStore'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Dumbbell } from 'lucide-vue-next'
import ActiveWorkoutPanel from './components/active/ActiveWorkoutPanel.vue'
import WorkoutHistoryList from './components/history/WorkoutHistoryList.vue'
import PlansTabView from './components/plans/PlansTabView.vue'

const { t } = useI18n()
const route = useRoute()
const { activeWorkout, startWorkout } = useActiveWorkout()
const workoutStore = useWorkoutStore()

// Get reactive state from workoutStore
const { recentWorkouts, loading } = storeToRefs(workoutStore)

// Check if there's an active workout
const hasActiveWorkout = computed(() => !!activeWorkout.value)

// Default tab based on URL query params or active workout status
const defaultTab = computed(() => {
  // If tab query param is provided, use it
  if (route.query.tab && ['active', 'history', 'plans'].includes(route.query.tab)) {
    return route.query.tab
  }
  return hasActiveWorkout.value ? 'active' : 'active'
})

// Handle start workout
async function handleStartWorkout() {
  await startWorkout()
}

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
