import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import {
  getFirstMondayOnOrBefore,
  getLastSundayOnOrAfter,
  toLocalDateString,
  getMonthBoundaries,
  isSameDay,
  formatDate,
} from '@/utils/dateUtils'
import { CONFIG } from '@/constants/config'

/**
 * Composable for generating contribution heatmap grid data
 * @returns {Object} Grid data, labels, and helper functions
 */
export function useContributionHeatmap() {
  const { t, locale } = useI18n()
  const analyticsStore = useAnalyticsStore()
  const { dailyWorkoutCounts, currentRange, period } = storeToRefs(analyticsStore)

  /**
   * Gets the color intensity level for a workout count
   * @param {number} count - Number of workouts
   * @returns {number} Level 0-3
   */
  function getIntensityLevel(count) {
    if (count === 0) return 0
    if (count === 1) return 1
    if (count === 2) return 2
    return 3 // 3+ workouts
  }

  /**
   * Gets the Tailwind color class for an intensity level
   * @param {number} level - Intensity level 0-3
   * @returns {string} Tailwind class
   */
  function getColorClass(level) {
    return CONFIG.analytics.heatmap.LEVEL_COLORS[level] || CONFIG.analytics.heatmap.LEVEL_COLORS[0]
  }

  /**
   * Check if the period is capped to 365 days
   */
  const isCappedToYear = computed(() => period.value === 'allTime')

  /**
   * Phase 2: Always generate 365-day grid structure for consistency
   * This is the effective grid range (always 365 days)
   */
  const effectiveGridRange = computed(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const yearAgo = new Date(today)
    yearAgo.setDate(today.getDate() - 365)
    yearAgo.setHours(0, 0, 0, 0)

    return { start: yearAgo, end: today }
  })

  /**
   * User's selected period for data filtering (what should be highlighted)
   */
  const selectedPeriodRange = computed(() => currentRange.value)

  /**
   * Period boundary export for potential visual indicators
   */
  const periodBoundary = computed(() => ({
    start: selectedPeriodRange.value.start,
    end: selectedPeriodRange.value.end,
  }))

  /**
   * Legacy effectiveRange for backwards compatibility
   * @deprecated Use effectiveGridRange and selectedPeriodRange instead
   */
  const effectiveRange = computed(() => {
    const range = currentRange.value

    // Cap "All Time" period to last 365 days
    if (isCappedToYear.value) {
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today

      const yearAgo = new Date(today)
      yearAgo.setDate(today.getDate() - 365)
      yearAgo.setHours(0, 0, 0, 0) // Start of 365 days ago

      return {
        start: yearAgo,
        end: today,
      }
    }

    return range
  })

  /**
   * Main grid data structure: 7 rows (days) × N columns (weeks)
   * Phase 2: Always generates 365-day grid, distinguishes selected period with opacity
   */
  const gridData = computed(() => {
    const gridRange = effectiveGridRange.value // Always 365 days
    const selectedRange = selectedPeriodRange.value // User's selected period
    const counts = dailyWorkoutCounts.value

    // Expand grid range to start on Monday and end on Sunday
    const gridStart = getFirstMondayOnOrBefore(gridRange.start)
    const gridEnd = getLastSundayOnOrAfter(gridRange.end)

    // Generate all weeks
    const weeks = []
    let currentDate = new Date(gridStart)

    while (currentDate <= gridEnd) {
      const week = []

      // Generate 7 days for this week (Mon-Sun)
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dateStr = toLocalDateString(currentDate)
        const isInPeriod = currentDate >= selectedRange.start && currentDate <= selectedRange.end

        // Show workout counts for all days in the 365-day grid
        const workoutCount = counts[dateStr] || 0
        const level = getIntensityLevel(workoutCount)

        week.push({
          date: new Date(currentDate),
          dateStr,
          count: workoutCount,
          level,
          isInRange: workoutCount >= 0, // Legacy: keep for backwards compatibility
          isInPeriod, // Phase 2: New flag for selected period distinction
          isToday: isSameDay(currentDate, new Date()),
          colorClass: getColorClass(level),
        })

        currentDate.setDate(currentDate.getDate() + 1)
      }

      weeks.push(week)
    }

    return weeks
  })

  /**
   * Month labels for header
   * Phase 2: Uses effectiveGridRange (365 days) for consistent layout
   */
  const monthLabels = computed(() => {
    const gridRange = effectiveGridRange.value
    const gridStart = getFirstMondayOnOrBefore(gridRange.start)
    const gridEnd = getLastSundayOnOrAfter(gridRange.end)

    const boundaries = getMonthBoundaries(gridStart, gridEnd)

    return boundaries.map((boundary) => {
      const date = new Date(boundary.year, boundary.month, 1)
      const monthName = new Intl.DateTimeFormat(locale.value, {
        month: 'short',
      }).format(date)

      return {
        label: monthName,
        weekIndex: boundary.firstWeek,
      }
    })
  })

  /**
   * Day labels (only show Mon, Wed, Fri for space)
   */
  const dayLabels = computed(() => [
    t('dashboard.charts.heatmap.dayLabels.mon'),
    '',
    t('dashboard.charts.heatmap.dayLabels.wed'),
    '',
    t('dashboard.charts.heatmap.dayLabels.fri'),
    '',
    '',
  ])

  /**
   * Legend levels
   */
  const legendLevels = [0, 1, 2, 3]

  /**
   * Check if heatmap is empty (no workouts)
   */
  const isEmpty = computed(() => {
    return Object.keys(dailyWorkoutCounts.value).length === 0
  })

  /**
   * Format tooltip text for a cell
   * @param {Object} cell - Cell data
   * @returns {string} Tooltip text
   */
  function formatTooltipText(cell) {
    const dateFormatted = formatDate(cell.date, locale.value)

    if (cell.count === 0) {
      return `${dateFormatted}\n${t('dashboard.charts.heatmap.tooltip.noWorkout')}`
    }

    return `${dateFormatted}\n${t('dashboard.charts.heatmap.tooltip.workouts', { count: cell.count })}`
  }

  /**
   * Total number of weeks in grid
   */
  const totalWeeks = computed(() => gridData.value.length)

  return {
    gridData,
    monthLabels,
    dayLabels,
    legendLevels,
    isEmpty,
    totalWeeks,
    isCappedToYear,
    getColorClass,
    formatTooltipText,
    // Phase 2 exports
    effectiveGridRange,
    selectedPeriodRange,
    periodBoundary,
  }
}
