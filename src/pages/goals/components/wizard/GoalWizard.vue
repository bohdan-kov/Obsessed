<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useGoalsStore } from '@/stores/goalsStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast/use-toast'
import { calculate1RM, findBestSet } from '@/utils/strengthUtils'
import { Target, CheckCircle } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Import wizard components
import GoalTypeSelector from './GoalTypeSelector.vue'
import ExerciseSelect from './strength/ExerciseSelect.vue'
import TargetWeightInput from './strength/TargetWeightInput.vue'
import DeadlineSelect from './strength/DeadlineSelect.vue'
import VolumeTypeSelect from './volume/VolumeTypeSelect.vue'
import VolumeTargetInput from './volume/VolumeTargetInput.vue'
import VolumePeriodSelect from './volume/VolumePeriodSelect.vue'
import FrequencyConfig from './frequency/FrequencyConfig.vue'
import StreakConfig from './streak/StreakConfig.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'goal-created'])

const { t } = useI18n()
const goalsStore = useGoalsStore()
const exerciseStore = useExerciseStore()
const workoutStore = useWorkoutStore()
const authStore = useAuthStore()
const { allExercises } = storeToRefs(exerciseStore)
const { completedWorkouts } = storeToRefs(workoutStore)
const { isAuthenticated } = storeToRefs(authStore)
const { toast } = useToast()

// Wizard state
const currentStep = ref(0) // Start at 0 for goal type selection
const loading = ref(false)

// Form data - common
const goalType = ref(null) // Dynamic goal type
const notes = ref('')

// Strength goal data
const strengthExerciseId = ref('')
const strengthTargetWeight = ref(null)
const strengthDeadline = ref('')

// Volume goal data
const volumeType = ref(null) // 'total', 'exercise', 'muscleGroup'
const volumeExerciseId = ref(null)
const volumeMuscleGroup = ref(null)
const volumeTargetValue = ref(null)
const volumePeriod = ref('week')

// Frequency goal data
const frequencyType = ref('total') // 'total' or 'muscleGroup'
const frequencyTargetCount = ref(null)
const frequencyPeriod = ref('week')
const frequencyMuscleGroup = ref(null)

// Streak goal data
const streakType = ref('daily') // 'daily' or 'weekly'
const streakTargetDays = ref(null)
const streakAllowRestDays = ref(false)
const streakMaxRestDays = ref(null)

// Dynamic wizard steps based on goal type
const wizardSteps = computed(() => {
  const steps = [
    { id: 0, title: t('goals.wizard.selectType'), component: 'GoalTypeSelector' }
  ]

  if (goalType.value === 'strength') {
    steps.push(
      { id: 1, title: t('goals.wizard.selectExercise'), component: 'ExerciseSelect' },
      { id: 2, title: t('goals.wizard.setTarget'), component: 'TargetWeightInput' },
      { id: 3, title: t('goals.wizard.setDeadline'), component: 'DeadlineSelect' }
    )
  } else if (goalType.value === 'volume') {
    steps.push(
      { id: 1, title: t('goals.wizard.selectVolumeType'), component: 'VolumeTypeSelect' },
      { id: 2, title: t('goals.wizard.setTarget'), component: 'VolumeTargetInput' },
      { id: 3, title: t('goals.wizard.setPeriod'), component: 'VolumePeriodSelect' }
    )
  } else if (goalType.value === 'frequency') {
    steps.push(
      { id: 1, title: t('goals.wizard.configureFrequency'), component: 'FrequencyConfig' }
    )
  } else if (goalType.value === 'streak') {
    steps.push(
      { id: 1, title: t('goals.wizard.configureStreak'), component: 'StreakConfig' }
    )
  }

  return steps
})

const totalSteps = computed(() => wizardSteps.value.length)
const currentStepData = computed(() => wizardSteps.value[currentStep.value])

// Validation for current step
const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return goalType.value !== null
  }

  if (goalType.value === 'strength') {
    if (currentStep.value === 1) return strengthExerciseId.value !== ''
    if (currentStep.value === 2) return strengthTargetWeight.value !== null && strengthTargetWeight.value > 0
    if (currentStep.value === 3) {
      if (!strengthDeadline.value) return false
      const deadlineDate = new Date(strengthDeadline.value)
      return deadlineDate > new Date()
    }
  } else if (goalType.value === 'volume') {
    if (currentStep.value === 1) return volumeType.value !== null
    if (currentStep.value === 2) return volumeTargetValue.value !== null && volumeTargetValue.value > 0
    if (currentStep.value === 3) return volumePeriod.value !== null
  } else if (goalType.value === 'frequency') {
    if (currentStep.value === 1) {
      if (!frequencyTargetCount.value || frequencyTargetCount.value <= 0) return false
      if (frequencyType.value === 'muscleGroup' && !frequencyMuscleGroup.value) return false
      return true
    }
  } else if (goalType.value === 'streak') {
    if (currentStep.value === 1) {
      if (!streakTargetDays.value || streakTargetDays.value <= 0) return false
      if (streakAllowRestDays.value) {
        if (!streakMaxRestDays.value || streakMaxRestDays.value < 0) return false
        if (streakType.value === 'daily' && streakMaxRestDays.value >= 7) return false
      }
      return true
    }
  }

  return false
})

