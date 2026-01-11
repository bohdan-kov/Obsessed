/**
 * Schedule utility functions
 * Used for week ID generation, date calculations, and schedule management
 */

/**
 * Get ISO week ID for a given date (e.g., "2026-W02")
 * Uses ISO 8601 week date system (Monday = week start)
 * @param {Date} date - Date to get week ID for (defaults to today)
 * @returns {string} Week ID in format "YYYY-Www"
 */
export function getWeekId(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  // Set to Thursday of the current week (ISO 8601 rule)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))

  // Get first day of year
  const yearStart = new Date(d.getFullYear(), 0, 1)

  // Calculate week number
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)

  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Get week start date (Monday 00:00:00) from week ID
 * @param {string} weekId - Week ID in format "YYYY-Www"
 * @returns {Date} Monday of the week at 00:00:00
 */
export function getWeekStartDate(weekId) {
  const [year, week] = weekId.split('-W').map(Number)

  // January 4th is always in week 1 (ISO 8601)
  const jan4 = new Date(year, 0, 4)

  // Calculate Monday of week 1
  const dayOfWeek = jan4.getDay() || 7 // Sunday is 0, make it 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1)

  // Add weeks
  monday.setDate(monday.getDate() + (week - 1) * 7)
  monday.setHours(0, 0, 0, 0)

  return monday
}

/**
 * Get week end date (Sunday 23:59:59) from week ID
 * @param {string} weekId - Week ID in format "YYYY-Www"
 * @returns {Date} Sunday of the week at 23:59:59
 */
export function getWeekEndDate(weekId) {
  const weekStart = getWeekStartDate(weekId)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return weekEnd
}

/**
 * Get all days of a week with dates and metadata
 * @param {string} weekId - Week ID in format "YYYY-Www"
 * @returns {Array<Object>} Array of day objects with name, date, label, dayOfMonth
 */
export function getWeekDays(weekId) {
  const weekStart = getWeekStartDate(weekId)
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return days.map((dayName, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)

    return {
      name: dayName,
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayOfMonth: date.getDate(),
    }
  })
}

/**
 * Check if a specific day name is today
 * @param {string} dayName - Day name (e.g., "monday")
 * @returns {boolean} True if the day is today
 */
export function isToday(dayName) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return dayName === today
}

/**
 * Check if a day is in the past (for a given week)
 * @param {string} dayName - Day name (e.g., "monday")
 * @param {string} weekId - Week ID in format "YYYY-Www"
 * @returns {boolean} True if the day is in the past
 */
export function isDayInPast(dayName, weekId) {
  const today = new Date()
  const currentWeekId = getWeekId(today)

  // If different week, compare week IDs
  if (weekId !== currentWeekId) {
    return weekId < currentWeekId
  }

  // Same week, compare day order
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return dayOrder.indexOf(dayName) < dayOrder.indexOf(todayName)
}

/**
 * Format week label for display (e.g., "Jan 6-12" or "Dec 30 - Jan 5")
 * @param {string} weekId - Week ID in format "YYYY-Www"
 * @param {string} locale - Locale for date formatting (default: 'en-US')
 * @returns {string} Formatted week label
 */
export function formatWeekLabel(weekId, locale = 'en-US') {
  const weekStart = getWeekStartDate(weekId)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const startMonth = weekStart.toLocaleDateString(locale, { month: 'short' })
  const endMonth = weekEnd.toLocaleDateString(locale, { month: 'short' })
  const startDay = weekStart.getDate()
  const endDay = weekEnd.getDate()

  // Same month
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`
  }

  // Different months
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
}

/**
 * Get day name from date
 * @param {Date} date - Date to get day name for
 * @returns {string} Day name in lowercase (e.g., "monday")
 */
export function getDayNameFromDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
}

/**
 * Get the next week ID
 * @param {string} weekId - Current week ID
 * @returns {string} Next week ID
 */
export function getNextWeekId(weekId) {
  const weekStart = getWeekStartDate(weekId)
  weekStart.setDate(weekStart.getDate() + 7)
  return getWeekId(weekStart)
}

/**
 * Get the previous week ID
 * @param {string} weekId - Current week ID
 * @returns {string} Previous week ID
 */
export function getPreviousWeekId(weekId) {
  const weekStart = getWeekStartDate(weekId)
  weekStart.setDate(weekStart.getDate() - 7)
  return getWeekId(weekStart)
}

/**
 * Create empty day schedule structure
 * @returns {Object} Empty day schedule
 */
export function createEmptyDaySchedule() {
  return {
    templateId: null,
    templateName: null,
    muscleGroups: [],
    completed: false,
    workoutId: null,
  }
}

/**
 * Create empty week schedule structure
 * @param {string} weekId - Week ID
 * @param {string} userId - User ID
 * @returns {Object} Empty week schedule with all days
 */
export function createEmptyWeekSchedule(weekId, userId) {
  const weekStart = getWeekStartDate(weekId)
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const schedule = {
    id: weekId,
    userId,
    weekStart,
    days: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  days.forEach((day) => {
    schedule.days[day] = createEmptyDaySchedule()
  })

  return schedule
}

/**
 * Get day status based on schedule data
 * @param {Object} dayData - Day schedule data
 * @param {boolean} isPast - Whether the day is in the past
 * @returns {string} Status: "completed" | "missed" | "planned" | "rest"
 */
export function getDayStatus(dayData, isPast) {
  if (dayData.completed) {
    return 'completed'
  }

  if (!dayData.templateId) {
    return 'rest'
  }

  if (isPast) {
    return 'missed'
  }

  return 'planned'
}
