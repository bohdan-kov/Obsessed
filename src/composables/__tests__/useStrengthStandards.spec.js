import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useStrengthStandards } from '@/composables/useStrengthStandards'

// Mock userStore with reactive profile
const mockProfile = ref({
  gender: 'male',
  bodyweight: 80, // 80kg bodyweight for testing
})

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => ({
    profile: mockProfile,
  }),
}))

describe('useStrengthStandards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('normalizeExerciseName', () => {
    it('should normalize bench press variations', () => {
      const { normalizeExerciseName } = useStrengthStandards()

      expect(normalizeExerciseName('Bench Press')).toBe('bench-press')
      expect(normalizeExerciseName('Barbell Bench Press')).toBe('bench-press')
      expect(normalizeExerciseName('BENCH PRESS')).toBe('bench-press')
    })

    it('should normalize squat variations', () => {
      const { normalizeExerciseName } = useStrengthStandards()

      expect(normalizeExerciseName('Squat')).toBe('squat')
      expect(normalizeExerciseName('Back Squat')).toBe('squat')
      expect(normalizeExerciseName('Barbell Squat')).toBe('squat')
    })

    it('should normalize deadlift variations', () => {
      const { normalizeExerciseName } = useStrengthStandards()

      expect(normalizeExerciseName('Deadlift')).toBe('deadlift')
      expect(normalizeExerciseName('Conventional Deadlift')).toBe('deadlift')
    })

    it('should normalize overhead press variations', () => {
      const { normalizeExerciseName } = useStrengthStandards()

      expect(normalizeExerciseName('Overhead Press')).toBe('overhead-press')
      expect(normalizeExerciseName('Military Press')).toBe('overhead-press')
      expect(normalizeExerciseName('Shoulder Press')).toBe('overhead-press')
    })

    it('should return null for unsupported exercises', () => {
      const { normalizeExerciseName } = useStrengthStandards()

      expect(normalizeExerciseName('Bicep Curl')).toBeNull()
      expect(normalizeExerciseName('Tricep Extension')).toBeNull()
    })

    it('should handle null and empty inputs', () => {
      const { normalizeExerciseName } = useStrengthStandards()

      expect(normalizeExerciseName(null)).toBeNull()
      expect(normalizeExerciseName('')).toBeNull()
    })
  })

  describe('hasStandards', () => {
    it('should return true for supported exercises', () => {
      const { hasStandards } = useStrengthStandards()

      expect(hasStandards('Bench Press')).toBe(true)
      expect(hasStandards('Squat')).toBe(true)
      expect(hasStandards('Deadlift')).toBe(true)
      expect(hasStandards('Overhead Press')).toBe(true)
    })

    it('should return false for unsupported exercises', () => {
      const { hasStandards } = useStrengthStandards()

      expect(hasStandards('Bicep Curl')).toBe(false)
      expect(hasStandards('Leg Press')).toBe(false)
    })
  })

  describe('calculateStrengthLevel', () => {
    it('should calculate beginner level correctly', () => {
      const { calculateStrengthLevel } = useStrengthStandards()

      // 40kg bench press at 80kg bodyweight = 0.5x = beginner
      const result = calculateStrengthLevel('Bench Press', 40)

      expect(result).not.toBeNull()
      expect(result.currentLevel).toBe('beginner')
      expect(result.ratio).toBe(0.5)
      expect(result.bodyweight).toBe(80)
    })

    it('should calculate novice level correctly', () => {
      const { calculateStrengthLevel } = useStrengthStandards()

      // 60kg bench press at 80kg bodyweight = 0.75x = novice
      const result = calculateStrengthLevel('Bench Press', 60)

      expect(result).not.toBeNull()
      expect(result.currentLevel).toBe('novice')
      expect(result.ratio).toBe(0.75)
    })

    it('should calculate intermediate level correctly', () => {
      const { calculateStrengthLevel } = useStrengthStandards()

      // 100kg bench press at 80kg bodyweight = 1.25x = intermediate
      const result = calculateStrengthLevel('Bench Press', 100)

      expect(result).not.toBeNull()
      expect(result.currentLevel).toBe('intermediate')
      expect(result.ratio).toBe(1.25)
    })

    it('should calculate advanced level correctly', () => {
      const { calculateStrengthLevel } = useStrengthStandards()

      // 140kg bench press at 80kg bodyweight = 1.75x = advanced
      const result = calculateStrengthLevel('Bench Press', 140)

      expect(result).not.toBeNull()
      expect(result.currentLevel).toBe('advanced')
      expect(result.ratio).toBe(1.75)
    })

    it('should calculate elite level correctly', () => {
      const { calculateStrengthLevel } = useStrengthStandards()

      // 160kg bench press at 80kg bodyweight = 2.0x = elite
      const result = calculateStrengthLevel('Bench Press', 160)

      expect(result).not.toBeNull()
      expect(result.currentLevel).toBe('elite')
      expect(result.ratio).toBe(2.0)
      expect(result.nextLevel).toBeNull()
    })

    it('should calculate progress to next level', () => {
      const { calculateStrengthLevel } = useStrengthStandards()

      // 50kg bench press at 80kg bodyweight = 0.625x (halfway between beginner and novice)
      const result = calculateStrengthLevel('Bench Press', 50)

      expect(result).not.toBeNull()
      expect(result.currentLevel).toBe('beginner')
      expect(result.nextLevel).toBe('novice')
      expect(result.progressPercent).toBeGreaterThan(0)
      expect(result.progressPercent).toBeLessThan(100)
    })

    it('should calculate remaining weight to next level', () => {
      const { calculateStrengthLevel } = useStrengthStandards()

      // 40kg at 80kg bodyweight (beginner)
      // Next level (novice) needs 60kg (0.75 x 80)
      // Remaining: 20kg
      const result = calculateStrengthLevel('Bench Press', 40)

      expect(result).not.toBeNull()
      expect(result.remainingWeight).toBeCloseTo(20, 0)
    })

    it('should return null for unsupported exercises', () => {
      const { calculateStrengthLevel } = useStrengthStandards()

      const result = calculateStrengthLevel('Bicep Curl', 20)
      expect(result).toBeNull()
    })

    it('should return null if bodyweight is missing', () => {
      // Update mock profile to have no bodyweight
      mockProfile.value = {
        gender: 'male',
        bodyweight: null,
      }

      const { calculateStrengthLevel } = useStrengthStandards()
      const result = calculateStrengthLevel('Bench Press', 100)

      expect(result).toBeNull()

      // Reset to default
      mockProfile.value = {
        gender: 'male',
        bodyweight: 80,
      }
    })
  })

  describe('getWeightForLevel', () => {
    it('should calculate weight needed for specific level', () => {
      const { getWeightForLevel } = useStrengthStandards()

      // For 80kg bodyweight
      // Beginner bench: 0.5 x 80 = 40kg
      expect(getWeightForLevel('Bench Press', 'beginner')).toBe(40)

      // Novice bench: 0.75 x 80 = 60kg
      expect(getWeightForLevel('Bench Press', 'novice')).toBe(60)

      // Intermediate bench: 1.25 x 80 = 100kg
      expect(getWeightForLevel('Bench Press', 'intermediate')).toBe(100)
    })

    it('should return null for unsupported exercises', () => {
      const { getWeightForLevel } = useStrengthStandards()

      expect(getWeightForLevel('Bicep Curl', 'intermediate')).toBeNull()
    })

    it('should return null for invalid levels', () => {
      const { getWeightForLevel } = useStrengthStandards()

      expect(getWeightForLevel('Bench Press', 'invalid-level')).toBeNull()
    })
  })

  describe('getSupportedExercises', () => {
    it('should return list of exercises with standards', () => {
      const { getSupportedExercises } = useStrengthStandards()

      const exercises = getSupportedExercises()

      expect(exercises).toBeInstanceOf(Array)
      expect(exercises.length).toBeGreaterThan(0)

      exercises.forEach((exercise) => {
        expect(exercise).toHaveProperty('id')
        expect(exercise).toHaveProperty('name')
        expect(exercise).toHaveProperty('standards')
      })
    })

    it('should include main compound lifts', () => {
      const { getSupportedExercises } = useStrengthStandards()

      const exercises = getSupportedExercises()
      const ids = exercises.map((e) => e.id)

      expect(ids).toContain('bench-press')
      expect(ids).toContain('squat')
      expect(ids).toContain('deadlift')
      expect(ids).toContain('overhead-press')
    })
  })

  describe('formatLevelName', () => {
    it('should capitalize level names', () => {
      const { formatLevelName } = useStrengthStandards()

      expect(formatLevelName('beginner')).toBe('Beginner')
      expect(formatLevelName('novice')).toBe('Novice')
      expect(formatLevelName('intermediate')).toBe('Intermediate')
      expect(formatLevelName('advanced')).toBe('Advanced')
      expect(formatLevelName('elite')).toBe('Elite')
    })

    it('should handle empty input', () => {
      const { formatLevelName } = useStrengthStandards()

      expect(formatLevelName('')).toBe('')
      expect(formatLevelName(null)).toBe('')
    })
  })

  describe('getLevelColor', () => {
    it('should return color classes for levels', () => {
      const { getLevelColor } = useStrengthStandards()

      expect(getLevelColor('beginner')).toBe('text-gray-500')
      expect(getLevelColor('novice')).toBe('text-blue-500')
      expect(getLevelColor('intermediate')).toBe('text-green-500')
      expect(getLevelColor('advanced')).toBe('text-purple-500')
      expect(getLevelColor('elite')).toBe('text-orange-500')
    })

    it('should return default color for invalid level', () => {
      const { getLevelColor } = useStrengthStandards()

      expect(getLevelColor('invalid')).toBe('text-gray-500')
    })
  })

  describe('getLevelBadgeVariant', () => {
    it('should return badge variants for levels', () => {
      const { getLevelBadgeVariant } = useStrengthStandards()

      expect(getLevelBadgeVariant('beginner')).toBe('secondary')
      expect(getLevelBadgeVariant('novice')).toBe('default')
      expect(getLevelBadgeVariant('elite')).toBe('destructive')
    })
  })

  describe('gender support', () => {
    it('should use different standards for female', () => {
      // Update the mock profile to female
      mockProfile.value = {
        gender: 'female',
        bodyweight: 60,
      }

      const { calculateStrengthLevel } = useStrengthStandards({ defaultGender: 'female' })

      // 45kg bench press at 60kg bodyweight = 0.75x = intermediate for female
      const result = calculateStrengthLevel('Bench Press', 45)

      expect(result).not.toBeNull()
      expect(result.currentLevel).toBe('intermediate')

      // Reset to default for other tests
      mockProfile.value = {
        gender: 'male',
        bodyweight: 80,
      }
    })
  })
})