// Navigation
function nextStep() {
  if (currentStep.value < totalSteps.value - 1) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// Handle goal type selection
function handleTypeSelected(type) {
  goalType.value = type
  currentStep.value = 1 // Move to next step
}

// Reset wizard
function resetWizard() {
  currentStep.value = 0
  goalType.value = null
  notes.value = ''

  // Reset strength data
  strengthExerciseId.value = ''
  strengthTargetWeight.value = null
  strengthDeadline.value = ''

  // Reset volume data
  volumeType.value = null
  volumeExerciseId.value = null
  volumeMuscleGroup.value = null
  volumeTargetValue.value = null
  volumePeriod.value = 'week'

  // Reset frequency data
  frequencyType.value = 'total'
  frequencyTargetCount.value = null
  frequencyPeriod.value = 'week'
  frequencyMuscleGroup.value = null

  // Reset streak data
  streakType.value = 'daily'
  streakTargetDays.value = null
  streakAllowRestDays.value = false
  streakMaxRestDays.value = null
}

// Calculate initial currentWeight from workout history for strength goals
function calculateInitialWeight(exerciseName) {
  if (!exerciseName || !completedWorkouts.value.length) {
    return 0
  }

  // Find the most recent workout that contains this exercise
  const recentWorkout = completedWorkouts.value
    .slice() // Create copy to avoid mutating original
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)) // Most recent first
    .find((workout) =>
      workout.exercises?.some((ex) =>
        exerciseStore.getExerciseDisplayName(ex) === exerciseName
      )
    )

  if (!recentWorkout) {
    return 0 // No history for this exercise
  }

  // Find the exercise in the workout
  const exercise = recentWorkout.exercises.find(
    (ex) => exerciseStore.getExerciseDisplayName(ex) === exerciseName
  )

  if (!exercise || !exercise.sets || exercise.sets.length === 0) {
    return 0
  }

  // Find the best set (highest weight × reps)
  const bestSet = findBestSet(exercise.sets)

  if (!bestSet) {
    return 0
  }

  // Calculate 1RM from the best set
  const estimated1RM = calculate1RM(bestSet.weight, bestSet.reps)

  return estimated1RM || 0
}

// Handle close
function handleClose() {
  resetWizard()
  emit('close')
}

// Create goal
async function createGoal() {
  // Safety check: Ensure user is authenticated
  if (!isAuthenticated.value) {
    toast({
      title: 'Authentication Required',
      description: 'Please log in to create a goal.',
      variant: 'destructive',
    })
    return
  }

  loading.value = true

  try {
    let goalData = {}

    if (goalType.value === 'strength') {
      const exercise = allExercises.value.find((ex) => ex.id === strengthExerciseId.value)
      const exerciseName = exerciseStore.getExerciseDisplayName(exercise)
      const initialWeight = calculateInitialWeight(exerciseName)

      goalData = {
        type: 'strength',
        exerciseName: exerciseName,
        targetWeight: strengthTargetWeight.value, // Already in storage units (kg)
        currentWeight: initialWeight, // Calculated from workout history (kg)
        startDate: new Date().toISOString().split('T')[0],
        deadline: strengthDeadline.value,
        notes: notes.value,
      }
    } else if (goalType.value === 'volume') {
      goalData = {
        type: 'volume',
        volumeType: volumeType.value,
        target: volumeTargetValue.value, // Already in storage units (kg) - CRITICAL: Firestore rules expect 'target', not 'targetVolume'
        period: volumePeriod.value,
        startDate: new Date().toISOString().split('T')[0],
        notes: notes.value,
      }

      if (volumeType.value === 'exercise' && volumeExerciseId.value) {
        const exercise = allExercises.value.find((ex) => ex.id === volumeExerciseId.value)
        goalData.exerciseName = exerciseStore.getExerciseDisplayName(exercise)
      }

      if (volumeType.value === 'muscleGroup' && volumeMuscleGroup.value) {
        goalData.muscleGroup = volumeMuscleGroup.value
      }
    } else if (goalType.value === 'frequency') {
      goalData = {
        type: 'frequency',
        frequencyType: frequencyType.value,
        targetCount: frequencyTargetCount.value,
        period: frequencyPeriod.value,
        startDate: new Date().toISOString().split('T')[0],
        notes: notes.value,
      }

      if (frequencyType.value === 'muscleGroup' && frequencyMuscleGroup.value) {
        goalData.muscleGroup = frequencyMuscleGroup.value
      }
    } else if (goalType.value === 'streak') {
      goalData = {
        type: 'streak',
        streakType: streakType.value,
        targetDays: streakTargetDays.value,
        allowRestDays: streakAllowRestDays.value,
        maxRestDays: streakAllowRestDays.value ? streakMaxRestDays.value : 0,
        currentStreak: 0,
        startDate: new Date().toISOString().split('T')[0],
        notes: notes.value,
      }
    }

    await goalsStore.createGoal(goalData)

    toast({
      title: t('goals.createGoal'),
      description: t('goals.goalCreatedSuccess'),
    })

    emit('goal-created')
    handleClose()
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

// Watch dialog open/close
watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      resetWizard()
    }
  }
)

