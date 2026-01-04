import { calculate1RM, findBestSet, calculateExerciseVolume } from './strengthUtils'
import { calculateLinearRegression } from './statsUtils'
import { differenceInDays, startOfWeek, endOfWeek } from 'date-fns'

/**
 * Calculate total workout volume
 * @param {Object} workout - Workout with exercises array
 * @returns {number} Total volume in kg
 */
export function calculateWorkoutVolume(workout) {
  if (workout.totalVolume != null && workout.totalVolume > 0) {
    return workout.totalVolume
  }

  if (!workout.exercises || workout.exercises.length === 0) {
    return 0
  }

  return workout.exercises.reduce((total, exercise) => {
    return total + calculateExerciseVolume(exercise)
  }, 0)
}

/**
 * Get muscle groups from exercise data
 * @param {Object} exerciseData - Exercise data from exerciseStore
 * @returns {string[]} Array of muscle group IDs
 */
export function getMuscleGroups(exerciseData) {
  if (!exerciseData) return []

  const muscles = []

  if (exerciseData.muscleGroup) {
    muscles.push(exerciseData.muscleGroup)
  }

  if (exerciseData.secondaryMuscles && Array.isArray(exerciseData.secondaryMuscles)) {
    muscles.push(...exerciseData.secondaryMuscles)
  }

  return muscles
}

/**
 * Calculate strength goal progress
 * @param {Object} goal - Strength goal
 * @param {Array} workouts - All workouts
 * @param {Map} exerciseMap - Exercise library map (exerciseId -> exerciseData)
 * @returns {Object} { current1RM, progressPercent, progressHistory, trend }
 */
export function calculateStrengthProgress(goal, workouts, exerciseMap = null) {
  const relevantWorkouts = workouts
    .filter((w) => w.exercises && w.exercises.some((e) => e.exerciseName === goal.exerciseName))
    .sort((a, b) => {
      // Use completedAt for sorting (when workout finished)
      const dateA = a.completedAt?.seconds
        ? new Date(a.completedAt.seconds * 1000)
        : new Date(a.completedAt || a.createdAt)
      const dateB = b.completedAt?.seconds
        ? new Date(b.completedAt.seconds * 1000)
        : new Date(b.completedAt || b.createdAt)
      return dateA - dateB
    })

  if (!relevantWorkouts.length) {
    return {
      current1RM: goal.currentWeight || 0,
      progressPercent: 0,
      progressHistory: [],
      trend: null,
    }
  }

  // Build progress history
  const progressHistory = relevantWorkouts.map((w) => {
    const exercise = w.exercises.find((e) => e.exerciseName === goal.exerciseName)
    const bestSet = findBestSet(exercise.sets)

    let onerm = 0
    if (bestSet && bestSet.weight && bestSet.reps) {
      onerm = calculate1RM(bestSet.weight, bestSet.reps) || 0
    }

    // Use completedAt for history date
    const historyDate = w.completedAt?.seconds
      ? new Date(w.completedAt.seconds * 1000)
      : (w.completedAt || w.createdAt)

    return {
      date: historyDate,
      value: onerm,
      sets: exercise.sets,
      maxWeight: bestSet ? bestSet.weight : 0,
    }
  })

  // CRITICAL: For strength goals, current1RM should be the BEST (max) 1RM ever achieved, not the last one
  // This represents the user's Personal Record (PR)
  const current1RM = progressHistory.length > 0
    ? Math.max(...progressHistory.map(p => p.value))
    : (goal.currentWeight || 0)

  const progressPercent = Math.min((current1RM / goal.targetWeight) * 100, 100)

  // Calculate trend (linear regression)
  const trend = calculateLinearRegression(progressHistory.map((p, i) => ({ x: i, y: p.value })))

  return {
    current1RM,
    progressPercent,
    progressHistory,
    trend,
  }
}

/**
 * Calculate volume goal progress for current period
 * @param {Object} goal - Volume goal
 * @param {Array} workouts - All workouts
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @param {Map} exerciseMap - Exercise library map (for muscle group lookup)
 * @returns {Object} { currentVolume, progressPercent }
 */
export function calculateVolumeProgress(goal, workouts, periodStart, periodEnd, exerciseMap = null) {
  const periodWorkouts = workouts.filter((w) => {
    // Use completedAt (when workout finished), not createdAt (when started)
    let workoutDate
    if (w.completedAt?.seconds) {
      workoutDate = new Date(w.completedAt.seconds * 1000)
    } else if (w.completedAt) {
      workoutDate = new Date(w.completedAt)
    } else if (w.createdAt?.seconds) {
      workoutDate = new Date(w.createdAt.seconds * 1000)
    } else {
      workoutDate = new Date(w.createdAt)
    }
    return workoutDate >= periodStart && workoutDate <= periodEnd
  })

  let currentVolume = 0

  if (goal.volumeType === 'total') {
    currentVolume = periodWorkouts.reduce((sum, w) => sum + calculateWorkoutVolume(w), 0)
  } else if (goal.volumeType === 'exercise') {
    currentVolume = periodWorkouts.reduce((sum, w) => {
      const exercise = w.exercises.find((e) => e.exerciseName === goal.exerciseName)
      return sum + (exercise ? calculateExerciseVolume(exercise) : 0)
    }, 0)
  } else if (goal.volumeType === 'muscle-group') {
    currentVolume = periodWorkouts.reduce((sum, w) => {
      const muscleVolume = w.exercises
        .filter((e) => {
          // If exerciseMap is provided, use it for muscle group lookup
          if (exerciseMap && e.exerciseId) {
            const exerciseData = exerciseMap.get(e.exerciseId)
            if (exerciseData) {
              const muscles = getMuscleGroups(exerciseData)
              return muscles.includes(goal.muscleGroup)
            }
          }
          // Fallback: exercise might have muscleGroup property directly
          return e.muscleGroup === goal.muscleGroup
        })
        .reduce((exSum, e) => exSum + calculateExerciseVolume(e), 0)

      return sum + muscleVolume
    }, 0)
  }

  const progressPercent = Math.min((currentVolume / goal.target) * 100, 100)

  return {
    currentVolume,
    progressPercent,
  }
}

