<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useGoalsStore } from '@/stores/goalsStore'
import { usePageMeta } from '@/composables/usePageMeta'
import { Target, Plus, Sparkles, TrendingUp, CalendarCheck, AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import GoalCard from './components/GoalCard.vue'
import EmptyGoalsState from './components/EmptyGoalsState.vue'
import GoalWizard from './components/wizard/GoalWizard.vue'

const { t } = useI18n()
const goalsStore = useGoalsStore()
const { allGoalProgress, goalStats, loading, error } = storeToRefs(goalsStore)

// Set page metadata for mobile header
usePageMeta(
  computed(() => t('goals.title')),
  computed(() => t('goals.subtitle'))
)

const isWizardOpen = ref(false)

// Filter options
const selectedFilter = ref('all') // 'all' | 'strength' | 'volume' | 'frequency' | 'streak'

// Filtered goals
const filteredGoals = computed(() => {
  if (selectedFilter.value === 'all') {
    return allGoalProgress.value
  }
  return allGoalProgress.value.filter((g) => g.type === selectedFilter.value)
})

// Open wizard
function handleCreateGoal() {
  isWizardOpen.value = true
}

// Close wizard
function handleCloseWizard() {
  isWizardOpen.value = false
}

// Handle goal created
function handleGoalCreated() {
  isWizardOpen.value = false
  // Goals will update automatically via real-time subscription
}

// Handle retry
function handleRetry() {
  goalsStore.subscribeToGoals()
}

// Lifecycle
onMounted(() => {
  goalsStore.subscribeToGoals()
})

onUnmounted(() => {
  goalsStore.cleanup()
})
</script>

<template>
  <div class="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
    <!-- Page Header (hidden on mobile, shown in AppLayout mobile header) -->
    <div class="hidden flex-col gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between md:flex">
      <div>
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('goals.title') }}
        </h1>
        <p class="mt-1 text-muted-foreground">
          {{ t('goals.subtitle') }}
        </p>
      </div>

      <!-- Create Goal Button (desktop) -->
      <Button
        v-if="allGoalProgress.length > 0"
        size="lg"
        class="min-h-11 w-full sm:w-auto"
        @click="handleCreateGoal"
      >
        <Plus class="mr-2 h-5 w-5" />
        {{ t('goals.createGoal') }}
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>

    <!-- Error State -->
    <Card v-else-if="error">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-destructive">
          <AlertCircle class="h-5 w-5" />
          {{ t('common.errors.loadFailed') }}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="mb-4 text-sm text-muted-foreground">
          {{ error }}
        </p>
        <Button @click="handleRetry" variant="outline">
          {{ t('common.actions.retry') }}
        </Button>
      </CardContent>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="allGoalProgress.length === 0">
      <CardContent class="p-6">
        <EmptyGoalsState @create-goal="handleCreateGoal" />
      </CardContent>
    </Card>

    <!-- Goals Content -->
    <div v-else class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Total Goals -->
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
              >
                <Target class="h-5 w-5 text-primary" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">
                  {{ t('goals.stats.totalGoals') }}
                </p>
                <p class="text-2xl font-bold">{{ goalStats.total }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Active Goals -->
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
              >
                <Sparkles class="h-5 w-5 text-primary" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">
                  {{ t('goals.stats.activeGoals') }}
                </p>
                <p class="text-2xl font-bold">{{ goalStats.active }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Completion Rate -->
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"
              >
                <TrendingUp class="h-5 w-5 text-success" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">
                  {{ t('goals.stats.completionRate') }}
                </p>
                <p class="text-2xl font-bold">
                  {{ Math.round(goalStats.completionRate) }}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- On Track -->
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"
              >
                <CalendarCheck class="h-5 w-5 text-success" />
              </div>
              <div>
                <p class="text-xs text-muted-foreground">
                  {{ t('goals.stats.onTrack') }}
                </p>
                <p class="text-2xl font-bold">{{ goalStats.onTrack }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Goals Grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GoalCard
          v-for="goal in filteredGoals"
          :key="goal.id"
          :goal="goal"
        />
      </div>

      <!-- Mobile Create Goal FAB -->
      <div class="fixed bottom-20 right-4 sm:hidden">
        <Button
          size="lg"
          class="h-14 w-14 rounded-full shadow-lg"
          @click="handleCreateGoal"
        >
          <Plus class="h-6 w-6" />
        </Button>
      </div>
    </div>

    <!-- Goal Wizard Modal -->
    <GoalWizard
      :is-open="isWizardOpen"
      @close="handleCloseWizard"
      @goal-created="handleGoalCreated"
    />
  </div>
</template>
