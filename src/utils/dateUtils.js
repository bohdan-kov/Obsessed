/**
 * Date Utility Functions
 * Handles date normalization, manipulation, and calculations
 * All dates are normalized to local timezone (ignoring time for day comparisons)
 */

/**
 * Normalize various date inputs to a Date object
 * Handles Firebase Timestamp, Date objects, ISO strings, and Proxied Timestamps
 * @param {Date|Object|string|number} dateInput - Date to normalize
 * @returns {Date} Normalized Date object (may be Invalid Date if input is invalid)
 * @note Always validate result with isNaN(date.getTime()) after calling this function
 */
export function normalizeDate(dateInput) {
  if (!dateInput) {
    return new Date()
  }

  // Already a Date object
  if (dateInput instanceof Date) {
    return new Date(dateInput)
  }

  // Firebase Timestamp object - check for toDate method FIRST
  // This handles both raw Timestamps and Proxied Timestamps
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    try {
      return dateInput.toDate()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[normalizeDate] Error calling toDate():', error, dateInput)
      }
      return new Date(NaN) // Return invalid date
    }
  }

  // Firebase Timestamp object - check for seconds/nanoseconds structure
  // This handles Timestamps that may be wrapped in Vue Proxies or plain objects
  if (typeof dateInput === 'object' && dateInput !== null) {
    // Try to access seconds property (works with Proxies and plain objects)
    const seconds = dateInput.seconds
    const nanoseconds = dateInput.nanoseconds

    // Check if we have valid numeric seconds
    if (typeof seconds === 'number' && !isNaN(seconds)) {
      // Valid Firestore Timestamp structure
      const nanos = typeof nanoseconds === 'number' ? nanoseconds : 0
      return new Date(seconds * 1000 + nanos / 1000000)
    }

    // Edge case: Proxy wrapping a Timestamp - try to unwrap
    // Check if the object has a _value or similar internal property
    if (dateInput._value) {
      return normalizeDate(dateInput._value)
    }

    // Log warning for unrecognized object structure in development
    if (import.meta.env.DEV) {
      console.warn('[normalizeDate] Unrecognized date object structure:', {
        type: typeof dateInput,
        constructor: dateInput?.constructor?.name,
        keys: Object.keys(dateInput),
        value: dateInput,
      })
    }
  }

  // ISO string or timestamp number
  try {
    return new Date(dateInput)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[normalizeDate] Error creating Date:', error, dateInput)
    }
    return new Date(NaN) // Return invalid date
  }
}

/**
 * Check if a date value is valid
 * @param {Date|Object|string|number} dateInput - Date to check
 * @returns {boolean} True if date is valid
 */
