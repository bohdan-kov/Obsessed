import { describe, it, expect } from 'vitest'
import {
  groupConsecutiveIdenticalPoints,
  formatDateRangeLabel,
  MUSCLE_COLORS,
} from '@/utils/chartUtils'

describe('chartUtils', () => {
  describe('MUSCLE_COLORS', () => {
    it('should have colors for all 8 muscle groups', () => {
      expect(MUSCLE_COLORS).toHaveProperty('back')
      expect(MUSCLE_COLORS).toHaveProperty('chest')
      expect(MUSCLE_COLORS).toHaveProperty('legs')
      expect(MUSCLE_COLORS).toHaveProperty('biceps')
      expect(MUSCLE_COLORS).toHaveProperty('shoulders')
      expect(MUSCLE_COLORS).toHaveProperty('triceps')
      expect(MUSCLE_COLORS).toHaveProperty('calves')
      expect(MUSCLE_COLORS).toHaveProperty('core')
    })
  })

  describe('groupConsecutiveIdenticalPoints', () => {
    const MUSCLES = ['back', 'chest', 'legs']

    it('should return empty map for empty data', () => {
      const result = groupConsecutiveIdenticalPoints([], MUSCLES)
      expect(result.size).toBe(0)
    })

    it('should return empty map for null/undefined data', () => {
      expect(groupConsecutiveIdenticalPoints(null, MUSCLES).size).toBe(0)
      expect(groupConsecutiveIdenticalPoints(undefined, MUSCLES).size).toBe(0)
    })

    it('should mark all single points when no consecutive identical values', () => {
      const data = [
        { date: '2024-01-01', back: 100, chest: 50, legs: 200 },
        { date: '2024-01-02', back: 150, chest: 75, legs: 225 },
        { date: '2024-01-03', back: 200, chest: 100, legs: 250 },
      ]

      const result = groupConsecutiveIdenticalPoints(data, MUSCLES)

      expect(result.size).toBe(3)
      expect(result.get(0)).toEqual({ type: 'single', startIndex: 0, endIndex: 0 })
      expect(result.get(1)).toEqual({ type: 'single', startIndex: 1, endIndex: 1 })
      expect(result.get(2)).toEqual({ type: 'single', startIndex: 2, endIndex: 2 })
    })

    it('should group consecutive identical points (2 points)', () => {
      const data = [
        { date: '2024-01-01', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-02', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-03', back: 100, chest: 50, legs: 200 },
      ]

      const result = groupConsecutiveIdenticalPoints(data, MUSCLES)

      expect(result.size).toBe(3)
      // First two points should be grouped
      expect(result.get(0)).toEqual({ type: 'range', startIndex: 0, endIndex: 1 })
      expect(result.get(1)).toEqual({ type: 'range', startIndex: 0, endIndex: 1 })
      // Third point is single
      expect(result.get(2)).toEqual({ type: 'single', startIndex: 2, endIndex: 2 })
    })

    it('should group consecutive identical points (5 points)', () => {
      const data = [
        { date: '2024-01-01', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-02', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-03', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-04', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-05', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-06', back: 100, chest: 50, legs: 200 },
      ]

      const result = groupConsecutiveIdenticalPoints(data, MUSCLES)

      expect(result.size).toBe(6)
      // First 5 points should be in one range
      for (let i = 0; i < 5; i++) {
        expect(result.get(i)).toEqual({ type: 'range', startIndex: 0, endIndex: 4 })
      }
      // Last point is single
      expect(result.get(5)).toEqual({ type: 'single', startIndex: 5, endIndex: 5 })
    })

    it('should handle multiple separate ranges', () => {
      const data = [
        { date: '2024-01-01', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-02', back: 0, chest: 0, legs: 0 },
        { date: '2024-01-03', back: 100, chest: 50, legs: 200 },
        { date: '2024-01-04', back: 150, chest: 75, legs: 225 },
        { date: '2024-01-05', back: 150, chest: 75, legs: 225 },
        { date: '2024-01-06', back: 150, chest: 75, legs: 225 },
      ]

      const result = groupConsecutiveIdenticalPoints(data, MUSCLES)

      expect(result.size).toBe(6)
      // First range: indices 0-1
      expect(result.get(0)).toEqual({ type: 'range', startIndex: 0, endIndex: 1 })
      expect(result.get(1)).toEqual({ type: 'range', startIndex: 0, endIndex: 1 })
      // Single point: index 2
      expect(result.get(2)).toEqual({ type: 'single', startIndex: 2, endIndex: 2 })
      // Second range: indices 3-5
      expect(result.get(3)).toEqual({ type: 'range', startIndex: 3, endIndex: 5 })
      expect(result.get(4)).toEqual({ type: 'range', startIndex: 3, endIndex: 5 })
      expect(result.get(5)).toEqual({ type: 'range', startIndex: 3, endIndex: 5 })
    })

    it('should not group if only one muscle differs', () => {
      const data = [
        { date: '2024-01-01', back: 100, chest: 50, legs: 200 },
        { date: '2024-01-02', back: 100, chest: 60, legs: 200 }, // chest differs
      ]

      const result = groupConsecutiveIdenticalPoints(data, MUSCLES)

      expect(result.size).toBe(2)
      expect(result.get(0)).toEqual({ type: 'single', startIndex: 0, endIndex: 0 })
      expect(result.get(1)).toEqual({ type: 'single', startIndex: 1, endIndex: 1 })
    })

    it('should group points with non-zero identical values', () => {
      const data = [
        { date: '2024-01-01', back: 1000, chest: 500, legs: 2000 },
        { date: '2024-01-02', back: 1000, chest: 500, legs: 2000 },
        { date: '2024-01-03', back: 1000, chest: 500, legs: 2000 },
      ]

      const result = groupConsecutiveIdenticalPoints(data, MUSCLES)

      expect(result.size).toBe(3)
      for (let i = 0; i < 3; i++) {
        expect(result.get(i)).toEqual({ type: 'range', startIndex: 0, endIndex: 2 })
      }
    })
  })

  describe('formatDateRangeLabel', () => {
    it('should format date range in Ukrainian locale', () => {
      const result = formatDateRangeLabel('2024-12-07', '2024-12-11', 'uk')
      // Ukrainian month format: "груд." (abbreviated грудня)
      expect(result).toMatch(/^7-11/)
      expect(result).toContain('груд')
    })

    it('should format date range in English locale', () => {
      const result = formatDateRangeLabel('2024-12-07', '2024-12-11', 'en')
      // English month format: "Dec" (abbreviated December)
      expect(result).toMatch(/^7-11/)
      expect(result).toContain('Dec')
    })

    it('should handle single-digit start day', () => {
      const result = formatDateRangeLabel('2024-12-02', '2024-12-11', 'en')
      expect(result).toMatch(/^2-11/)
    })

    it('should handle double-digit days', () => {
      const result = formatDateRangeLabel('2024-12-15', '2024-12-22', 'en')
      expect(result).toMatch(/^15-22/)
    })

    it('should handle end of month', () => {
      const result = formatDateRangeLabel('2024-12-25', '2024-12-31', 'en')
      expect(result).toMatch(/^25-31/)
    })

    it('should use end date month for label', () => {
      // When range spans month boundary, use the end date's month
      const result = formatDateRangeLabel('2024-11-30', '2024-12-05', 'en')
      expect(result).toMatch(/^30-5/)
      expect(result).toContain('Dec') // Should use December from end date
    })

    it('should handle January (month edge case)', () => {
      const result = formatDateRangeLabel('2024-01-10', '2024-01-15', 'en')
      expect(result).toMatch(/^10-15/)
      expect(result).toContain('Jan')
    })

    it('should default to Ukrainian locale if not specified', () => {
      const result = formatDateRangeLabel('2024-12-07', '2024-12-11')
      expect(result).toMatch(/^7-11/)
      expect(result).toContain('груд')
    })
  })
})