/**
 * Calculate frequency goal progress for current period
 * @param {Object} goal - Frequency goal
 * @param {Array} workouts - All workouts
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @param {Map} exerciseMap - Exercise library map (for muscle group lookup)
 * @returns {Object} { currentCount, progressPercent }
 */
export function calculateFrequencyProgress(
  goal,
  workouts,
  periodStart,
  periodEnd,
  exerciseMap = null
) {
  let periodWorkouts = workouts.filter((w) => {
    // Use completedAt (when workout finished), not createdAt (when started)
    // Firestore Timestamp can be object with seconds field
    let workoutDate
    if (w.completedAt?.seconds) {
      workoutDate = new Date(w.completedAt.seconds * 1000)
    } else if (w.completedAt) {
      workoutDate = new Date(w.completedAt)
    } else if (w.createdAt?.seconds) {
      workoutDate = new Date(w.createdAt.seconds * 1000)
    } else {
      workoutDate = new Date(w.createdAt)
    }

    return workoutDate >= periodStart && workoutDate <= periodEnd
  })

  if (goal.frequencyType === 'muscle-group') {
    periodWorkouts = periodWorkouts.filter((w) =>
      w.exercises.some((e) => {
        if (exerciseMap && e.exerciseId) {
          const exerciseData = exerciseMap.get(e.exerciseId)
          if (exerciseData) {
            const muscles = getMuscleGroups(exerciseData)
            return muscles.includes(goal.muscleGroup)
          }
        }
        return e.muscleGroup === goal.muscleGroup
      })
    )
  }

  const currentCount = periodWorkouts.length
  const progressPercent = Math.min((currentCount / goal.targetCount) * 100, 100)

  return {
    currentCount,
    progressPercent,
  }
}

/**
 * Calculate streak goal progress
 * @param {Object} goal - Streak goal
 * @param {Array} workouts - All workouts
 * @returns {Object} { currentStreak, longestStreak, progressPercent, history }
 */
export function calculateStreakProgress(goal, workouts) {
  const sortedWorkouts = workouts
    .map((w) => {
      // Use completedAt (when workout finished), not createdAt (when started)
      if (w.completedAt?.seconds) {
        return new Date(w.completedAt.seconds * 1000)
      } else if (w.completedAt) {
        return new Date(w.completedAt)
      } else if (w.createdAt?.seconds) {
        return new Date(w.createdAt.seconds * 1000)
      } else {
        return new Date(w.createdAt)
      }
    })
    .sort((a, b) => b - a) // Newest first

  if (!sortedWorkouts.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      progressPercent: 0,
      history: [],
    }
  }

  // Calculate streak based on streakType
  if (goal.streakType === 'daily') {
    const { currentStreak, longestStreak } = calculateDailyStreak(
      sortedWorkouts,
      goal.allowRestDays,
      goal.maxRestDaysPerWeek
    )

    const target = goal.targetDays
    const progressPercent = Math.min((currentStreak / target) * 100, 100)

    return {
      currentStreak,
      longestStreak,
      progressPercent,
      history: [],
    }
  } else {
    // Weekly streak
    const { currentStreak, longestStreak } = calculateWeeklyStreak(sortedWorkouts)

    const target = goal.targetWeeks
    const progressPercent = Math.min((currentStreak / target) * 100, 100)

    return {
      currentStreak,
      longestStreak,
      progressPercent,
      history: [],
    }
  }
}

/**
 * Calculate daily streak
 */
function calculateDailyStreak(workoutDates, allowRestDays, maxRestDaysPerWeek) {
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let consecutiveMissedDays = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)

    const hadWorkout = workoutDates.some((d) => {
      const workoutDate = new Date(d)
      workoutDate.setHours(0, 0, 0, 0)
      return workoutDate.getTime() === checkDate.getTime()
    })

    if (hadWorkout) {
      tempStreak++
      consecutiveMissedDays = 0
    } else {
      consecutiveMissedDays++

      if (allowRestDays && consecutiveMissedDays <= maxRestDaysPerWeek) {
        // Allow rest day
        continue
      } else {
        // Streak broken
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
        if (i === consecutiveMissedDays) {
          currentStreak = 0
        }
        tempStreak = 0
      }
    }
  }

  if (tempStreak > 0 && currentStreak === 0) {
    currentStreak = tempStreak
  }

  return { currentStreak, longestStreak }
}

/**
 * Calculate weekly streak
 */
function calculateWeeklyStreak(workoutDates) {
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const today = new Date()

  for (let i = 0; i < 52; i++) {
    const weekStart = startOfWeek(new Date(today.setDate(today.getDate() - i * 7)), {
      weekStartsOn: 1,
    })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    const hadWorkoutThisWeek = workoutDates.some((d) => d >= weekStart && d <= weekEnd)

    if (hadWorkoutThisWeek) {
      tempStreak++
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
      if (i === 0) {
        currentStreak = 0
      }
      tempStreak = 0
    }
  }

  if (tempStreak > 0 && currentStreak === 0) {
    currentStreak = tempStreak
  }

  return { currentStreak, longestStreak }
}

