/**
 * Date Utility Functions
 * Handles date normalization, manipulation, and calculations
 * All dates are normalized to local timezone (ignoring time for day comparisons)
 */

/**
 * Normalize various date inputs to a Date object
 * Handles Firebase Timestamp, Date objects, ISO strings
 * @param {Date|Object|string} dateInput - Date to normalize
 * @returns {Date} Normalized Date object
 */
export function normalizeDate(dateInput) {
  if (!dateInput) {
    return new Date()
  }

  // Firebase Timestamp object
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    return dateInput.toDate()
  }

  // Already a Date object
  if (dateInput instanceof Date) {
    return new Date(dateInput)
  }

  // ISO string or timestamp number
  return new Date(dateInput)
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
 * Get all-time range (from distant past to today)
 * @returns {{ start: Date, end: Date }}
 */
export function getAllTimeRange() {
  const start = new Date(2020, 0, 1) // Reasonable minimum (app launch year)
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
