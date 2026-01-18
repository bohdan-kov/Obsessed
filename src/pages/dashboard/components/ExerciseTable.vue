<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useUserStore } from '@/stores/userStore'
import { usePlan } from '@/composables/usePlan'
import { useUnits } from '@/composables/useUnits'
import { normalizeDate } from '@/utils/dateUtils'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MoreHorizontal, Plus, X } from 'lucide-vue-next'
import { CONFIG } from '@/constants/config'
import QuickLogSheet from '@/components/QuickLogSheet.vue'
import DeleteExerciseDialog from '@/pages/workouts/components/sheets/DeleteExerciseDialog.vue'
import EditExerciseSheet from '@/pages/workouts/components/sheets/EditExerciseSheet.vue'
import TableSettingsSheet from './sheets/TableSettingsSheet.vue'
import PlanFormSheet from '@/pages/workouts/components/sheets/PlanFormSheet.vue'
import PlanDetailsSheet from '@/pages/workouts/components/sheets/PlanDetailsSheet.vue'
import PlanCard from '@/pages/workouts/components/plans/PlanCard.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { t } = useI18n()
const router = useRouter()
const { formatWeight } = useUnits()
const { toast } = useToast()
const { handleError } = useErrorHandler()
const workoutStore = useWorkoutStore()
const userStore = useUserStore()
const { sortedPlans, loading: plansLoading, subscribeToPlans } = usePlan()
const { recentWorkouts, activeWorkout } = storeToRefs(workoutStore)
const { tableSettings } = storeToRefs(userStore)

const activeTab = ref('overview')
const isAddExerciseSheetOpen = ref(false)

// Delete dialog state
const isDeleteDialogOpen = ref(false)
const selectedExercise = ref(null)

// Edit sheet state
const isEditSheetOpen = ref(false)

// Table settings sheet state
const isSettingsSheetOpen = ref(false)

// Plan form sheet state
const isPlanFormSheetOpen = ref(false)

// Plan details sheet state
const isPlanDetailsSheetOpen = ref(false)
const selectedPlanId = ref(null)

// Batch actions state
const selectedExerciseIds = ref(new Set())
const isBatchDeleteDialogOpen = ref(false)
const isBatchDuplicateDialogOpen = ref(false)

// Get today's exercises from active workout
const todaysExercises = computed(() => {
  if (!activeWorkout.value) return []

  return activeWorkout.value.exercises.map((exercise) => ({
    id: exercise.exerciseId,
    name: exercise.exerciseName,
    type: exercise.category || 'Strength',
    status: exercise.sets.length > 0 ? 'completed' : 'scheduled',
    sets: exercise.sets.length,
    reps: exercise.sets.length > 0
      ? Math.round(
          exercise.sets.reduce((sum, set) => sum + set.reps, 0) /
            exercise.sets.length
        )
      : 0,
    // Store average weight in kg (storage unit)
    weight:
      exercise.sets.length > 0
        ? exercise.sets.reduce((sum, set) => sum + set.weight, 0) /
            exercise.sets.length
        : null,
  }))
})

// Get recent workout history
const workoutHistory = computed(() => {
  return recentWorkouts.value
    .slice(0, CONFIG.analytics.MAX_RECENT_WORKOUTS_DISPLAY)
    .map((workout) => ({
      id: workout.id,
      date: workout.completedAt,
      exercises: workout.exercises?.length || 0,
      duration: workout.duration,
      volume: workout.totalVolume || 0,
      status: workout.status,
    }))
})

