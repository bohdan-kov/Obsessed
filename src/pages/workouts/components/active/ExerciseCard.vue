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

          <!-- Plan Suggestions Badge -->
          <div v-if="hasSuggestions" class="flex flex-wrap gap-1 mt-2">
            <Badge variant="secondary" class="text-xs">
              {{ t('plans.suggestions.badge') }}
            </Badge>
            <span v-if="suggestions.suggestedSets" class="text-xs text-muted-foreground">
              {{ suggestions.suggestedSets }} {{ t('plans.exercise.suggestedSets').toLowerCase() }}
            </span>
            <span v-if="suggestions.suggestedWeight" class="text-xs text-muted-foreground">
              {{ formatWeight(suggestions.suggestedWeight) }}
            </span>
            <span v-if="suggestions.suggestedReps" class="text-xs text-muted-foreground">
              {{ suggestions.suggestedReps }} {{ t('plans.exercise.suggestedReps').toLowerCase() }}
            </span>
          </div>
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

      <!-- Plan Suggestions Notes (Collapsible) -->
      <Collapsible v-if="suggestions?.notes" class="mt-4">
        <CollapsibleTrigger
          class="flex w-full items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"
        >
          <span class="font-medium">{{ t('plans.exercise.notes') }} ({{ t('plans.suggestions.badge') }})</span>
          <ChevronDown class="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent class="p-3 text-sm text-muted-foreground">
          {{ suggestions.notes }}
        </CollapsibleContent>
      </Collapsible>

      <!-- Regular Notes (Collapsible) -->
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
import { useUnits } from '@/composables/useUnits'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
const { formatWeight } = useUnits()

const setCount = computed(() => props.exercise.sets?.length || 0)

// Plan suggestions
const suggestions = computed(() => props.exercise.planSuggestions || null)

const hasSuggestions = computed(() => {
  return suggestions.value && (
    suggestions.value.suggestedSets ||
    suggestions.value.suggestedWeight ||
    suggestions.value.suggestedReps
  )
})
</script>
