import { useI18n } from 'vue-i18n'

/**
 * Composable for handling Firestore Timestamp conversions and formatting
 * Centralizes date logic to avoid duplicate implementations across components
 */
export function useFirestoreDate() {
  const { t, locale } = useI18n()

  /**
   * Check if a value is a Firestore serverTimestamp placeholder
   * These appear immediately after setting serverTimestamp() before it resolves
   * @param {*} value - Value to check
   * @returns {boolean} - True if it's a serverTimestamp placeholder
   */
  function isServerTimestampPlaceholder(value) {
    return (
      typeof value === 'object' &&
      value !== null &&
      '_methodName' in value &&
      value._methodName === 'serverTimestamp'
    )
  }

  /**
   * Convert Firestore Timestamp to JavaScript Date
   * Handles multiple input formats: Firestore Timestamp, Date object, ISO string
   * @param {*} timestamp - Firestore Timestamp, Date object, or ISO string
   * @returns {Date|null} - JavaScript Date object, or null if invalid
   */
  function toDate(timestamp) {
    if (!timestamp) return null

    // Handle serverTimestamp placeholder (not yet resolved)
    if (isServerTimestampPlaceholder(timestamp)) {
      return new Date() // Use current time as fallback
    }

    // Handle Firestore Timestamp objects
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      try {
        return timestamp.toDate()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[useFirestoreDate] Failed to convert Firestore Timestamp:', timestamp, err)
        }
        return null
      }
    }

    // Handle JavaScript Date objects
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : timestamp
    }

    // Handle ISO strings or other date formats
    try {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? null : date
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[useFirestoreDate] Failed to parse date:', timestamp, err)
      }
      return null
    }
  }

  /**
   * Format date as relative time (today, yesterday, X days ago, etc.)
   * @param {*} timestamp - Firestore Timestamp, Date object, or ISO string
   * @param {Object} options - Formatting options
   * @param {boolean} options.showNeverUsed - If true, return "Never used" for null dates (default: true)
   * @param {string} options.todayKey - i18n key for "today" (default: 'schedule.calendar.today')
   * @param {string} options.yesterdayKey - i18n key for "yesterday" (default: 'schedule.calendar.yesterday')
   * @param {string} options.daysAgoKey - i18n key for "X days ago" (default: 'schedule.daysAgo')
   * @param {string} options.neverUsedKey - i18n key for "never used" (default: 'schedule.templates.neverUsed')
   * @returns {string} - Formatted relative time string
   */
  function formatRelativeDate(timestamp, options = {}) {
    const {
      showNeverUsed = true,
      todayKey = 'schedule.calendar.today',
      yesterdayKey = 'schedule.calendar.yesterday',
      daysAgoKey = 'schedule.daysAgo',
      neverUsedKey = 'schedule.templates.neverUsed'
    } = options

    if (!timestamp && showNeverUsed) {
      return t(neverUsedKey)
    }

    const date = toDate(timestamp)
    if (!date) {
      return showNeverUsed ? t(neverUsedKey) : ''
    }

    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t(todayKey)
    if (diffDays === 1) return t(yesterdayKey)
    if (diffDays < 7) return t(daysAgoKey, { count: diffDays })

    // For dates older than 7 days, show formatted date
    return date.toLocaleDateString(locale.value, {
      month: 'short',
      day: 'numeric'
    })
  }

  /**
   * Convert Firestore Timestamp to ISO string
   * Useful for localStorage serialization
   * @param {*} timestamp - Firestore Timestamp, Date object, or ISO string
   * @returns {string|null} - ISO string, or null if invalid
   */
  function toISOString(timestamp) {
    const date = toDate(timestamp)
    return date ? date.toISOString() : null
  }

  /**
   * Format date for display with locale-aware formatting
   * @param {*} timestamp - Firestore Timestamp, Date object, or ISO string
   * @param {Intl.DateTimeFormatOptions} options - Intl.DateTimeFormat options
   * @returns {string} - Formatted date string
   */
  function formatDate(timestamp, options = {}) {
    const date = toDate(timestamp)
    if (!date) return ''

    return date.toLocaleDateString(locale.value, options)
  }

  return {
    toDate,
    isServerTimestampPlaceholder,
    formatRelativeDate,
    toISOString,
    formatDate
  }
}