// Get all exercises from recent workouts
const allExercises = computed(() => {
  const exerciseMap = new Map()

  recentWorkouts.value.forEach((workout) => {
    workout.exercises?.forEach((exercise) => {
      const id = exercise.exerciseId
      if (!exerciseMap.has(id)) {
        exerciseMap.set(id, {
          id,
          name: exercise.exerciseName,
          lastPerformed: workout.completedAt,
          totalSets: 0,
          totalVolume: 0,
          timesPerformed: 0,
        })
      }

      const existing = exerciseMap.get(id)
      existing.totalSets += exercise.sets.length
      existing.totalVolume += exercise.sets.reduce(
        (sum, set) => sum + set.weight * set.reps,
        0
      )
      existing.timesPerformed += 1
    })
  })

  return Array.from(exerciseMap.values()).slice(
    0,
    CONFIG.analytics.MAX_EXERCISES_DISPLAY
  )
})

// Status helpers
function getStatusVariant(status) {
  switch (status) {
    case 'completed':
      return 'default' // green
    case 'in-progress':
      return 'secondary' // yellow
    case 'scheduled':
      return 'outline' // gray
    default:
      return 'outline'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'completed':
      return t('common.status.completed')
    case 'in-progress':
      return t('common.status.inProgress')
    case 'scheduled':
      return t('common.status.scheduled')
    default:
      return status
  }
}

