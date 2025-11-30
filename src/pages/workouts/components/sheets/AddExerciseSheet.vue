<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="bottom" class="h-[85vh]">
      <SheetHeader>
        <SheetTitle>{{
          t('workout.activeWorkout.exercise.addExercise')
        }}</SheetTitle>
        <SheetDescription>{{
          t('workout.activeWorkout.exercise.addExerciseDescription')
        }}</SheetDescription>
      </SheetHeader>

      <!-- Loading state -->
      <div v-if="loading" class="mt-6 flex items-center justify-center py-8">
        <p class="text-sm text-muted-foreground">{{ t('common.loading') }}</p>
      </div>

      <!-- Exercise list -->
      <Command v-else class="mt-6">
        <CommandInput
          v-model="searchQuery"
          :placeholder="t('exercises.search.placeholder')"
        />
        <CommandList>
          <CommandEmpty>{{
            t('exercises.search.noResults')
          }}</CommandEmpty>

          <!-- Recent Exercises -->
          <CommandGroup
            v-if="!searchQuery && recentExercises.length > 0"
            :heading="t('exercises.sort.recent')"
          >
            <CommandItem
              v-for="exercise in recentExercises"
              :key="exercise.id"
              :value="exercise.id"
              class="flex items-center gap-3 py-3"
              @select="handleSelect(exercise)"
            >
              <div class="flex-1">
                <div class="font-medium">
                  {{ getExerciseDisplayName(exercise) }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ exercise.primaryMuscle }}
                </div>
              </div>
            </CommandItem>
          </CommandGroup>

          <!-- All Exercises (Grouped by Muscle) -->
          <template v-if="!searchQuery">
            <CommandGroup
              v-for="(exercises, muscleGroup) in exercisesByMuscle"
              :key="muscleGroup"
              :heading="muscleGroup"
            >
              <CommandItem
                v-for="exercise in exercises"
                :key="exercise.id"
                :value="exercise.id"
                class="flex items-center gap-3 py-3"
                @select="handleSelect(exercise)"
              >
                <div class="flex-1">
                  <div class="font-medium">
                    {{ getExerciseDisplayName(exercise) }}
                  </div>
                </div>
              </CommandItem>
            </CommandGroup>
          </template>

          <!-- Search Results -->
          <CommandGroup v-else>
            <CommandItem
              v-for="exercise in filteredExercises"
              :key="exercise.id"
              :value="exercise.id"
              class="flex items-center gap-3 py-3"
              @select="handleSelect(exercise)"
            >
              <div class="flex-1">
                <div class="font-medium">
                  {{ getExerciseDisplayName(exercise) }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ exercise.primaryMuscle }}
                </div>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useExerciseStore } from '@/stores/exerciseStore'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open', 'select'])

const { t } = useI18n()
const exerciseStore = useExerciseStore()
const { loading } = storeToRefs(exerciseStore)

const searchQuery = ref('')

// Fetch exercises when sheet opens if not already loaded
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && exerciseStore.exercises.length === 0 && !loading.value) {
      try {
        await exerciseStore.fetchExercises()
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch exercises:', error)
        }
      }
    }
  },
  { immediate: true },
)

// Get recent exercises
const recentExercises = computed(() => {
  return exerciseStore.recentExercises.slice(0, 5)
})

// Get exercises grouped by muscle
const exercisesByMuscle = computed(() => {
  const grouped = {}

  exerciseStore.exercises.forEach((exercise) => {
    const muscle = exercise.primaryMuscle || 'Other'
    if (!grouped[muscle]) {
      grouped[muscle] = []
    }
    grouped[muscle].push(exercise)
  })

  return grouped
})

// Filtered exercises for search
const filteredExercises = computed(() => {
  if (!searchQuery.value) return []

  const query = searchQuery.value.toLowerCase()
  return exerciseStore.exercises.filter((exercise) => {
    const name = exerciseStore.getExerciseDisplayName(exercise).toLowerCase()
    return name.includes(query)
  })
})

// Get display name
function getExerciseDisplayName(exercise) {
  return exerciseStore.getExerciseDisplayName(exercise)
}

// Handle selection
function handleSelect(exercise) {
  emit('select', exercise)
  emit('update:open', false)
  searchQuery.value = ''
}
</script>
