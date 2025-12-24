/**
 * Statistical utilities for analytics calculations
 */

/**
 * Calculates linear regression for trend lines
 * @param {Array<{x: number, y: number}>} points - Data points
 * @returns {{slope: number, intercept: number, r2: number}} Regression coefficients
 */
export function calculateLinearRegression(points) {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 }

  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // R-squared (coefficient of determination)
  const yMean = sumY / n
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0)
  const ssResidual = points.reduce((sum, p) => {
    const predicted = slope * p.x + intercept
    return sum + Math.pow(p.y - predicted, 2)
  }, 0)
  const r2 = ssTotal === 0 ? 1 : 1 - ssResidual / ssTotal

  return { slope, intercept, r2 }
}

/**
 * Calculates standard deviation
 * @param {number[]} values - Array of numeric values
 * @returns {number} Standard deviation
 */
export function calculateStandardDeviation(values) {
  const n = values.length
  if (n === 0) return 0

  const mean = values.reduce((sum, v) => sum + v, 0) / n
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n
  return Math.sqrt(variance)
}

/**
 * Calculates percentile rank
 * @param {number} value - Value to find percentile for
 * @param {number[]} dataset - Dataset to compare against
 * @returns {number} Percentile (0-100)
 */
export function calculatePercentile(value, dataset) {
  if (!dataset || dataset.length === 0) return 0

  const sorted = [...dataset].sort((a, b) => a - b)
  const index = sorted.findIndex((v) => v >= value)

  if (index === -1) return 100
  return (index / sorted.length) * 100
}

/**
 * Calculates moving average
 * @param {number[]} data - Array of numeric values
 * @param {number} windowSize - Size of moving window (default: 3)
 * @returns {number[]} Moving average values
 */
export function calculateMovingAverage(data, windowSize = 3) {
  if (data.length < windowSize) return data

  const result = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(data.length, start + windowSize)
    const window = data.slice(start, end)
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(avg)
  }
  return result
}

/**
 * Detects outliers using IQR (Interquartile Range) method
 * @param {number[]} values - Array of numeric values
 * @returns {Array<{value: number, index: number, isOutlier: boolean}>} Outlier detection results
 */
export function detectOutliers(values) {
  if (!values || values.length === 0) return []

  const sorted = [...values].sort((a, b) => a - b)
  const q1Index = Math.floor(sorted.length * 0.25)
  const q3Index = Math.floor(sorted.length * 0.75)

  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1

  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  return values.map((val, idx) => ({
    value: val,
    index: idx,
    isOutlier: val < lowerBound || val > upperBound,
  }))
}
