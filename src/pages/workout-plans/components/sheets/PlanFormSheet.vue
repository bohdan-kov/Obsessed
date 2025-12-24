<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePlan } from '@/composables/usePlan'
import { usePlanForm } from '@/composables/usePlanForm'
import { useExerciseStore } from '@/stores/exerciseStore'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Check, Loader2 } from 'lucide-vue-next'
import PlanExerciseItem from '../PlanExerciseItem.vue'
import { CONFIG } from '@/constants/config'

const { t } = useI18n()
const { getPlan, createPlan, updatePlan } = usePlan()
const exerciseStore = useExerciseStore()
const { allExercises } = storeToRefs(exerciseStore)
const { getExerciseDisplayName } = exerciseStore

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value),
  },
  plan: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'success'])

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

// Form state
const {
  name,
  description,
  exercises,
  errors,
  isDirty,
  isValid,
  addExercise,
  removeExercise,
  updateExercise,
  validate,
  getSubmitData,
  reset,
  loadPlan,
} = usePlanForm(props.plan, props.mode)

// Exercise selection state
const showExerciseSelector = ref(false)
const exerciseSearchQuery = ref('')

// Saving state
const saving = ref(false)

// Load plan data when sheet opens in edit mode
watch(
  () => [props.open, props.mode, props.plan],
  () => {
    if (props.open) {
      if (props.mode === 'edit' && props.plan) {
        const plan = getPlan(props.plan.id)
        if (plan) {
          loadPlan(plan)
        }
      } else {
        reset()
      }
    }
  },
  { immediate: true },
)

// Filtered exercises for selection
const filteredExercises = computed(() => {
  if (!exerciseSearchQuery.value) {
    return allExercises.value
  }

  const query = exerciseSearchQuery.value.toLowerCase()
  return allExercises.value.filter((ex) => {
    const displayName = getExerciseDisplayName(ex)
    return displayName.toLowerCase().includes(query)
  })
})

// Already added exercise IDs
const addedExerciseIds = computed(() => {
  return new Set(exercises.value.map((ex) => ex.exerciseId))
})

function handleAddExercise(exercise) {
  if (addedExerciseIds.value.has(exercise.id)) {
    return // Exercise already added
  }

  const exerciseToAdd = {
    id: exercise.id,
    name: getExerciseDisplayName(exercise),
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
  }

  addExercise(exerciseToAdd)
  showExerciseSelector.value = false
  exerciseSearchQuery.value = ''
}

function handleUpdateExercise(index, updates) {
  updateExercise(index, updates)
}

function handleRemoveExercise(index) {
  removeExercise(index)
}

