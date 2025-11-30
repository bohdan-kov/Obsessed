<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <CardTitle class="text-lg">{{ exercise.exerciseName }}</CardTitle>
          <CardDescription>
            {{ setCount }}
            {{ t('workout.activeWorkout.stats.sets').toLowerCase() }}
          </CardDescription>
        </div>

        <!-- Add Set Button -->
        <Button size="icon" class="h-11 w-11" @click="$emit('add-set')">
          <Plus class="h-5 w-5" />
        </Button>
      </div>
    </CardHeader>

    <CardContent class="space-y-2">
      <!-- Sets List -->
      <div v-if="exercise.sets.length > 0" class="space-y-2">
        <SetRow
          v-for="(set, index) in exercise.sets"
          :key="set.id || index"
          :set="set"
          :set-number="index + 1"
          @delete="$emit('delete-set', index)"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        {{ t('workout.activeWorkout.exercise.noExercisesHint') }}
      </div>

      <!-- Notes (Collapsible) -->
      <Collapsible v-if="exercise.notes" class="mt-4">
        <CollapsibleTrigger
          class="flex w-full items-center justify-between rounded-lg border p-3 text-sm"
        >
          <span>{{ t('workout.activeWorkout.exercise.notes') }}</span>
          <ChevronDown class="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent class="p-3 text-sm text-muted-foreground">
          {{ exercise.notes }}
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Plus, ChevronDown } from 'lucide-vue-next'
import SetRow from './SetRow.vue'

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
})

defineEmits(['add-set', 'delete-set'])

const { t } = useI18n()

const setCount = computed(() => props.exercise.sets?.length || 0)
</script>
