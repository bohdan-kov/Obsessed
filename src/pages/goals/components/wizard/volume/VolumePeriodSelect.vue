<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CalendarDays } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const selectedPeriod = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const periods = computed(() => [
  {
    id: 'week',
    icon: Calendar,
    title: t('goals.wizard.periods.week'),
    description: t('goals.wizard.periods.weekDescription'),
  },
  {
    id: 'month',
    icon: CalendarDays,
    title: t('goals.wizard.periods.month'),
    description: t('goals.wizard.periods.monthDescription'),
  },
])

function selectPeriod(periodId) {
  selectedPeriod.value = periodId
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-6">
      <h3 class="text-lg font-semibold mb-2">{{ t('goals.wizard.setPeriod') }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t('goals.wizard.setPeriodDescription') }}
      </p>
    </div>

    <div class="space-y-3">
      <Card
        v-for="period in periods"
        :key="period.id"
        :class="[
          'cursor-pointer transition-all duration-200 border-2',
          selectedPeriod === period.id
            ? 'border-primary bg-primary/5 shadow-md'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
          'active:scale-[0.98]',
        ]"
        @click="selectPeriod(period.id)"
      >
        <CardHeader class="pb-3">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'p-2 rounded-lg shrink-0',
                selectedPeriod === period.id ? 'bg-primary/10' : 'bg-accent',
              ]"
            >
              <component
                :is="period.icon"
                :class="['w-5 h-5', selectedPeriod === period.id ? 'text-primary' : 'text-muted-foreground']"
              />
            </div>
            <div class="flex-1 min-w-0">
              <CardTitle class="text-base mb-1">{{ period.title }}</CardTitle>
              <CardDescription class="text-xs">{{ period.description }}</CardDescription>
            </div>
            <div
              v-if="selectedPeriod === period.id"
              class="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
            >
              <div class="w-2 h-2 rounded-full bg-primary-foreground" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* Touch-friendly on mobile */
@media (max-width: 640px) {
  .cursor-pointer {
    min-height: 88px;
  }
}
</style>
