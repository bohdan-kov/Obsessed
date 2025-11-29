<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { ChevronLeft, Check, Loader2 } from 'lucide-vue-next'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useUnits } from '@/composables/useUnits'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const { weightUnit, unitLabel, toStorageUnit } = useUnits()

const props = defineProps({
  open: Boolean,
})
const emit = defineEmits(['update:open'])

const workoutStore = useWorkoutStore()
const exerciseStore = useExerciseStore()

const { recentExercises, allExercises } = storeToRefs(exerciseStore)

// Form state
const step = ref('exercise') // 'exercise' | 'details'
const selectedExercise = ref(null)
const weight = ref('')
const reps = ref('')
const rpe = ref('')
const saving = ref(false)

// Remember last values
const lastWeight = ref(localStorage.getItem('obsessed_lastWeight') || '')

const canSubmit = computed(() => {
  return selectedExercise.value && weight.value && reps.value && !saving.value
})

function selectExercise(exercise) {
  selectedExercise.value = exercise
  weight.value = lastWeight.value
  step.value = 'details'
}

function goBack() {
  step.value = 'exercise'
  selectedExercise.value = null
}

async function handleSubmit() {
  if (!canSubmit.value) return

  saving.value = true

  try {
    // Ensure workout is started
    if (!workoutStore.activeWorkout) {
      await workoutStore.startWorkout()
    }

    // Add exercise if not already in workout
    const exerciseInWorkout = workoutStore.activeWorkout.exercises.find(
      (ex) => ex.exerciseId === selectedExercise.value.id
    )

    if (!exerciseInWorkout) {
      await workoutStore.addExercise({
        id: selectedExercise.value.id,
        name: selectedExercise.value.name,
        muscleGroup: selectedExercise.value.muscleGroups?.[0] || 'Unknown',
        category: selectedExercise.value.category,
      })
    }

    // Add set (convert weight to storage unit - kg)
    const weightInKg = toStorageUnit(parseFloat(weight.value))
    await workoutStore.addSet(selectedExercise.value.id, {
      weight: weightInKg,
      reps: parseInt(reps.value),
      rpe: rpe.value ? parseInt(rpe.value) : null,
      completedAt: new Date(),
    })

    // Remember values
    localStorage.setItem('obsessed_lastWeight', weight.value)
    exerciseStore.addToRecent(selectedExercise.value.id)

    // Reset and close
    resetForm()
    emit('update:open', false)
  } catch (error) {
    console.error('Failed to save set:', error)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  step.value = 'exercise'
  selectedExercise.value = null
  weight.value = ''
  reps.value = ''
  rpe.value = ''
}

function handleClose(open) {
  if (!open) resetForm()
  emit('update:open', open)
}
</script>

<template>
  <Sheet :open="open" @update:open="handleClose">
    <SheetContent side="bottom" class="h-[85vh] rounded-t-xl">
      <SheetHeader class="text-left">
        <div class="flex items-center gap-2">
          <Button
            v-if="step === 'details'"
            variant="ghost"
            size="icon"
            @click="goBack"
          >
            <ChevronLeft class="w-5 h-5" />
          </Button>
          <div>
            <SheetTitle>
              {{ step === 'exercise' ? t('workout.quickLog.title') : selectedExercise?.name }}
            </SheetTitle>
            <SheetDescription>
              {{
                step === 'exercise'
                  ? t('workout.quickLog.selectExercise')
                  : t('workout.quickLog.enterDetails')
              }}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <!-- Step 1: Exercise Selection -->
      <div v-if="step === 'exercise'" class="py-4 flex-1 overflow-hidden">
        <Command class="rounded-lg border">
          <CommandInput :placeholder="t('workout.quickLog.searchPlaceholder')" />
          <CommandList class="max-h-[50vh]">
            <CommandEmpty>{{ t('workout.quickLog.noExercisesFound') }}</CommandEmpty>

            <CommandGroup v-if="recentExercises.length" :heading="t('workout.quickLog.recent')">
              <CommandItem
                v-for="exercise in recentExercises"
                :key="exercise.id"
                :value="exercise.name"
                @select="selectExercise(exercise)"
                class="py-3"
              >
                <span>{{ exercise.name }}</span>
                <span class="ml-auto text-xs text-muted-foreground">
                  {{ exercise.muscleGroups?.[0] || 'Unknown' }}
                </span>
              </CommandItem>
            </CommandGroup>

            <CommandGroup :heading="t('workout.quickLog.allExercises')">
              <CommandItem
                v-for="exercise in allExercises"
                :key="exercise.id"
                :value="exercise.name"
                @select="selectExercise(exercise)"
                class="py-3"
              >
                <span>{{ exercise.name }}</span>
                <span class="ml-auto text-xs text-muted-foreground">
                  {{ exercise.muscleGroups?.[0] || 'Unknown' }}
                </span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>

      <!-- Step 2: Set Details -->
      <div v-else class="py-6 space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="weight" class="text-base">{{ t('workout.quickLog.weight') }} ({{ unitLabel }})</Label>
            <Input
              id="weight"
              v-model="weight"
              type="number"
              inputmode="decimal"
              placeholder="0"
              class="text-3xl h-16 text-center font-mono"
            />
          </div>
          <div class="space-y-2">
            <Label for="reps" class="text-base">{{ t('workout.quickLog.reps') }}</Label>
            <Input
              id="reps"
              v-model="reps"
              type="number"
              inputmode="numeric"
              placeholder="0"
              class="text-3xl h-16 text-center font-mono"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="rpe" class="text-base">{{ t('workout.quickLog.rpe') }}</Label>
          <Input
            id="rpe"
            v-model="rpe"
            type="number"
            inputmode="numeric"
            min="1"
            max="10"
            placeholder="1-10"
            class="h-12 text-center font-mono"
          />
        </div>
      </div>

      <SheetFooter v-if="step === 'details'" class="mt-auto">
        <Button
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="w-full h-14 text-lg bg-red-500 hover:bg-red-600"
        >
          <Loader2 v-if="saving" class="w-5 h-5 mr-2 animate-spin" />
          <Check v-else class="w-5 h-5 mr-2" />
          {{ t('workout.quickLog.submit') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
