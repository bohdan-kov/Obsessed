<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import ExerciseMiniChart from './ExerciseMiniChart.vue'
import { Button } from '@/components/ui/button'

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const { t } = useI18n()
const { formatWeight } = useUnits()

const isExpanded = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function viewLastWorkout(event) {
  event.stopPropagation()
  if (props.exercise.lastWorkoutId) {
    router.push({
      name: 'WorkoutDetail',
      params: { id: props.exercise.lastWorkoutId },
      query: {
        from: 'analytics',
        tab: 'exercises'  // Include tab to preserve context when navigating back
      },
    })
  }
}

function formatDate(date) {
  if (!date) return '-'
  const d = date instanceof Date ? date : new Date(date)
  // Check if the date is valid before formatting
  if (isNaN(d.getTime())) {
    return '-'
  }
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

function getTrendIcon(trend) {
  switch (trend) {
    case 'up':
      return TrendingUp
    case 'down':
      return TrendingDown
    default:
      return Minus
  }
}

function getStatusColor(status) {
  const colorMap = {
    green: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
    red: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
    yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400',
    gray: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400',
  }
  return colorMap[status.color] || colorMap.gray
}
</script>

<template>
  <div class="exercise-progress-row border-b last:border-0">
    <!-- Main Row (Always Visible) -->
    <div
      class="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_165px] gap-3 sm:gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer items-center"
      @click="toggleExpanded"
    >
      <!-- Exercise Name + Mobile-only chart -->
      <div class="flex flex-col gap-1 min-w-0">
        <div class="font-medium text-sm sm:text-base truncate">
          {{ exercise.name }}
        </div>
        <!-- Mobile: Show mini chart inline -->
        <div class="sm:hidden flex items-center gap-2">
          <ExerciseMiniChart :history="exercise.history" :trend="exercise.trend" :width="80" :height="24" />
          <span class="text-xs text-muted-foreground">
            {{ formatWeight(exercise.estimated1RM) }}
          </span>
        </div>
      </div>

      <!-- Desktop: Est. 1RM -->
      <div class="hidden sm:block text-sm">
        <div class="font-semibold">{{ formatWeight(exercise.estimated1RM) }}</div>
      </div>

      <!-- Desktop: Best PR -->
      <div class="hidden sm:block text-sm">
        <div v-if="exercise.bestPR" class="text-muted-foreground">
          {{ formatWeight(exercise.bestPR.weight) }} × {{ exercise.bestPR.reps }}
        </div>
        <div v-else class="text-muted-foreground">-</div>
      </div>

      <!-- Desktop: Last Performed -->
      <div class="hidden sm:block text-sm text-muted-foreground">
        {{ formatDate(exercise.lastPerformed) }}
      </div>

      <!-- Desktop: Trend -->
      <div class="hidden sm:flex items-center gap-2 text-sm">
        <component
          :is="getTrendIcon(exercise.trend)"
          class="w-4 h-4"
          :class="{
            'text-green-600': exercise.trend === 'up',
            'text-red-600': exercise.trend === 'down',
            'text-gray-400': exercise.trend === 'flat',
          }"
        />
        <span
          v-if="exercise.trend !== 'insufficient_data'"
          class="text-muted-foreground text-xs"
        >
          {{ exercise.trendPercentage > 0 ? '+' : '' }}{{ exercise.trendPercentage }}%
        </span>
      </div>

      <!-- Status Badge + Expand Button -->
      <div class="flex items-center gap-2 justify-end">
        <!-- Desktop: Status badge -->
        <span
          class="hidden sm:inline-flex items-center w-[165px] px-2 py-1 rounded-full text-xs font-medium"
          :class="getStatusColor(exercise.status)"
        >
          {{ t(`analytics.exerciseProgress.statusBadge.${exercise.trend}`) }}
        </span>

        <!-- Mobile: Status icon only -->
        <component
          :is="getTrendIcon(exercise.trend)"
          class="sm:hidden w-5 h-5"
          :class="{
            'text-green-600': exercise.trend === 'up',
            'text-red-600': exercise.trend === 'down',
            'text-gray-400': exercise.trend === 'flat',
          }"
        />

        <!-- Expand Icon -->
        <ChevronDown
          class="w-5 h-5 text-muted-foreground transition-transform"
          :class="{ 'rotate-180': isExpanded }"
        />
      </div>
    </div>

    <!-- Expanded Details -->
    <div
      v-if="isExpanded"
      class="px-4 py-4 bg-muted/30 border-t animate-in slide-in-from-top-2"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Progress Chart -->
        <div>
          <h4 class="text-sm font-medium mb-3">
            {{ t('analytics.exerciseProgress.chart.title') }}
          </h4>
          <div class="bg-background rounded-lg p-4 border">
            <ExerciseMiniChart :history="exercise.history" :trend="exercise.trend" :width="280" :height="100" />
            <div class="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{{ exercise.history.length }} workouts</span>
              <span>{{ t('analytics.exerciseProgress.chart.yAxis') }}</span>
            </div>
          </div>
        </div>

        <!-- PR Details -->
        <div>
          <h4 class="text-sm font-medium mb-3">
            {{ t('analytics.exerciseProgress.prDetails.estimated1RM') }}
          </h4>
          <div class="space-y-3">
            <!-- Current 1RM -->
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Current</span>
              <span class="text-lg font-semibold">
                {{ formatWeight(exercise.estimated1RM) }}
              </span>
            </div>

            <!-- Best PR -->
            <div v-if="exercise.bestPR" class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-muted-foreground">
                  {{ t('analytics.exerciseProgress.prDetails.weight') }}
                </span>
                <span class="text-sm font-medium">
                  {{ formatWeight(exercise.bestPR.weight) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-muted-foreground">
                  {{ t('analytics.exerciseProgress.prDetails.reps') }}
                </span>
                <span class="text-sm font-medium">{{ exercise.bestPR.reps }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-muted-foreground">
                  {{ t('analytics.exerciseProgress.prDetails.date') }}
                </span>
                <span class="text-sm font-medium">
                  {{ formatDate(exercise.bestPR.date) }}
                </span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t">
                <span class="text-sm text-muted-foreground">Best 1RM</span>
                <span class="text-sm font-semibold text-primary">
                  {{ formatWeight(exercise.bestPR.estimated1RM) }}
                </span>
              </div>
            </div>

            <!-- Trend Info -->
            <div class="pt-3 border-t">
              <div class="flex justify-between items-center">
                <span class="text-sm text-muted-foreground">
                  {{ t('analytics.exerciseProgress.table.trend') }}
                </span>
                <div class="flex items-center gap-2">
                  <component
                    :is="getTrendIcon(exercise.trend)"
                    class="w-4 h-4"
                    :class="{
                      'text-green-600': exercise.trend === 'up',
                      'text-red-600': exercise.trend === 'down',
                      'text-gray-400': exercise.trend === 'flat',
                    }"
                  />
                  <span class="text-sm font-medium">
                    {{ t(`analytics.exerciseProgress.trend.${exercise.trend}`) }}
                  </span>
                  <span
                    v-if="exercise.trend !== 'insufficient_data'"
                    class="text-xs text-muted-foreground"
                  >
                    ({{ exercise.trendPercentage > 0 ? '+' : '' }}{{ exercise.trendPercentage }}%)
                  </span>
                </div>
              </div>
            </div>

            <!-- View Last Workout Button -->
            <div v-if="exercise.lastWorkoutId" class="pt-3 border-t">
              <Button variant="outline" size="sm" class="w-full" @click="viewLastWorkout">
                <ExternalLink class="w-4 h-4 mr-2" />
                {{ t('workout.detail.viewDetails') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exercise-progress-row {
  @apply transition-all duration-200;
}
</style>
