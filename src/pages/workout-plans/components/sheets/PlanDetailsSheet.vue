<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlan } from '@/composables/usePlan'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Edit } from 'lucide-vue-next'
import PlanExerciseItem from '../PlanExerciseItem.vue'

const { t } = useI18n()
const { getPlan } = usePlan()

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  planId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'start', 'edit'])

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const plan = ref(null)

// Load plan when sheet opens or planId changes
watch(
  () => [props.open, props.planId],
  () => {
    if (props.open && props.planId) {
      plan.value = getPlan(props.planId)
    }
  },
  { immediate: true },
)

function handleStart() {
  emit('start', props.planId)
  isOpen.value = false
}

function handleEdit() {
  emit('edit', props.planId)
  isOpen.value = false
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="right" class="w-full sm:max-w-2xl flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4 border-b">
        <SheetTitle>{{ plan?.name || t('plans.details.title') }}</SheetTitle>
        <SheetDescription v-if="plan?.description">
          {{ plan.description }}
        </SheetDescription>
        <SheetDescription v-else class="text-muted-foreground/50">
          {{ t('plans.details.noDescription') }}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea class="flex-1 px-6">
        <div v-if="plan" class="space-y-4 py-4">
          <!-- Exercises Section -->
          <div>
            <h3 class="text-sm font-medium mb-3">
              {{ t('plans.details.exercises', { count: plan.exercises?.length || 0 }) }}
            </h3>

            <div class="space-y-3">
              <PlanExerciseItem
                v-for="(exercise, index) in plan.exercises"
                :key="index"
                :exercise="exercise"
                :index="index"
                :readonly="true"
                :show-drag-handle="false"
              />
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
          {{ t('plans.details.edit') }}
        </Button>
        <Button @click="handleStart" class="flex-1 min-h-11">
          <Play class="mr-2 h-4 w-4" />
          {{ t('plans.details.startWorkout') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
