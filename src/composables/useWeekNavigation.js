import { ref, computed } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useI18n } from 'vue-i18n'

/**
 * Composable for navigating between weeks in the schedule
 * @returns {Object} Week navigation interface with current week info and navigation methods
 */
export function useWeekNavigation() {
  const scheduleStore = useScheduleStore()
  const { t, locale } = useI18n()

  const currentWeekOffset = ref(0) // 0 = this week, -1 = last week, +1 = next week

  const currentWeekId = computed(() => {
    const date = new Date()
    date.setDate(date.getDate() + currentWeekOffset.value * 7)
    return scheduleStore.getWeekId(date)
  })

  const weekLabel = computed(() => {
    if (currentWeekOffset.value === 0) return t('schedule.thisWeek')
    if (currentWeekOffset.value === -1) return t('schedule.lastWeek')
    if (currentWeekOffset.value === 1) return t('schedule.nextWeek')

    const date = new Date()
    date.setDate(date.getDate() + currentWeekOffset.value * 7)
    const weekStart = scheduleStore.getWeekStartDate(currentWeekId.value)
    const formattedDate = weekStart.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
    return t('schedule.weekOf', { date: formattedDate })
  })

  const canGoBack = computed(() => true)
  const canGoForward = computed(() => currentWeekOffset.value < 4)

  function goToPreviousWeek() {
    currentWeekOffset.value--
    loadWeek()
  }

  function goToNextWeek() {
    if (canGoForward.value) {
      currentWeekOffset.value++
      loadWeek()
    }
  }

  function goToThisWeek() {
    currentWeekOffset.value = 0
    loadWeek()
  }

  async function loadWeek() {
    await scheduleStore.fetchScheduleForWeek(currentWeekId.value)
  }

  return {
    currentWeekId,
    weekLabel,
    currentWeekOffset,
    canGoBack,
    canGoForward,
    goToPreviousWeek,
    goToNextWeek,
    goToThisWeek,
    loadWeek,
  }
}
