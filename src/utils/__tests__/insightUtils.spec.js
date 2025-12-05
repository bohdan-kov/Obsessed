import { describe, it, expect } from 'vitest'
import {
  generateRestDaysInsight,
  generateStreakInsight,
  generateWorkoutInsight,
  generateVolumeInsight,
  generatePRInsight,
  calculateTrendPercentage,
  calculateAbsoluteChange,
  formatTrendValue,
  getTrendDirection,
  createTrendObject,
} from '../insightUtils'

describe('insightUtils', () => {
  describe('generateRestDaysInsight', () => {
    const thresholds = { WARNING_THRESHOLD: 3 }

    it('should return good status for 0 rest days', () => {
      const result = generateRestDaysInsight(0, thresholds)
      expect(result.status).toBe('good')
      expect(result.textKey).toBe('dashboard.stats.insights.strongConsistency')
    })

    it('should return good status for 1-2 rest days', () => {
      const result1 = generateRestDaysInsight(1, thresholds)
      expect(result1.status).toBe('good')
      expect(result1.textKey).toBe('dashboard.stats.insights.onTrack')

      const result2 = generateRestDaysInsight(2, thresholds)
      expect(result2.status).toBe('good')
    })

    it('should return warning status for 3+ rest days', () => {
      const result = generateRestDaysInsight(3, thresholds)
      expect(result.status).toBe('warning')
      expect(result.textKey).toBe('dashboard.stats.insights.timeToTrain')
    })
  })

  describe('generateStreakInsight', () => {
    const thresholds = { EXCELLENT_THRESHOLD: 7, GOOD_THRESHOLD: 3 }

    it('should return warning for 0 streak', () => {
      const result = generateStreakInsight(0, thresholds)
      expect(result.status).toBe('warning')
      expect(result.textKey).toBe('dashboard.stats.insights.timeToTrain')
    })

    it('should return neutral for 1-2 days streak', () => {
      const result = generateStreakInsight(2, thresholds)
      expect(result.status).toBe('neutral')
      expect(result.textKey).toBe('dashboard.stats.insights.onTrack')
    })

    it('should return good for 3-6 days streak', () => {
      const result = generateStreakInsight(5, thresholds)
      expect(result.status).toBe('good')
      expect(result.textKey).toBe('dashboard.stats.insights.streakBuilding')
    })

    it('should return good for 7+ days streak', () => {
      const result = generateStreakInsight(10, thresholds)
      expect(result.status).toBe('good')
      expect(result.textKey).toBe('dashboard.stats.insights.keepItUp')
    })
  })

  describe('generateWorkoutInsight', () => {
    const target = 12

    it('should return good when meeting target', () => {
      const trend = { direction: 'neutral' }
      const result = generateWorkoutInsight(12, target, trend)
      expect(result.status).toBe('good')
      expect(result.textKey).toBe('dashboard.stats.insights.strongConsistency')
    })

    it('should return good when exceeding target', () => {
      const trend = { direction: 'up' }
      const result = generateWorkoutInsight(15, target, trend)
      expect(result.status).toBe('good')
    })

    it('should return good for trending up below target', () => {
      const trend = { direction: 'up' }
      const result = generateWorkoutInsight(8, target, trend)
      expect(result.status).toBe('good')
      expect(result.textKey).toBe('dashboard.stats.insights.greatProgress')
    })

    it('should return warning for below 50% of target', () => {
      const trend = { direction: 'down' }
      const result = generateWorkoutInsight(5, target, trend)
      expect(result.status).toBe('warning')
      expect(result.textKey).toBe('dashboard.stats.insights.needsAttention')
    })

    it('should return neutral for moderate performance', () => {
      const trend = { direction: 'neutral' }
      const result = generateWorkoutInsight(8, target, trend)
      expect(result.status).toBe('neutral')
      expect(result.textKey).toBe('dashboard.stats.insights.onTrack')
    })
  })

  describe('generateVolumeInsight', () => {
    const thresholds = { GROWTH_TARGET_PERCENT: 5, DECLINE_WARNING_PERCENT: -10 }

    it('should return neutral for no trend', () => {
      const result = generateVolumeInsight(null, thresholds)
      expect(result.status).toBe('neutral')
      expect(result.textKey).toBe('dashboard.stats.insights.volumeStable')
    })

    it('should return neutral for neutral direction', () => {
      const trend = { direction: 'neutral', value: '0%' }
      const result = generateVolumeInsight(trend, thresholds)
      expect(result.status).toBe('neutral')
    })

    it('should return good for growth above target', () => {
      const trend = { direction: 'up', value: '12.5%' }
      const result = generateVolumeInsight(trend, thresholds)
      expect(result.status).toBe('good')
      expect(result.textKey).toBe('dashboard.stats.insights.volumeGrowing')
    })

    it('should return good for modest growth', () => {
      const trend = { direction: 'up', value: '3%' }
      const result = generateVolumeInsight(trend, thresholds)
      expect(result.status).toBe('good')
      expect(result.textKey).toBe('dashboard.stats.insights.greatProgress')
    })

    it('should return warning for significant decline', () => {
      const trend = { direction: 'down', value: '-15%' }
      const result = generateVolumeInsight(trend, thresholds)
      expect(result.status).toBe('warning')
      expect(result.textKey).toBe('dashboard.stats.insights.needsAttention')
    })

    it('should return neutral for modest decline', () => {
      const trend = { direction: 'down', value: '-5%' }
      const result = generateVolumeInsight(trend, thresholds)
      expect(result.status).toBe('neutral')
      expect(result.textKey).toBe('dashboard.stats.insights.maintainingStrength')
    })
  })

  describe('generatePRInsight', () => {
    it('should return good for new PRs in period', () => {
      const result = generatePRInsight(3, 10)
      expect(result.status).toBe('good')
      expect(result.textKey).toBe('dashboard.stats.insights.newPRs')
    })

    it('should return neutral when no new PRs but has history', () => {
      const result = generatePRInsight(0, 10)
      expect(result.status).toBe('neutral')
      expect(result.textKey).toBe('dashboard.stats.insights.maintainingStrength')
    })

    it('should return neutral for no PRs at all', () => {
      const result = generatePRInsight(0, 0)
      expect(result.status).toBe('neutral')
      expect(result.textKey).toBe('dashboard.stats.insights.keepItUp')
    })
  })

  describe('calculateTrendPercentage', () => {
    it('should calculate positive percentage', () => {
      const result = calculateTrendPercentage(120, 100)
      expect(result).toBe(20)
    })

    it('should calculate negative percentage', () => {
      const result = calculateTrendPercentage(80, 100)
      expect(result).toBe(-20)
    })

    it('should return 0 when both values are 0', () => {
      const result = calculateTrendPercentage(0, 0)
      expect(result).toBe(0)
    })

    it('should return 100 when previous is 0 and current is positive', () => {
      const result = calculateTrendPercentage(50, 0)
      expect(result).toBe(100)
    })

    it('should round to 1 decimal place', () => {
      const result = calculateTrendPercentage(115, 100)
      expect(result).toBe(15)
    })

    it('should handle decimal percentages', () => {
      const result = calculateTrendPercentage(112.5, 100)
      expect(result).toBe(12.5)
    })
  })

  describe('calculateAbsoluteChange', () => {
    it('should calculate positive change', () => {
      const result = calculateAbsoluteChange(120, 100)
      expect(result).toBe(20)
    })

    it('should calculate negative change', () => {
      const result = calculateAbsoluteChange(80, 100)
      expect(result).toBe(-20)
    })

    it('should return 0 for no change', () => {
      const result = calculateAbsoluteChange(100, 100)
      expect(result).toBe(0)
    })
  })

  describe('formatTrendValue', () => {
    it('should format positive percentage with plus sign', () => {
      const result = formatTrendValue(12.5, 'percentage')
      expect(result).toBe('+12.5%')
    })

    it('should format negative percentage without extra sign', () => {
      const result = formatTrendValue(-12.5, 'percentage')
      expect(result).toBe('-12.5%')
    })

    it('should format zero', () => {
      const result = formatTrendValue(0, 'percentage')
      expect(result).toBe('0')
    })

    it('should format absolute values', () => {
      const result = formatTrendValue(5, 'absolute')
      expect(result).toBe('+5')
    })

    it('should format negative absolute values', () => {
      const result = formatTrendValue(-5, 'absolute')
      expect(result).toBe('-5')
    })
  })

  describe('getTrendDirection', () => {
    it('should return up for positive values', () => {
      expect(getTrendDirection(10)).toBe('up')
    })

    it('should return down for negative values', () => {
      expect(getTrendDirection(-10)).toBe('down')
    })

    it('should return neutral for zero', () => {
      expect(getTrendDirection(0)).toBe('neutral')
    })

    it('should return neutral for values within threshold', () => {
      expect(getTrendDirection(0.5, 1)).toBe('neutral')
      expect(getTrendDirection(-0.5, 1)).toBe('neutral')
    })

    it('should return up/down for values outside threshold', () => {
      expect(getTrendDirection(1.5, 1)).toBe('up')
      expect(getTrendDirection(-1.5, 1)).toBe('down')
    })
  })

  describe('createTrendObject', () => {
    it('should create percentage trend object', () => {
      const result = createTrendObject(120, 100, 'percentage')
      expect(result).toEqual({
        value: '+20%',
        direction: 'up',
        raw: 20,
      })
    })

    it('should create absolute trend object', () => {
      const result = createTrendObject(120, 100, 'absolute')
      expect(result).toEqual({
        value: '+20',
        direction: 'up',
        raw: 20,
      })
    })

    it('should handle negative trends', () => {
      const result = createTrendObject(80, 100, 'percentage')
      expect(result).toEqual({
        value: '-20%',
        direction: 'down',
        raw: -20,
      })
    })

    it('should handle neutral trends', () => {
      const result = createTrendObject(100, 100, 'percentage')
      expect(result).toEqual({
        value: '0',
        direction: 'neutral',
        raw: 0,
      })
    })
  })
})
