<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const deadline = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Minimum deadline (tomorrow)
const minDeadline = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

// Maximum deadline (2 years from now)
const maxDeadline = computed(() => {
  const twoYears = new Date()
  twoYears.setFullYear(twoYears.getFullYear() + 2)
  return twoYears.toISOString().split('T')[0]
})

// Validation
const isValid = computed(() => {
  if (!deadline.value) return false
  const deadlineDate = new Date(deadline.value)
  const now = new Date()
  return deadlineDate > now
})
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h3 class="text-lg font-semibold mb-2">{{ t('goals.wizard.setDeadline') }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.setDeadlineDescription') }}
      </p>
    </div>

    <div class="space-y-2">
      <Label for="deadline">{{ t('goals.wizard.deadline') }}</Label>
      <Input
        id="deadline"
        v-model="deadline"
        type="date"
        :min="minDeadline"
        :max="maxDeadline"
        class="h-12 text-base"
      />
      <p class="text-xs text-muted-foreground">
        {{ t('goals.wizard.deadlineHint') }}
      </p>
    </div>

    <!-- Validation Error -->
    <p v-if="deadline && !isValid" class="text-sm text-destructive">
      {{ t('goals.wizard.invalidDeadline') }}
    </p>
  </div>
</template>
