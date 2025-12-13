import { normalizeDate } from '@/utils/dateUtils'

/**
 * Calculate current workout streak (consecutive days with workouts)
 * @param {Array} workouts - Array of workout objects
 * @param {string} dateKey - Key to access date property (default: 'completedAt')
 * @returns {number} Current streak count
 *
 * @example
 * const streak = calculateCurrentStreak(workouts, 'completedAt')
 * // Returns 5 if user worked out 5 consecutive days including today
 */
export function calculateCurrentStreak(workouts, dateKey = 'completedAt') {
  if (!workouts || workouts.length === 0) return 0

  // Filter out workouts with invalid dates
  const validWorkouts = workouts.filter((w) => {
    if (!w[dateKey]) return false
    const date = normalizeDate(w[dateKey])
    return !isNaN(date.getTime())
  })

  if (validWorkouts.length === 0) return 0

  // Sort workouts descending (newest first) for streak calculation
  const sortedWorkouts = [...validWorkouts].sort((a, b) => {
    const dateA = normalizeDate(a[dateKey])
    const dateB = normalizeDate(b[dateKey])
    return dateB - dateA
  })

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sortedWorkouts.length; i++) {
    const workoutDate = normalizeDate(sortedWorkouts[i][dateKey])
    workoutDate.setHours(0, 0, 0, 0)

    // Calculate expected date for current streak position
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - streak)

    if (workoutDate.getTime() === expectedDate.getTime()) {
      // Workout matches expected date - continue streak
      streak++
    } else if (workoutDate < expectedDate) {
      // Workout is older than expected - streak broken
      break
    }
    // If workoutDate > expectedDate, skip this workout (duplicate day)
  }

  return streak
}

/**
 * Calculate longest workout streak from workout history
 * @param {Array} workouts - Array of workout objects
 * @param {string} dateKey - Key to access date property (default: 'completedAt')
 * @returns {number} Longest streak count
 *
 * @example
 * const longest = calculateLongestStreak(workouts)
 * // Returns 12 if user's best streak was 12 consecutive days
 */
export function calculateLongestStreak(workouts, dateKey = 'completedAt') {
  if (!workouts || workouts.length === 0) return 0

  // Filter out workouts with invalid dates
  const validWorkouts = workouts.filter((w) => {
    if (!w[dateKey]) return false
    const date = normalizeDate(w[dateKey])
    return !isNaN(date.getTime())
  })

  if (validWorkouts.length === 0) return 0

  // Sort workouts chronologically (oldest first)
  const sortedWorkouts = [...validWorkouts].sort((a, b) => {
    const dateA = normalizeDate(a[dateKey])
    const dateB = normalizeDate(b[dateKey])
    return dateA - dateB
  })

  let maxStreak = 0
  let currentStreak = 0
  let previousDate = null

  for (const workout of sortedWorkouts) {
    const workoutDate = normalizeDate(workout[dateKey])
    workoutDate.setHours(0, 0, 0, 0)

    if (!previousDate) {
      // First workout
      currentStreak = 1
      previousDate = workoutDate
      continue
    }

    // Calculate days difference
    const daysDiff = Math.round(
      (workoutDate - previousDate) / (1000 * 60 * 60 * 24)
    )

    if (daysDiff === 0) {
      // Same day - skip (multiple workouts on same day)
      continue
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      currentStreak++
    } else {
      // Gap in days - reset streak
      maxStreak = Math.max(maxStreak, currentStreak)
      currentStreak = 1
    }

    previousDate = workoutDate
  }

  // Check final streak
  maxStreak = Math.max(maxStreak, currentStreak)

  return maxStreak
}

/**
 * Check if there's an active streak (workout today or yesterday)
 * @param {Array} workouts - Array of workout objects
 * @param {string} dateKey - Key to access date property (default: 'completedAt')
 * @returns {boolean} True if streak is active
 *
 * @example
 * const isActive = hasActiveStreak(workouts)
 * // Returns true if user worked out today or yesterday
 */
export function hasActiveStreak(workouts, dateKey = 'completedAt') {
  if (!workouts || workouts.length === 0) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  return workouts.some((workout) => {
    if (!workout[dateKey]) return false
    const workoutDate = normalizeDate(workout[dateKey])
    if (isNaN(workoutDate.getTime())) return false
    workoutDate.setHours(0, 0, 0, 0)

    return (
      workoutDate.getTime() === today.getTime() ||
      workoutDate.getTime() === yesterday.getTime()
    )
  })
}
