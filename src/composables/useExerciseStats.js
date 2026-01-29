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
   * Also builds a Map of workout sessions for efficient access
   */
  const exerciseData = computed(() => {
    const sets = []
    const sessionMap = new Map()

    // Only include completed workouts in statistics
    workoutStore.completedWorkouts.forEach((workout) => {
      const exercise = workout.exercises?.find((ex) => ex.exerciseId === exerciseId)

      if (exercise && exercise.sets.length > 0) {
        const dateSource = workout.completedAt || workout.startedAt

        let workoutDate
        // Handle Firestore Timestamp with toDate method
        if (dateSource?.toDate && typeof dateSource.toDate === 'function') {
          workoutDate = dateSource.toDate()
        }
        // Handle Firestore Timestamp plain object (serialized format)
        else if (typeof dateSource === 'object' && 'seconds' in dateSource && typeof dateSource.seconds === 'number') {
          const milliseconds = dateSource.seconds * 1000 + (dateSource.nanoseconds || 0) / 1000000
          workoutDate = new Date(milliseconds)
        }
        // Handle Date object or string
        else {
          workoutDate = new Date(dateSource)
        }

        // Skip workouts with invalid dates
        if (!workoutDate || isNaN(workoutDate.getTime()) || workoutDate.getTime() === 0) {
          return
        }

        // Add sets with workout context
        exercise.sets.forEach((set) => {
          sets.push({
            ...set,
            workoutId: workout.id,
            workoutDate,
          })
        })

        // Build session data for progressData computation
        const maxWeight = Math.max(...exercise.sets.map((s) => s.weight))
        const volume = exercise.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

        sessionMap.set(workout.id, {
          date: workoutDate,
          maxWeight,
          volume,
          sets: exercise.sets.length,
        })
      }
    })

    // Sort sets by date descending (most recent first)
    const sortedSets = sets.sort((a, b) => b.workoutDate - a.workoutDate)

    return {
      sets: sortedSets,
      sessionMap,
    }
  })

  /**
   * All sets for this exercise (sorted by date descending)
   */
  const exerciseSets = computed(() => exerciseData.value.sets)

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
   * Optimized: Reuses exerciseData.sessionMap instead of iterating workouts again
   */
  const timesPerformed = computed(() => exerciseData.value.sessionMap.size)

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
   * Optimized: Reuses exerciseData.sessionMap instead of rebuilding from workouts
   */
  const progressData = computed(() => {
    const sessions = Array.from(exerciseData.value.sessionMap.values())
      .map((session) => ({
        date: session.date,
        maxWeight: fromStorageUnit(session.maxWeight),
        volume: fromStorageUnit(session.volume),
        sets: session.sets,
      }))
      .sort((a, b) => a.date - b.date)
      .slice(-10) // Last 10 sessions

    return sessions
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
