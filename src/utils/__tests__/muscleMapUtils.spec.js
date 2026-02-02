import { describe, it, expect } from 'vitest'
import {
  MUSCLE_GROUP_MAPPING,
  convertToAnatomicalMuscles,
  calculateMuscleOpacity,
  getMuscleColor,
  groupMusclesByIntensity,
  findMaxVolume,
} from '../muscleMapUtils'

describe('muscleMapUtils', () => {
  describe('MUSCLE_GROUP_MAPPING', () => {
    it('should map all 8 app muscle groups', () => {
      const expectedGroups = [
        'back',
        'chest',
        'legs',
        'shoulders',
        'biceps',
        'triceps',
        'core',
        'calves',
      ]

      expectedGroups.forEach((group) => {
        expect(MUSCLE_GROUP_MAPPING[group]).toBeDefined()
        expect(Array.isArray(MUSCLE_GROUP_MAPPING[group])).toBe(true)
        expect(MUSCLE_GROUP_MAPPING[group].length).toBeGreaterThan(0)
      })
    })

    it('should map back to 4 anatomical muscles', () => {
      expect(MUSCLE_GROUP_MAPPING.back).toEqual([
        'lats',
        'traps',
        'rotatorCuffs',
        'lowerBack',
      ])
    })

    it('should map legs to 5 anatomical muscles', () => {
      expect(MUSCLE_GROUP_MAPPING.legs).toEqual([
        'glutes',
        'quads',
        'hamstrings',
        'adductors',
        'abductors',
      ])
    })

    it('should have 1:1 mapping for chest', () => {
      expect(MUSCLE_GROUP_MAPPING.chest).toEqual(['chest'])
    })
  })

  describe('calculateMuscleOpacity', () => {
    it('should return 0.2 for zero volume', () => {
      expect(calculateMuscleOpacity(0, 1000)).toBe(0.2)
    })

    it('should return 0.2 for zero maxVolume', () => {
      expect(calculateMuscleOpacity(500, 0)).toBe(0.2)
    })

    it('should return 1.0 for max volume', () => {
      expect(calculateMuscleOpacity(1000, 1000)).toBe(1.0)
    })

    it('should apply quadratic scaling for half of max volume', () => {
      // 0.2 + (0.5)² * 0.8 = 0.2 + 0.25 * 0.8 = 0.2 + 0.2 = 0.4
      expect(calculateMuscleOpacity(500, 1000)).toBe(0.4)
    })

    it('should apply quadratic scaling for 25% of max volume', () => {
      // 0.2 + (0.25)² * 0.8 = 0.2 + 0.0625 * 0.8 = 0.2 + 0.05 = 0.25
      expect(calculateMuscleOpacity(250, 1000)).toBe(0.25)
    })

    it('should apply quadratic scaling for 75% of max volume', () => {
      // 0.2 + (0.75)² * 0.8 = 0.2 + 0.5625 * 0.8 = 0.2 + 0.45 = 0.65
      expect(calculateMuscleOpacity(750, 1000)).toBe(0.65)
    })

    it('should apply quadratic scaling for 10% of max volume', () => {
      // 0.2 + (0.1)² * 0.8 = 0.2 + 0.01 * 0.8 = 0.2 + 0.008 = 0.208 ≈ 0.21
      expect(calculateMuscleOpacity(100, 1000)).toBe(0.21)
    })

    it('should apply quadratic scaling for 33% of max volume', () => {
      // 0.2 + (0.33)² * 0.8 = 0.2 + 0.1089 * 0.8 ≈ 0.2 + 0.0871 ≈ 0.29
      expect(calculateMuscleOpacity(330, 1000)).toBe(0.29)
    })

    it('should handle decimal values correctly', () => {
      const result = calculateMuscleOpacity(666.67, 1000)
      expect(result).toBeGreaterThanOrEqual(0.2)
      expect(result).toBeLessThanOrEqual(1.0)
    })

    it('should cap at 1.0 even if volume exceeds maxVolume', () => {
      expect(calculateMuscleOpacity(1500, 1000)).toBe(1.0)
    })

    it('should provide better contrast than linear scaling', () => {
      // Compare 33% vs 100% contrast with quadratic scaling
      const opacity33 = calculateMuscleOpacity(330, 1000) // ~0.29
      const opacity100 = calculateMuscleOpacity(1000, 1000) // 1.0

      // Quadratic contrast: 1.0 - 0.29 = 0.71
      const quadraticContrast = opacity100 - opacity33

      // Linear would be: (0.3 + 0.33*0.7) ≈ 0.53 → contrast = 1.0 - 0.53 = 0.47
      const expectedLinearContrast = 0.47

      // Verify quadratic provides more contrast
      expect(quadraticContrast).toBeGreaterThan(expectedLinearContrast)
      expect(quadraticContrast).toBeCloseTo(0.71, 1)
    })
  })

  describe('getMuscleColor', () => {
    it('should return correct color for back', () => {
      expect(getMuscleColor('back')).toBe('#3b82f6')
    })

    it('should return correct color for chest', () => {
      expect(getMuscleColor('chest')).toBe('#f97316')
    })

    it('should return correct color for legs', () => {
      expect(getMuscleColor('legs')).toBe('#10b981')
    })

    it('should return fallback color for unknown muscle', () => {
      expect(getMuscleColor('unknown')).toBe('#6b7280')
    })

    it('should return fallback color for undefined', () => {
      expect(getMuscleColor(undefined)).toBe('#6b7280')
    })
  })

  describe('findMaxVolume', () => {
    it('should return 0 for empty array', () => {
      expect(findMaxVolume([])).toBe(0)
    })

    it('should return 0 for null input', () => {
      expect(findMaxVolume(null)).toBe(0)
    })

    it('should return 0 for undefined input', () => {
      expect(findMaxVolume(undefined)).toBe(0)
    })

    it('should find max volume in array', () => {
      const data = [
        { muscle: 'chest', value: 1500, percentage: 30 },
        { muscle: 'back', value: 2000, percentage: 40 },
        { muscle: 'legs', value: 1000, percentage: 20 },
      ]
      expect(findMaxVolume(data)).toBe(2000)
    })

    it('should work with single item', () => {
      const data = [{ muscle: 'chest', value: 1500, percentage: 100 }]
      expect(findMaxVolume(data)).toBe(1500)
    })
  })

  describe('convertToAnatomicalMuscles', () => {
    it('should return empty array for null input', () => {
      expect(convertToAnatomicalMuscles(null)).toEqual([])
    })

    it('should return empty array for empty input', () => {
      expect(convertToAnatomicalMuscles([])).toEqual([])
    })

    it('should convert chest correctly (1:1 mapping)', () => {
      const input = [{ muscle: 'chest', value: 1500, percentage: 100 }]
      const result = convertToAnatomicalMuscles(input)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'chest',
        volume: 1500,
        percentage: 100,
        appGroup: 'chest',
        opacity: 1.0,
        color: '#f97316',
      })
    })

    it('should convert back correctly (1:4 mapping)', () => {
      const input = [{ muscle: 'back', value: 1000, percentage: 100 }]
      const result = convertToAnatomicalMuscles(input)

      expect(result).toHaveLength(4)
      const muscleNames = result.map((m) => m.name)
      expect(muscleNames).toEqual(['lats', 'traps', 'rotatorCuffs', 'lowerBack'])

      // All should have same volume and opacity
      result.forEach((muscle) => {
        expect(muscle.volume).toBe(1000)
        expect(muscle.percentage).toBe(100)
        expect(muscle.appGroup).toBe('back')
        expect(muscle.opacity).toBe(1.0)
        expect(muscle.color).toBe('#3b82f6')
      })
    })

    it('should convert legs correctly (1:5 mapping)', () => {
      const input = [{ muscle: 'legs', value: 800, percentage: 100 }]
      const result = convertToAnatomicalMuscles(input)

      expect(result).toHaveLength(5)
      const muscleNames = result.map((m) => m.name)
      expect(muscleNames).toEqual([
        'glutes',
        'quads',
        'hamstrings',
        'adductors',
        'abductors',
      ])
    })

    it('should calculate correct opacity for multiple muscles', () => {
      const input = [
        { muscle: 'chest', value: 1500, percentage: 50 }, // max
        { muscle: 'back', value: 750, percentage: 25 }, // half of max
        { muscle: 'legs', value: 375, percentage: 12.5 }, // quarter of max
      ]
      const result = convertToAnatomicalMuscles(input)

      // Find chest muscle
      const chestMuscle = result.find((m) => m.name === 'chest')
      expect(chestMuscle.opacity).toBe(1.0) // max opacity

      // Find back muscles (should all have same opacity)
      // 750/1500 = 0.5, quadratic: 0.2 + (0.5)² * 0.8 = 0.2 + 0.2 = 0.4
      const backMuscles = result.filter((m) => m.appGroup === 'back')
      backMuscles.forEach((muscle) => {
        expect(muscle.opacity).toBe(0.4)
      })

      // Find leg muscles
      // 375/1500 = 0.25, quadratic: 0.2 + (0.25)² * 0.8 = 0.2 + 0.05 = 0.25
      const legMuscles = result.filter((m) => m.appGroup === 'legs')
      legMuscles.forEach((muscle) => {
        expect(muscle.opacity).toBe(0.25)
      })
    })

    it('should skip unknown muscle groups', () => {
      const input = [
        { muscle: 'chest', value: 1000, percentage: 50 },
        { muscle: 'unknown', value: 500, percentage: 25 },
        { muscle: 'back', value: 500, percentage: 25 },
      ]
      const result = convertToAnatomicalMuscles(input)

      // Should have 1 (chest) + 4 (back) = 5 muscles, unknown skipped
      expect(result).toHaveLength(5)
      const appGroups = [...new Set(result.map((m) => m.appGroup))]
      expect(appGroups).not.toContain('unknown')
    })
  })

  describe('groupMusclesByIntensity', () => {
    it('should group muscles by primary threshold (≥60% of max)', () => {
      // Max group volume = 1000 (chest)
      // Primary threshold = 1000 * 0.6 = 600
      // chest (1000) and back (700) are >= 600, legs (400) is not
      const anatomicalData = [
        { name: 'chest', volume: 1000, appGroup: 'chest', opacity: 1.0 },
        { name: 'lats', volume: 700, appGroup: 'back', opacity: 0.7 },
        { name: 'quads', volume: 400, appGroup: 'legs', opacity: 0.4 },
      ]
      const result = groupMusclesByIntensity(anatomicalData)

      expect(result.primary).toEqual(['chest', 'lats'])
      expect(result.secondary).toEqual(['quads'])
    })

    it('should group only top muscle group as primary', () => {
      // Max group volume = 1000 (chest)
      // Primary threshold = 1000 * 0.6 = 600
      // Only chest (1000) is >= 600
      const anatomicalData = [
        { name: 'chest', volume: 1000, appGroup: 'chest', opacity: 1.0 },
        { name: 'lats', volume: 500, appGroup: 'back', opacity: 0.5 },
        { name: 'quads', volume: 300, appGroup: 'legs', opacity: 0.3 },
      ]
      const result = groupMusclesByIntensity(anatomicalData)

      expect(result.primary).toEqual(['chest'])
      expect(result.secondary).toEqual(['lats', 'quads'])
    })

    it('should handle empty input', () => {
      const result = groupMusclesByIntensity([])
      expect(result.primary).toEqual([])
      expect(result.secondary).toEqual([])
    })

    it('should handle multiple anatomical muscles from same app group', () => {
      // back appGroup maps to 4 anatomical muscles (lats, traps, rotatorCuffs, lowerBack)
      // Total back volume = 200 * 4 = 800 (max)
      // Primary threshold = 800 * 0.6 = 480
      // back (800) >= 480, chest (400) < 480
      const anatomicalData = [
        { name: 'lats', volume: 200, appGroup: 'back', opacity: 1.0 },
        { name: 'traps', volume: 200, appGroup: 'back', opacity: 1.0 },
        { name: 'rotatorCuffs', volume: 200, appGroup: 'back', opacity: 1.0 },
        { name: 'lowerBack', volume: 200, appGroup: 'back', opacity: 1.0 },
        { name: 'chest', volume: 400, appGroup: 'chest', opacity: 0.5 },
      ]
      const result = groupMusclesByIntensity(anatomicalData)

      expect(result.primary).toEqual(['lats', 'traps', 'rotatorCuffs', 'lowerBack'])
      expect(result.secondary).toEqual(['chest'])
    })

    it('should handle all muscles above primary threshold', () => {
      // All groups have similar volumes
      // Max = 1000, threshold = 600
      // All are >= 600
      const anatomicalData = [
        { name: 'chest', volume: 1000, appGroup: 'chest', opacity: 1.0 },
        { name: 'lats', volume: 900, appGroup: 'back', opacity: 0.9 },
        { name: 'quads', volume: 800, appGroup: 'legs', opacity: 0.8 },
      ]
      const result = groupMusclesByIntensity(anatomicalData)

      expect(result.primary).toEqual(['chest', 'lats', 'quads'])
      expect(result.secondary).toEqual([])
    })
  })
})
