/**
 * Template validation and utility functions
 * Used for validating workout templates and computing template metadata
 */

/**
 * Validate template data before creating/updating
 * @param {Object} template - Template data to validate
 * @param {string} template.name - Template name
 * @param {Array} template.exercises - Template exercises
 * @returns {Object} Validation result with { valid: boolean, errors: string[] }
 */
export function validateTemplate(template) {
  const errors = []

  // Validate name
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required')
  }

  if (template.name && template.name.length > 50) {
    errors.push('Template name must be less than 50 characters')
  }

  // Validate exercises
  if (!template.exercises || template.exercises.length === 0) {
    errors.push('At least one exercise is required')
  }

  // Validate each exercise
  template.exercises?.forEach((exercise, index) => {
    if (!exercise.exerciseId) {
      errors.push(`Exercise ${index + 1}: Exercise ID is required`)
    }

    if (!exercise.sets || exercise.sets <= 0) {
      errors.push(`Exercise ${index + 1}: Sets must be positive`)
    }

    if (!exercise.reps || exercise.reps <= 0) {
      errors.push(`Exercise ${index + 1}: Reps must be positive`)
    }

    if (exercise.restTime && exercise.restTime < 0) {
      errors.push(`Exercise ${index + 1}: Rest time cannot be negative`)
    }

    if (exercise.targetWeight && exercise.targetWeight < 0) {
      errors.push(`Exercise ${index + 1}: Target weight cannot be negative`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Compute muscle groups from exercises using exerciseStore
 * @param {Array} exercises - Template exercises
 * @param {Object} exerciseStore - Exercise store instance
 * @returns {string[]} Array of unique muscle group IDs
 */
export function computeMuscleGroupsFromExercises(exercises, exerciseStore) {
  const muscles = new Set()

  exercises.forEach((exercise) => {
    const exerciseData = exerciseStore.getExerciseById(exercise.exerciseId)
    if (exerciseData) {
      // Add primary muscle group
      if (exerciseData.muscleGroup) {
        muscles.add(exerciseData.muscleGroup)
      }

      // Add secondary muscles if they exist
      if (exerciseData.secondaryMuscles && Array.isArray(exerciseData.secondaryMuscles)) {
        exerciseData.secondaryMuscles.forEach((m) => muscles.add(m))
      }
    }
  })

  return Array.from(muscles)
}

/**
 * Estimate workout duration based on exercises
 * Formula: Base time per exercise + bonus for high set count
 * @param {Array} exercises - Template exercises
 * @returns {number} Estimated duration in minutes
 */
export function estimateDuration(exercises) {
  if (!exercises || exercises.length === 0) {
    return 0
  }

  // Average: 2.5 minutes per exercise (including warm-up, rest, sets)
  // Compound exercises take longer, isolation exercises shorter
  const baseTime = exercises.length * 2.5

  // Add extra time for high set count
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)
  const setBonus = totalSets > 20 ? (totalSets - 20) * 0.5 : 0

  return Math.round(baseTime + setBonus)
}

/**
 * Format template for display with computed metadata
 * @param {Object} template - Template data
 * @returns {Object} Template with display fields
 */
export function formatTemplateForDisplay(template) {
  return {
    ...template,
    displayName: template.name,
    displayDuration: `${template.estimatedDuration} min`,
    displayExercises: `${template.exercises.length} exercises`,
    displayMuscles: template.muscleGroups?.join(', ') || '',
  }
}

/**
 * Create a default template exercise structure
 * @param {string} exerciseId - Exercise ID
 * @param {string} exerciseName - Exercise name
 * @returns {Object} Default template exercise
 */
export function createDefaultTemplateExercise(exerciseId, exerciseName) {
  return {
    exerciseId,
    exerciseName,
    sets: 3,
    reps: 10,
    targetWeight: null,
    restTime: 90,
    notes: '',
  }
}

/**
 * Validate individual template exercise
 * @param {Object} exercise - Template exercise
 * @returns {Object} Validation result with { valid: boolean, errors: string[] }
 */
export function validateTemplateExercise(exercise) {
  const errors = []

  if (!exercise.exerciseId) {
    errors.push('Exercise ID is required')
  }

  if (!exercise.exerciseName) {
    errors.push('Exercise name is required')
  }

  if (!exercise.sets || exercise.sets <= 0) {
    errors.push('Sets must be positive')
  }

  if (!exercise.reps || exercise.reps <= 0) {
    errors.push('Reps must be positive')
  }

  if (exercise.restTime && exercise.restTime < 0) {
    errors.push('Rest time cannot be negative')
  }

  if (exercise.targetWeight && exercise.targetWeight < 0) {
    errors.push('Target weight cannot be negative')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
