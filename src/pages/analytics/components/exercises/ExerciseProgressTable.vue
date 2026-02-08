<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useI18n } from 'vue-i18n'
import { Search } from 'lucide-vue-next'
import ExerciseProgressRow from './ExerciseProgressRow.vue'
import EmptyState from '@/pages/analytics/components/shared/EmptyState.vue'
import LoadingSkeleton from '@/pages/analytics/components/shared/LoadingSkeleton.vue'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()
const { exerciseProgressTable } = storeToRefs(analyticsStore)

// Local state
const searchQuery = ref('')
const sortBy = ref('lastPerformed') // 'name' | 'estimated1RM' | 'lastPerformed' | 'trend'
const filterBy = ref('all') // 'all' | 'progressing' | 'stalled' | 'regressing'
const isLoading = ref(false)

/**
 * Filtered exercises based on search query
 */
const searchedExercises = computed(() => {
  if (!searchQuery.value.trim()) return exerciseProgressTable.value

  const query = searchQuery.value.toLowerCase().trim()
  return exerciseProgressTable.value.filter((exercise) =>
    exercise.name.toLowerCase().includes(query)
  )
})

/**
 * Filtered exercises based on status filter
 */
const filteredExercises = computed(() => {
  if (filterBy.value === 'all') return searchedExercises.value

  const statusMap = {
    progressing: 'up',
    stalled: 'flat',
    regressing: 'down',
  }

  const targetTrend = statusMap[filterBy.value]
  return searchedExercises.value.filter((exercise) => exercise.trend === targetTrend)
})

/**
 * Sorted exercises based on sort option
 */
const sortedExercises = computed(() => {
  const exercises = [...filteredExercises.value]

  switch (sortBy.value) {
    case 'name':
      return exercises.sort((a, b) => a.name.localeCompare(b.name))

    case 'estimated1RM':
      return exercises.sort((a, b) => b.estimated1RM - a.estimated1RM)

    case 'lastPerformed':
      return exercises.sort((a, b) => b.lastPerformed - a.lastPerformed)

    case 'trend': {
      // Sort by trend direction (up > flat > down) then by percentage
      const trendOrder = { up: 3, flat: 2, down: 1, insufficient_data: 0 }
      return exercises.sort((a, b) => {
        const orderDiff = trendOrder[b.trend] - trendOrder[a.trend]
        if (orderDiff !== 0) return orderDiff
        return b.trendPercentage - a.trendPercentage
      })
    }

    default:
      return exercises
  }
})

/**
 * Empty states
 */
const isEmpty = computed(() => exerciseProgressTable.value.length === 0)
const hasNoResults = computed(
  () => !isEmpty.value && sortedExercises.value.length === 0
)

/**
 * Sort options
 */
const sortOptions = computed(() => [
  { value: 'lastPerformed', label: t('analytics.exerciseProgress.sort.lastPerformed') },
  { value: 'estimated1RM', label: t('analytics.exerciseProgress.sort.estimated1RM') },
  { value: 'name', label: t('analytics.exerciseProgress.sort.name') },
  { value: 'trend', label: t('analytics.exerciseProgress.sort.trend') },
])

/**
 * Filter options
 */
const filterOptions = computed(() => [
  { value: 'all', label: t('analytics.exerciseProgress.filter.all') },
  { value: 'progressing', label: t('analytics.exerciseProgress.filter.progressing') },
  { value: 'stalled', label: t('analytics.exerciseProgress.filter.stalled') },
  { value: 'regressing', label: t('analytics.exerciseProgress.filter.regressing') },
])
</script>

<template>
  <div data-testid="exercise-table" class="exercise-progress-table space-y-4">
    <!-- Loading State -->
    <LoadingSkeleton v-if="isLoading" type="table" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="isEmpty"
      :title="t('analytics.exerciseProgress.empty.title')"
      :description="t('analytics.exerciseProgress.empty.description')"
    />

    <!-- Data State -->
    <div v-else class="space-y-4">
      <!-- Controls: Search + Sort + Filter -->
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search -->
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="text"
            :placeholder="t('analytics.exerciseProgress.search')"
            class="pl-9 min-h-11"
          />
        </div>

        <!-- Sort By -->
        <div class="flex gap-3 flex-wrap sm:flex-nowrap">
          <Select v-model="sortBy">
            <SelectTrigger class="w-full sm:w-[180px] min-h-11">
              <SelectValue>
                {{ t('analytics.exerciseProgress.sortBy') }}:
                {{ sortOptions.find((o) => o.value === sortBy)?.label }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in sortOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Filter By -->
          <Select v-model="filterBy">
            <SelectTrigger class="w-full sm:w-[180px] min-h-11">
              <SelectValue>
                {{ t('analytics.exerciseProgress.filterBy') }}:
                {{ filterOptions.find((o) => o.value === filterBy)?.label }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in filterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- No Results State -->
      <EmptyState
        v-if="hasNoResults"
        :title="t('analytics.exerciseProgress.empty.noResults')"
        :description="t('analytics.exerciseProgress.empty.description')"
      />

      <!-- Table -->
      <div v-else class="border rounded-lg overflow-hidden bg-card">
        <!-- Desktop Header Row -->
        <div
          class="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_165px] gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground"
        >
          <div>{{ t('analytics.exerciseProgress.table.exercise') }}</div>
          <div>{{ t('analytics.exerciseProgress.table.estimated1RM') }}</div>
          <div>{{ t('analytics.exerciseProgress.table.bestPR') }}</div>
          <div>{{ t('analytics.exerciseProgress.table.lastPerformed') }}</div>
          <div>{{ t('analytics.exerciseProgress.table.trend') }}</div>
          <div>{{ t('analytics.exerciseProgress.table.status') }}</div>
        </div>

        <!-- Exercise Rows -->
        <div>
          <ExerciseProgressRow
            v-for="exercise in sortedExercises"
            :key="exercise.id"
            :exercise="exercise"
          />
        </div>
      </div>

      <!-- Results Count -->
      <div class="text-sm text-muted-foreground text-center">
        {{ sortedExercises.length }}
        {{ sortedExercises.length === 1 ? 'exercise' : 'exercises' }}
      </div>
    </div>
  </div>
</template>
