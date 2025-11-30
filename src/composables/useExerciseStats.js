import { computed } from 'vue'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useUnits } from './useUnits'

/**
 * Exercise Statistics Composable
 * Calculates statistics for a specific exercise based on workout history
 *
 * @param {string} exerciseId - Exercise ID to calculate stats for
 * @returns {Object} Computed statistics
 */
export function useExerciseStats(exerciseId) {
  const workoutStore = useWorkoutStore()
  const { fromStorageUnit, formatWeight } = useUnits()

  /**
   * Get all sets for this exercise from all workouts
   */
  const exerciseSets = computed(() => {
    const sets = []

    workoutStore.workouts.forEach((workout) => {
      const exercise = workout.exercises?.find((ex) => ex.exerciseId === exerciseId)

      if (exercise) {
        exercise.sets.forEach((set) => {
          sets.push({
            ...set,
            workoutDate: workout.startedAt?.toDate
              ? workout.startedAt.toDate()
              : new Date(workout.startedAt),
          })
        })
      }
    })

    // Sort by date descending (most recent first)
    return sets.sort((a, b) => b.workoutDate - a.workoutDate)
  })

  /**
   * Personal Record (PR) - Maximum weight lifted
   */
  const personalRecord = computed(() => {
    if (exerciseSets.value.length === 0) return null

    const maxSet = exerciseSets.value.reduce((max, set) => {
      return set.weight > max.weight ? set : max
    }, exerciseSets.value[0])

    return {
      weight: fromStorageUnit(maxSet.weight),
      reps: maxSet.reps,
      date: maxSet.workoutDate,
      formatted: formatWeight(maxSet.weight),
    }
  })

  /**
   * Estimated 1 Rep Max using Brzycki formula
   * 1RM = weight × (36 / (37 - reps))
   */
  const estimated1RM = computed(() => {
    if (exerciseSets.value.length === 0) return null

    // Find the set with the highest estimated 1RM
    let maxEstimated1RM = 0
    let bestSet = null

    exerciseSets.value.forEach((set) => {
      if (set.reps >= 1 && set.reps <= 36) {
        const estimated = set.weight * (36 / (37 - set.reps))
        if (estimated > maxEstimated1RM) {
          maxEstimated1RM = estimated
          bestSet = set
        }
      }
    })

    if (!bestSet) return null

    return {
      value: fromStorageUnit(maxEstimated1RM),
      formatted: formatWeight(maxEstimated1RM),
      basedOn: {
        weight: fromStorageUnit(bestSet.weight),
        reps: bestSet.reps,
        date: bestSet.workoutDate,
      },
    }
  })

  /**
   * Total volume lifted (sum of all weight × reps)
   */
  const totalVolume = computed(() => {
    const volume = exerciseSets.value.reduce((total, set) => {
      return total + set.weight * set.reps
    }, 0)

    return {
      value: fromStorageUnit(volume),
      formatted: formatWeight(volume),
    }
  })

  /**
   * Times performed (number of workout sessions)
   */
  const timesPerformed = computed(() => {
    const workoutIds = new Set()

    workoutStore.workouts.forEach((workout) => {
      const hasExercise = workout.exercises?.some((ex) => ex.exerciseId === exerciseId)
      if (hasExercise) {
        workoutIds.add(workout.id)
      }
    })

    return workoutIds.size
  })

  /**
   * Average weight per set
   */
  const averageWeight = computed(() => {
    if (exerciseSets.value.length === 0) return null

    const totalWeight = exerciseSets.value.reduce((sum, set) => sum + set.weight, 0)
    const avgWeight = totalWeight / exerciseSets.value.length

    return {
      value: fromStorageUnit(avgWeight),
      formatted: formatWeight(avgWeight),
    }
  })

  /**
   * Average reps per set
   */
  const averageReps = computed(() => {
    if (exerciseSets.value.length === 0) return null

    const totalReps = exerciseSets.value.reduce((sum, set) => sum + set.reps, 0)
    return Math.round(totalReps / exerciseSets.value.length)
  })

  /**
   * Last performed date
   */
  const lastPerformed = computed(() => {
    if (exerciseSets.value.length === 0) return null
    return exerciseSets.value[0].workoutDate // Already sorted descending
  })

  /**
   * Progress data for charting (last 10 sessions)
   */
  const progressData = computed(() => {
    const sessionMap = new Map()

    // Group sets by workout session
    workoutStore.workouts.forEach((workout) => {
      const exercise = workout.exercises?.find((ex) => ex.exerciseId === exerciseId)

      if (exercise && exercise.sets.length > 0) {
        const date = workout.startedAt?.toDate
          ? workout.startedAt.toDate()
          : new Date(workout.startedAt)

        // Calculate max weight and total volume for this session
        const maxWeight = Math.max(...exercise.sets.map((s) => s.weight))
        const volume = exercise.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

        sessionMap.set(workout.id, {
          date,
          maxWeight: fromStorageUnit(maxWeight),
          volume: fromStorageUnit(volume),
          sets: exercise.sets.length,
        })
      }
    })

    // Convert to array and sort by date
    return Array.from(sessionMap.values())
      .sort((a, b) => a.date - b.date)
      .slice(-10) // Last 10 sessions
  })

  /**
   * Check if exercise has any data
   */
  const hasData = computed(() => exerciseSets.value.length > 0)

  /**
   * Total number of sets completed
   */
  const totalSets = computed(() => exerciseSets.value.length)

  /**
   * Average RPE (Rate of Perceived Exertion)
   */
  const averageRPE = computed(() => {
    const setsWithRPE = exerciseSets.value.filter((set) => set.rpe != null && set.rpe > 0)

    if (setsWithRPE.length === 0) return null

    const totalRPE = setsWithRPE.reduce((sum, set) => sum + set.rpe, 0)
    return (totalRPE / setsWithRPE.length).toFixed(1)
  })

  return {
    // Raw data
    exerciseSets,

    // Statistics
    personalRecord,
    estimated1RM,
    totalVolume,
    timesPerformed,
    averageWeight,
    averageReps,
    averageRPE,
    lastPerformed,
    totalSets,

    // Progress tracking
    progressData,

    // Status
    hasData,
  }
}
