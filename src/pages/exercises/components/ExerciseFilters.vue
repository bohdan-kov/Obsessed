<template>
  <div class="space-y-4">
    <!-- Filter header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">{{ t('exercises.filters.title') }}</h3>
      <Button
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        @click="handleResetFilters"
        class="h-8 text-xs"
      >
        {{ t('exercises.filters.reset') }}
      </Button>
    </div>

    <!-- Muscle Group Filter -->
    <div class="space-y-2">
      <label class="text-sm font-medium">
        {{ t('exercises.filters.muscleGroup') }}
      </label>
      <Select
        :model-value="modelValue.muscleGroup"
        @update:modelValue="(value) => handleFilterChange('muscleGroup', value)"
      >
        <SelectTrigger class="h-11">
          <SelectValue :placeholder="t('exercises.filters.all')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {{ t('exercises.filters.all') }}
          </SelectItem>
          <SelectItem
            v-for="group in muscleGroups"
            :key="group.id"
            :value="group.id"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: group.color }"
              ></span>
              <span>{{ t(`exercises.muscleGroups.${group.id}`) }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Equipment Filter -->
    <div class="space-y-2">
      <label class="text-sm font-medium">
        {{ t('exercises.filters.equipment') }}
      </label>
      <Select
        :model-value="modelValue.equipment"
        @update:modelValue="(value) => handleFilterChange('equipment', value)"
      >
        <SelectTrigger class="h-11">
          <SelectValue :placeholder="t('exercises.filters.all')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {{ t('exercises.filters.all') }}
          </SelectItem>
          <SelectItem
            v-for="equipment in equipmentTypes"
            :key="equipment"
            :value="equipment"
          >
            {{ t(`exercises.equipment.${equipment}`) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Exercise Type Filter -->
    <div class="space-y-2">
      <label class="text-sm font-medium">
        {{ t('exercises.filters.type') }}
      </label>
      <Select
        :model-value="modelValue.exerciseType"
        @update:modelValue="(value) => handleFilterChange('exerciseType', value)"
      >
        <SelectTrigger class="h-11">
          <SelectValue :placeholder="t('exercises.filters.all')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {{ t('exercises.filters.all') }}
          </SelectItem>
          <SelectItem
            v-for="type in exerciseTypes"
            :key="type"
            :value="type"
          >
            {{ t(`exercises.types.${type}`) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Favorites Toggle -->
    <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <label for="favorites-toggle" class="text-sm font-medium cursor-pointer">
        {{ t('exercises.filters.showFavoritesOnly') }}
      </label>
      <Switch
        id="favorites-toggle"
        :model-value="modelValue.showFavoritesOnly"
        @update:model-value="handleFavoritesToggle"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, EXERCISE_TYPES } from '@/shared/config/constants'

const props = defineProps({
  /**
   * Current filters object
   */
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()

// Data
const muscleGroups = MUSCLE_GROUPS
const equipmentTypes = EQUIPMENT_TYPES
const exerciseTypes = EXERCISE_TYPES

/**
 * Check if any filters are active
 */
const hasActiveFilters = computed(() => {
  return (
    (props.modelValue.muscleGroup && props.modelValue.muscleGroup !== 'all') ||
    (props.modelValue.equipment && props.modelValue.equipment !== 'all') ||
    (props.modelValue.exerciseType && props.modelValue.exerciseType !== 'all') ||
    props.modelValue.showFavoritesOnly
  )
})

/**
 * Handle filter change
 * @param {string} key - Filter key
 * @param {any} value - Filter value
 */
function handleFilterChange(key, value) {
  const newFilters = { ...props.modelValue, [key]: value }
  emit('update:modelValue', newFilters)
  emit('change', newFilters)
}

/**
 * Handle favorites toggle
 */
function handleFavoritesToggle(checked) {
  handleFilterChange('showFavoritesOnly', checked)
}

/**
 * Reset all filters
 */
function handleResetFilters() {
  const resetFilters = {
    muscleGroup: 'all',
    equipment: 'all',
    exerciseType: 'all',
    showFavoritesOnly: false,
  }
  emit('update:modelValue', resetFilters)
  emit('change', resetFilters)
}
</script>
