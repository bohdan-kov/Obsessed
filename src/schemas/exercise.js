import { z } from 'zod'
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, EXERCISE_TYPES } from '@/shared/config/constants'
import { CONFIG } from '@/constants/config'

// Extract muscle group IDs for validation
const muscleGroupIds = MUSCLE_GROUPS.map((group) => group.id)

/**
 * Bilingual text schema
 * Used for exercise names and descriptions that support both UK and EN
 */
const bilingualTextSchema = z.object({
  uk: z.string().min(1, 'Ukrainian text is required'),
  en: z.string().min(1, 'English text is required'),
})

/**
 * Optional bilingual text schema
 * Used for optional fields like descriptions
 */
const optionalBilingualTextSchema = z
  .object({
    uk: z.string().max(500).optional(),
    en: z.string().max(500).optional(),
  })
  .optional()

/**
 * Create Exercise Schema
 * Used when creating a new exercise (custom or default)
 */
export const createExerciseSchema = z.object({
  name: bilingualTextSchema.refine(
    (data) => data.uk.length >= 2 && data.en.length >= 2,
    {
      message: 'Names must be at least 2 characters',
    }
  ).refine(
    (data) => data.uk.length <= 100 && data.en.length <= 100,
    {
      message: 'Names must not exceed 100 characters',
    }
  ),
  muscleGroup: z.enum(muscleGroupIds, {
    errorMap: () => ({ message: 'Please select a valid muscle group' }),
  }),
  equipment: z.enum(EQUIPMENT_TYPES, {
    errorMap: () => ({ message: 'Please select valid equipment' }),
  }),
  type: z.enum(EXERCISE_TYPES).optional().default('compound'),
  secondaryMuscles: z
    .array(z.enum(muscleGroupIds))
    .max(CONFIG.exercise.MAX_SECONDARY_MUSCLES, {
      message: `Maximum ${CONFIG.exercise.MAX_SECONDARY_MUSCLES} secondary muscles allowed`,
    })
    .optional()
    .default([]),
  description: optionalBilingualTextSchema,
  videoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

/**
 * Update Exercise Schema
 * Used when editing an existing exercise
 * All fields are optional for partial updates
 */
export const updateExerciseSchema = z.object({
  name: bilingualTextSchema.optional(),
  muscleGroup: z.enum(muscleGroupIds).optional(),
  equipment: z.enum(EQUIPMENT_TYPES).optional(),
  type: z.enum(EXERCISE_TYPES).optional(),
  secondaryMuscles: z
    .array(z.enum(muscleGroupIds))
    .max(CONFIG.exercise.MAX_SECONDARY_MUSCLES)
    .optional(),
  description: optionalBilingualTextSchema,
  videoUrl: z.string().url().optional().or(z.literal('')),
})

/**
 * Exercise Note Schema
 * Used for saving exercise notes
 */
export const exerciseNoteSchema = z.object({
  note: z.string().max(2000, 'Notes must not exceed 2000 characters'),
})

/**
 * Exercise Filter Schema
 * Used for validating filter inputs
 */
export const exerciseFilterSchema = z.object({
  muscleGroup: z.enum([...muscleGroupIds, 'all']).optional(),
  equipment: z.enum([...EQUIPMENT_TYPES, 'all']).optional(),
  exerciseType: z.enum([...EXERCISE_TYPES, 'all']).optional(),
  showFavoritesOnly: z.boolean().optional().default(false),
})

/**
 * Exercise Sort Schema
 * Used for validating sort options
 */
export const exerciseSortSchema = z.enum([
  'alphabetical',
  'muscleGroup',
  'recent',
  'frequent',
])
