/**
 * Strength training calculation utilities
 */

import { calculateLinearRegression } from './statsUtils'

/**
 * Calculates estimated 1 Rep Max using Epley formula
 * @param {number} weight - Weight lifted (kg)
 * @param {number} reps - Repetitions performed
 * @returns {number|null} Estimated 1RM or null if reps > 15
 */
export function calculate1RM(weight, reps) {
  if (!weight || !reps || weight <= 0 || reps <= 0) return null
  if (reps === 1) return weight
  if (reps > 15) return null // Formula unreliable beyond 15 reps

  // Epley formula: 1RM = weight × (1 + reps/30)
  return weight * (1 + reps / 30)
}

/**
 * Finds the best set (highest weight × reps product)
 * @param {Array<{weight: number, reps: number}>} sets - Array of sets
 * @returns {{weight: number, reps: number}|null} Best set or null
 */
export function findBestSet(sets) {
  if (!sets || sets.length === 0) return null

  return sets.reduce((best, set) => {
    if (!set.weight || !set.reps) return best
    const score = set.weight * set.reps
    const bestScore = best ? best.weight * best.reps : 0
    return score > bestScore ? set : best
  }, null)
}

/**
 * Calculates trend for exercise progression
 * @param {Array<{date: Date, sets: Array, bestSet: {weight: number, reps: number}}>} history - Exercise history
 * @returns {{direction: string, percentage: number, confidence: number}} Trend analysis
 */
export function calculateTrend(history) {
  if (!history || history.length < 4) {
    return { direction: 'insufficient_data', percentage: 0, confidence: 0 }
  }

  const points = history
    .map((h, i) => {
      if (!h.bestSet || !h.bestSet.weight || !h.bestSet.reps) return null
      const e1rm = calculate1RM(h.bestSet.weight, h.bestSet.reps)
      return e1rm ? { x: i, y: e1rm } : null
    })
    .filter((p) => p !== null)

  if (points.length < 4) {
    return { direction: 'insufficient_data', percentage: 0, confidence: 0 }
  }

  const regression = calculateLinearRegression(points)
  const avgValue = points.reduce((sum, p) => sum + p.y, 0) / points.length
  const percentageChange = avgValue > 0 ? (regression.slope / avgValue) * 100 : 0

  let direction
  if (percentageChange > 2.5) {
    direction = 'up'
  } else if (percentageChange < -2.5) {
    direction = 'down'
  } else {
    direction = 'flat'
  }

  return {
    direction,
    percentage: percentageChange,
    confidence: regression.r2, // 0-1, higher = more confident
  }
}

/**
 * Gets progress status from trend
 * @param {{direction: string, percentage: number, confidence: number}} trend - Trend object
 * @returns {{label: string, color: string, icon: string}} Status object
 */
export function getProgressStatus(trend) {
  const statusMap = {
    up: { label: 'Progressing', color: 'green', icon: 'trending-up' },
    down: { label: 'Regressing', color: 'red', icon: 'trending-down' },
    flat: { label: 'Stalled', color: 'yellow', icon: 'minus' },
    insufficient_data: { label: 'New', color: 'gray', icon: 'help-circle' },
  }

  return statusMap[trend.direction] || statusMap.insufficient_data
}

/**
 * Finds best PR (Personal Record) from exercise history
 * @param {Array<{date: Date, sets: Array, bestSet: {weight: number, reps: number}}>} history - Exercise history
 * @returns {{date: Date, bestSet: {weight: number, reps: number}}|null} Best PR or null
 */
export function findBestPR(history) {
  if (!history || history.length === 0) return null

  return history.reduce((best, entry) => {
    if (!entry.bestSet || !entry.bestSet.weight || !entry.bestSet.reps) return best

    const current1RM = calculate1RM(entry.bestSet.weight, entry.bestSet.reps)
    const best1RM = best ? calculate1RM(best.bestSet.weight, best.bestSet.reps) : 0

    return current1RM > best1RM ? entry : best
  }, null)
}

/**
 * Calculates total volume for an exercise (sum of weight × reps for all sets)
 * @param {{sets: Array<{weight: number, reps: number}>}} exercise - Exercise object
 * @returns {number} Total volume in kg
 */
export function calculateExerciseVolume(exercise) {
  if (!exercise || !exercise.sets || exercise.sets.length === 0) return 0

  return exercise.sets.reduce((sum, set) => {
    if (!set.weight || !set.reps) return sum
    return sum + set.weight * set.reps
  }, 0)
}