// Initialize exercise store on mount
onMounted(async () => {
  // Fetch default exercises if not already loaded
  if (allExercises.value.length === 0) {
    await exerciseStore.fetchExercises()
  }
  // Fetch custom exercises if user is authenticated
  await exerciseStore.fetchCustomExercises()
})

// Is last step
const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)
</script>

<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && handleClose()">
    <DialogContent class="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Target class="h-5 w-5" />
          {{ t('goals.wizard.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ currentStepData?.title || t('goals.wizard.subtitle') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Progress Steps (only show if goal type selected) -->
      <div v-if="goalType" class="flex items-center justify-center gap-2 py-4">
        <template v-for="(step, index) in wizardSteps" :key="step.id">
          <Badge :variant="currentStep >= index ? 'default' : 'outline'">
            {{ currentStep > index ? '✓' : (index + 1) }}
          </Badge>
          <div v-if="index < wizardSteps.length - 1" class="h-px w-8 bg-border" />
        </template>
      </div>

      <!-- Dynamic Step Content -->
      <div class="min-h-[300px]">
        <!-- Step 0: Goal Type Selection -->
        <GoalTypeSelector
          v-if="currentStep === 0"
          @select="handleTypeSelected"
        />

        <!-- Strength Goal Steps -->
        <template v-if="goalType === 'strength'">
          <ExerciseSelect
            v-if="currentStep === 1"
            v-model="strengthExerciseId"
          />
          <TargetWeightInput
            v-if="currentStep === 2"
            v-model="strengthTargetWeight"
            :exercise-id="strengthExerciseId"
          />
          <DeadlineSelect
            v-if="currentStep === 3"
            v-model="strengthDeadline"
          />
        </template>

        <!-- Volume Goal Steps -->
        <template v-if="goalType === 'volume'">
          <VolumeTypeSelect
            v-if="currentStep === 1"
            v-model="volumeType"
          />
          <VolumeTargetInput
            v-if="currentStep === 2"
            v-model="volumeTargetValue"
            :volume-type="volumeType"
            :exercise-id="volumeExerciseId"
            :muscle-group="volumeMuscleGroup"
            :period="volumePeriod"
          />
          <VolumePeriodSelect
            v-if="currentStep === 3"
            v-model="volumePeriod"
          />
        </template>

        <!-- Frequency Goal Steps -->
        <template v-if="goalType === 'frequency'">
          <FrequencyConfig
            v-if="currentStep === 1"
            :frequency-type="frequencyType"
            :target-count="frequencyTargetCount"
            :period="frequencyPeriod"
            :muscle-group="frequencyMuscleGroup"
            @update:frequency-type="frequencyType = $event"
            @update:target-count="frequencyTargetCount = $event"
            @update:period="frequencyPeriod = $event"
            @update:muscle-group="frequencyMuscleGroup = $event"
          />
        </template>

        <!-- Streak Goal Steps -->
        <template v-if="goalType === 'streak'">
          <StreakConfig
            v-if="currentStep === 1"
            :streak-type="streakType"
            :target-days="streakTargetDays"
            :allow-rest-days="streakAllowRestDays"
            :max-rest-days="streakMaxRestDays"
            @update:streak-type="streakType = $event"
            @update:target-days="streakTargetDays = $event"
            @update:allow-rest-days="streakAllowRestDays = $event"
            @update:max-rest-days="streakMaxRestDays = $event"
          />
        </template>
      </div>

      <DialogFooter>
        <div class="flex w-full gap-2">
          <Button
            v-if="currentStep > 0"
            variant="outline"
            class="flex-1"
            @click="prevStep"
          >
            {{ t('goals.wizard.back') }}
          </Button>
          <Button
            v-if="!isLastStep"
            class="flex-1"
            :disabled="!canProceed"
            @click="nextStep"
          >
            {{ t('goals.wizard.next') }}
          </Button>
          <Button
            v-if="isLastStep && currentStep > 0"
            class="flex-1"
            :disabled="loading || !isAuthenticated || !canProceed"
            @click="createGoal"
          >
            <CheckCircle v-if="!loading" class="mr-2 h-4 w-4" />
            {{ loading ? t('goals.wizard.creating') : t('goals.wizard.create') }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
