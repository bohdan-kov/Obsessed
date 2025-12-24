<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GripVertical, X } from 'lucide-vue-next'
import { CONFIG } from '@/constants/config'

const { t } = useI18n()
const { unitLabel } = useUnits()

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  showDragHandle: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update', 'remove'])

// Local state for inputs
const suggestedSets = ref(props.exercise.suggestedSets)
const suggestedWeight = ref(props.exercise.suggestedWeight)
const suggestedReps = ref(props.exercise.suggestedReps)
const notes = ref(props.exercise.notes)

// Validation
const setsError = computed(() => {
  if (!suggestedSets.value) return null
  if (
    suggestedSets.value < CONFIG.plans.SUGGESTED_SETS_MIN ||
    suggestedSets.value > CONFIG.plans.SUGGESTED_SETS_MAX
  ) {
    return t('plans.exercise.setsRange')
  }
  return null
})

const weightError = computed(() => {
  if (!suggestedWeight.value) return null
  if (
    suggestedWeight.value < CONFIG.workout.MIN_WEIGHT ||
    suggestedWeight.value > CONFIG.workout.MAX_WEIGHT
  ) {
    return t('plans.exercise.weightRange')
  }
  return null
})

const notesError = computed(() => {
  if (!notes.value) return null
  if (notes.value.length > CONFIG.plans.NOTES_MAX_LENGTH) {
    return t('plans.exercise.notesMaxLength')
  }
  return null
})

// Update parent when inputs change
function handleUpdate() {
  emit('update', {
    suggestedSets: suggestedSets.value || null,
    suggestedWeight: suggestedWeight.value || null,
    suggestedReps: suggestedReps.value?.trim() || null,
    notes: notes.value?.trim() || null,
  })
}

// Character count for notes
const notesCharCount = computed(() => notes.value?.length || 0)
</script>

<template>
  <Card class="p-4">
    <div class="flex gap-3">
      <!-- Drag Handle -->
      <div
        v-if="showDragHandle && !readonly"
        class="flex items-start pt-1 cursor-grab active:cursor-grabbing"
      >
        <GripVertical class="h-5 w-5 text-muted-foreground" />
      </div>

      <div class="flex-1 space-y-3">
        <!-- Exercise Name & Remove Button -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <h4 class="font-medium">{{ exercise.exerciseName }}</h4>
            <div class="flex gap-2 mt-1">
              <Badge v-if="exercise.muscleGroup" variant="secondary" class="text-xs">
                {{ t(`exercises.muscleGroups.${exercise.muscleGroup}`) }}
              </Badge>
              <Badge v-if="exercise.equipment" variant="outline" class="text-xs">
                {{ t(`exercises.equipment.${exercise.equipment}`) }}
              </Badge>
            </div>
          </div>

          <Button
            v-if="!readonly"
            variant="ghost"
            size="icon"
            class="h-8 w-8 -mr-2"
            @click="emit('remove', index)"
            :aria-label="t('plans.exercise.removeExercise')"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>

        <!-- Suggestions Grid -->
        <div v-if="!readonly" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Suggested Sets -->
          <div class="space-y-1">
            <Label for="suggested-sets" class="text-xs">
              {{ t('plans.exercise.suggestedSets') }}
            </Label>
            <Input
              id="suggested-sets"
              v-model.number="suggestedSets"
              type="number"
              :min="CONFIG.plans.SUGGESTED_SETS_MIN"
              :max="CONFIG.plans.SUGGESTED_SETS_MAX"
              :placeholder="t('plans.exercise.setsPlaceholder')"
              class="h-9"
              @blur="handleUpdate"
            />
            <p v-if="setsError" class="text-xs text-destructive">
              {{ setsError }}
            </p>
          </div>

          <!-- Suggested Weight -->
          <div class="space-y-1">
            <Label for="suggested-weight" class="text-xs">
              {{ t('plans.exercise.suggestedWeight') }} ({{ unitLabel }})
            </Label>
            <Input
              id="suggested-weight"
              v-model.number="suggestedWeight"
              type="number"
              step="0.5"
              :min="CONFIG.workout.MIN_WEIGHT"
              :placeholder="t('plans.exercise.weightPlaceholder')"
              class="h-9"
              @blur="handleUpdate"
            />
            <p v-if="weightError" class="text-xs text-destructive">
              {{ weightError }}
            </p>
          </div>

          <!-- Suggested Reps -->
          <div class="space-y-1">
            <Label for="suggested-reps" class="text-xs">
              {{ t('plans.exercise.suggestedReps') }}
            </Label>
            <Input
              id="suggested-reps"
              v-model="suggestedReps"
              type="text"
              :placeholder="t('plans.exercise.repsPlaceholder')"
              class="h-9"
              @blur="handleUpdate"
            />
          </div>
        </div>

        <!-- Read-only suggestions display -->
        <div
          v-else-if="exercise.suggestedSets || exercise.suggestedWeight || exercise.suggestedReps"
          class="flex flex-wrap gap-2 text-sm"
        >
          <span v-if="exercise.suggestedSets" class="text-muted-foreground">
            {{ t('plans.exercise.suggestedSets') }}: <strong>{{ exercise.suggestedSets }}</strong>
          </span>
          <span v-if="exercise.suggestedWeight" class="text-muted-foreground">
            {{ t('plans.exercise.suggestedWeight') }}:
            <strong>{{ exercise.suggestedWeight }} {{ unitLabel }}</strong>
          </span>
          <span v-if="exercise.suggestedReps" class="text-muted-foreground">
            {{ t('plans.exercise.suggestedReps') }}: <strong>{{ exercise.suggestedReps }}</strong>
          </span>
        </div>

        <!-- Notes -->
        <div v-if="!readonly" class="space-y-1">
          <Label for="notes" class="text-xs">
            {{ t('plans.exercise.notes') }}
          </Label>
          <Textarea
            id="notes"
            v-model="notes"
            :placeholder="t('plans.exercise.notesPlaceholder')"
            :maxlength="CONFIG.plans.NOTES_MAX_LENGTH"
            rows="2"
            class="resize-none"
            @blur="handleUpdate"
          />
          <div class="flex justify-between items-center">
            <p v-if="notesError" class="text-xs text-destructive">
              {{ notesError }}
            </p>
            <p class="text-xs text-muted-foreground text-right ml-auto">
              {{ notesCharCount }}/{{ CONFIG.plans.NOTES_MAX_LENGTH }}
            </p>
          </div>
        </div>

        <!-- Read-only notes -->
        <div v-else-if="exercise.notes" class="text-sm text-muted-foreground">
          <strong class="text-xs">{{ t('plans.exercise.notes') }}:</strong>
          <p class="mt-1">{{ exercise.notes }}</p>
        </div>
      </div>
    </div>
  </Card>
</template>
