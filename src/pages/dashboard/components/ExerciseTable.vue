<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkoutStore } from '@/stores/workoutStore'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
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
import { MoreHorizontal, Plus } from 'lucide-vue-next'
import { CONFIG } from '@/constants/config'
import { STRINGS } from '@/constants/strings'

const workoutStore = useWorkoutStore()
const { recentWorkouts, activeWorkout } = storeToRefs(workoutStore)

const activeTab = ref('overview')
const t = STRINGS.exerciseTable

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
    weight:
      exercise.sets.length > 0
        ? `${Math.round(
            exercise.sets.reduce((sum, set) => sum + set.weight, 0) /
              exercise.sets.length
          )} kg`
        : '-',
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
      return 'Done'
    case 'in-progress':
      return 'In Progress'
    case 'scheduled':
      return 'Scheduled'
    default:
      return status
  }
}

// Format date
function formatDate(date) {
  if (!date) return '-'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format duration
function formatDuration(seconds) {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const hrs = Math.floor(mins / 60)
  const remainingMins = mins % 60

  if (hrs > 0) {
    return `${hrs}год ${remainingMins}хв`
  }
  return `${mins}хв`
}

/**
 * Event handlers
 * TODO: Implement actual functionality when modals/features are ready
 */

/**
 * Open modal to add new exercise to workout
 */
function handleAddExercise() {
  // TODO: Emit event to parent or open modal
  // emit('add-exercise')
}

/**
 * Open table customization settings
 */
function handleCustomize() {
  // TODO: Open customize table modal
  // emit('customize-table')
}

/**
 * Edit exercise details
 * @param {Object} exercise - Exercise to edit
 */
function handleEdit(exercise) {
  // TODO: Open edit exercise modal
  // emit('edit-exercise', exercise)
}

/**
 * Duplicate exercise in workout
 * @param {Object} exercise - Exercise to duplicate
 */
function handleDuplicate(exercise) {
  // TODO: Duplicate exercise logic
  // workoutStore.duplicateExercise(exercise.id)
}

/**
 * Delete exercise from workout
 * @param {Object} exercise - Exercise to delete
 */
function handleDelete(exercise) {
  // TODO: Show confirmation dialog then delete
  // workoutStore.removeExercise(exercise.id)
}

/**
 * Toggle exercise completion status
 * @param {Object} exercise - Exercise to toggle
 */
function toggleExerciseComplete(exercise) {
  // TODO: Update exercise status
  // workoutStore.updateExerciseStatus(exercise.id, newStatus)
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
      <Tabs v-model="activeTab" class="w-auto">
        <TabsList>
          <TabsTrigger value="overview">Огляд</TabsTrigger>
          <TabsTrigger value="history" class="gap-2">
            Історія
            <Badge variant="secondary" class="h-5 px-1.5">
              {{ workoutHistory.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="exercises" class="gap-2">
            Вправи
            <Badge variant="secondary" class="h-5 px-1.5">
              {{ allExercises.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="plans">Плани</TabsTrigger>
        </TabsList>
      </Tabs>

      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="handleCustomize">
          Налаштувати
        </Button>
        <Button
          size="sm"
          class="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          @click="handleAddExercise"
        >
          <Plus class="w-4 h-4 mr-1" />
          Додати вправу
        </Button>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'">
        <Table v-if="todaysExercises.length > 0" aria-label="Today's workout exercises">
          <TableHeader>
            <TableRow>
              <TableHead class="w-12" aria-label="Completion status" />
              <TableHead>{{ t.exercise }}</TableHead>
              <TableHead>{{ t.type }}</TableHead>
              <TableHead>{{ t.status }}</TableHead>
              <TableHead class="text-center">{{ t.sets }}</TableHead>
              <TableHead class="text-center">{{ t.reps }}</TableHead>
              <TableHead>{{ t.weight }}</TableHead>
              <TableHead class="w-12" aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="exercise in todaysExercises" :key="exercise.id">
              <TableCell>
                <Checkbox
                  :checked="exercise.status === 'completed'"
                  :aria-label="`Mark ${exercise.name} as ${exercise.status === 'completed' ? 'incomplete' : 'complete'}`"
                  @update:checked="() => toggleExerciseComplete(exercise)"
                />
              </TableCell>
              <TableCell class="font-medium">{{ exercise.name }}</TableCell>
              <TableCell>
                <Badge variant="outline">{{ exercise.type }}</Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(exercise.status)">
                  {{ getStatusLabel(exercise.status) }}
                </Badge>
              </TableCell>
              <TableCell class="text-center font-mono">
                {{ exercise.sets }}
              </TableCell>
              <TableCell class="text-center font-mono">
                {{ exercise.reps }}
              </TableCell>
              <TableCell class="font-mono">{{ exercise.weight }}</TableCell>
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
                      {{ t.edit }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleDuplicate(exercise)">
                      {{ t.duplicate }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive"
                      @click="handleDelete(exercise)"
                    >
                      {{ t.delete }}
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
          <p class="text-sm">{{ t.noActiveExercises }}</p>
          <p class="text-xs mt-1">{{ t.noActiveExercisesSubtitle }}</p>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'">
        <Table v-if="workoutHistory.length > 0" aria-label="Workout history">
          <TableHeader>
            <TableRow>
              <TableHead>{{ t.date }}</TableHead>
              <TableHead>{{ t.exercises }}</TableHead>
              <TableHead>{{ t.duration }}</TableHead>
              <TableHead>{{ t.volume }}</TableHead>
              <TableHead>{{ t.status }}</TableHead>
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
                {{ workout.volume.toLocaleString() }} кг
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
          <p class="text-sm">Немає історії тренувань</p>
        </div>
      </div>

      <!-- Exercises Tab -->
      <div v-if="activeTab === 'exercises'">
        <Table v-if="allExercises.length > 0">
          <TableHeader>
            <TableRow>
              <TableHead>Вправа</TableHead>
              <TableHead>Останнє виконання</TableHead>
              <TableHead>Всього підходів</TableHead>
              <TableHead>Загальний обсяг</TableHead>
              <TableHead>Разів виконано</TableHead>
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
                {{ exercise.totalVolume.toLocaleString() }} кг
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
          <p class="text-sm">Немає виконаних вправ</p>
        </div>
      </div>

      <!-- Plans Tab -->
      <div v-if="activeTab === 'plans'">
        <div
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
          <p class="text-sm">Планів ще немає</p>
          <p class="text-xs mt-1">Створіть план тренувань</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
