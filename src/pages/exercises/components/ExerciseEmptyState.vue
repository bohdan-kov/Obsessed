<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div
      class="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center"
    >
      <component :is="icon" class="h-8 w-8 text-muted-foreground" />
    </div>

    <h3 class="text-lg font-semibold mb-2">
      {{ title }}
    </h3>

    <p class="text-sm text-muted-foreground mb-6 max-w-md">
      {{ description }}
    </p>

    <div v-if="showActions" class="flex flex-col sm:flex-row gap-3">
      <Button
        v-if="showCreateButton"
        @click="emit('create')"
        size="lg"
        class="min-h-11"
      >
        <Plus class="h-4 w-4 mr-2" />
        {{ t('exercises.emptyState.createButton') }}
      </Button>

      <Button
        v-if="showResetButton"
        @click="emit('reset-filters')"
        variant="outline"
        size="lg"
        class="min-h-11"
      >
        <X class="h-4 w-4 mr-2" />
        {{ t('exercises.filters.reset') }}
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Dumbbell, Search, Star, Plus, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  /**
   * Type of empty state
   * - 'no-exercises': No exercises in library
   * - 'no-results': No search/filter results
   * - 'no-favorites': No favorite exercises
   */
  type: {
    type: String,
    default: 'no-exercises',
    validator: (value) => ['no-exercises', 'no-results', 'no-favorites'].includes(value),
  },
  /**
   * Show action buttons
   */
  showActions: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['create', 'reset-filters'])

const { t } = useI18n()

/**
 * Icon based on empty state type
 */
const icon = computed(() => {
  switch (props.type) {
    case 'no-exercises':
      return Dumbbell
    case 'no-results':
      return Search
    case 'no-favorites':
      return Star
    default:
      return Dumbbell
  }
})

/**
 * Title based on empty state type
 */
const title = computed(() => {
  switch (props.type) {
    case 'no-exercises':
      return t('exercises.emptyState.title')
    case 'no-results':
      return t('exercises.search.noResults')
    case 'no-favorites':
      return t('exercises.favorites.empty')
    default:
      return t('exercises.emptyState.title')
  }
})

/**
 * Description based on empty state type
 */
const description = computed(() => {
  switch (props.type) {
    case 'no-exercises':
      return t('exercises.emptyState.description')
    case 'no-results':
      return t('exercises.list.emptyFiltered')
    case 'no-favorites':
      return t('exercises.favorites.addHint')
    default:
      return t('exercises.emptyState.description')
  }
})

/**
 * Show create button
 */
const showCreateButton = computed(() => {
  return props.type === 'no-exercises'
})

/**
 * Show reset filters button
 */
const showResetButton = computed(() => {
  return props.type === 'no-results'
})
</script>
