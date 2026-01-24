import { describe, it, expect, vi } from 'vitest'
import {
  validateTemplate,
  computeMuscleGroupsFromExercises,
  estimateDuration,
  formatTemplateForDisplay,
  createDefaultTemplateExercise,
  validateTemplateExercise,
} from '@/utils/templateUtils'

describe('templateUtils', () => {
  describe('validateTemplate', () => {
    it('validates a valid template', () => {
      const template = {
        name: 'Push Day A',
        exercises: [
          {
            exerciseId: 'bench-press',
            sets: 4,
            reps: 8,
            restTime: 120,
          },
        ],
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('requires template name', () => {
      const template = {
        name: '',
        exercises: [
          {
            exerciseId: 'bench-press',
            sets: 4,
            reps: 8,
          },
        ],
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template name is required')
    })

    it('validates template name length', () => {
      const template = {
        name: 'A'.repeat(51),
        exercises: [
          {
            exerciseId: 'bench-press',
            sets: 4,
            reps: 8,
          },
        ],
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template name must be less than 50 characters')
    })

    it('requires at least one exercise', () => {
      const template = {
        name: 'Push Day A',
        exercises: [],
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one exercise is required')
    })

    it('validates exercise sets are positive', () => {
      const template = {
        name: 'Push Day A',
        exercises: [
          {
            exerciseId: 'bench-press',
            sets: 0,
            reps: 8,
          },
        ],
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Exercise 1: Sets must be positive')
    })

    it('validates exercise reps are positive', () => {
      const template = {
        name: 'Push Day A',
        exercises: [
          {
            exerciseId: 'bench-press',
            sets: 4,
            reps: -5,
          },
        ],
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Exercise 1: Reps must be positive')
    })

    it('validates target weight is not negative', () => {
      const template = {
        name: 'Push Day A',
        exercises: [
          {
            exerciseId: 'bench-press',
            sets: 4,
            reps: 8,
            targetWeight: -100,
          },
        ],
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Exercise 1: Target weight cannot be negative')
    })

    it('validates rest time is not negative', () => {
      const template = {
        name: 'Push Day A',
        exercises: [
          {
            exerciseId: 'bench-press',
            sets: 4,
            reps: 8,
            restTime: -60,
          },
        ],
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Exercise 1: Rest time cannot be negative')
    })
  })

  describe('computeMuscleGroupsFromExercises', () => {
    it('computes muscle groups from exercises', () => {
      const exercises = [
        { exerciseId: 'bench-press' },
        { exerciseId: 'squat' },
      ]

      const mockExerciseStore = {
        getExerciseById: vi.fn((id) => {
          if (id === 'bench-press') {
            return {
              muscleGroup: 'chest',
              secondaryMuscles: ['shoulders', 'triceps'],
            }
          }
          if (id === 'squat') {
            return {
              muscleGroup: 'legs',
              secondaryMuscles: ['glutes'],
            }
          }
          return null
        }),
      }

      const result = computeMuscleGroupsFromExercises(exercises, mockExerciseStore)

      expect(result).toContain('chest')
      expect(result).toContain('shoulders')
      expect(result).toContain('triceps')
      expect(result).toContain('legs')
      expect(result).toContain('glutes')
      expect(result).toHaveLength(5)
    })

    it('returns unique muscle groups', () => {
      const exercises = [
        { exerciseId: 'bench-press' },
        { exerciseId: 'incline-press' },
      ]

      const mockExerciseStore = {
        getExerciseById: vi.fn(() => ({
          muscleGroup: 'chest',
          secondaryMuscles: ['shoulders'],
        })),
      }

      const result = computeMuscleGroupsFromExercises(exercises, mockExerciseStore)

      expect(result).toContain('chest')
      expect(result).toContain('shoulders')
      expect(result).toHaveLength(2)
    })

    it('handles exercises not found in store', () => {
      const exercises = [{ exerciseId: 'unknown-exercise' }]

      const mockExerciseStore = {
        getExerciseById: vi.fn(() => null),
      }

      const result = computeMuscleGroupsFromExercises(exercises, mockExerciseStore)

      expect(result).toHaveLength(0)
    })
  })

  describe('estimateDuration', () => {
    it('estimates duration for small workout', () => {
      const exercises = [
        { sets: 3 },
        { sets: 3 },
        { sets: 3 },
      ]

      const result = estimateDuration(exercises)

      expect(result).toBe(8) // 3 exercises * 2.5 = 7.5 → 8 minutes
    })

    it('estimates duration with set bonus for high volume', () => {
      const exercises = Array(10).fill({ sets: 3 })

      const result = estimateDuration(exercises)

      // 10 exercises * 2.5 = 25
      // Total sets: 30 → 30 - 20 = 10 → 10 * 0.5 = 5 bonus
      // Total: 25 + 5 = 30
      expect(result).toBe(30)
    })

    it('returns 0 for empty exercises', () => {
      expect(estimateDuration([])).toBe(0)
      expect(estimateDuration(null)).toBe(0)
      expect(estimateDuration(undefined)).toBe(0)
    })
  })

  describe('formatTemplateForDisplay', () => {
    it('formats template for display', () => {
      const template = {
        name: 'Push Day A',
        estimatedDuration: 75,
        exercises: [{ id: 1 }, { id: 2 }, { id: 3 }],
        muscleGroups: ['chest', 'shoulders', 'triceps'],
      }

      const result = formatTemplateForDisplay(template)

      expect(result.displayName).toBe('Push Day A')
      expect(result.displayDuration).toBe('75 min')
      expect(result.displayExercises).toBe('3 exercises')
      expect(result.displayMuscles).toBe('chest, shoulders, triceps')
    })

    it('handles empty muscle groups', () => {
      const template = {
        name: 'Test Template',
        estimatedDuration: 30,
        exercises: [{ id: 1 }],
        muscleGroups: [],
      }

      const result = formatTemplateForDisplay(template)

      expect(result.displayMuscles).toBe('')
    })
  })

  describe('createDefaultTemplateExercise', () => {
    it('creates default template exercise', () => {
      const result = createDefaultTemplateExercise('bench-press', 'Bench Press')

      expect(result).toEqual({
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        sets: 3,
        reps: 10,
        targetWeight: null,
        restTime: 90,
        notes: '',
      })
    })
  })

  describe('validateTemplateExercise', () => {
    it('validates a valid exercise', () => {
      const exercise = {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        sets: 4,
        reps: 8,
        restTime: 120,
      }

      const result = validateTemplateExercise(exercise)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('requires exercise ID', () => {
      const exercise = {
        exerciseName: 'Bench Press',
        sets: 4,
        reps: 8,
      }

      const result = validateTemplateExercise(exercise)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Exercise ID is required')
    })

    it('requires exercise name', () => {
      const exercise = {
        exerciseId: 'bench-press',
        sets: 4,
        reps: 8,
      }

      const result = validateTemplateExercise(exercise)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Exercise name is required')
    })
  })
})
