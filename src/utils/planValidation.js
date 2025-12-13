import { z } from 'zod'
import { CONFIG } from '@/constants/config'

/**
 * Validation schemas for workout plans using Zod
 * Ensures data integrity for plan creation and updates
 */

/**
 * Schema for a single exercise in a plan
 */
export const planExerciseSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  exerciseName: z.string().min(1, 'Exercise name is required'),
  order: z.number().int().min(0, 'Order must be a positive integer'),
  suggestedSets: z
    .number()
    .int()
    .min(CONFIG.plans.SUGGESTED_SETS_MIN)
    .max(CONFIG.plans.SUGGESTED_SETS_MAX)
    .optional()
    .nullable(),
  suggestedWeight: z
    .number()
    .min(CONFIG.workout.MIN_WEIGHT)
    .max(CONFIG.workout.MAX_WEIGHT)
    .optional()
    .nullable(),
  suggestedReps: z.string().max(20).optional().nullable(),
  notes: z.string().max(CONFIG.plans.NOTES_MAX_LENGTH).optional().nullable(),
  muscleGroup: z.string().optional().nullable(),
  equipment: z.string().optional().nullable(),
})

/**
 * Schema for a complete workout plan
 */
export const workoutPlanSchema = z.object({
  name: z
    .string()
    .min(CONFIG.plans.NAME_MIN_LENGTH, `Plan name must be at least ${CONFIG.plans.NAME_MIN_LENGTH} characters`)
    .max(CONFIG.plans.NAME_MAX_LENGTH, `Plan name must be at most ${CONFIG.plans.NAME_MAX_LENGTH} characters`)
    .trim(),
  description: z
    .string()
    .max(CONFIG.plans.DESCRIPTION_MAX_LENGTH, `Description must be at most ${CONFIG.plans.DESCRIPTION_MAX_LENGTH} characters`)
    .trim()
    .optional()
    .nullable(),
  exercises: z
    .array(planExerciseSchema)
    .min(CONFIG.plans.MIN_EXERCISES_PER_PLAN, `Plan must have at least ${CONFIG.plans.MIN_EXERCISES_PER_PLAN} exercise`)
    .max(CONFIG.plans.MAX_EXERCISES_PER_PLAN, `Plan can have at most ${CONFIG.plans.MAX_EXERCISES_PER_PLAN} exercises`),
  tags: z.array(z.string()).optional().nullable(),
})

/**
 * Validate a plan exercise object
 * @param {Object} exercise - Exercise data to validate
 * @returns {{ success: boolean, data?: Object, errors?: Object }}
 */
export function validatePlanExercise(exercise) {
  try {
    const validatedData = planExerciseSchema.parse(exercise)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const field = err.path.join('.')
        acc[field] = err.message
        return acc
      }, {})
      return { success: false, errors }
    }
    return { success: false, errors: { _general: error.message } }
  }
}

/**
 * Validate a workout plan object
 * @param {Object} plan - Plan data to validate
 * @returns {{ success: boolean, data?: Object, errors?: Object }}
 */
export function validatePlan(plan) {
  try {
    const validatedData = workoutPlanSchema.parse(plan)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const field = err.path.join('.')
        acc[field] = err.message
        return acc
      }, {})
      return { success: false, errors }
    }
    return { success: false, errors: { _general: error.message } }
  }
}

/**
 * Validate partial plan data (for updates)
 * @param {Object} updates - Partial plan data to validate
 * @returns {{ success: boolean, data?: Object, errors?: Object }}
 */
export function validatePlanUpdate(updates) {
  try {
    const partialSchema = workoutPlanSchema.partial()
    const validatedData = partialSchema.parse(updates)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const field = err.path.join('.')
        acc[field] = err.message
        return acc
      }, {})
      return { success: false, errors }
    }
    return { success: false, errors: { _general: error.message } }
  }
}
