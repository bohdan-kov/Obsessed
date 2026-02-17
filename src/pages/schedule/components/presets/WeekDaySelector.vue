<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  requiredDays: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const selectedDays = ref([...props.modelValue])

const weekDays = computed(() => [
  { index: 0, key: 'monday', short: t('schedule.daysShort.monday'), initial: t('schedule.daysShort.monday').charAt(0) },
  { index: 1, key: 'tuesday', short: t('schedule.daysShort.tuesday'), initial: t('schedule.daysShort.tuesday').charAt(0) },
  { index: 2, key: 'wednesday', short: t('schedule.daysShort.wednesday'), initial: t('schedule.daysShort.wednesday').charAt(0) },
  { index: 3, key: 'thursday', short: t('schedule.daysShort.thursday'), initial: t('schedule.daysShort.thursday').charAt(0) },
  { index: 4, key: 'friday', short: t('schedule.daysShort.friday'), initial: t('schedule.daysShort.friday').charAt(0) },
  { index: 5, key: 'saturday', short: t('schedule.daysShort.saturday'), initial: t('schedule.daysShort.saturday').charAt(0) },
  { index: 6, key: 'sunday', short: t('schedule.daysShort.sunday'), initial: t('schedule.daysShort.sunday').charAt(0) },
])

const isValid = computed(() => selectedDays.value.length === props.requiredDays)

function toggleDay(dayIndex) {
  const index = selectedDays.value.indexOf(dayIndex)
  if (index > -1) {
    selectedDays.value.splice(index, 1)
  } else {
    selectedDays.value.push(dayIndex)
  }
  selectedDays.value.sort((a, b) => a - b)
  emit('update:modelValue', selectedDays.value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    selectedDays.value = [...newValue]
  }
)
</script>

<template>
  <div class="space-y-3">
    <!-- Day selector grid -->
    <div class="grid grid-cols-7 gap-2">
      <Button
        v-for="day in weekDays"
        :key="day.key"
        :variant="selectedDays.includes(day.index) ? 'default' : 'outline'"
        @click="toggleDay(day.index)"
        class="flex flex-col items-center justify-center h-14 min-h-11 relative p-2"
        :aria-label="day.short"
        :aria-pressed="selectedDays.includes(day.index)"
      >
        <!-- Selection indicator -->
        <CheckCircle2
          v-if="selectedDays.includes(day.index)"
          class="absolute top-1 right-1 w-3 h-3"
        />

        <!-- Day initial (large) -->
        <span class="text-base font-bold leading-none mb-0.5">{{ day.initial }}</span>

        <!-- Day short name (small) -->
        <span class="text-[9px] leading-none opacity-70">{{ day.short }}</span>
      </Button>
    </div>

    <!-- Validation feedback -->
    <p
      class="text-xs text-center font-medium"
      :class="isValid ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'"
    >
      {{ selectedDays.length }} / {{ requiredDays }} {{ t('schedule.presets.daysSelected') }}
    </p>
  </div>
</template>