export function isValidDate(dateInput) {
  if (!dateInput) {
    return false
  }

  try {
    const date = normalizeDate(dateInput)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}

/**
 * Get start of day (00:00:00.000)
 * @param {Date|Object|string} dateInput - Date to process
 * @returns {Date} Date at 00:00:00
 */
export function getStartOfDay(dateInput) {
  const date = normalizeDate(dateInput)
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get start of week (Monday by default)
 * @param {Date|Object|string} dateInput - Date to process
 * @param {number} startDay - Day of week to start (0=Sunday, 1=Monday)
 * @returns {Date} Date at start of week
 */
export function getStartOfWeek(dateInput, startDay = 1) {
  const date = getStartOfDay(dateInput)
  const day = date.getDay()
  const diff = (day < startDay ? 7 : 0) + day - startDay

  date.setDate(date.getDate() - diff)
  return date
}

/**
 * Get start of month (first day at 00:00:00)
 * @param {Date|Object|string} dateInput - Date to process
 * @returns {Date} First day of month
 */
export function getStartOfMonth(dateInput) {
  const date = getStartOfDay(dateInput)
  date.setDate(1)
  return date
}

/**
 * Subtract days from a date
 * @param {Date|Object|string} dateInput - Date to process
 * @param {number} days - Number of days to subtract
 * @returns {Date} New date with days subtracted
 */
export function subDays(dateInput, days) {
  const date = normalizeDate(dateInput)
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

/**
 * Add days to a date
 * @param {Date|Object|string} dateInput - Date to process
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export function addDays(dateInput, days) {
  const date = normalizeDate(dateInput)
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Calculate difference in full days between two dates
 * Ignores time component
 * @param {Date|Object|string} dateA - First date
 * @param {Date|Object|string} dateB - Second date
 * @returns {number} Difference in days (can be negative)
 */
export function diffInDays(dateA, dateB) {
  const a = getStartOfDay(dateA)
  const b = getStartOfDay(dateB)
  const diffTime = a - b
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if two dates are the same day
 * Ignores time component
 * @param {Date|Object|string} dateA - First date
 * @param {Date|Object|string} dateB - Second date
 * @returns {boolean} True if same day
 */
export function isSameDay(dateA, dateB) {
  const a = getStartOfDay(dateA)
  const b = getStartOfDay(dateB)
  return a.getTime() === b.getTime()
}

/**
 * Check if a date is within a date range (inclusive)
 * @param {Date|Object|string} date - Date to check
 * @param {Date|Object|string} startDate - Range start
 * @param {Date|Object|string} endDate - Range end
 * @returns {boolean} True if date is within range
 */
export function isWithinRange(date, startDate, endDate) {
  const d = getStartOfDay(date)
  const start = getStartOfDay(startDate)
  const end = getStartOfDay(endDate)
  return d >= start && d <= end
}

/**
 * Get date range for "this month" (calendar month)
 * @returns {{ start: Date, end: Date }} Start and end dates
 */
export function getThisMonthRange() {
  const now = new Date()
  const start = getStartOfMonth(now)
  const end = getStartOfDay(now)
  return { start, end }
}

/**
 * Get date range for "last month" (previous calendar month)
 * @returns {{ start: Date, end: Date }} Start and end dates
 */
export function getLastMonthRange() {
  const now = new Date()
  const thisMonthStart = getStartOfMonth(now)
  const lastMonthEnd = subDays(thisMonthStart, 1)
  const lastMonthStart = getStartOfMonth(lastMonthEnd)
  return { start: lastMonthStart, end: lastMonthEnd }
}

/**
 * Get date range for "this week" (Monday to today)
 * @returns {{ start: Date, end: Date }} Start and end dates
 */
export function getThisWeekRange() {
  const now = new Date()
  const start = getStartOfWeek(now, 1) // Monday
  const end = getStartOfDay(now)
  return { start, end }
}

/**
 * Get date range for "last week" (previous Monday to Sunday)
 * @returns {{ start: Date, end: Date }} Start and end dates
 */
export function getLastWeekRange() {
  const now = new Date()
  const thisWeekStart = getStartOfWeek(now, 1)
  const lastWeekEnd = subDays(thisWeekStart, 1)
  const lastWeekStart = getStartOfWeek(lastWeekEnd, 1)
  return { start: lastWeekStart, end: lastWeekEnd }
}

/**
 * Get date range for "last N days" (N days ago to today)
 * @param {number} days - Number of days
 * @returns {{ start: Date, end: Date }} Start and end dates
 */
export function getLastNDaysRange(days) {
  const now = new Date()
  const end = getStartOfDay(now)
  const start = subDays(end, days - 1) // -1 to include today
  return { start, end }
}

/**
 * Get rolling date range (last N days including today)
 * @param {number} days - Number of days
 * @returns {{ start: Date, end: Date }}
 */
export function getRollingRange(days) {
  const end = getStartOfDay(new Date())
  const start = subDays(end, days - 1)
  return { start, end }
}

/**
 * Get comparison rolling range (previous N days before current range)
 * @param {number} days - Number of days
 * @returns {{ start: Date, end: Date }}
 */
export function getComparisonRollingRange(days) {
  const currentRange = getRollingRange(days)
  const comparisonEnd = subDays(currentRange.start, 1)
  const comparisonStart = subDays(comparisonEnd, days - 1)
  return { start: comparisonStart, end: comparisonEnd }
}

/**
 * Get this year range (Jan 1 to today)
 * @returns {{ start: Date, end: Date }}
 */
export function getThisYearRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = getStartOfDay(now)
  return { start, end }
}

/**
 * Get last year range (full calendar year)
 * @returns {{ start: Date, end: Date }}
 */
export function getLastYearRange() {
  const now = new Date()
  const year = now.getFullYear() - 1
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31, 23, 59, 59, 999)
  return { start, end }
}

/**
 * Get month before last range (2 months ago)
 * @returns {{ start: Date, end: Date }}
 */
export function getMonthBeforeLastRange() {
  const now = new Date()
  const year = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() < 2 ? now.getMonth() + 10 : now.getMonth() - 2
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

/**
 * Get all-time range (from first workout or fallback to app launch year)
 * @param {Date|null} firstWorkoutDate - Date of user's first workout (optional)
 * @returns {{ start: Date, end: Date }}
 */
export function getAllTimeRange(firstWorkoutDate = null) {
  const start = firstWorkoutDate || new Date(2020, 0, 1) // Use first workout or fallback to app launch year
  const end = new Date()
  return { start, end }
}

/**
 * Format date for display (locale-aware)
 * @param {Date|Object|string} dateInput - Date to format
 * @param {string} locale - Locale code (e.g., 'en', 'uk')
 * @returns {string} Formatted date string
 */
export function formatDate(dateInput, locale = 'uk') {
  const date = normalizeDate(dateInput)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Format date in short format for chart labels (locale-aware)
 * Returns compact format like "Dec 15" or "15 груд" suitable for chart axes
 * @param {Date|Object|string} dateInput - Date to format
 * @param {string} locale - Locale code (e.g., 'en', 'uk')
 * @returns {string} Formatted short date string
 */
export function formatDateShort(dateInput, locale = 'uk') {
  const date = normalizeDate(dateInput)
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Format date in medium format (locale-aware)
 * Returns format like "December 15" or "15 грудня" with full month name
 * @param {Date|Object|string} dateInput - Date to format
 * @param {string} locale - Locale code (e.g., 'en', 'uk')
 * @returns {string} Formatted medium date string
 */
export function formatDateMedium(dateInput, locale = 'uk') {
  const date = normalizeDate(dateInput)
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Safely format date with validation and fallback
 * @param {Date|Object|string} dateInput - Date to format
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale code (e.g., 'en', 'uk')
 * @param {Object} options.formatOptions - Intl.DateTimeFormat options
 * @param {string} options.fallback - Fallback string if date is invalid (default: '-')
 * @returns {string} Formatted date string or fallback
 */
export function safeFormatDate(dateInput, options = {}) {
  const {
    locale = 'uk',
    formatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    fallback = '-',
  } = options

  if (!dateInput) {
    return fallback
  }

  try {
    const date = normalizeDate(dateInput)

    // Validate that the date is valid
    if (isNaN(date.getTime())) {
      if (import.meta.env.DEV) {
        console.warn('[dateUtils] Invalid date in safeFormatDate:', dateInput)
      }
      return fallback
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(date)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[dateUtils] Error formatting date in safeFormatDate:', error, dateInput)
    }
    return fallback
  }
}

/**
 * Converts a date to local date string in YYYY-MM-DD format
 * @param {Date|Object} date - Date object or Firebase Timestamp
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function toLocalDateString(date) {
  const normalized = normalizeDate(date)
  const year = normalized.getFullYear()
  const month = String(normalized.getMonth() + 1).padStart(2, '0')
  const day = String(normalized.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Gets the first Monday on or before the given date
 * @param {Date} date - Input date
 * @returns {Date} First Monday on or before date
 */
export function getFirstMondayOnOrBefore(date) {
  const result = new Date(date)
  const dayOfWeek = result.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  result.setDate(result.getDate() - daysToSubtract)
  return getStartOfDay(result)
}

/**
 * Gets the last Sunday on or after the given date
 * @param {Date} date - Input date
 * @returns {Date} Last Sunday on or after date
 */
export function getLastSundayOnOrAfter(date) {
  const result = new Date(date)
  const dayOfWeek = result.getDay()
  const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  result.setDate(result.getDate() + daysToAdd)
  return getStartOfDay(result)
}

/**
 * Gets month boundaries for a date range
 * @param {Date} startDate - Range start (should be a Monday from getFirstMondayOnOrBefore)
 * @param {Date} endDate - Range end (should be a Sunday from getLastSundayOnOrAfter)
 * @returns {Array<{month: number, year: number, firstWeek: number}>}
 */
export function getMonthBoundaries(startDate, endDate) {
  const boundaries = []
  const current = new Date(startDate)
  let weekIndex = 0
  let lastSeenMonth = null

  while (current <= endDate) {
    // Check if this week contains the start of a new month
    // by checking if any day in the week (Mon-Sun) is day 1-7 AND is a different month
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6) // Sunday of this week

    const currentMonth = weekStart.getMonth()
    const currentYear = weekStart.getFullYear()

    // Iterate through the 7 days of this week
    let containsMonthStart = false
    const checkDate = new Date(weekStart)

    for (let i = 0; i < 7; i++) {
      if (checkDate.getDate() === 1) {
        // This week contains the 1st day of a month
        const monthStartMonth = checkDate.getMonth()
        const monthStartYear = checkDate.getFullYear()

        // Only add if we haven't seen this month yet
        if (
          lastSeenMonth === null ||
          lastSeenMonth.month !== monthStartMonth ||
          lastSeenMonth.year !== monthStartYear
        ) {
          boundaries.push({
            month: monthStartMonth,
            year: monthStartYear,
            firstWeek: weekIndex,
          })
          lastSeenMonth = { month: monthStartMonth, year: monthStartYear }
          containsMonthStart = true
          break
        }
      }
      checkDate.setDate(checkDate.getDate() + 1)
    }

    // Move to next week
    current.setDate(current.getDate() + 7)
    weekIndex++
  }

  return boundaries
}
