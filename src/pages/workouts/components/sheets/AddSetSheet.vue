<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="bottom" class="h-[85vh]">
      <SheetHeader>
        <SheetTitle>{{ t('workout.activeWorkout.set.logSet') }}</SheetTitle>
        <SheetDescription v-if="exercise">
          {{ exercise.exerciseName }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-6 space-y-6">
        <!-- Weight Input -->
        <div class="space-y-2">
          <Label>{{ t('workout.activeWorkout.set.weight') }} ({{ unitLabel }})</Label>

          <!-- Quick Increment Buttons -->
          <div class="grid grid-cols-4 gap-2">
            <Button
              v-for="increment in weightIncrements"
              :key="increment"
              variant="outline"
              size="sm"
              @click="adjustWeight(increment)"
            >
              {{ increment > 0 ? '+' : '' }}{{ increment }}{{ unitLabel }}
            </Button>
          </div>

          <!-- Weight Input -->
          <Input
            ref="weightInput"
            v-model.number="weight"
            type="number"
            inputmode="decimal"
            step="0.5"
            min="0"
            class="h-14 text-center text-lg"
            @focus="$event.target.select()"
          />
        </div>

        <!-- Reps Input -->
        <div class="space-y-2">
          <Label>{{ t('workout.activeWorkout.set.reps') }}</Label>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              class="h-14 w-14"
              :disabled="reps <= 1"
              @click="reps = Math.max(1, reps - 1)"
            >
              <Minus class="h-5 w-5" />
            </Button>

            <Input
              v-model.number="reps"
              type="number"
              inputmode="numeric"
              min="1"
              class="h-14 text-center text-lg"
              @focus="$event.target.select()"
            />

            <Button
              variant="outline"
              size="icon"
              class="h-14 w-14"
              @click="reps++"
            >
              <Plus class="h-5 w-5" />
            </Button>
          </div>
        </div>

        <!-- RPE Input (Optional) -->
        <div class="space-y-2">
          <Label>{{ t('workout.activeWorkout.set.rpeOptional') }}</Label>

          <div class="grid grid-cols-5 gap-2">
            <Button
              v-for="value in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
              :key="value"
              :variant="rpe === value ? 'default' : 'outline'"
              size="sm"
              @click="rpe = rpe === value ? null : value"
            >
              {{ value }}
            </Button>
          </div>
        </div>

        <!-- Set Type -->
        <div class="space-y-2">
          <Label>{{ t('workout.activeWorkout.set.type') }}</Label>

          <div class="grid grid-cols-3 gap-2">
            <Button
              v-for="type in setTypes"
              :key="type"
              :variant="setType === type ? 'default' : 'outline'"
              size="sm"
              @click="setType = type"
            >
              {{ t(`workout.activeWorkout.set.types.${type}`) }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <SheetFooter class="mt-6">
        <Button
          class="h-12 w-full text-lg"
          :disabled="!isValid || saving"
          @click="handleSubmit"
        >
          {{
            saving ? t('common.saving') : t('workout.activeWorkout.set.logSet')
          }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Minus } from 'lucide-vue-next'
import { CONFIG } from '@/constants/config'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  exercise: {
    type: Object,
    default: null,
  },
  previousSet: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'submit'])

const { t } = useI18n()
const { weightUnit, unitLabel, fromStorageUnit } = useUnits()

// Form state
const weight = ref(0)
const reps = ref(10)
const rpe = ref(null)
const setType = ref(CONFIG.setTypes.NORMAL)
const saving = ref(false)
const weightInput = ref(null)

// Set types
const setTypes = Object.values(CONFIG.setTypes)

// Weight increment buttons (adjust for current unit)
const weightIncrements = computed(() => {
  if (weightUnit.value === 'lbs') {
    return [-10, -5, 5, 10]
  }
  return [-5, -2.5, 2.5, 5]
})

// Validation
const isValid = computed(() => {
  return weight.value > 0 && reps.value > 0
})

// Adjust weight by increment
function adjustWeight(increment) {
  weight.value = Math.max(0, weight.value + increment)
}

// Pre-fill form when sheet opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Pre-fill from previous set or localStorage
      if (props.previousSet) {
        // Convert from storage unit (kg) to display unit
        weight.value = fromStorageUnit(props.previousSet.weight)
        reps.value = props.previousSet.reps
        rpe.value = props.previousSet.rpe
      } else {
        // Try localStorage
        const lastWeight = localStorage.getItem(CONFIG.storage.LAST_WEIGHT)
        const lastRpe = localStorage.getItem(CONFIG.storage.LAST_RPE)

        if (lastWeight) {
          weight.value = parseFloat(lastWeight)
        }
        if (lastRpe) {
          rpe.value = parseInt(lastRpe)
        }
      }

      // Auto-focus weight input
      nextTick(() => {
        if (weightInput.value) {
          // Access the native input element from the Input component
          const inputElement =
            weightInput.value.$el?.querySelector?.('input') || weightInput.value.$el
          if (inputElement && typeof inputElement.focus === 'function') {
            inputElement.focus()
            inputElement.select?.()
          }
        }
      })
    }
  },
)

// Reset saving state on close
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      saving.value = false
    }
  },
)

// Submit handler
async function handleSubmit() {
  if (!isValid.value || saving.value) return

  saving.value = true

  const setData = {
    weight: weight.value, // In display unit (will be converted by composable)
    reps: reps.value,
    rpe: rpe.value,
    type: setType.value,
  }

  emit('submit', setData)

  // Don't close here - parent will close after successful save
}
</script>
