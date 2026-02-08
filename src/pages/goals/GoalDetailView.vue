<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useGoalsStore } from '@/stores/goalsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useUnits } from '@/composables/useUnits'
import { usePageMeta } from '@/composables/usePageMeta'
import { useToast } from '@/components/ui/toast/use-toast'
import { ArrowLeft, Calendar, Target, Trash2, Edit, Pause, Play, TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { VisAxis, VisLine, VisXYContainer, VisScatter } from '@unovis/vue'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import ProgressRing from '@/components/goals/ProgressRing.vue'
import { calculateStrengthProgress } from '@/utils/progressCalculator'
import { predictGoalCompletion, calculateRequiredPaceToGoal } from '@/utils/goalUtils'
import { calculate1RM, findBestSet } from '@/utils/strengthUtils'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const { t, locale } = useI18n()
const goalsStore = useGoalsStore()
const workoutStore = useWorkoutStore()
const exerciseStore = useExerciseStore()
const { allGoalProgress } = storeToRefs(goalsStore)
const { formatWeight } = useUnits()
const { toast } = useToast()

// Dialog states
const isDeleteDialogOpen = ref(false)
const isPauseDialogOpen = ref(false)
const isResumeDialogOpen = ref(false)
const loading = ref(false)

// Find goal by ID
const goal = computed(() => {
  return allGoalProgress.value.find((g) => g.id === props.id)
})

// Get raw goal data (needed for detailed progress calculation)
const rawGoal = computed(() => {
  return goalsStore.goals.find((g) => g.id === props.id)
})

// Check if goal is paused
const isPaused = computed(() => {
  return rawGoal.value?.status === 'paused'
})

// Calculate detailed progress data for charts
const progressData = computed(() => {
  if (!rawGoal.value || !goal.value) return null

  const goalType = rawGoal.value.type

  // For strength goals, calculate detailed progress
  if (goalType === 'strength') {
    const workouts = workoutStore.completedWorkouts
    const exerciseMap = exerciseStore.exerciseMap
    return calculateStrengthProgress(rawGoal.value, workouts, exerciseMap)
  }

  // TODO: Add support for volume/frequency/streak goals
  return null
})

// Chart data - transform progress history into chart format
const chartData = computed(() => {
  if (!progressData.value?.progressHistory?.length) return []

  return progressData.value.progressHistory.map((point) => ({
    date: new Date(point.date),
    value: point.value,
    maxWeight: point.maxWeight,
  }))
})

// Target line data - horizontal line at target weight
const targetLineData = computed(() => {
  if (!chartData.value.length || !rawGoal.value) return []

  const dates = chartData.value.map((d) => d.date)
  const targetWeight = rawGoal.value.targetWeight

  return [
    { date: dates[0], value: targetWeight },
    { date: dates[dates.length - 1], value: targetWeight },
  ]
})

// Trend line data - linear regression
const trendLineData = computed(() => {
  if (!progressData.value?.trend || !chartData.value.length) return []

  const trend = progressData.value.trend
  const dates = chartData.value.map((d) => d.date)

  return dates.map((date, index) => ({
    date,
    value: trend.intercept + trend.slope * index,
  }))
})

// Chart config
const chartConfig = {
  value: {
    label: t('goals.detail.chart.actualProgress'),
    color: 'var(--chart-1)',
  },
  target: {
    label: t('goals.detail.chart.targetLine'),
    color: 'var(--chart-3)',
  },
  trend: {
    label: t('goals.detail.chart.trendLine'),
    color: 'var(--chart-2)',
  },
}

// Y domain - dynamic based on max value
const yDomain = computed(() => {
  if (!chartData.value.length) return [0, 100]

  const allValues = [
    ...chartData.value.map((d) => d.value),
    ...(targetLineData.value.length ? [targetLineData.value[0].value] : []),
    ...(trendLineData.value.length ? trendLineData.value.map((d) => d.value) : []),
  ]

  const maxValue = Math.max(...allValues, 100)
  const minValue = Math.min(...allValues, 0)

  return [Math.max(minValue * 0.9, 0), maxValue * 1.1]
})

// Predictions
const predictions = computed(() => {
  if (!progressData.value?.progressHistory?.length || progressData.value.progressHistory.length < 3) {
    return null
  }

  if (!rawGoal.value) return null

  const predictedDate = predictGoalCompletion(
    progressData.value.progressHistory,
    rawGoal.value.targetWeight
  )

  // Calculate current pace (last 4 workouts)
  const recentHistory = progressData.value.progressHistory.slice(-4)
  const currentPace =
    recentHistory.length >= 2
      ? (recentHistory[recentHistory.length - 1].value - recentHistory[0].value) /
        ((recentHistory.length - 1) * 7)
      : 0

  // Calculate required pace
  const daysRemaining = goal.value?.daysRemaining || 0
  const requiredPace =
    daysRemaining > 0
      ? calculateRequiredPaceToGoal(
          progressData.value.current1RM,
          rawGoal.value.targetWeight,
          daysRemaining
        )
      : null

  return {
    predictedDate,
    currentPace: currentPace * 7, // Convert to per week
    requiredPace: requiredPace?.perWeek || 0,
    willReachOnTime: predictedDate && new Date(rawGoal.value.deadline) >= predictedDate,
  }
})

// Workout history - filtered to relevant workouts
const workoutHistory = computed(() => {
  if (!rawGoal.value) return []

  const goalType = rawGoal.value.type

  if (goalType === 'strength') {
    return workoutStore.completedWorkouts
      .filter((w) => w.exercises?.some((e) => e.exerciseName === rawGoal.value.exerciseName))
      .map((w) => {
        const exercise = w.exercises.find((e) => e.exerciseName === rawGoal.value.exerciseName)
        const bestSet = findBestSet(exercise.sets)
        const estimated1RM = bestSet ? calculate1RM(bestSet.weight, bestSet.reps) : 0

        return {
          id: w.id,
          date: w.completedAt || w.createdAt,
          sets: exercise.sets.length,
          reps: bestSet?.reps || 0,
          maxWeight: bestSet?.weight || 0,
          estimated1RM,
          volume: exercise.sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0),
        }
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // TODO: Add support for volume/frequency/streak goals
  return []
})

// Set page metadata
usePageMeta(
  computed(() => goal.value?.exerciseName || t('goals.title')),
  computed(() => t(`goals.types.${goal.value?.type || 'strength'}`))
)

// Status color
const statusColor = computed(() => {
  const status = goal.value?.status
  if (status === 'on-track') return 'hsl(var(--success))'
  if (status === 'ahead') return 'hsl(var(--primary))'
  if (status === 'behind') return 'hsl(var(--warning))'
  if (status === 'at-risk') return 'hsl(var(--destructive))'
  return 'hsl(var(--muted))'
})

// Format displays
const currentDisplay = computed(() => {
  if (!goal.value) return '-'
  if (goal.value.type === 'strength') {
    return formatWeight(goal.value.current1RM || 0, { precision: 0, compact: 'auto' })
  }
  if (goal.value.type === 'volume') {
    return formatWeight(goal.value.currentVolume || 0, { precision: 0, compact: 'auto' })
  }
  return goal.value.currentCount || goal.value.currentStreak || 0
})

const targetDisplay = computed(() => {
  if (!goal.value) return '-'
  if (goal.value.type === 'strength') {
    return formatWeight(goal.value.targetWeight, { precision: 0, compact: 'auto' })
  }
  if (goal.value.type === 'volume') {
    return formatWeight(goal.value.target, { precision: 0, compact: 'auto' })
  }
  return goal.value.targetCount || goal.value.targetDays || goal.value.targetWeeks
})

function handleBack() {
  router.push({ name: 'Goals' })
}

// Navigate to workout detail
function handleWorkoutClick(workoutId) {
  router.push({ name: 'WorkoutDetail', params: { id: workoutId } })
}

// Calculate change from previous workout
function getChangeFromPrevious(index) {
  if (index >= workoutHistory.value.length - 1) return null
  const current = workoutHistory.value[index].estimated1RM
  const previous = workoutHistory.value[index + 1].estimated1RM
  return current - previous
}

// Handle edit (future implementation - reopen wizard with pre-filled data)
function handleEdit() {
  toast({
    title: t('common.comingSoon'),
    description: 'Goal editing will be available soon',
  })
}

// Handle pause
async function handlePauseConfirm() {
  loading.value = true
  try {
    await goalsStore.pauseGoal(props.id)
    toast({
      title: t('goals.detail.pause'),
      description: t('goals.goalPausedSuccess'),
    })
    isPauseDialogOpen.value = false
  } catch (error) {
    toast({
      title: t('common.errors.error'),
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

// Handle resume
async function handleResumeConfirm() {
  loading.value = true
  try {
    await goalsStore.resumeGoal(props.id)
    toast({
      title: t('goals.detail.resume'),
      description: t('goals.goalResumedSuccess'),
    })
    isResumeDialogOpen.value = false
  } catch (error) {
    toast({
      title: t('common.errors.error'),
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

// Handle delete
async function handleDeleteConfirm() {
  loading.value = true
  try {
    await goalsStore.deleteGoal(props.id)
    toast({
      title: t('goals.detail.delete'),
      description: t('goals.goalDeletedSuccess'),
    })
    isDeleteDialogOpen.value = false
    router.push({ name: 'Goals' })
  } catch (error) {
    toast({
      title: t('common.errors.error'),
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-4xl space-y-6 px-4 py-6">
    <!-- Back Button -->
    <Button variant="ghost" size="sm" @click="handleBack" class="gap-2">
      <ArrowLeft class="h-4 w-4" />
      {{ t('common.actions.back') }}
    </Button>

    <!-- Goal not found -->
    <Card v-if="!goal">
      <CardContent class="flex flex-col items-center justify-center py-12">
        <Target class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="mb-2 text-lg font-semibold">Goal not found</h3>
        <p class="text-sm text-muted-foreground">This goal may have been deleted</p>
        <Button class="mt-4" @click="handleBack">Back to Goals</Button>
      </CardContent>
    </Card>

    <!-- Goal Detail -->
    <div v-else class="space-y-6">
      <!-- Header Card -->
      <Card>
        <CardHeader>
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <CardTitle class="text-2xl">
                {{ goal.exerciseName || t(`goals.types.${goal.type}`) }}
              </CardTitle>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ t(`goals.types.${goal.type}`) }}
              </p>
            </div>
            <Badge>
              {{ t(`goals.status.${goal.status}`) }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <!-- Progress Ring -->
          <div class="flex justify-center py-6">
            <ProgressRing
              :progress="goal.progressPercent || 0"
              :size="200"
              :color="statusColor"
            />
          </div>

          <!-- Stats Grid -->
          <div class="mt-6 grid gap-4 sm:grid-cols-3">
            <!-- Current -->
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">
                {{ t('goals.detail.current') }}
              </p>
              <p class="mt-1 text-2xl font-bold">{{ currentDisplay }}</p>
            </div>

            <!-- Target -->
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">
                {{ t('goals.detail.target') }}
              </p>
              <p class="mt-1 text-2xl font-bold">{{ targetDisplay }}</p>
            </div>

            <!-- Days Remaining -->
            <div v-if="goal.deadline" class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">Days Remaining</p>
              <p class="mt-1 text-2xl font-bold">
                {{ Math.max(0, goal.daysRemaining || 0) }}
              </p>
            </div>
          </div>

          <!-- Deadline -->
          <div
            v-if="goal.deadline"
            class="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3"
          >
            <Calendar class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">
              Deadline: {{ new Date(goal.deadline).toLocaleDateString() }}
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- Notes Card -->
      <Card v-if="goal.notes">
        <CardHeader>
          <CardTitle class="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">{{ goal.notes }}</p>
        </CardContent>
      </Card>

      <!-- Progress Chart -->
      <Card v-if="rawGoal?.type === 'strength'">
        <CardHeader>
          <CardTitle>{{ t('goals.detail.chart.title') }}</CardTitle>
          <CardDescription>{{ t('goals.detail.chart.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Empty State -->
          <div
            v-if="!chartData.length"
            class="flex flex-col items-center justify-center py-12 text-muted-foreground"
          >
            <TrendingUp class="mb-2 h-12 w-12 opacity-50" />
            <p class="text-sm">{{ t('goals.detail.chart.noData') }}</p>
            <p class="mt-1 text-xs">{{ t('goals.detail.chart.startTraining') }}</p>
          </div>

          <!-- Chart -->
          <ChartContainer v-else :config="chartConfig" class="w-full">
            <div class="h-[300px] w-full">
              <VisXYContainer :data="chartData" :y-domain="yDomain">
                <!-- Axes -->
                <VisAxis
                  type="x"
                  :x="(d) => d.date"
                  :tick-line="false"
                  :domain-line="false"
                  :grid-line="false"
                  :num-ticks="6"
                  :tick-format="
                    (d) =>
                      new Date(d).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                      })
                  "
                />
                <VisAxis
                  type="y"
                  :num-ticks="5"
                  :tick-line="false"
                  :domain-line="false"
                  :grid-line="true"
                  :tick-format="(value) => Math.round(value).toString()"
                />

                <!-- Target Line (horizontal) -->
                <VisLine
                  v-if="targetLineData.length"
                  :data="targetLineData"
                  :x="(d) => d.date"
                  :y="(d) => d.value"
                  :color="chartConfig.target.color"
                  :line-width="2"
                  :opacity="0.6"
                  :line-type="'dashed'"
                />

                <!-- Trend Line (linear regression) -->
                <VisLine
                  v-if="trendLineData.length"
                  :data="trendLineData"
                  :x="(d) => d.date"
                  :y="(d) => d.value"
                  :color="chartConfig.trend.color"
                  :line-width="2"
                  :opacity="0.5"
                />

                <!-- Actual Progress Line -->
                <VisLine
                  :x="(d) => d.date"
                  :y="(d) => d.value"
                  :color="chartConfig.value.color"
                  :line-width="3"
                />

                <!-- Data Points -->
                <VisScatter
                  :x="(d) => d.date"
                  :y="(d) => d.value"
                  :color="chartConfig.value.color"
                  :size="6"
                />

                <!-- Tooltip -->
                <ChartTooltip />
                <ChartCrosshair
                  :template="
                    componentToString(chartConfig, ChartTooltipContent, {
                      indicator: 'line',
                      labelFormatter: (date) =>
                        new Date(date).toLocaleDateString(locale, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                      valueFormatter: (value, key) => {
                        if (key === 'value' || key === 'target' || key === 'trend') {
                          return formatWeight(value, { precision: 1 })
                        }
                        return String(value)
                      },
                    })
                  "
                  :color="
                    (_d, i) => {
                      const colorMap = [null, chartConfig.value.color]
                      return colorMap[i] || 'currentColor'
                    }
                  "
                />
              </VisXYContainer>
            </div>
          </ChartContainer>
        </CardContent>
      </Card>

      <!-- Predictions Section -->
      <Card v-if="rawGoal?.type === 'strength'">
        <CardHeader>
          <CardTitle>{{ t('goals.detail.predictions.title') }}</CardTitle>
          <CardDescription>{{ t('goals.detail.predictions.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Not Enough Data -->
          <div
            v-if="!predictions"
            class="flex flex-col items-center justify-center py-8 text-muted-foreground"
          >
            <Target class="mb-2 h-10 w-10 opacity-50" />
            <p class="text-sm">{{ t('goals.detail.predictions.notEnoughData') }}</p>
          </div>

          <!-- Predictions -->
          <div v-else class="grid gap-4 sm:grid-cols-3">
            <!-- Predicted Completion Date -->
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">
                {{ t('goals.detail.predictions.completionDate') }}
              </p>
              <p class="mt-1 text-lg font-semibold">
                {{
                  predictions.predictedDate
                    ? new Date(predictions.predictedDate).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '-'
                }}
              </p>
              <div
                v-if="predictions.willReachOnTime !== null"
                class="mt-2 flex items-center gap-1 text-xs"
                :class="{
                  'text-green-500': predictions.willReachOnTime,
                  'text-amber-500': !predictions.willReachOnTime,
                }"
              >
                <TrendingUp v-if="predictions.willReachOnTime" class="h-3 w-3" />
                <TrendingDown v-else class="h-3 w-3" />
                <span>{{
                  predictions.willReachOnTime
                    ? t('goals.detail.predictions.onTime')
                    : t('goals.detail.predictions.needsMore')
                }}</span>
              </div>
            </div>

            <!-- Current Pace -->
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">
                {{ t('goals.detail.predictions.currentPace') }}
              </p>
              <p class="mt-1 text-lg font-semibold">
                {{ formatWeight(Math.abs(predictions.currentPace), { precision: 1, compact: 'auto' }) }}
                <span class="text-sm font-normal text-muted-foreground">
                  {{ t('goals.detail.predictions.perWeek') }}
                </span>
              </p>
              <div class="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp v-if="predictions.currentPace > 0" class="h-3 w-3 text-green-500" />
                <TrendingDown v-else-if="predictions.currentPace < 0" class="h-3 w-3 text-red-500" />
                <Minus v-else class="h-3 w-3" />
                <span>Last 4 workouts average</span>
              </div>
            </div>

            <!-- Required Pace -->
            <div class="rounded-lg border p-4">
              <p class="text-xs text-muted-foreground">
                {{ t('goals.detail.predictions.requiredPace') }}
              </p>
              <p class="mt-1 text-lg font-semibold">
                {{ formatWeight(Math.abs(predictions.requiredPace), { precision: 1 }) }}
                <span class="text-sm font-normal text-muted-foreground">
                  {{ t('goals.detail.predictions.perWeek') }}
                </span>
              </p>
              <div
                class="mt-2 text-xs"
                :class="{
                  'text-green-500': predictions.currentPace >= predictions.requiredPace,
                  'text-amber-500': predictions.currentPace < predictions.requiredPace,
                }"
              >
                {{
                  predictions.currentPace >= predictions.requiredPace
                    ? 'Ahead of schedule'
                    : 'Need to increase pace'
                }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Workout History -->
      <Card v-if="rawGoal?.type === 'strength'">
        <CardHeader>
          <CardTitle>{{ t('goals.detail.workoutHistory.title') }}</CardTitle>
          <CardDescription>
            {{ t('goals.detail.workoutHistory.description', { exercise: rawGoal.exerciseName }) }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Empty State -->
          <div
            v-if="!workoutHistory.length"
            class="flex flex-col items-center justify-center py-8 text-muted-foreground"
          >
            <Calendar class="mb-2 h-10 w-10 opacity-50" />
            <p class="text-sm">{{ t('goals.detail.workoutHistory.noWorkouts') }}</p>
            <p class="mt-1 text-xs">{{ t('goals.detail.workoutHistory.startTracking') }}</p>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b">
                <tr class="text-muted-foreground">
                  <th class="pb-3 text-left font-medium">
                    {{ t('goals.detail.workoutHistory.date') }}
                  </th>
                  <th class="pb-3 text-center font-medium">
                    {{ t('goals.detail.workoutHistory.sets') }}
                  </th>
                  <th class="pb-3 text-center font-medium">
                    {{ t('goals.detail.workoutHistory.reps') }}
                  </th>
                  <th class="pb-3 text-right font-medium">
                    {{ t('goals.detail.workoutHistory.maxWeight') }}
                  </th>
                  <th class="pb-3 text-right font-medium">
                    {{ t('goals.detail.workoutHistory.estimated1RM') }}
                  </th>
                  <th class="pb-3 text-right font-medium">
                    {{ t('goals.detail.workoutHistory.change') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(workout, index) in workoutHistory.slice(0, 10)"
                  :key="workout.id"
                  class="cursor-pointer border-b transition-colors hover:bg-muted/50"
                  @click="handleWorkoutClick(workout.id)"
                >
                  <td class="py-3">
                    {{
                      new Date(workout.date).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                      })
                    }}
                  </td>
                  <td class="py-3 text-center">{{ workout.sets }}</td>
                  <td class="py-3 text-center">{{ workout.reps }}</td>
                  <td class="py-3 text-right">
                    {{ formatWeight(workout.maxWeight, { precision: 1 }) }}
                  </td>
                  <td class="py-3 text-right font-medium">
                    {{ formatWeight(workout.estimated1RM, { precision: 1 }) }}
                  </td>
                  <td class="py-3 text-right">
                    <span
                      v-if="getChangeFromPrevious(index)"
                      :class="{
                        'text-green-500': getChangeFromPrevious(index) > 0,
                        'text-red-500': getChangeFromPrevious(index) < 0,
                      }"
                    >
                      {{ getChangeFromPrevious(index) > 0 ? '+' : ''
                      }}{{ formatWeight(getChangeFromPrevious(index), { precision: 1 }) }}
                    </span>
                    <span v-else class="text-muted-foreground">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <!-- Actions -->
      <div class="flex gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="handleEdit"
          :disabled="loading"
        >
          <Edit class="mr-2 h-4 w-4" />
          {{ t('goals.detail.edit') }}
        </Button>

        <!-- Pause or Resume button based on status -->
        <Button
          v-if="!isPaused"
          variant="outline"
          class="flex-1"
          @click="isPauseDialogOpen = true"
          :disabled="loading"
        >
          <Pause class="mr-2 h-4 w-4" />
          {{ t('goals.detail.pause') }}
        </Button>
        <Button
          v-else
          variant="outline"
          class="flex-1"
          @click="isResumeDialogOpen = true"
          :disabled="loading"
        >
          <Play class="mr-2 h-4 w-4" />
          {{ t('goals.detail.resume') }}
        </Button>

        <Button
          variant="destructive"
          class="flex-1"
          @click="isDeleteDialogOpen = true"
          :disabled="loading"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          {{ t('goals.detail.delete') }}
        </Button>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('goals.deleteConfirmTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('goals.deleteConfirmMessage') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel as-child>
            <Button variant="outline" class="min-h-11 min-w-11" :disabled="loading">
              {{ t('common.actions.cancel') }}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <Button
              variant="destructive"
              class="min-h-11 min-w-11"
              @click="handleDeleteConfirm"
              :disabled="loading"
            >
              {{ loading ? t('common.loading') : t('goals.detail.delete') }}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Pause Confirmation Dialog -->
    <AlertDialog :open="isPauseDialogOpen" @update:open="isPauseDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('goals.pauseConfirmTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('goals.pauseConfirmMessage') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel as-child>
            <Button variant="outline" class="min-h-11 min-w-11" :disabled="loading">
              {{ t('common.actions.cancel') }}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <Button class="min-h-11 min-w-11" @click="handlePauseConfirm" :disabled="loading">
              {{ loading ? t('common.loading') : t('goals.detail.pause') }}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Resume Confirmation Dialog -->
    <AlertDialog :open="isResumeDialogOpen" @update:open="isResumeDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('goals.resumeConfirmTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('goals.resumeConfirmMessage') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel as-child>
            <Button variant="outline" class="min-h-11 min-w-11" :disabled="loading">
              {{ t('common.actions.cancel') }}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <Button class="min-h-11 min-w-11" @click="handleResumeConfirm" :disabled="loading">
              {{ loading ? t('common.loading') : t('goals.detail.resume') }}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
