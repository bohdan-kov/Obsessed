<script setup>
import { ref, computed } from 'vue'
import { useSchedule } from '@/composables/useSchedule'
import { useWeekNavigation } from '@/composables/useWeekNavigation'
import { getWeekDays } from '@/utils/scheduleUtils'
import DayCard from './DayCard.vue'
import DayDetailSheet from './DayDetailSheet.vue'

const { currentSchedule } = useSchedule()
const { currentWeekId } = useWeekNavigation()

const weekDays = computed(() => {
  if (!currentWeekId.value) return []
  return getWeekDays(currentWeekId.value)
})

// Day detail sheet state
const dayDetailOpen = ref(false)
const selectedDay = ref(null)

function openDayDetail(day) {
  selectedDay.value = day
  dayDetailOpen.value = true
}

function closeDayDetail() {
  dayDetailOpen.value = false
  selectedDay.value = null
}

function handleChangeTemplate(dayName) {
  // Emit event to parent to open template picker
  emit('change-template', dayName)
  closeDayDetail()
}

function handleQuickStart(templateId) {
  // Emit event to parent to start workout
  emit('quick-start', templateId)
  closeDayDetail()
}

const emit = defineEmits(['change-template', 'quick-start'])
</script>

<template>
  <div v-if="!currentSchedule" class="text-center py-12">
    <p class="text-muted-foreground">Loading schedule...</p>
  </div>

  <div v-else>
    <!-- Desktop: 7-column grid -->
    <div class="hidden md:grid md:grid-cols-7 gap-4">
      <DayCard
        v-for="day in weekDays"
        :key="day.name"
        :day-name="day.name"
        :date="day.date"
        :day-data="currentSchedule.days[day.name]"
        @click="openDayDetail(day)"
      />
    </div>

    <!-- Mobile: Vertical list -->
    <div class="md:hidden space-y-3">
      <DayCard
        v-for="day in weekDays"
        :key="day.name"
        :day-name="day.name"
        :date="day.date"
        :day-data="currentSchedule.days[day.name]"
        mobile
        @click="openDayDetail(day)"
      />
    </div>

    <!-- Day Detail Sheet -->
    <DayDetailSheet
      v-if="selectedDay"
      :open="dayDetailOpen"
      :day-name="selectedDay.name"
      :date="selectedDay.date"
      :day-data="currentSchedule.days[selectedDay.name]"
      @close="closeDayDetail"
      @change-template="handleChangeTemplate"
      @quick-start="handleQuickStart"
    />
  </div>
</template>
