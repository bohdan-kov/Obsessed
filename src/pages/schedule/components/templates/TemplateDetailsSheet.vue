<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { getLocalizedExerciseName } from '@/utils/exerciseUtils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import MuscleGroupBadges from '@/pages/schedule/components/shared/MuscleGroupBadges.vue'
import { Play, Edit, Dumbbell, Clock } from 'lucide-vue-next'

const { t, locale } = useI18n()
const { unitLabel } = useUnits()
const scheduleStore = useScheduleStore()
const exerciseStore = useExerciseStore()
const { templates } = storeToRefs(scheduleStore)

// Memoize exercise data lookups to avoid redundant getExerciseById calls
// Map caches exercise data for current template's exercises
const exerciseDataMap = computed(() => {
  const map = new Map()
  template.value?.exercises?.forEach((ex) => {
    const data = exerciseStore.getExerciseById(ex.exerciseId)
    if (data) {
      map.set(ex.exerciseId, data)
    }
  })
  return map
})

// Get exercise data for badges (uses memoized map)
function getExerciseData(exerciseId) {
  return exerciseDataMap.value.get(exerciseId)
}

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  templateId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:open', 'start', 'edit'])

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const template = ref(null)

// Load template when sheet opens or templateId changes
watch(
  () => [props.open, props.templateId],
  () => {
    if (props.open && props.templateId) {
      template.value = templates.value.find(t => t.id === props.templateId)
    }
  },
  { immediate: true }
)

function handleStart() {
  emit('start', props.templateId)
  isOpen.value = false
}

function handleEdit() {
  emit('edit', props.templateId)
  isOpen.value = false
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="right" class="w-full sm:max-w-2xl flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4 border-b">
        <SheetTitle>{{ template?.name || t('schedule.templateDetails.title') }}</SheetTitle>
        <SheetDescription v-if="template">
          <div class="flex items-center gap-4 text-sm mt-2">
            <div class="flex items-center gap-1">
              <Dumbbell class="w-4 h-4" />
              <span>{{ template.exercises.length }} {{ t('common.exercises') }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Clock class="w-4 h-4" />
              <span>~{{ template.estimatedDuration }} {{ t('common.min') }}</span>
            </div>
          </div>
        </SheetDescription>
      </SheetHeader>

      <ScrollArea class="flex-1 px-6">
        <div v-if="template" class="space-y-6 py-4">
          <!-- Muscle Groups -->
          <div>
            <h3 class="text-sm font-medium mb-3">
              {{ t('schedule.templateDetails.muscleGroups') }}
            </h3>
            <MuscleGroupBadges :muscle-groups="template.muscleGroups" />
          </div>

          <Separator />

          <!-- Exercises Section -->
          <div>
            <h3 class="text-sm font-medium mb-3">
              {{ t('schedule.templateDetails.exercises', { count: template.exercises?.length || 0 }) }}
            </h3>

            <div class="space-y-3">
              <Card
                v-for="(exercise, index) in template.exercises"
                :key="index"
                class="p-4"
              >
                <div class="space-y-3">
                  <!-- Exercise Name & Badges -->
                  <div>
                    <h4 class="font-medium">{{ getLocalizedExerciseName(exercise.exerciseName, locale) }}</h4>
                    <div class="flex gap-2 mt-1">
                      <Badge
                        v-if="getExerciseData(exercise.exerciseId)?.muscleGroup"
                        variant="secondary"
                        class="text-xs"
                      >
                        {{ t(`exercises.muscleGroups.${getExerciseData(exercise.exerciseId).muscleGroup}`) }}
                      </Badge>
                      <Badge
                        v-if="getExerciseData(exercise.exerciseId)?.equipment"
                        variant="outline"
                        class="text-xs"
                      >
                        {{ t(`exercises.equipment.${getExerciseData(exercise.exerciseId).equipment}`) }}
                      </Badge>
                    </div>
                  </div>

                  <!-- Exercise Details -->
                  <div class="flex flex-wrap gap-2 text-sm">
                    <span v-if="exercise.sets" class="text-muted-foreground">
                      {{ t('schedule.form.sets') }}: <strong>{{ exercise.sets }}</strong>
                    </span>
                    <span v-if="exercise.targetWeight" class="text-muted-foreground">
                      {{ t('common.weight') }}:
                      <strong>{{ exercise.targetWeight }} {{ unitLabel }}</strong>
                    </span>
                    <span v-if="exercise.reps" class="text-muted-foreground">
                      {{ t('schedule.form.reps') }}: <strong>{{ exercise.reps }}</strong>
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else class="py-8 text-center text-muted-foreground">
          {{ t('common.loading') }}
        </div>
      </ScrollArea>

      <SheetFooter class="px-6 py-4 border-t flex-row gap-2 sm:gap-2">
        <Button @click="handleEdit" variant="outline" class="flex-1 min-h-11">
          <Edit class="mr-2 h-4 w-4" />
          {{ t('schedule.templateDetails.edit') }}
        </Button>
        <Button @click="handleStart" class="flex-1 min-h-11">
          <Play class="mr-2 h-4 w-4" />
          {{ t('schedule.templateDetails.startWorkout') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
