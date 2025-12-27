/**
 * Chart-related utility functions and constants
 */

/**
 * Color palettes for muscle groups (matching Dashboard donut colors)
 */
export const MUSCLE_COLORS = {
  back: '#3b82f6', // blue-500
  chest: '#f97316', // orange-500
  legs: '#10b981', // green-500
  biceps: '#a855f7', // purple-500
  shoulders: '#ec4899', // pink-500
  triceps: '#14b8a6', // teal-500
  calves: '#8b5cf6', // violet-500
  core: '#06b6d4', // cyan-500
}

/**
 * Status colors for progress indicators
 */
export const STATUS_COLORS = {
  progressing: '#10b981', // green-500
  maintaining: '#f59e0b', // amber-500
  regressing: '#ef4444', // red-500
  balanced: '#10b981', // green-500
  under_trained: '#f59e0b', // amber-500
  over_trained: '#ef4444', // red-500
}

/**
 * Transforms data to area chart format
 * @param {Array<Object>} data - Source data
 * @param {string} xKey - Key for x-axis values
 * @param {string[]} yKeys - Keys for y-axis values
 * @returns {{labels: Array<string>, datasets: Array<Object>}} Chart data
 */
export function transformToAreaData(data, xKey, yKeys) {
  return {
    labels: data.map((d) => d[xKey]),
    datasets: yKeys.map((key) => ({
      label: key,
      data: data.map((d) => d[key]),
      fill: true,
      tension: 0.4,
    })),
  }
}

/**
 * Gets responsive chart configuration based on screen size
 * @param {string} type - Chart type ('line' | 'bar' | 'scatter')
 * @returns {Object} Chart configuration object
 */
export function getResponsiveConfig(type = 'line') {
  const isMobile = window.innerWidth < 768

  const baseConfig = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: isMobile ? 1.5 : 2,
    plugins: {
      legend: {
        display: !isMobile,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },
  }

  if (type === 'line') {
    baseConfig.elements = {
      line: {
        borderWidth: isMobile ? 2 : 3,
      },
      point: {
        radius: isMobile ? 2 : 4,
      },
    }
  }

  if (type === 'bar') {
    baseConfig.barThickness = isMobile ? 20 : 30
  }

  return baseConfig
}

/**
 * Formats large numbers for chart axes
 * @param {number} value - Numeric value to format
 * @returns {string} Formatted value (e.g., "1.2K", "2.5M")
 */
export function formatAxisValue(value) {
  if (!value && value !== 0) return '0'

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

/**
 * Checks if two data points have identical values across all tracked keys
 * @param {Object} pointA - First data point
 * @param {Object} pointB - Second data point
 * @param {string[]} keys - Keys to compare (e.g., muscle groups)
 * @returns {boolean} True if all values are identical
 */
function areValuesIdentical(pointA, pointB, keys) {
  if (!pointA || !pointB) return false
  return keys.every((key) => pointA[key] === pointB[key])
}

/**
 * Groups consecutive data points with identical values
 * Returns a map of index -> group metadata
 * @param {Array<Object>} data - Chart data points
 * @param {string[]} keys - Keys to compare for grouping (e.g., muscle groups)
 * @returns {Map<number, { type: 'single' | 'range', startIndex: number, endIndex: number }>}
 */
export function groupConsecutiveIdenticalPoints(data, keys) {
  const groupMap = new Map()

  if (!data || data.length === 0) return groupMap

  let i = 0
  while (i < data.length) {
    const current = data[i]
    let rangeEnd = i

    // Check how many consecutive points have identical values
    while (
      rangeEnd + 1 < data.length &&
      areValuesIdentical(current, data[rangeEnd + 1], keys)
    ) {
      rangeEnd++
    }

    // If we found a range (2+ consecutive identical points)
    if (rangeEnd > i) {
      // Mark all indices in the range
      for (let j = i; j <= rangeEnd; j++) {
        groupMap.set(j, {
          type: 'range',
          startIndex: i,
          endIndex: rangeEnd,
        })
      }
      i = rangeEnd + 1
    } else {
      // Single point
      groupMap.set(i, {
        type: 'single',
        startIndex: i,
        endIndex: i,
      })
      i++
    }
  }

  return groupMap
}

/**
 * Formats a date range label for chart axes
 * Creates compact range labels like "7-11 Dec" or "7-11 груд."
 * @param {string} startDateStr - Start date in YYYY-MM-DD format
 * @param {string} endDateStr - End date in YYYY-MM-DD format
 * @param {string} locale - Locale code (e.g., 'en', 'uk')
 * @returns {string} Formatted range label
 */
export function formatDateRangeLabel(startDateStr, endDateStr, locale = 'uk') {
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)

  const startDay = startDate.getDate()
  const endDay = endDate.getDate()

  // Format month in short format
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' })
  const month = monthFormatter.format(endDate)

  // Create range label: "7-11 груд." or "7-11 Dec"
  return `${startDay}-${endDay} ${month}`
}
