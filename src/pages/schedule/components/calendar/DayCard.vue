<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSchedule } from '@/composables/useSchedule'
import { useScheduleStore } from '@/stores/scheduleStore'
import { isToday, getWeekId } from '@/utils/scheduleUtils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/pages/schedule/components/shared/StatusBadge.vue'
import MuscleGroupBadges from '@/pages/schedule/components/shared/MuscleGroupBadges.vue'
import { Calendar, Edit2 } from 'lucide-vue-next'

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
const scheduleStore = useScheduleStore()
const { activeProgram } = storeToRefs(scheduleStore)

const weekId = computed(() => getWeekId(props.date))
const isPast = computed(() => isDayInPast(props.dayName, weekId.value))
const status = computed(() => getDayStatus(props.dayData, isPast.value))
const dayIsToday = computed(() => isToday(props.dayName))

const dayLabel = computed(() => {
  return props.date.toLocaleDateString(locale.value, { weekday: 'short' })
})

const dateLabel = computed(() => {
  return props.date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
})

// Check if this day was manually modified
const isModified = computed(() => {
  if (!activeProgram.value || !props.dayData.templateId) return false

  const currentWeekId = getWeekId(props.date)
  const modifications = activeProgram.value.modifications?.[currentWeekId]

  return modifications?.[props.dayName]?.modified || false
})
</script>

<template>
  <Card
    :class="[
      'cursor-pointer transition-all hover:shadow-md relative',
      dayIsToday && 'ring-2 ring-primary',
      mobile && 'flex-row',
    ]"
    tabindex="0"
    role="button"
    :aria-label="t('schedule.calendar.changeTemplate')"
    @click="emit('click')"
    @keydown.enter="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <!-- Modified indicator badge (top-right) -->
    <Badge
      v-if="isModified && !mobile"
      variant="secondary"
      class="absolute top-2 right-2 text-xs flex items-center gap-1"
      :title="t('schedule.dayModified.tooltip')"
    >
      <Edit2 class="w-3 h-3" />
      {{ t('schedule.dayModified.badge') }}
    </Badge>

    <CardContent :class="['p-4', mobile && 'flex items-center justify-between w-full']">
      <div :class="mobile ? 'flex items-center gap-3' : 'mb-3'">
        <div>
          <p class="font-semibold text-sm">{{ dayLabel }}</p>
          <p class="text-xs text-muted-foreground">{{ dateLabel }}</p>
        </div>
        <StatusBadge v-if="!mobile" :status="status" class="mt-2" />
      </div>

      <div v-if="dayData.templateName" :class="mobile ? 'flex-1 mx-4' : ''">
        <div class="flex items-center gap-2 mb-1">
          <p class="text-sm font-medium">{{ dayData.templateName }}</p>
          <Badge
            v-if="isModified && mobile"
            variant="secondary"
            class="text-xs flex items-center gap-1"
            :title="t('schedule.dayModified.tooltip')"
          >
            <Edit2 class="w-3 h-3" />
          </Badge>
        </div>
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
