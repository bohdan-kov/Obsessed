import { differenceInDays } from 'date-fns'
import { calculate1RM, findBestSet } from './strengthUtils'

/**
 * Validate goal data before creation
 * @param {Object} goalData - Goal to validate
 * @param {Array} workouts - User's workout history
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateGoal(goalData, workouts) {
  const errors = []
  const warnings = []

  // Common validations
  if (!goalData.type) {
    errors.push('Goal type is required')
  }

  if (goalData.deadline) {
    const deadline = new Date(goalData.deadline)
    const now = new Date()

    if (deadline <= now) {
      errors.push('Deadline must be in the future')
    }
  }

  // Type-specific validations
  if (goalData.type === 'strength') {
    validateStrengthGoal(goalData, workouts, errors, warnings)
  } else if (goalData.type === 'volume') {
    validateVolumeGoal(goalData, workouts, errors, warnings)
  } else if (goalData.type === 'frequency') {
    validateFrequencyGoal(goalData, errors, warnings)
  } else if (goalData.type === 'streak') {
    validateStreakGoal(goalData, errors, warnings)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate strength goal
 */
function validateStrengthGoal(goalData, workouts, errors, warnings) {
  if (!goalData.exerciseName) {
    errors.push('Exercise name is required')
  }

  if (!goalData.targetWeight || goalData.targetWeight <= 0) {
    errors.push('Target weight must be positive')
  }

  // Check if user has workout history for this exercise
  const relevantWorkouts = workouts.filter((w) =>
    w.exercises.some((e) => e.name === goalData.exerciseName)
  )

  if (relevantWorkouts.length < 3) {
    warnings.push(
      `Only ${relevantWorkouts.length} workouts found for ${goalData.exerciseName}. ` +
        'Add more workouts for accurate progress tracking.'
    )
  }

  // Calculate current 1RM
  if (relevantWorkouts.length > 0) {
    const latestWorkout = relevantWorkouts[relevantWorkouts.length - 1]
    const exercise = latestWorkout.exercises.find((e) => e.name === goalData.exerciseName)
    const bestSet = findBestSet(exercise.sets)

    if (!bestSet) {
      errors.push('No valid sets found for this exercise')
      return
    }

    const current1RM = calculate1RM(bestSet.weight, bestSet.reps)

    if (!current1RM) {
      errors.push('Could not calculate 1RM from exercise history')
      return
    }

    if (goalData.targetWeight <= current1RM) {
      errors.push(
        `Target weight (${goalData.targetWeight}kg) must be higher than ` +
          `current 1RM (${current1RM.toFixed(1)}kg)`
      )
    }

    // Check if goal is realistic
    if (goalData.deadline) {
      const daysAvailable = differenceInDays(new Date(goalData.deadline), new Date())
      const increasePercent = ((goalData.targetWeight - current1RM) / current1RM) * 100
      const weeksAvailable = daysAvailable / 7

      // Rule: +5% per month is realistic for intermediate lifters
      const realisticIncreasePercent = (weeksAvailable / 4) * 5

      if (increasePercent > realisticIncreasePercent * 1.5) {
        warnings.push(
          `Target may be ambitious. Based on typical progress, ` +
            `${(current1RM * (1 + realisticIncreasePercent / 100)).toFixed(1)}kg ` +
            `in ${weeksAvailable.toFixed(0)} weeks is more realistic.`
        )
      }
    }
  }
}

/**
 * Validate volume goal
 */
function validateVolumeGoal(goalData, workouts, errors, warnings) {
  if (!goalData.volumeType) {
    errors.push('Volume type is required (total, exercise, or muscle-group)')
  }

  if (!goalData.target || goalData.target <= 0) {
    errors.push('Target volume must be positive')
  }

  if (!goalData.period) {
    errors.push('Period is required (week or month)')
  }

  if (goalData.volumeType === 'muscle-group' && !goalData.muscleGroup) {
    errors.push('Muscle group is required for muscle-group volume goals')
  }

  if (goalData.volumeType === 'exercise' && !goalData.exerciseName) {
    errors.push('Exercise name is required for exercise volume goals')
  }

  // Check if increase is too aggressive
  if (goalData.currentVolume && goalData.target) {
    const increasePercent =
      ((goalData.target - goalData.currentVolume) / goalData.currentVolume) * 100

    if (increasePercent > 50) {
      warnings.push(
        `Volume increase of ${increasePercent.toFixed(0)}% may be too aggressive. ` +
          'Consider increasing by 10-15% for sustainable progress.'
      )
    }
  }
}

/**
 * Validate frequency goal
 */
function validateFrequencyGoal(goalData, errors, warnings) {
  if (!goalData.frequencyType) {
    errors.push('Frequency type is required (total or muscle-group)')
  }

  if (!goalData.targetCount || goalData.targetCount <= 0) {
    errors.push('Target count must be positive')
  }

  if (!goalData.period) {
    errors.push('Period is required (week or month)')
  }

  if (goalData.frequencyType === 'muscle-group' && !goalData.muscleGroup) {
    errors.push('Muscle group is required for muscle-group frequency goals')
  }

  // Warn about overtraining
  if (goalData.period === 'week' && goalData.targetCount > 7) {
    warnings.push(
      'Training 7+ times per week may lead to overtraining. Ensure adequate recovery.'
    )
  }
}

/**
 * Validate streak goal
 */
function validateStreakGoal(goalData, errors, warnings) {
  if (!goalData.streakType) {
    errors.push('Streak type is required (daily or weekly)')
  }

  if (goalData.streakType === 'daily' && (!goalData.targetDays || goalData.targetDays <= 0)) {
    errors.push('Target days must be positive for daily streak goals')
  }

  if (goalData.streakType === 'weekly' && (!goalData.targetWeeks || goalData.targetWeeks <= 0)) {
    errors.push('Target weeks must be positive for weekly streak goals')
  }

  if (goalData.allowRestDays && (!goalData.maxRestDaysPerWeek || goalData.maxRestDaysPerWeek < 0)) {
    errors.push('Max rest days per week must be specified when rest days are allowed')
  }
}
