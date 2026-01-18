<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUnits } from '@/composables/useUnits'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Info } from 'lucide-vue-next'

const { t } = useI18n()
const { formatWeight, toStorageUnit } = useUnits()
const analyticsStore = useAnalyticsStore()

const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  volumeType: {
    type: String,
    required: true,
  },
  exerciseId: {
    type: String,
    default: null,
  },
  muscleGroup: {
    type: String,
    default: null,
  },
  period: {
    type: String,
    default: 'week',
  },
})

const emit = defineEmits(['update:modelValue'])

// Local input value (in display units)
const displayValue = ref('')

// Current volume based on context
const currentVolume = computed(() => {
  // TODO: Calculate based on volumeType, exerciseId, muscleGroup, period
  // For now, use total volume from last week
  const stats = analyticsStore.periodStats
  return stats?.totalVolume || 0
})

// Recommended target (10-15% increase)
const recommendedTarget = computed(() => {
  if (!currentVolume.value) return null
  return Math.round(currentVolume.value * 1.125) // 12.5% increase
})

// Validation
const isValid = computed(() => {
  const value = parseFloat(displayValue.value)
  return !isNaN(value) && value > 0
})

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== null && newValue !== parseFloat(displayValue.value)) {
      displayValue.value = newValue.toString()
    }
  },
  { immediate: true }
)

// Watch for display value changes
watch(displayValue, (newValue) => {
  const numValue = parseFloat(newValue)
  if (!isNaN(numValue) && numValue > 0) {
    // Convert to storage unit (kg) before emitting
    const storageValue = toStorageUnit(numValue)
    emit('update:modelValue', storageValue)
  } else {
    emit('update:modelValue', null)
  }
})

function applyRecommendation() {
  if (recommendedTarget.value) {
    displayValue.value = recommendedTarget.value.toString()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h3 class="text-lg font-semibold mb-2">{{ t('goals.wizard.setTarget') }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.setVolumeTargetDescription') }}
      </p>
    </div>

    <!-- Current Volume Card -->
    <Card v-if="currentVolume > 0" class="bg-accent/50 border-primary/20">
      <CardContent class="pt-4 pb-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-primary/10">
            <TrendingUp class="w-5 h-5 text-primary" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-muted-foreground mb-1">
              {{ t('goals.wizard.currentVolume') }} ({{ period === 'week' ? t('goals.wizard.periods.week') : t('goals.wizard.periods.month') }})
            </p>
            <p class="text-lg font-bold">
              {{ formatWeight(currentVolume, { precision: 0, compact: 'auto' }) }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Target Input -->
    <div class="space-y-2">
      <Label for="target-volume">
        {{ t('goals.wizard.targetVolume') }}
      </Label>
      <Input
        id="target-volume"
        v-model="displayValue"
        type="number"
        inputmode="decimal"
        :placeholder="t('goals.wizard.enterTargetVolume')"
        class="text-lg h-12"
      />
    </div>

    <!-- Recommendation -->
    <Card
      v-if="recommendedTarget && !displayValue"
      class="bg-blue-500/5 border-blue-500/20 cursor-pointer hover:bg-blue-500/10 transition-colors"
      @click="applyRecommendation"
    >
      <CardContent class="pt-4 pb-4">
        <div class="flex items-start gap-3">
          <Info class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium mb-1">{{ t('goals.wizard.recommendation') }}</p>
            <p class="text-xs text-muted-foreground mb-2">
              {{ t('goals.wizard.recommendationDescription') }}
            </p>
            <p class="text-lg font-bold text-blue-500">
              {{ formatWeight(recommendedTarget, { precision: 0, compact: 'auto' }) }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Validation Error -->
    <p v-if="displayValue && !isValid" class="text-sm text-destructive">
      {{ t('goals.wizard.invalidVolume') }}
    </p>
  </div>
</template>

<style scoped>
/* Remove spinner from number input */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
