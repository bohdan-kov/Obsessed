<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      v-model="searchQueryLocal"
      type="text"
      :placeholder="t('exercises.search.placeholder')"
      class="pl-9 pr-9 h-11"
      :aria-label="t('exercises.search.placeholder')"
    />
    <Button
      v-if="searchQueryLocal"
      variant="ghost"
      size="icon"
      class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
      :aria-label="t('exercises.search.clear')"
      @click="clearSearch"
    >
      <X class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import { CONFIG } from '@/constants/config'

const props = defineProps({
  /**
   * Current search query
   */
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

// Local state for immediate updates (no lag in typing)
const searchQueryLocal = ref(props.modelValue)

/**
 * Debounced emit to parent
 * Waits 300ms after user stops typing
 */
const debouncedEmit = useDebounceFn((value) => {
  emit('update:modelValue', value)
}, CONFIG.exercise.SEARCH_DEBOUNCE)

/**
 * Watch local search query and emit with debounce
 */
watch(searchQueryLocal, (newValue) => {
  debouncedEmit(newValue)
})

/**
 * Watch prop changes from parent
 */
watch(
  () => props.modelValue,
  (newValue) => {
    searchQueryLocal.value = newValue
  }
)

/**
 * Clear search
 */
function clearSearch() {
  searchQueryLocal.value = ''
  emit('update:modelValue', '')
}
</script>
