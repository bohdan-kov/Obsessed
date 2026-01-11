<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedule } from '@/composables/useSchedule'
import { isToday } from '@/utils/scheduleUtils'
import { Card, CardContent } from '@/components/ui/card'
import StatusBadge from '../shared/StatusBadge.vue'
import MuscleGroupBadges from '../shared/MuscleGroupBadges.vue'
import { Calendar } from 'lucide-vue-next'

const props = defineProps({
  dayName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dayData: {
    type: Object,
    required: true,
  },
  mobile: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const { t, locale } = useI18n()
const { isDayInPast, getDayStatus } = useSchedule()

const isPast = computed(() => isDayInPast(props.dayName))
const status = computed(() => getDayStatus(props.dayData, isPast.value))
const dayIsToday = computed(() => isToday(props.dayName))

const dayLabel = computed(() => {
  return props.date.toLocaleDateString(locale.value, { weekday: 'short' })
})

const dateLabel = computed(() => {
  return props.date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
})
</script>

<template>
  <Card
    :class="[
      'cursor-pointer transition-all hover:shadow-md',
      dayIsToday && 'ring-2 ring-primary',
      mobile && 'flex-row',
    ]"
    @click="emit('click')"
  >
    <CardContent :class="['p-4', mobile && 'flex items-center justify-between w-full']">
      <div :class="mobile ? 'flex items-center gap-3' : 'mb-3'">
        <div>
          <p class="font-semibold text-sm">{{ dayLabel }}</p>
          <p class="text-xs text-muted-foreground">{{ dateLabel }}</p>
        </div>
        <StatusBadge v-if="!mobile" :status="status" class="mt-2" />
      </div>

      <div v-if="dayData.templateName" :class="mobile ? 'flex-1 mx-4' : ''">
        <p class="text-sm font-medium mb-1">{{ dayData.templateName }}</p>
        <MuscleGroupBadges :muscle-groups="dayData.muscleGroups" :max="2" />
      </div>

      <div
        v-else
        :class="[
          'flex flex-col items-center justify-center py-4',
          mobile && 'flex-row gap-2 py-0',
        ]"
      >
        <Calendar class="w-6 h-6 text-muted-foreground mb-1" />
        <p class="text-xs text-muted-foreground">{{ t('schedule.calendar.restDay') }}</p>
      </div>

      <StatusBadge v-if="mobile" :status="status" />
    </CardContent>
  </Card>
</template>
