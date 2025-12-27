<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { CONFIG } from '@/constants/config'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = defineProps({
  variant: {
    type: String,
    default: 'button-group', // 'button-group' | 'select'
    validator: (value) => ['button-group', 'select'].includes(value),
  },
  size: {
    type: String,
    default: 'default', // 'sm' | 'default' | 'lg'
    validator: (value) => ['sm', 'default', 'lg'].includes(value),
  },
})

const { t } = useI18n()

// Connect to analyticsStore for period management
const analyticsStore = useAnalyticsStore()
const { period } = storeToRefs(analyticsStore)

// Get period options from CONFIG (all 8 options, same as Dashboard)
const periodOptions = computed(() => {
  return CONFIG.analytics.periods.PERIOD_OPTIONS
})

// Check if a period is selected
function isPeriodSelected(periodId) {
  return period.value === periodId
}

// Handle period selection
function selectPeriod(periodId) {
  analyticsStore.setPeriod(periodId)
}

// Get translated label for a period
function getPeriodLabel(labelKey) {
  return t(labelKey)
}

// Determine button size classes
const buttonSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 px-2 text-xs'
    case 'lg':
      return 'h-11 px-6 text-base'
    default:
      return 'h-9 px-4 text-sm'
  }
})
</script>

<template>
  <div class="period-selector">
    <!-- Button Group Variant (Desktop-friendly) -->
    <div
      v-if="variant === 'button-group'"
      class="flex flex-wrap gap-2"
      role="group"
      aria-label="Period selector"
    >
      <Button
        v-for="option in periodOptions"
        :key="option.id"
        :variant="isPeriodSelected(option.id) ? 'default' : 'outline'"
        :size="size"
        :class="[buttonSizeClass, 'transition-all']"
        @click="selectPeriod(option.id)"
        :aria-pressed="isPeriodSelected(option.id)"
      >
        {{ getPeriodLabel(option.labelKey) }}
      </Button>
    </div>

    <!-- Select Variant (Mobile-friendly) -->
    <Select
      v-else-if="variant === 'select'"
      :model-value="period"
      @update:model-value="selectPeriod"
    >
      <SelectTrigger
        :class="[
          'w-full sm:w-[200px]',
          props.size === 'sm' ? 'h-8 text-xs' : '',
          props.size === 'lg' ? 'h-11 text-base' : '',
        ]"
        aria-label="Select period"
      >
        <SelectValue :placeholder="t('dashboard.periodSelector.last30Days')" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem v-for="option in periodOptions" :key="option.id" :value="option.id">
            {{ getPeriodLabel(option.labelKey) }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>

<style scoped>
/* Ensure buttons wrap nicely on small screens */
@media (max-width: 640px) {
  .period-selector .flex {
    justify-content: stretch;
  }

  .period-selector button {
    flex: 1 1 auto;
    min-width: fit-content;
  }
}
</style>
