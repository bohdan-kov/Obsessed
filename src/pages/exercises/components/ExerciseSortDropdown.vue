<template>
  <Select :model-value="modelValue" @update:modelValue="handleChange">
    <SelectTrigger class="h-11 w-full sm:w-[200px]">
      <div class="flex items-center gap-2">
        <ArrowUpDown class="h-4 w-4 text-muted-foreground" />
        <SelectValue :placeholder="t('exercises.sort.label')" />
      </div>
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="option in sortOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ t(option.labelKey) }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup>
import { ArrowUpDown } from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from 'vue-i18n'
import { EXERCISE_SORT_OPTIONS } from '@/shared/config/constants'

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  /**
   * Current sort option
   */
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()

// Sort options
const sortOptions = EXERCISE_SORT_OPTIONS

/**
 * Handle sort change
 */
function handleChange(value) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
