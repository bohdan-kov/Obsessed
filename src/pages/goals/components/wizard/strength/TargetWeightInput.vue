<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useUnits } from '@/composables/useUnits'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { calculate1RM, findBestSet } from '@/utils/strengthUtils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Info } from 'lucide-vue-next'

const { t } = useI18n()
const { formatWeight, toStorageUnit, weightUnit } = useUnits()
const workoutStore = useWorkoutStore()
const exerciseStore = useExerciseStore()
const { completedWorkouts } = storeToRefs(workoutStore)
const { allExercises } = storeToRefs(exerciseStore)

const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  exerciseId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

// Local input value (in display units)
const displayValue = ref('')

// Get selected exercise
const selectedExercise = computed(() => {
  if (!props.exerciseId) return null
  return allExercises.value.find((ex) => ex.id === props.exerciseId)
})

// Calculate current 1RM for selected exercise
const current1RM = computed(() => {
  if (!selectedExercise.value) return null

  const exerciseName = exerciseStore.getExerciseDisplayName(selectedExercise.value)
  const relevantWorkouts = completedWorkouts.value.filter((w) =>
    w.exercises?.some((e) => e.name === exerciseName)
  )

  if (!relevantWorkouts.length) return null

  const latestWorkout = relevantWorkouts[relevantWorkouts.length - 1]
  const exercise = latestWorkout.exercises.find((e) => e.name === exerciseName)
  const bestSet = findBestSet(exercise.sets)

  if (!bestSet) return null

  return calculate1RM(bestSet.weight, bestSet.reps)
})

// Recommended target (5-10% increase)
const recommendedTarget = computed(() => {
  if (!current1RM.value) return null
  return Math.round(current1RM.value * 1.075) // 7.5% increase
})

// Validation
const isValid = computed(() => {
  const value = parseFloat(displayValue.value)
  if (isNaN(value) || value <= 0) return false
  // Target should be higher than current
  if (current1RM.value && value <= current1RM.value) return false
  return true
})

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== null && newValue !== parseFloat(displayValue.value)) {
      displayValue.value = newValue.toString()
    }
  },
  { immediate: true }
)

// Watch for display value changes
watch(displayValue, (newValue) => {
  const numValue = parseFloat(newValue)
  if (!isNaN(numValue) && numValue > 0) {
    // Convert to storage unit (kg) before emitting
    const storageValue = toStorageUnit(numValue)
    emit('update:modelValue', storageValue)
  } else {
    emit('update:modelValue', null)
  }
})

function applyRecommendation() {
  if (recommendedTarget.value) {
    displayValue.value = recommendedTarget.value.toString()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h3 class="text-lg font-semibold mb-2">{{ t('goals.wizard.setTarget') }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.setTargetDescription') }}
      </p>
    </div>

    <!-- Current 1RM Card -->
    <Card v-if="current1RM" class="bg-accent/50 border-primary/20">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-primary/10">
            <Dumbbell class="w-5 h-5 text-primary" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-muted-foreground mb-1">
              {{ t('goals.wizard.currentWeight') }} (1RM)
            </p>
            <p class="text-lg font-bold">
              {{ formatWeight(current1RM, { precision: 1 }) }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Target Input -->
    <div class="space-y-2">
      <Label for="target-weight">
        {{ t('goals.wizard.targetWeight') }}
      </Label>
      <div class="flex gap-2">
        <Input
          id="target-weight"
          v-model="displayValue"
          type="number"
          inputmode="decimal"
          step="0.1"
          :placeholder="t('goals.wizard.enterTargetWeight')"
          class="text-lg h-12 flex-1"
        />
        <Badge variant="outline" class="flex items-center px-3 h-12">
          {{ weightUnit }}
        </Badge>
      </div>
      <p v-if="current1RM" class="text-xs text-muted-foreground">
        {{ t('goals.wizard.currentWeight') }}: {{ formatWeight(current1RM, { precision: 1 }) }}
      </p>
    </div>

    <!-- Recommendation -->
    <Card
      v-if="recommendedTarget && !displayValue"
      class="bg-blue-500/5 border-blue-500/20 cursor-pointer hover:bg-blue-500/10 transition-colors"
      @click="applyRecommendation"
    >
      <CardContent class="pt-4 pb-4">
        <div class="flex items-start gap-3">
          <Info class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium mb-1">{{ t('goals.wizard.recommendation') }}</p>
            <p class="text-xs text-muted-foreground mb-2">
              {{ t('goals.wizard.recommendationDescription') }}
            </p>
            <p class="text-lg font-bold text-blue-500">
              {{ formatWeight(recommendedTarget, { precision: 1 }) }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Validation Error -->
    <p v-if="displayValue && !isValid" class="text-sm text-destructive">
      {{ t('goals.wizard.invalidTargetWeight') }}
    </p>
  </div>
</template>

<style scoped>
/* Remove spinner from number input */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
