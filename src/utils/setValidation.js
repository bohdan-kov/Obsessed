import { CONFIG } from '@/constants/config'

/**
 * Validate weight value (in storage unit - kg)
 * @param {number} weight - Weight in kg
 * @returns {{ valid: boolean, error: string|null, min?: number, max?: number }}
 */
export function validateWeight(weight) {
  if (weight == null || weight === '') {
    return { valid: false, error: 'required' }
  }

  const numWeight = parseFloat(weight)

  if (isNaN(numWeight)) {
    return { valid: false, error: 'invalid' }
  }

  if (numWeight < CONFIG.workout.MIN_WEIGHT) {
    return { valid: false, error: 'min', min: CONFIG.workout.MIN_WEIGHT }
  }

  if (numWeight > CONFIG.workout.MAX_WEIGHT) {
    return { valid: false, error: 'max', max: CONFIG.workout.MAX_WEIGHT }
  }

  return { valid: true, error: null }
}

/**
 * Validate reps value
 * @param {number} reps
 * @returns {{ valid: boolean, error: string|null, min?: number, max?: number }}
 */
export function validateReps(reps) {
  if (reps == null || reps === '') {
    return { valid: false, error: 'required' }
  }

  const numReps = parseInt(reps)

  if (isNaN(numReps) || numReps < 1) {
    return { valid: false, error: 'invalid' }
  }

  if (numReps < CONFIG.workout.MIN_REPS) {
    return { valid: false, error: 'min', min: CONFIG.workout.MIN_REPS }
  }

  if (numReps > CONFIG.workout.MAX_REPS) {
    return { valid: false, error: 'max', max: CONFIG.workout.MAX_REPS }
  }

  return { valid: true, error: null }
}

/**
 * Validate RPE value
 * @param {number} rpe
 * @returns {{ valid: boolean, error: string|null, min?: number, max?: number }}
 */
export function validateRPE(rpe) {
  // RPE is optional
  if (rpe == null || rpe === '') {
    return { valid: true, error: null }
  }

  const numRPE = parseInt(rpe)

  if (isNaN(numRPE)) {
    return { valid: false, error: 'invalid' }
  }

  if (numRPE < CONFIG.workout.RPE_MIN || numRPE > CONFIG.workout.RPE_MAX) {
    return {
      valid: false,
      error: 'range',
      min: CONFIG.workout.RPE_MIN,
      max: CONFIG.workout.RPE_MAX,
    }
  }

  return { valid: true, error: null }
}

/**
 * Validate complete set data
 * @param {object} setData - { weight, reps, rpe }
 * @returns {{ valid: boolean, errors: object, details: object }}
 */
export function validateSetData(setData) {
  const weightValidation = validateWeight(setData.weight)
  const repsValidation = validateReps(setData.reps)
  const rpeValidation = validateRPE(setData.rpe)

  return {
    valid: weightValidation.valid && repsValidation.valid && rpeValidation.valid,
    errors: {
      weight: weightValidation.error,
      reps: repsValidation.error,
      rpe: rpeValidation.error,
    },
    details: {
      weight: weightValidation,
      reps: repsValidation,
      rpe: rpeValidation,
    },
  }
}
