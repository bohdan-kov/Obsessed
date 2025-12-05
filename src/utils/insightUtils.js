/**
 * Insight Generation Utilities
 * Generate status insights and trend calculations for dashboard analytics
 */

/**
 * Generate rest days insight
 * @param {number} restDays - Days since last workout
 * @param {Object} thresholds - Threshold configuration
 * @param {number} thresholds.WARNING_THRESHOLD - Days before warning
 * @returns {{ status: string, textKey: string }} Insight object
 */
export function generateRestDaysInsight(restDays, thresholds) {
  const { WARNING_THRESHOLD } = thresholds

  if (restDays === 0) {
    return {
      status: 'good',
      textKey: 'dashboard.stats.insights.strongConsistency',
    }
  }

  if (restDays >= WARNING_THRESHOLD) {
    return {
      status: 'warning',
      textKey: 'dashboard.stats.insights.timeToTrain',
    }
  }

  return {
    status: 'good',
    textKey: 'dashboard.stats.insights.onTrack',
  }
}

/**
 * Generate streak insight
 * @param {number} streak - Current workout streak (consecutive days)
 * @param {Object} thresholds - Threshold configuration
 * @param {number} thresholds.EXCELLENT_THRESHOLD - Days for excellent status
 * @param {number} thresholds.GOOD_THRESHOLD - Days for good status
 * @returns {{ status: string, textKey: string }} Insight object
 */
export function generateStreakInsight(streak, thresholds) {
  const { EXCELLENT_THRESHOLD, GOOD_THRESHOLD } = thresholds

  if (streak === 0) {
    return {
      status: 'warning',
      textKey: 'dashboard.stats.insights.timeToTrain',
    }
  }

  if (streak >= EXCELLENT_THRESHOLD) {
    return {
      status: 'good',
      textKey: 'dashboard.stats.insights.keepItUp',
    }
  }

  if (streak >= GOOD_THRESHOLD) {
    return {
      status: 'good',
      textKey: 'dashboard.stats.insights.streakBuilding',
    }
  }

  return {
    status: 'neutral',
    textKey: 'dashboard.stats.insights.onTrack',
  }
}

/**
 * Generate workout count insight
 * @param {number} count - Workout count in current period
 * @param {number} target - Target workout count
 * @param {Object} trend - Trend object with direction
 * @returns {{ status: string, textKey: string }} Insight object
 */
export function generateWorkoutInsight(count, target, trend) {
  // If on track or exceeding target
  if (count >= target) {
    return {
      status: 'good',
      textKey: 'dashboard.stats.insights.strongConsistency',
    }
  }

  // If trending up but below target
  if (trend && trend.direction === 'up') {
    return {
      status: 'good',
      textKey: 'dashboard.stats.insights.greatProgress',
    }
  }

  // Below target and not trending up
  if (count < target * 0.5) {
    return {
      status: 'warning',
      textKey: 'dashboard.stats.insights.needsAttention',
    }
  }

  return {
    status: 'neutral',
    textKey: 'dashboard.stats.insights.onTrack',
  }
}

/**
 * Generate volume insight based on trend
 * @param {Object} trend - Trend object with percentage value
 * @param {Object} thresholds - Threshold configuration
 * @param {number} thresholds.GROWTH_TARGET_PERCENT - Target growth percentage
 * @param {number} thresholds.DECLINE_WARNING_PERCENT - Decline warning threshold
 * @returns {{ status: string, textKey: string }} Insight object
 */
export function generateVolumeInsight(trend, thresholds) {
  const { GROWTH_TARGET_PERCENT, DECLINE_WARNING_PERCENT } = thresholds

  if (!trend || trend.direction === 'neutral') {
    return {
      status: 'neutral',
      textKey: 'dashboard.stats.insights.volumeStable',
    }
  }

  // Parse percentage value (e.g., "12.5%" -> 12.5)
  const percentValue = parseFloat(trend.value) || 0

  if (trend.direction === 'up') {
    if (percentValue >= GROWTH_TARGET_PERCENT) {
      return {
        status: 'good',
        textKey: 'dashboard.stats.insights.volumeGrowing',
      }
    }
    return {
      status: 'good',
      textKey: 'dashboard.stats.insights.greatProgress',
    }
  }

  // Declining volume
  if (Math.abs(percentValue) >= Math.abs(DECLINE_WARNING_PERCENT)) {
    return {
      status: 'warning',
      textKey: 'dashboard.stats.insights.needsAttention',
    }
  }

  return {
    status: 'neutral',
    textKey: 'dashboard.stats.insights.maintainingStrength',
  }
}

/**
 * Generate PR (Personal Record) insight
 * @param {number} prCount - Number of PRs in period
 * @param {number} totalPRs - Total PRs all-time
 * @returns {{ status: string, textKey: string }} Insight object
 */
export function generatePRInsight(prCount, totalPRs) {
  if (prCount > 0) {
    return {
      status: 'good',
      textKey: 'dashboard.stats.insights.newPRs',
    }
  }

  if (totalPRs > 0) {
    return {
      status: 'neutral',
      textKey: 'dashboard.stats.insights.maintainingStrength',
    }
  }

  return {
    status: 'neutral',
    textKey: 'dashboard.stats.insights.keepItUp',
  }
}

/**
 * Calculate trend percentage change
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change (rounded to 1 decimal)
 */
export function calculateTrendPercentage(current, previous) {
  if (previous === 0) {
    // If previous is 0 and current is 0, no change
    if (current === 0) return 0
    // If previous is 0 and current is positive, show 100% increase
    return 100
  }

  const change = ((current - previous) / previous) * 100
  return Math.round(change * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate absolute change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Absolute change
 */
export function calculateAbsoluteChange(current, previous) {
  return current - previous
}

/**
 * Format trend value with proper sign and unit
 * @param {number} value - Trend value
 * @param {string} type - Type of trend ('percentage' | 'absolute')
 * @returns {string} Formatted trend string (e.g., "+12.5%", "-3")
 */
export function formatTrendValue(value, type = 'percentage') {
  if (value === 0) return '0'

  const sign = value > 0 ? '+' : ''
  const formattedValue = type === 'percentage' ? `${value}%` : `${value}`

  return `${sign}${formattedValue}`
}

/**
 * Determine trend direction from value
 * @param {number} value - Trend value (can be percentage or absolute)
 * @param {number} neutralThreshold - Threshold for neutral (default 0)
 * @returns {'up' | 'down' | 'neutral'} Trend direction
 */
export function getTrendDirection(value, neutralThreshold = 0) {
  if (Math.abs(value) <= neutralThreshold) return 'neutral'
  return value > 0 ? 'up' : 'down'
}

/**
 * Create a trend object for UI consumption
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @param {string} type - Type of trend ('percentage' | 'absolute')
 * @returns {{ value: string, direction: string, raw: number }} Trend object
 */
export function createTrendObject(current, previous, type = 'percentage') {
  const rawValue =
    type === 'percentage'
      ? calculateTrendPercentage(current, previous)
      : calculateAbsoluteChange(current, previous)

  return {
    value: formatTrendValue(rawValue, type),
    direction: getTrendDirection(rawValue),
    raw: rawValue,
  }
}
