import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'
import { isDayInPast, getDayStatus } from '@/utils/scheduleUtils'

/**
 * Composable for accessing schedule data and utility functions
 * @returns {Object} Schedule interface with current week data and day status helpers
 */
export function useSchedule() {
  const scheduleStore = useScheduleStore()
  const { currentSchedule, todaysWorkout, weekAdherence } = storeToRefs(scheduleStore)

  const currentWeekId = computed(() => {
    return scheduleStore.getWeekId(new Date())
  })

  return {
    currentWeekId,
    currentSchedule,
    todaysWorkout,
    weekAdherence,
    isDayInPast,
    getDayStatus,
  }
}
