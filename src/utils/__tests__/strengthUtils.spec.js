import { describe, it, expect } from 'vitest'
import {
  calculate1RM,
  findBestSet,
  calculateTrend,
  getProgressStatus,
  findBestPR,
  calculateExerciseVolume,
} from '../strengthUtils'

describe('strengthUtils', () => {
  describe('calculate1RM', () => {
    it('should return weight for 1 rep', () => {
      expect(calculate1RM(100, 1)).toBe(100)
    })

    it('should calculate 1RM using Epley formula', () => {
      expect(calculate1RM(100, 5)).toBeCloseTo(116.67, 1)
      expect(calculate1RM(80, 10)).toBeCloseTo(106.67, 1)
      expect(calculate1RM(60, 8)).toBeCloseTo(76, 1)
    })

    it('should return null for >15 reps', () => {
      expect(calculate1RM(50, 16)).toBeNull()
      expect(calculate1RM(50, 20)).toBeNull()
    })

    it('should return null for invalid inputs', () => {
      expect(calculate1RM(0, 5)).toBeNull()
      expect(calculate1RM(100, 0)).toBeNull()
      expect(calculate1RM(-50, 5)).toBeNull()
      expect(calculate1RM(null, 5)).toBeNull()
      expect(calculate1RM(100, null)).toBeNull()
    })

    it('should handle decimal weights', () => {
      expect(calculate1RM(52.5, 5)).toBeCloseTo(61.25, 1)
    })
  })

  describe('findBestSet', () => {
    it('should return null for empty array', () => {
      expect(findBestSet([])).toBeNull()
    })

    it('should return null for null/undefined', () => {
      expect(findBestSet(null)).toBeNull()
      expect(findBestSet(undefined)).toBeNull()
    })

    it('should find set with highest weight × reps', () => {
      const sets = [
        { weight: 100, reps: 5 }, // 500
        { weight: 80, reps: 10 }, // 800 ← best
        { weight: 120, reps: 3 }, // 360
      ]

      const best = findBestSet(sets)
      expect(best).toEqual({ weight: 80, reps: 10 })
    })

    it('should handle single set', () => {
      const sets = [{ weight: 100, reps: 10 }]
      const best = findBestSet(sets)
      expect(best).toEqual({ weight: 100, reps: 10 })
    })

    it('should handle ties (return first one)', () => {
      const sets = [
        { weight: 100, reps: 5 }, // 500
        { weight: 50, reps: 10 }, // 500
      ]

      const best = findBestSet(sets)
      expect(best).toEqual({ weight: 100, reps: 5 })
    })

    it('should ignore sets with missing weight or reps', () => {
      const sets = [
        { weight: 100, reps: null },
        { weight: null, reps: 10 },
        { weight: 80, reps: 5 }, // 400 ← valid best
      ]

      const best = findBestSet(sets)
      expect(best).toEqual({ weight: 80, reps: 5 })
    })
  })

  describe('calculateTrend', () => {
    it('should return insufficient_data for <4 workouts', () => {
      const history = [{ bestSet: { weight: 100, reps: 5 } }, { bestSet: { weight: 102, reps: 5 } }]

      const trend = calculateTrend(history)
      expect(trend.direction).toBe('insufficient_data')
      expect(trend.percentage).toBe(0)
      expect(trend.confidence).toBe(0)
    })

    it('should return insufficient_data for null/undefined', () => {
      expect(calculateTrend(null).direction).toBe('insufficient_data')
      expect(calculateTrend(undefined).direction).toBe('insufficient_data')
      expect(calculateTrend([]).direction).toBe('insufficient_data')
    })

    it('should detect progressing trend (up)', () => {
      const history = [
        { bestSet: { weight: 100, reps: 5 } },
        { bestSet: { weight: 105, reps: 5 } },
        { bestSet: { weight: 110, reps: 5 } },
        { bestSet: { weight: 115, reps: 5 } },
      ]

      const trend = calculateTrend(history)
      expect(trend.direction).toBe('up')
      expect(trend.percentage).toBeGreaterThan(2.5)
      expect(trend.confidence).toBeGreaterThan(0.9) // High confidence for linear data
    })

    it('should detect stalled trend (flat)', () => {
      const history = Array(5).fill({ bestSet: { weight: 100, reps: 5 } })

      const trend = calculateTrend(history)
      expect(trend.direction).toBe('flat')
      expect(Math.abs(trend.percentage)).toBeLessThan(2.5)
    })

    it('should detect regressing trend (down)', () => {
      const history = [
        { bestSet: { weight: 115, reps: 5 } },
        { bestSet: { weight: 110, reps: 5 } },
        { bestSet: { weight: 105, reps: 5 } },
        { bestSet: { weight: 100, reps: 5 } },
      ]

      const trend = calculateTrend(history)
      expect(trend.direction).toBe('down')
      expect(trend.percentage).toBeLessThan(-2.5)
    })

    it('should handle missing bestSet values', () => {
      const history = [
        { bestSet: { weight: 100, reps: 5 } },
        { bestSet: null },
        { bestSet: { weight: 105, reps: 5 } },
        { bestSet: { weight: 110, reps: 5 } },
        { bestSet: { weight: 115, reps: 5 } },
      ]

      const trend = calculateTrend(history)
      // Should still have enough data after filtering null
      expect(trend.direction).toBe('up')
    })

    it('should calculate confidence (r2)', () => {
      const history = [
        { bestSet: { weight: 100, reps: 5 } },
        { bestSet: { weight: 105, reps: 5 } },
        { bestSet: { weight: 110, reps: 5 } },
        { bestSet: { weight: 115, reps: 5 } },
      ]

      const trend = calculateTrend(history)
      expect(trend.confidence).toBeGreaterThan(0)
      expect(trend.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('getProgressStatus', () => {
    it('should return Progressing for up trend', () => {
      const status = getProgressStatus({ direction: 'up', percentage: 5, confidence: 0.9 })
      expect(status.label).toBe('Progressing')
      expect(status.color).toBe('green')
      expect(status.icon).toBe('trending-up')
    })

    it('should return Regressing for down trend', () => {
      const status = getProgressStatus({ direction: 'down', percentage: -5, confidence: 0.9 })
      expect(status.label).toBe('Regressing')
      expect(status.color).toBe('red')
      expect(status.icon).toBe('trending-down')
    })

    it('should return Stalled for flat trend', () => {
      const status = getProgressStatus({ direction: 'flat', percentage: 1, confidence: 0.9 })
      expect(status.label).toBe('Stalled')
      expect(status.color).toBe('yellow')
      expect(status.icon).toBe('minus')
    })

    it('should return New for insufficient_data', () => {
      const status = getProgressStatus({
        direction: 'insufficient_data',
        percentage: 0,
        confidence: 0,
      })
      expect(status.label).toBe('New')
      expect(status.color).toBe('gray')
      expect(status.icon).toBe('help-circle')
    })

    it('should default to New for unknown direction', () => {
      const status = getProgressStatus({ direction: 'unknown', percentage: 0, confidence: 0 })
      expect(status.label).toBe('New')
      expect(status.color).toBe('gray')
    })
  })

  describe('findBestPR', () => {
    it('should return null for empty history', () => {
      expect(findBestPR([])).toBeNull()
      expect(findBestPR(null)).toBeNull()
      expect(findBestPR(undefined)).toBeNull()
    })

    it('should find entry with highest estimated 1RM', () => {
      const history = [
        { date: new Date('2024-01-01'), bestSet: { weight: 100, reps: 5 } }, // 1RM: 116.67
        { date: new Date('2024-01-08'), bestSet: { weight: 105, reps: 5 } }, // 1RM: 122.5 ← best
        { date: new Date('2024-01-15'), bestSet: { weight: 110, reps: 3 } }, // 1RM: 121
      ]

      const best = findBestPR(history)
      expect(best.bestSet.weight).toBe(105)
      expect(best.bestSet.reps).toBe(5)
    })

    it('should handle entries with missing bestSet', () => {
      const history = [
        { date: new Date('2024-01-01'), bestSet: { weight: 100, reps: 5 } },
        { date: new Date('2024-01-08'), bestSet: null },
        { date: new Date('2024-01-15'), bestSet: { weight: 105, reps: 5 } }, // ← best
      ]

      const best = findBestPR(history)
      expect(best.bestSet.weight).toBe(105)
    })

    it('should handle single entry', () => {
      const history = [{ date: new Date(), bestSet: { weight: 100, reps: 5 } }]
      const best = findBestPR(history)
      expect(best).toEqual(history[0])
    })
  })

  describe('calculateExerciseVolume', () => {
    it('should return 0 for no sets', () => {
      expect(calculateExerciseVolume({ sets: [] })).toBe(0)
      expect(calculateExerciseVolume({ sets: null })).toBe(0)
      expect(calculateExerciseVolume(null)).toBe(0)
      expect(calculateExerciseVolume(undefined)).toBe(0)
    })

    it('should calculate correct volume (weight × reps sum)', () => {
      const exercise = {
        sets: [
          { weight: 100, reps: 10 }, // 1000
          { weight: 100, reps: 8 }, // 800
          { weight: 100, reps: 6 }, // 600
        ],
      }

      expect(calculateExerciseVolume(exercise)).toBe(2400)
    })

    it('should handle single set', () => {
      const exercise = {
        sets: [{ weight: 50, reps: 10 }],
      }

      expect(calculateExerciseVolume(exercise)).toBe(500)
    })

    it('should ignore sets with missing weight or reps', () => {
      const exercise = {
        sets: [
          { weight: 100, reps: 10 }, // 1000
          { weight: null, reps: 10 },
          { weight: 100, reps: null },
          { weight: 50, reps: 10 }, // 500
        ],
      }

      expect(calculateExerciseVolume(exercise)).toBe(1500)
    })

    it('should handle decimal weights', () => {
      const exercise = {
        sets: [
          { weight: 52.5, reps: 10 }, // 525
          { weight: 52.5, reps: 8 }, // 420
        ],
      }

      expect(calculateExerciseVolume(exercise)).toBe(945)
    })
  })
})
