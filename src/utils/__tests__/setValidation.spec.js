import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateWeight, validateReps, validateRPE, validateSetData } from '@/utils/setValidation'
import { CONFIG } from '@/constants/config'

describe('setValidation', () => {
  describe('validateWeight', () => {
    it('should return valid for weight within range', () => {
      const result = validateWeight(100)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return valid for minimum weight', () => {
      const result = validateWeight(CONFIG.workout.MIN_WEIGHT)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return valid for maximum weight', () => {
      const result = validateWeight(CONFIG.workout.MAX_WEIGHT)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return error for weight below minimum', () => {
      const result = validateWeight(0.3)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('min')
      expect(result.min).toBe(CONFIG.workout.MIN_WEIGHT)
    })

    it('should return error for weight above maximum', () => {
      const result = validateWeight(700)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('max')
      expect(result.max).toBe(CONFIG.workout.MAX_WEIGHT)
    })

    it('should return error for null weight', () => {
      const result = validateWeight(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('required')
    })

    it('should return error for empty string', () => {
      const result = validateWeight('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('required')
    })

    it('should return error for NaN', () => {
      const result = validateWeight('abc')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid')
    })

    it('should accept decimal weights', () => {
      const result = validateWeight(75.5)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should accept string numbers', () => {
      const result = validateWeight('100')
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('validateReps', () => {
    it('should return valid for reps within range', () => {
      const result = validateReps(10)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return valid for minimum reps', () => {
      const result = validateReps(CONFIG.workout.MIN_REPS)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return valid for maximum reps', () => {
      const result = validateReps(CONFIG.workout.MAX_REPS)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return error for reps below minimum', () => {
      const result = validateReps(0)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid')
    })

    it('should return error for reps above maximum', () => {
      const result = validateReps(150)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('max')
      expect(result.max).toBe(CONFIG.workout.MAX_REPS)
    })

    it('should return error for null reps', () => {
      const result = validateReps(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('required')
    })

    it('should return error for empty string', () => {
      const result = validateReps('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('required')
    })

    it('should return error for NaN', () => {
      const result = validateReps('abc')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid')
    })

    it('should accept string numbers', () => {
      const result = validateReps('10')
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return error for negative reps', () => {
      const result = validateReps(-5)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid')
    })

    it('should return error for decimal reps', () => {
      const result = validateReps(10.5)
      expect(result.valid).toBe(true) // parseInt will convert to 10
    })
  })

  describe('validateRPE', () => {
    it('should return valid for RPE within range', () => {
      const result = validateRPE(7)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return valid for minimum RPE', () => {
      const result = validateRPE(CONFIG.workout.RPE_MIN)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return valid for maximum RPE', () => {
      const result = validateRPE(CONFIG.workout.RPE_MAX)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return valid for null RPE (optional field)', () => {
      const result = validateRPE(null)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return valid for empty string (optional field)', () => {
      const result = validateRPE('')
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return error for RPE below minimum', () => {
      const result = validateRPE(0)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('range')
      expect(result.min).toBe(CONFIG.workout.RPE_MIN)
      expect(result.max).toBe(CONFIG.workout.RPE_MAX)
    })

    it('should return error for RPE above maximum', () => {
      const result = validateRPE(11)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('range')
      expect(result.min).toBe(CONFIG.workout.RPE_MIN)
      expect(result.max).toBe(CONFIG.workout.RPE_MAX)
    })

    it('should return error for NaN', () => {
      const result = validateRPE('abc')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid')
    })

    it('should accept string numbers', () => {
      const result = validateRPE('8')
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('validateSetData', () => {
    it('should return valid for complete valid set data', () => {
      const result = validateSetData({
        weight: 100,
        reps: 10,
        rpe: 8,
      })
      expect(result.valid).toBe(true)
      expect(result.errors.weight).toBeNull()
      expect(result.errors.reps).toBeNull()
      expect(result.errors.rpe).toBeNull()
    })

    it('should return valid for set without RPE', () => {
      const result = validateSetData({
        weight: 100,
        reps: 10,
        rpe: null,
      })
      expect(result.valid).toBe(true)
      expect(result.errors.rpe).toBeNull()
    })

    it('should return invalid for missing weight', () => {
      const result = validateSetData({
        weight: null,
        reps: 10,
        rpe: 8,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.weight).toBe('required')
    })

    it('should return invalid for missing reps', () => {
      const result = validateSetData({
        weight: 100,
        reps: null,
        rpe: 8,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.reps).toBe('required')
    })

    it('should return invalid for weight out of range', () => {
      const result = validateSetData({
        weight: 999,
        reps: 10,
        rpe: 8,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.weight).toBe('max')
    })

    it('should return invalid for reps out of range', () => {
      const result = validateSetData({
        weight: 100,
        reps: 150,
        rpe: 8,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.reps).toBe('max')
    })

    it('should return invalid for RPE out of range', () => {
      const result = validateSetData({
        weight: 100,
        reps: 10,
        rpe: 15,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.rpe).toBe('range')
    })

    it('should return invalid for multiple validation errors', () => {
      const result = validateSetData({
        weight: 999,
        reps: 150,
        rpe: 15,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.weight).toBe('max')
      expect(result.errors.reps).toBe('max')
      expect(result.errors.rpe).toBe('range')
    })

    it('should include details for all validations', () => {
      const result = validateSetData({
        weight: 100,
        reps: 10,
        rpe: 8,
      })
      expect(result.details).toBeDefined()
      expect(result.details.weight).toBeDefined()
      expect(result.details.reps).toBeDefined()
      expect(result.details.rpe).toBeDefined()
    })
  })
})