// Format date
function formatDate(date) {
  // Handle null/undefined
  if (!date) return '-'

  // Handle Firebase serverTimestamp placeholder
  // These are temporary objects that get replaced with actual timestamps after Firestore writes
  if (date && typeof date === 'object' && '_methodName' in date && date._methodName === 'serverTimestamp') {
    return '-' // Return placeholder until timestamp is resolved
  }

  // Handle objects (Firestore Timestamps, Date objects, empty objects, proxies, etc.)
  if (typeof date === 'object') {
    // Check if it's a Firestore Timestamp
    if (date?.toDate && typeof date.toDate === 'function') {
      try {
        const dateObj = date.toDate()
        if (isNaN(dateObj.getTime())) return '-'
        return dateObj.toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      } catch {
        return '-'
      }
    }

    // Check if it's a Date object
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }

    // If it's any other object (empty object, proxy, etc.), return '-'
    return '-'
  }

  // Handle timestamps (numbers)
  if (typeof date === 'number') {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return '-'
    return dateObj.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Handle string dates
  if (typeof date === 'string') {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return '-'
    return dateObj.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Fallback for anything else
  return '-'
}

// Format duration
function formatDuration(seconds) {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const hrs = Math.floor(mins / 60)
  const remainingMins = mins % 60

  if (hrs > 0) {
    return `${hrs}${t('workout.exerciseTable.hourShort')} ${remainingMins}${t('workout.exerciseTable.minuteShort')}`
  }
  return `${mins}${t('workout.exerciseTable.minuteShort')}`
}

/**
 * Current tab settings computed property
 * Returns the settings object for the currently active tab
 * Plans tab has no table (uses cards), so returns null for it
 */
const currentTabSettings = computed(() => {
  // Plans tab uses cards, not a table
  if (activeTab.value === 'plans') return null

  // Get tab-specific settings
  const tabKey = activeTab.value // 'overview', 'history', or 'exercises'
  return tableSettings.value?.[tabKey]?.columns || null
})

/**
 * Column visibility computed properties for Overview tab
 *
 * These read directly from userStore.tableSettings[activeTab] and control which columns render
 * - true = column VISIBLE (v-if passes, column renders)
 * - false = column HIDDEN (v-if fails, column doesn't render)
 *
 * Null coalescing (??) ensures defaults when settings not loaded:
 * - If tableSettings.overview.columns.type === false → returns false (column hidden)
 * - If tableSettings.overview.columns.type === true → returns true (column visible)
 * - If tableSettings.overview.columns.type === undefined/null → returns true (default visible)
 *
 * CRITICAL: Use ?? not || because || treats false as falsy and would return the default
 *
 * Note: These are currently only used in Overview tab. History and Exercises tabs
 * will eventually have their own column visibility settings.
 */
const showTypeColumn = computed(() => {
  if (activeTab.value !== 'overview') return true
  return currentTabSettings.value?.type ?? true
})

const showStatusColumn = computed(() => {
  if (activeTab.value !== 'overview') return true
  return currentTabSettings.value?.status ?? true
})

const showSetsColumn = computed(() => {
  if (activeTab.value !== 'overview') return true
  return currentTabSettings.value?.sets ?? true
})

const showRepsColumn = computed(() => {
  if (activeTab.value !== 'overview') return true
  return currentTabSettings.value?.reps ?? true
})

const showWeightColumn = computed(() => {
  if (activeTab.value !== 'overview') return true
  return currentTabSettings.value?.weight ?? true
})

/**
 * Count of hidden columns for the current tab
 * Used to show a badge on the "Configure" button
 */
const hiddenColumnsCount = computed(() => {
  if (!currentTabSettings.value) return 0
  return Object.values(currentTabSettings.value).filter(visible => visible === false).length
})

/**
 * Batch actions computed properties
 */
const isBatchModeActive = computed(() => selectedExerciseIds.value.size > 0)

const selectedExercises = computed(() => {
  return todaysExercises.value.filter((ex) => selectedExerciseIds.value.has(ex.id))
})

const allExercisesSelected = computed(() => {
  if (todaysExercises.value.length === 0) return false
  return todaysExercises.value.every((ex) => selectedExerciseIds.value.has(ex.id))
})

const totalSetsInSelection = computed(() => {
  return selectedExercises.value.reduce((sum, ex) => sum + ex.sets, 0)
})

/**
 * Watch for tab changes - clear selection and close settings sheet
 */
watch(activeTab, () => {
  clearSelection()
  // Close settings sheet when switching tabs to avoid confusion
  if (isSettingsSheetOpen.value) {
    isSettingsSheetOpen.value = false
  }
})

/**
 * Batch actions helper functions
 */
function toggleExerciseSelection(exerciseId) {
  const newSet = new Set(selectedExerciseIds.value)
  if (newSet.has(exerciseId)) {
    newSet.delete(exerciseId)
  } else {
    newSet.add(exerciseId)
  }
  selectedExerciseIds.value = newSet
}

function selectAll() {
  selectedExerciseIds.value = new Set(todaysExercises.value.map((ex) => ex.id))
}

function clearSelection() {
  selectedExerciseIds.value = new Set()
}

/**
 * Event handlers
 */

/**
 * Open QuickLogSheet to log a set
 */
function handleAddExerciseClick() {
  isAddExerciseSheetOpen.value = true
}

/**
 * Open table customization settings
 */
function handleCustomize() {
  isSettingsSheetOpen.value = true
}

/**
 * Open plan form sheet to create a new plan
 */
function handleCreatePlan() {
  isPlanFormSheetOpen.value = true
}

/**
 * Computed property for context-aware header button
 * Returns button config based on active tab, or null to hide button
 */
const headerButton = computed(() => {
  switch (activeTab.value) {
    case 'overview':
      // Always show "Add Exercise" button in Overview tab
      return {
        label: t('workout.exerciseTable.addExercise'),
        action: handleAddExerciseClick,
        gradient: 'from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600',
      }
    case 'exercises':
      return {
        label: t('workout.exerciseTable.addExercise'),
        action: handleAddExerciseClick,
        gradient: 'from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600',
      }
    case 'plans':
      return {
        label: t('plans.list.createPlan'),
        action: handleCreatePlan,
        gradient: 'from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600',
      }
    case 'history':
      // No button for History tab (view-only)
      return null
    default:
      return null
  }
})

/**
 * Handle starting a workout from a plan
 * @param {string} planId - Plan ID to start workout from
 */
async function handleStartPlan(planId) {
  try {
    await workoutStore.startWorkoutFromPlan(planId)
  } catch {
    // Error handled by workoutStore
  }
}

/**
 * Handle viewing plan details
 * @param {string} planId - Plan ID to view
 */
function handleViewPlan(planId) {
  selectedPlanId.value = planId
  isPlanDetailsSheetOpen.value = true
}

/**
 * Handle editing a plan (from PlanDetailsSheet)
 * @param {string} planId - Plan ID to edit
 */
function handleEditPlan(planId) {
  // Close details sheet and navigate to workout plans page
  isPlanDetailsSheetOpen.value = false
  router.push(`/workout-plans?highlight=${planId}`)
}

/**
 * Edit exercise details
 * @param {Object} exercise - Exercise to edit
 */
function handleEdit(exercise) {
  selectedExercise.value = exercise
  isEditSheetOpen.value = true
}

/**
 * Save exercise notes
 * @param {Object} data - Save data
 * @param {string} data.exerciseId - Exercise ID
 * @param {string} data.notes - Notes text
 */
async function handleSaveNotes({ exerciseId, notes }) {
  try {
    await workoutStore.updateExerciseNotes(exerciseId, notes)
    // Don't show toast for auto-save to avoid spamming user
  } catch (error) {
    handleError(error, t('workout.exerciseTable.saveNotesError'))
  }
}

/**
 * Duplicate exercise in workout
 * @param {Object} exercise - Exercise to duplicate
 */
async function handleDuplicate(exercise) {
  try {
    await workoutStore.duplicateExercise(exercise.id)
    toast({
      description: t('workout.exerciseTable.exerciseDuplicated', {
        name: exercise.name,
      }),
    })
  } catch (error) {
    handleError(error, t('workout.exerciseTable.duplicateError'))
  }
}

/**
 * Delete exercise from workout
 * @param {Object} exercise - Exercise to delete
 */
function handleDelete(exercise) {
  selectedExercise.value = exercise
  isDeleteDialogOpen.value = true
}

/**
 * Confirm delete exercise
 */
async function confirmDelete() {
  if (!selectedExercise.value) return

  try {
    await workoutStore.deleteExercise(selectedExercise.value.id)
    toast({
      description: t('workout.exerciseTable.exerciseDeleted', {
        name: selectedExercise.value.name,
      }),
    })
    isDeleteDialogOpen.value = false
    selectedExercise.value = null
  } catch (error) {
    handleError(error, t('workout.exerciseTable.deleteError'))
  }
}


/**
 * Handle "Select All" checkbox toggle
 */
function handleSelectAllToggle() {
  if (allExercisesSelected.value) {
    clearSelection()
  } else {
    selectAll()
  }
}

/**
 * Open batch delete dialog
 */
function handleBatchDelete() {
  isBatchDeleteDialogOpen.value = true
}

/**
 * Open batch duplicate dialog
 */
function handleBatchDuplicate() {
  isBatchDuplicateDialogOpen.value = true
}

/**
 * Confirm batch delete
 */
async function confirmBatchDelete() {
  try {
    const count = selectedExerciseIds.value.size
    const idsArray = Array.from(selectedExerciseIds.value)

    await workoutStore.deleteExercises(idsArray)

    toast({
      description: t('workout.exerciseTable.batchActions.exercisesDeleted', { count }),
    })

    isBatchDeleteDialogOpen.value = false
    clearSelection()
  } catch (error) {
    // Check if it's the "cannot delete all" error
    if (error.message === 'Cannot delete all exercises') {
      handleError(error, t('workout.exerciseTable.batchDeleteDialog.cannotDeleteAll'))
    } else {
      handleError(error, t('workout.exerciseTable.batchActions.batchDeleteError'))
    }
  }
}

/**
 * Confirm batch duplicate
 */
async function confirmBatchDuplicate() {
  try {
    const count = selectedExerciseIds.value.size
    const idsArray = Array.from(selectedExerciseIds.value)

    await workoutStore.duplicateExercises(idsArray)

    toast({
      description: t('workout.exerciseTable.batchActions.exercisesDuplicated', { count }),
    })

    isBatchDuplicateDialogOpen.value = false
    clearSelection()
  } catch (error) {
    handleError(error, t('workout.exerciseTable.batchActions.batchDuplicateError'))
  }
}

/**
 * Lifecycle hooks - Subscribe to plans data
 */
let unsubscribePlans = null

onMounted(() => {
  // Subscribe to real-time plan updates
  try {
    unsubscribePlans = subscribeToPlans()
  } catch {
    // Error handled by composable
  }
})

onUnmounted(() => {
  // Cleanup plan subscription
  if (unsubscribePlans) {
    unsubscribePlans()
  }
})

</script>

<template>
  <Card>
    <CardHeader class="space-y-4 pb-4">
      <!-- Mobile/Tablet: Buttons first, then tabs (stacked vertically) -->
      <!-- Desktop (768px+): Tabs and buttons side by side -->
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <!-- Tabs: 2-column grid on small screens, horizontal row on 640px+ -->
        <div class="order-2 md:order-1">
          <Tabs v-model="activeTab" class="w-full sm:w-auto">
            <!-- 2-column grid below 640px, single row at 640px+ -->
            <TabsList class="grid grid-cols-2 gap-1 sm:inline-flex sm:w-max">
              <TabsTrigger value="overview" class="min-h-11">
                {{ t('workout.exerciseTable.overview') }}
              </TabsTrigger>
              <TabsTrigger value="history" class="gap-2 min-h-11">
                {{ t('workout.exerciseTable.history') }}
                <Badge variant="secondary" class="h-5 px-1.5 shrink-0">
                  {{ workoutHistory.length }}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="exercises" class="gap-2 min-h-11">
                {{ t('workout.exerciseTable.exercises') }}
                <Badge variant="secondary" class="h-5 px-1.5 shrink-0">
                  {{ allExercises.length }}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="plans" class="min-h-11">
                {{ t('workout.exerciseTable.plans') }}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <!-- Action buttons -->
        <!-- Mobile-first: Stack vertically on very small screens (320-374px), horizontal on 375px+ -->
        <div class="order-1 md:order-2 flex flex-col xxs:flex-row gap-2 shrink-0 w-full xxs:w-auto">
          <!-- Configure button: hidden in Plans tab (cards don't have table settings) -->
          <Button
            v-if="activeTab !== 'plans'"
            variant="outline"
            size="sm"
            @click="handleCustomize"
            class="min-h-11 min-w-11 flex-1 xxs:flex-none gap-2"
          >
            {{ t('workout.exerciseTable.customize') }}
            <Badge
              v-if="hiddenColumnsCount > 0"
              variant="destructive"
              class="h-5 px-1.5 shrink-0"
            >
              -{{ hiddenColumnsCount }}
            </Badge>
          </Button>
          <!-- Context-aware button: shown only for Exercises and Plans tabs -->
          <Button
            v-if="headerButton"
            size="sm"
            :class="`bg-gradient-to-r ${headerButton.gradient} min-h-11 min-w-11 flex-1 xxs:flex-none`"
            @click="headerButton.action"
          >
            <Plus class="w-4 h-4 xxs:mr-1" />
            <span class="truncate">{{ headerButton.label }}</span>
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Batch Action Bar -->
      <div
        v-if="isBatchModeActive && activeTab === 'overview'"
        class="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg border border-border"
      >
        <div class="flex items-center gap-2">
          <Badge variant="secondary" class="h-6 px-2">
            {{ t('workout.exerciseTable.batchActions.selected', { count: selectedExerciseIds.size }) }}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            @click="clearSelection"
            class="h-8 text-xs"
            :aria-label="t('workout.exerciseTable.batchActions.clearSelection')"
          >
            <X class="w-3 h-3 mr-1" />
            {{ t('workout.exerciseTable.batchActions.clearSelection') }}
          </Button>
        </div>

        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            @click="handleBatchDuplicate"
            class="min-h-11 min-w-11 flex-1 sm:flex-none"
          >
            {{ t('workout.exerciseTable.batchActions.duplicateSelected') }}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            @click="handleBatchDelete"
            class="min-h-11 min-w-11 flex-1 sm:flex-none"
          >
            {{ t('workout.exerciseTable.batchActions.deleteSelected') }}
          </Button>
        </div>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'">
        <Table v-if="todaysExercises.length > 0" aria-label="Today's workout exercises" class="exercise-table">
          <TableHeader>
            <TableRow>
              <TableHead class="w-12">
                <Checkbox
                  :model-value="allExercisesSelected"
                  :aria-label="t('workout.exerciseTable.batchActions.selectAll')"
                  @update:model-value="handleSelectAllToggle"
                  class="cursor-pointer"
                />
              </TableHead>
              <TableHead>{{ t('workout.exerciseTable.exercise') }}</TableHead>
              <TableHead v-if="showTypeColumn" data-test="type-column-header">{{ t('workout.exerciseTable.type') }}</TableHead>
              <TableHead v-if="showStatusColumn" data-test="status-column-header">{{ t('workout.exerciseTable.status') }}</TableHead>
              <TableHead v-if="showSetsColumn" data-test="sets-column-header" class="text-center">{{ t('workout.exerciseTable.sets') }}</TableHead>
              <TableHead v-if="showRepsColumn" data-test="reps-column-header" class="text-center">{{ t('workout.exerciseTable.reps') }}</TableHead>
              <TableHead v-if="showWeightColumn" data-test="weight-column-header">{{ t('workout.exerciseTable.weight') }}</TableHead>
              <TableHead class="w-12" aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="exercise in todaysExercises"
              :key="exercise.id"
              :class="{ 'bg-muted/30': selectedExerciseIds.has(exercise.id) }"
            >
              <TableCell>
                <Checkbox
                  :model-value="selectedExerciseIds.has(exercise.id)"
                  :aria-label="`Select ${exercise.name}`"
                  @update:model-value="() => toggleExerciseSelection(exercise.id)"
                  class="cursor-pointer"
                />
              </TableCell>
              <TableCell class="font-medium">{{ exercise.name }}</TableCell>
              <TableCell v-if="showTypeColumn" data-test="type-column-cell">
                <Badge variant="outline">{{ exercise.type }}</Badge>
              </TableCell>
              <TableCell v-if="showStatusColumn" data-test="status-column-cell">
                <Badge :variant="getStatusVariant(exercise.status)">
                  {{ getStatusLabel(exercise.status) }}
                </Badge>
              </TableCell>
              <TableCell v-if="showSetsColumn" data-test="sets-column-cell" class="text-center font-mono">
                {{ exercise.sets }}
              </TableCell>
              <TableCell v-if="showRepsColumn" data-test="reps-column-cell" class="text-center font-mono">
                {{ exercise.reps }}
              </TableCell>
              <TableCell v-if="showWeightColumn" data-test="weight-column-cell" class="font-mono">
                {{ exercise.weight !== null ? formatWeight(exercise.weight, { from: 'kg' }) : '-' }}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="min-h-11 min-w-11 h-8 w-8"
                      :aria-label="`Actions for ${exercise.name}`"
                    >
                      <MoreHorizontal class="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="handleEdit(exercise)">
                      {{ t('workout.exerciseTable.edit') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleDuplicate(exercise)">
                      {{ t('workout.exerciseTable.duplicate') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive"
                      @click="handleDelete(exercise)"
                    >
                      {{ t('workout.exerciseTable.delete') }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div
          v-else
          class="flex flex-col items-center justify-center py-12 text-muted-foreground"
          role="status"
        >
          <Plus class="w-12 h-12 mb-4 opacity-50" aria-hidden="true" />
          <p class="text-sm">{{ t('workout.exerciseTable.noActiveExercises') }}</p>
          <p class="text-xs mt-1">{{ t('workout.exerciseTable.noActiveExercisesSubtitle') }}</p>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'">
        <Table v-if="workoutHistory.length > 0" aria-label="Workout history">
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('workout.exerciseTable.date') }}</TableHead>
              <TableHead>{{ t('workout.exerciseTable.exercises') }}</TableHead>
              <TableHead>{{ t('workout.exerciseTable.duration') }}</TableHead>
              <TableHead>{{ t('workout.exerciseTable.volume') }}</TableHead>
              <TableHead>{{ t('workout.exerciseTable.status') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="workout in workoutHistory" :key="workout.id">
              <TableCell class="font-medium">
                {{ formatDate(workout.date) }}
              </TableCell>
              <TableCell>{{ workout.exercises }}</TableCell>
              <TableCell>{{ formatDuration(workout.duration) }}</TableCell>
              <TableCell class="font-mono">
                {{ formatWeight(workout.volume, { from: 'kg', showUnit: true, precision: 0, compact: 'auto' }) }}
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(workout.status)">
                  {{ getStatusLabel(workout.status) }}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div
          v-else
          class="flex flex-col items-center justify-center py-12 text-muted-foreground"
        >
          <svg
            class="w-12 h-12 mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-sm">{{ t('workout.exerciseTable.noWorkoutHistory') }}</p>
        </div>
      </div>

      <!-- Exercises Tab -->
      <div v-if="activeTab === 'exercises'">
        <Table v-if="allExercises.length > 0">
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('workout.exerciseTable.exercise') }}</TableHead>
              <TableHead>{{ t('workout.exerciseTable.lastPerformed') }}</TableHead>
              <TableHead>{{ t('workout.exerciseTable.totalSets') }}</TableHead>
              <TableHead>{{ t('workout.exerciseTable.totalVolume') }}</TableHead>
              <TableHead>{{ t('workout.exerciseTable.timesPerformed') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="exercise in allExercises" :key="exercise.id">
              <TableCell class="font-medium">{{ exercise.name }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ formatDate(exercise.lastPerformed) }}
              </TableCell>
              <TableCell class="font-mono">{{ exercise.totalSets }}</TableCell>
              <TableCell class="font-mono">
                {{ formatWeight(exercise.totalVolume, { from: 'kg', showUnit: true, precision: 0, compact: 'auto' }) }}
              </TableCell>
              <TableCell class="font-mono">
                {{ exercise.timesPerformed }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div
          v-else
          class="flex flex-col items-center justify-center py-12 text-muted-foreground"
        >
          <svg
            class="w-12 h-12 mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p class="text-sm">{{ t('workout.exerciseTable.noExercises') }}</p>
        </div>
      </div>

      <!-- Plans Tab -->
      <div v-if="activeTab === 'plans'">
        <!-- Empty State: Show when no plans exist and not loading -->
        <div
          v-if="sortedPlans.length === 0 && !plansLoading"
          class="flex flex-col items-center justify-center py-12 text-muted-foreground"
        >
          <svg
            class="w-12 h-12 mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p class="text-sm font-semibold mb-1">{{ t('workout.exerciseTable.noPlans') }}</p>
          <p class="text-xs mb-6">{{ t('workout.exerciseTable.noPlansSubtitle') }}</p>
          <Button size="lg" class="min-h-11" @click="handleCreatePlan">
            <Plus class="mr-2 h-5 w-5" />
            {{ t('plans.list.createPlan') }}
          </Button>
        </div>

        <!-- Plans Grid: Show when plans exist -->
        <div
          v-if="sortedPlans.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <PlanCard
            v-for="plan in sortedPlans"
            :key="plan.id"
            :plan="plan"
            variant="simple"
            @start="handleStartPlan"
            @view="handleViewPlan"
          />
        </div>

        <!-- Loading State -->
        <div
          v-if="plansLoading && sortedPlans.length === 0"
          class="flex flex-col items-center justify-center py-12 text-muted-foreground"
        >
          <p class="text-sm">{{ t('common.loading') }}</p>
        </div>
      </div>
    </CardContent>

    <!-- Quick Log Sheet -->
    <QuickLogSheet
      v-model:open="isAddExerciseSheetOpen"
      :title="t('workout.exerciseTable.addExercise')"
    />

    <!-- Delete Exercise Dialog -->
    <DeleteExerciseDialog
      v-model:open="isDeleteDialogOpen"
      :exercise="selectedExercise"
      :can-delete="selectedExercise ? workoutStore.canDeleteExercise(selectedExercise.id) : false"
      :sets-count="selectedExercise?.sets || 0"
      @confirm="confirmDelete"
    />

    <!-- Edit Exercise Sheet -->
    <EditExerciseSheet
      v-model:open="isEditSheetOpen"
      :exercise="selectedExercise"
      @save="handleSaveNotes"
    />

    <!-- Table Settings Sheet -->
    <TableSettingsSheet
      v-model:open="isSettingsSheetOpen"
      :active-tab="activeTab"
    />

    <!-- Plan Form Sheet -->
    <PlanFormSheet
      v-model:open="isPlanFormSheetOpen"
      mode="create"
    />

    <!-- Plan Details Sheet -->
    <PlanDetailsSheet
      v-model:open="isPlanDetailsSheetOpen"
      :plan-id="selectedPlanId"
      @start="handleStartPlan"
      @edit="handleEditPlan"
    />

    <!-- Batch Delete Dialog -->
    <AlertDialog v-model:open="isBatchDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ t('workout.exerciseTable.batchDeleteDialog.title', { count: selectedExerciseIds.size }) }}
          </AlertDialogTitle>
          <AlertDialogDescription class="space-y-3">
            <p>
              {{ t('workout.exerciseTable.batchDeleteDialog.message', { totalSets: totalSetsInSelection }) }}
            </p>

            <div v-if="selectedExercises.length > 0">
              <p class="font-medium text-sm text-foreground">
                {{ t('workout.exerciseTable.batchDeleteDialog.exerciseList') }}
              </p>
              <ul class="mt-2 space-y-1 text-sm">
                <li
                  v-for="exercise in selectedExercises.slice(0, 5)"
                  :key="exercise.id"
                  class="text-muted-foreground"
                >
                  {{ exercise.name }} ({{ exercise.sets }} {{ t('workout.exerciseTable.sets').toLowerCase() }})
                </li>
                <li
                  v-if="selectedExercises.length > 5"
                  class="text-muted-foreground italic"
                >
                  {{ t('workout.exerciseTable.batchDeleteDialog.andMore', { count: selectedExercises.length - 5 }) }}
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel as-child>
            <Button variant="outline" class="min-h-11 min-w-11">
              {{ t('workout.exerciseTable.batchDeleteDialog.cancel') }}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <Button
              variant="destructive"
              class="min-h-11 min-w-11"
              @click="confirmBatchDelete"
            >
              {{ t('workout.exerciseTable.batchDeleteDialog.confirm', { count: selectedExerciseIds.size }) }}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Batch Duplicate Dialog -->
    <Dialog v-model:open="isBatchDuplicateDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ t('workout.exerciseTable.batchDuplicateDialog.title', { count: selectedExerciseIds.size }) }}
          </DialogTitle>
          <DialogDescription>
            {{ t('workout.exerciseTable.batchDuplicateDialog.warning', { total: todaysExercises.length + selectedExerciseIds.size }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            @click="isBatchDuplicateDialogOpen = false"
          >
            {{ t('workout.exerciseTable.batchDuplicateDialog.cancel') }}
          </Button>
          <Button @click="confirmBatchDuplicate">
            {{ t('workout.exerciseTable.batchDuplicateDialog.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<style scoped>
/* Smooth column transitions when toggling visibility */
.exercise-table th,
.exercise-table td {
  transition: opacity 200ms ease-in-out;
}
</style>
