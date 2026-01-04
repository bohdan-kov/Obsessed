<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useExerciseStore } from '@/stores/exerciseStore'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const { t } = useI18n()
const exerciseStore = useExerciseStore()
const { allExercises } = storeToRefs(exerciseStore)

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const selectedExerciseId = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const availableExercises = computed(() => {
  return allExercises.value
    .map((exercise) => ({
      id: exercise.id,
      name: exerciseStore.getExerciseDisplayName(exercise),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h3 class="text-lg font-semibold mb-2">{{ t('goals.wizard.selectExercise') }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.selectExerciseDescription') }}
      </p>
    </div>

    <div class="space-y-2">
      <Label for="exercise">{{ t('goals.wizard.selectExercise') }}</Label>
      <Select v-model="selectedExerciseId">
        <SelectTrigger id="exercise" class="h-11">
          <SelectValue :placeholder="t('goals.wizard.selectExercisePlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="exercise in availableExercises"
            :key="exercise.id"
            :value="exercise.id"
          >
            {{ exercise.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
