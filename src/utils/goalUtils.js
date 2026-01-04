import { differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

/**
 * Calculate expected progress percentage based on time elapsed
 * @param {Object} goal - Goal with startDate and deadline
 * @returns {number} Expected progress (0-100)
 */
export function calculateExpectedProgress(goal) {
  if (!goal.startDate || !goal.deadline) return 0

  const totalDays = differenceInDays(new Date(goal.deadline), new Date(goal.startDate))
  const daysPassed = differenceInDays(new Date(), new Date(goal.startDate))

  return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
}

/**
 * Determine goal status based on progress vs expected
 * @param {number} currentProgress - Current progress percentage
 * @param {number} expectedProgress - Expected progress percentage
 * @param {number} daysRemaining - Days until deadline
 * @returns {string} Status: 'on-track' | 'ahead' | 'behind' | 'at-risk' | 'completed'
 */
export function determineGoalStatus(currentProgress, expectedProgress, daysRemaining) {
  if (currentProgress >= 100) return 'completed'
  if (daysRemaining < 14 && currentProgress < 80) return 'at-risk'
  if (currentProgress > expectedProgress + 10) return 'ahead'
  if (currentProgress < expectedProgress - 10) return 'behind'
  return 'on-track'
}

/**
 * Get period boundaries for volume/frequency goals
 * @param {'week'|'month'} period
 * @param {Date} date - Reference date (default: now)
 * @returns {Object} { start: Date, end: Date }
 */
export function getPeriodBoundaries(period, date = new Date()) {
  if (period === 'week') {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
      end: endOfWeek(date, { weekStartsOn: 1 }),
    }
  } else if (period === 'month') {
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
    }
  }

  throw new Error(`Unknown period: ${period}`)
}

/**
 * Calculate required pace to reach goal on time
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} daysRemaining - Days until deadline
 * @returns {Object} { perDay, perWeek, total }
 */
export function calculateRequiredPaceToGoal(current, target, daysRemaining) {
  const remaining = target - current
  const weeksRemaining = daysRemaining / 7

  return {
    perDay: remaining / daysRemaining,
    perWeek: remaining / weeksRemaining,
    total: remaining,
  }
}

/**
 * Predict goal completion date based on linear trend
 * @param {Array} progressHistory - [{date, value}]
 * @param {number} targetValue - Target to reach
 * @returns {Date|null} Predicted completion date
 */
export function predictGoalCompletion(progressHistory, targetValue) {
  if (progressHistory.length < 2) return null

  // Calculate average days between workouts
  const daysDiffs = []
  for (let i = 1; i < progressHistory.length; i++) {
    const diff = differenceInDays(
      new Date(progressHistory[i].date),
      new Date(progressHistory[i - 1].date)
    )
    daysDiffs.push(diff)
  }
  const avgDaysBetween = daysDiffs.reduce((sum, d) => sum + d, 0) / daysDiffs.length

  // Simple linear regression
  const points = progressHistory.map((p, i) => ({ x: i, y: p.value }))
  const n = points.length
  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Find when trend line crosses target
  const stepsToTarget = (targetValue - intercept) / slope

  if (stepsToTarget <= 0) return new Date() // Already achieved

  const lastDate = new Date(progressHistory[progressHistory.length - 1].date)
  const daysToTarget = stepsToTarget * avgDaysBetween

  return new Date(lastDate.getTime() + daysToTarget * 24 * 60 * 60 * 1000)
}
