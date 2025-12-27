/**
 * Composable for analytics period selection and date range management
 * Centralizes period state management for analytics views
 */

import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { subDays } from '@/utils/dateUtils'

/**
 * Available period options
 */
export const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'analytics.periodSelector.last7days', days: 7 },
  { value: 'last_30_days', label: 'analytics.periodSelector.last30days', days: 30 },
  { value: 'last_90_days', label: 'analytics.periodSelector.last90days', days: 90 },
  { value: 'allTime', label: 'analytics.periodSelector.allTime', days: null },
]

/**
 * Default period
 */
const DEFAULT_PERIOD = 'last_30_days'

/**
 * Use analytics period composable
 * Manages selected period state and provides date range calculations
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.syncWithUrl - Whether to sync period with URL query params (default: true)
 * @param {string} options.initialPeriod - Initial period value (default: 'last_30_days')
 * @returns {Object} Period state and utilities
 */
export function useAnalyticsPeriod(options = {}) {
  const { syncWithUrl = true, initialPeriod = DEFAULT_PERIOD } = options

  const route = useRoute()
  const router = useRouter()

  // Initialize period from URL or default
  const selectedPeriod = ref(syncWithUrl && route.query.period ? route.query.period : initialPeriod)

  /**
   * Gets the period option configuration
   */
  const periodOption = computed(() => {
    return (
      PERIOD_OPTIONS.find((opt) => opt.value === selectedPeriod.value) ||
      PERIOD_OPTIONS.find((opt) => opt.value === DEFAULT_PERIOD)
    )
  })

  /**
   * Calculates date range for the selected period
   */
  const dateRange = computed(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    const days = periodOption.value.days

    if (days === null) {
      // All time: return null to indicate no date filtering
      return {
        start: null,
        end: today,
        days: null,
        isAllTime: true,
      }
    }

    const startDate = subDays(today, days)
    startDate.setHours(0, 0, 0, 0) // Start of day

    return {
      start: startDate,
      end: today,
      days,
      isAllTime: false,
    }
  })

  /**
   * Checks if current period is "All Time"
   */
  const isAllTime = computed(() => {
    return selectedPeriod.value === 'allTime'
  })

  /**
   * Changes the selected period
   * @param {string} period - New period value
   */
  function changePeriod(period) {
    if (!PERIOD_OPTIONS.some((opt) => opt.value === period)) {
      console.warn('[useAnalyticsPeriod] Invalid period:', period, 'Using default.')
      period = DEFAULT_PERIOD
    }

    selectedPeriod.value = period

    // Sync with URL if enabled
    if (syncWithUrl && router) {
      router.replace({
        query: {
          ...route.query,
          period,
        },
      })
    }
  }

  /**
   * Resets period to default
   */
  function resetPeriod() {
    changePeriod(DEFAULT_PERIOD)
  }

  /**
   * Filters an array of items by date
   * @param {Array} items - Items with a date property
   * @param {string} dateKey - Key name for the date property (default: 'createdAt')
   * @returns {Array} Filtered items
   */
  function filterByPeriod(items, dateKey = 'createdAt') {
    if (!items || !Array.isArray(items)) {
      return []
    }

    const range = dateRange.value

    // All time: return all items
    if (range.isAllTime || !range.start) {
      return items
    }

    // Filter by date range
    return items.filter((item) => {
      const itemDate = item[dateKey]
      if (!itemDate) return false

      const date = itemDate instanceof Date ? itemDate : new Date(itemDate)
      return date >= range.start && date <= range.end
    })
  }

  /**
   * Gets human-readable period label
   * @param {string} locale - Locale code (default: 'en')
   * @returns {string} Period label
   */
  function getPeriodLabel(locale = 'en') {
    const option = periodOption.value
    if (!option) return ''

    // For i18n compatibility, return the translation key
    return option.label
  }

  /**
   * Checks if a date is within the selected period
   * @param {Date|string} date - Date to check
   * @returns {boolean} True if date is within period
   */
  function isDateInPeriod(date) {
    const range = dateRange.value

    if (range.isAllTime) {
      return true
    }

    const checkDate = date instanceof Date ? date : new Date(date)
    return checkDate >= range.start && checkDate <= range.end
  }

  /**
   * Gets next period option
   * @returns {Object|null} Next period option or null if at end
   */
  function getNextPeriod() {
    const currentIndex = PERIOD_OPTIONS.findIndex((opt) => opt.value === selectedPeriod.value)
    if (currentIndex === -1 || currentIndex === PERIOD_OPTIONS.length - 1) {
      return null
    }
    return PERIOD_OPTIONS[currentIndex + 1]
  }

  /**
   * Gets previous period option
   * @returns {Object|null} Previous period option or null if at start
   */
  function getPreviousPeriod() {
    const currentIndex = PERIOD_OPTIONS.findIndex((opt) => opt.value === selectedPeriod.value)
    if (currentIndex <= 0) {
      return null
    }
    return PERIOD_OPTIONS[currentIndex - 1]
  }

  /**
   * Navigates to next period
   */
  function goToNextPeriod() {
    const next = getNextPeriod()
    if (next) {
      changePeriod(next.value)
    }
  }

  /**
   * Navigates to previous period
   */
  function goToPreviousPeriod() {
    const prev = getPreviousPeriod()
    if (prev) {
      changePeriod(prev.value)
    }
  }

  // Watch route changes if URL sync is enabled
  if (syncWithUrl) {
    watch(
      () => route.query.period,
      (newPeriod) => {
        if (newPeriod && newPeriod !== selectedPeriod.value) {
          selectedPeriod.value = newPeriod
        }
      },
    )
  }

  return {
    // State
    selectedPeriod,
    periodOption,
    dateRange,
    isAllTime,

    // Options
    periodOptions: PERIOD_OPTIONS,

    // Methods
    changePeriod,
    resetPeriod,
    filterByPeriod,
    getPeriodLabel,
    isDateInPeriod,

    // Navigation
    getNextPeriod,
    getPreviousPeriod,
    goToNextPeriod,
    goToPreviousPeriod,
  }
}