async function handleSubmit() {
  if (!validate()) {
    return
  }

  saving.value = true

  try {
    const planData = getSubmitData()

    if (props.mode === 'create') {
      await createPlan(planData)
    } else {
      await updatePlan(props.plan.id, planData)
    }

    emit('success')
    isOpen.value = false
    reset()
  } catch (error) {
    // Error handled by composable
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  reset()
  isOpen.value = false
}

// Sheet title
const sheetTitle = computed(() => {
  return props.mode === 'create' ? t('plans.form.createTitle') : t('plans.form.editTitle')
})

// Character counts
const nameCharCount = computed(() => name.value?.length || 0)
const descriptionCharCount = computed(() => description.value?.length || 0)
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="right" class="w-full sm:max-w-2xl flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4 border-b">
        <SheetTitle>{{ sheetTitle }}</SheetTitle>
        <SheetDescription class="sr-only">
          {{
            mode === 'create' ? t('plans.form.createDescription') : t('plans.form.editDescription')
          }}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea class="flex-1 px-6">
        <div class="space-y-6 py-4">
          <!-- Plan Name -->
          <div class="space-y-2">
            <Label for="plan-name" class="required">
              {{ t('plans.form.name') }}
            </Label>
            <Input
              id="plan-name"
              v-model="name"
              :placeholder="t('plans.form.namePlaceholder')"
              :maxlength="CONFIG.plans.NAME_MAX_LENGTH"
              class="h-11"
            />
            <div class="flex justify-between items-center">
              <p v-if="errors.name" class="text-xs text-destructive">
                {{ errors.name }}
              </p>
              <p class="text-xs text-muted-foreground text-right ml-auto">
                {{ nameCharCount }}/{{ CONFIG.plans.NAME_MAX_LENGTH }}
              </p>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <Label for="plan-description">
              {{ t('plans.form.description') }}
            </Label>
            <Textarea
              id="plan-description"
              v-model="description"
              :placeholder="t('plans.form.descriptionPlaceholder')"
              :maxlength="CONFIG.plans.DESCRIPTION_MAX_LENGTH"
              rows="3"
              class="resize-none"
            />
            <div class="flex justify-between items-center">
              <p v-if="errors.description" class="text-xs text-destructive">
                {{ errors.description }}
              </p>
              <p class="text-xs text-muted-foreground text-right ml-auto">
                {{ descriptionCharCount }}/{{ CONFIG.plans.DESCRIPTION_MAX_LENGTH }}
              </p>
            </div>
          </div>

          <!-- Exercises Section -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label class="text-base">
                {{ t('plans.form.exercises') }}
              </Label>
              <Button
                @click="showExerciseSelector = true"
                variant="outline"
                size="sm"
                :disabled="exercises.length >= CONFIG.plans.MAX_EXERCISES_PER_PLAN"
                class="min-h-9"
              >
                <Plus class="mr-2 h-4 w-4" />
                {{ t('plans.form.addExercise') }}
              </Button>
            </div>

            <p v-if="errors.exercises" class="text-xs text-destructive">
              {{ errors.exercises }}
            </p>

            <!-- Exercise List -->
            <div v-if="exercises.length > 0" class="space-y-3">
              <PlanExerciseItem
                v-for="(exercise, index) in exercises"
                :key="exercise.exerciseId"
                :exercise="exercise"
                :index="index"
                @update="(updates) => handleUpdateExercise(index, updates)"
                @remove="handleRemoveExercise"
              />
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-8 text-muted-foreground">
              <p class="text-sm">{{ t('plans.form.noExercises') }}</p>
              <p class="text-xs mt-1">{{ t('plans.form.noExercisesHint') }}</p>
            </div>
          </div>
        </div>
      </ScrollArea>

      <SheetFooter class="px-6 py-4 border-t flex-row gap-2 sm:gap-2">
        <Button @click="handleCancel" variant="outline" class="flex-1 min-h-11">
          {{ t('plans.form.cancel') }}
        </Button>
        <Button @click="handleSubmit" :disabled="!isValid || saving" class="flex-1 min-h-11">
          <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          {{
            saving
              ? mode === 'create'
                ? t('plans.form.creating')
                : t('plans.form.updating')
              : t('plans.form.save')
          }}
        </Button>
      </SheetFooter>
    </SheetContent>

    <!-- Exercise Selector Sheet -->
    <Sheet v-model:open="showExerciseSelector">
      <SheetContent side="right" class="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader class="px-6 pt-6 pb-4 border-b">
          <SheetTitle>{{ t('plans.form.addExercise') }}</SheetTitle>
          <SheetDescription class="sr-only">
            {{ t('plans.form.addExerciseDescription') }}
          </SheetDescription>
        </SheetHeader>

        <div class="flex-1 overflow-hidden">
          <Command>
            <CommandInput
              v-model="exerciseSearchQuery"
              :placeholder="t('workout.quickLog.searchPlaceholder')"
              class="h-11"
            />
            <CommandList>
              <CommandEmpty>
                {{ t('workout.quickLog.noExercisesFound') }}
              </CommandEmpty>
              <CommandGroup>
                <ScrollArea class="h-[calc(100vh-200px)]">
                  <CommandItem
                    v-for="exercise in filteredExercises"
                    :key="exercise.id"
                    :value="exercise.id"
                    @select="handleAddExercise(exercise)"
                    :disabled="addedExerciseIds.has(exercise.id)"
                    class="min-h-11"
                  >
                    <Check
                      v-if="addedExerciseIds.has(exercise.id)"
                      class="mr-2 h-4 w-4 text-primary"
                    />
                    <span class="flex-1">{{ getExerciseDisplayName(exercise) }}</span>
                    <span v-if="exercise.muscleGroup" class="text-xs text-muted-foreground">
                      {{ t(`exercises.muscleGroups.${exercise.muscleGroup}`) }}
                    </span>
                  </CommandItem>
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </SheetContent>
    </Sheet>
  </Sheet>
</template>

<style>
.required::after {
  content: ' *';
  color: hsl(var(--destructive));
}
</style>
