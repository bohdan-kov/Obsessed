import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'

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

  /**
   * Check if a day is in the past relative to today
   * @param {string} dayName - Day name in lowercase (e.g., 'monday')
   * @returns {boolean} True if the day is in the past
   */
  const isDayInPast = (dayName) => {
    const today = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase()
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return dayOrder.indexOf(dayName) < dayOrder.indexOf(today)
  }

  /**
   * Get the status of a day based on its data and whether it's in the past
   * @param {Object} dayData - Day data object
   * @param {boolean} isPast - Whether the day is in the past
   * @returns {'completed' | 'rest' | 'missed' | 'planned'} Day status
   */
  const getDayStatus = (dayData, isPast) => {
    if (dayData.completed) return 'completed'
    if (!dayData.templateId) return 'rest'
    if (isPast) return 'missed'
    return 'planned'
  }

  return {
    currentWeekId,
    currentSchedule,
    todaysWorkout,
    weekAdherence,
    isDayInPast,
    getDayStatus,
  }
}
