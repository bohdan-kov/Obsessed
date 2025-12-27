import { describe, it, expect } from 'vitest'
import {
  calculateLinearRegression,
  calculateStandardDeviation,
  calculatePercentile,
  calculateMovingAverage,
  detectOutliers,
} from '@/utils/statsUtils'

describe('statsUtils', () => {
  describe('calculateLinearRegression', () => {
    it('should return zero values for empty array', () => {
      const result = calculateLinearRegression([])
      expect(result).toEqual({ slope: 0, intercept: 0, r2: 0 })
    })

    it('should return zero values for single point', () => {
      const points = [{ x: 0, y: 0 }]
      const result = calculateLinearRegression(points)
      expect(result).toEqual({ slope: 0, intercept: 0, r2: 0 })
    })

    it('should calculate correct slope and intercept for perfect linear data', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
      ]

      const result = calculateLinearRegression(points)
      expect(result.slope).toBeCloseTo(2, 1)
      expect(result.intercept).toBeCloseTo(0, 1)
      expect(result.r2).toBeCloseTo(1, 1) // Perfect fit
    })

    it('should handle noisy data', () => {
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 6 },
      ]

      const result = calculateLinearRegression(points)
      expect(result.slope).toBeGreaterThan(0)
      expect(result.r2).toBeLessThan(1)
      expect(result.r2).toBeGreaterThan(0.8)
    })

    it('should handle negative slope', () => {
      const points = [
        { x: 0, y: 10 },
        { x: 1, y: 8 },
        { x: 2, y: 6 },
        { x: 3, y: 4 },
      ]

      const result = calculateLinearRegression(points)
      expect(result.slope).toBeCloseTo(-2, 1)
      expect(result.intercept).toBeCloseTo(10, 1)
    })

    it('should handle flat data (zero slope)', () => {
      const points = [
        { x: 0, y: 5 },
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
      ]

      const result = calculateLinearRegression(points)
      expect(result.slope).toBeCloseTo(0, 1)
      expect(result.intercept).toBeCloseTo(5, 1)
      expect(result.r2).toBeCloseTo(1, 1) // Perfect fit for flat line
    })
  })

  describe('calculateStandardDeviation', () => {
    it('should return 0 for empty array', () => {
      const result = calculateStandardDeviation([])
      expect(result).toBe(0)
    })

    it('should return 0 for single value', () => {
      const result = calculateStandardDeviation([5])
      expect(result).toBe(0)
    })

    it('should return 0 for identical values', () => {
      const result = calculateStandardDeviation([5, 5, 5, 5])
      expect(result).toBe(0)
    })

    it('should calculate correct standard deviation', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9]
      const stdDev = calculateStandardDeviation(values)
      expect(stdDev).toBeCloseTo(2, 1)
    })

    it('should handle negative numbers', () => {
      const values = [-2, -1, 0, 1, 2]
      const stdDev = calculateStandardDeviation(values)
      expect(stdDev).toBeGreaterThan(0)
    })

    it('should handle large numbers', () => {
      const values = [1000, 1050, 1100, 1150, 1200]
      const stdDev = calculateStandardDeviation(values)
      expect(stdDev).toBeCloseTo(70.71, 1)
    })
  })

  describe('calculatePercentile', () => {
    it('should return 0 for empty dataset', () => {
      const result = calculatePercentile(5, [])
      expect(result).toBe(0)
    })

    it('should return 0 for null/undefined dataset', () => {
      expect(calculatePercentile(5, null)).toBe(0)
      expect(calculatePercentile(5, undefined)).toBe(0)
    })

    it('should return 0 for value below all dataset values', () => {
      const result = calculatePercentile(1, [5, 10, 15, 20])
      expect(result).toBe(0)
    })

    it('should return 100 for value above all dataset values', () => {
      const result = calculatePercentile(25, [5, 10, 15, 20])
      expect(result).toBe(100)
    })

    it('should calculate correct percentile for middle value', () => {
      const result = calculatePercentile(10, [5, 10, 15, 20])
      expect(result).toBe(25) // 10 is at 25th percentile
    })

    it('should handle unsorted dataset', () => {
      const result = calculatePercentile(15, [20, 5, 15, 10])
      expect(result).toBe(50) // 15 is at 50th percentile
    })
  })

  describe('calculateMovingAverage', () => {
    it('should return original data if length < window size', () => {
      const data = [1, 2]
      const result = calculateMovingAverage(data, 3)
      expect(result).toEqual([1, 2])
    })

    it('should calculate moving average with default window (3)', () => {
      const data = [1, 2, 3, 4, 5]
      const result = calculateMovingAverage(data)
      expect(result).toHaveLength(5)
      expect(result[2]).toBeCloseTo(3, 1) // Middle point: (2+3+4)/3 = 3
    })

    it('should calculate moving average with window size 5', () => {
      const data = [1, 2, 3, 4, 5, 6, 7]
      const result = calculateMovingAverage(data, 5)
      expect(result).toHaveLength(7)
      expect(result[2]).toBeCloseTo(3, 1) // (1+2+3+4+5)/5 = 3
    })

    it('should smooth noisy data', () => {
      const data = [1, 10, 2, 11, 3]
      const result = calculateMovingAverage(data, 3)
      // Moving average should reduce spikes
      expect(result[2]).toBeLessThan(11)
      expect(result[2]).toBeGreaterThan(1)
    })

    it('should handle single value', () => {
      const data = [5]
      const result = calculateMovingAverage(data, 3)
      expect(result).toEqual([5])
    })
  })

  describe('detectOutliers', () => {
    it('should return empty array for empty input', () => {
      const result = detectOutliers([])
      expect(result).toEqual([])
    })

    it('should return empty array for null/undefined', () => {
      expect(detectOutliers(null)).toEqual([])
      expect(detectOutliers(undefined)).toEqual([])
    })

    it('should not flag outliers in uniform distribution', () => {
      const values = [1, 2, 3, 4, 5]
      const result = detectOutliers(values)
      expect(result).toHaveLength(5)
      expect(result.every((r) => !r.isOutlier)).toBe(true)
    })

    it('should detect high outlier', () => {
      const values = [1, 2, 3, 4, 100]
      const result = detectOutliers(values)
      expect(result).toHaveLength(5)
      expect(result[4].isOutlier).toBe(true)
      expect(result[4].value).toBe(100)
      expect(result[4].index).toBe(4)
    })

    it('should detect low outlier', () => {
      const values = [1, 50, 51, 52, 53]
      const result = detectOutliers(values)
      expect(result).toHaveLength(5)
      expect(result[0].isOutlier).toBe(true)
      expect(result[0].value).toBe(1)
    })

    it('should preserve original order and indices', () => {
      const values = [5, 100, 3, 4, 2]
      const result = detectOutliers(values)
      expect(result[0].value).toBe(5)
      expect(result[1].value).toBe(100)
      expect(result[1].index).toBe(1)
    })

    it('should not flag values in normal range', () => {
      const values = [10, 12, 13, 14, 15, 18, 20]
      const result = detectOutliers(values)
      expect(result.filter((r) => r.isOutlier).length).toBe(0)
    })
  })
})
