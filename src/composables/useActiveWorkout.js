import { computed } from 'vue'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useUnits } from '@/composables/useUnits'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useWorkoutTimer } from '@/composables/useWorkoutTimer'
import { useWorkoutBackup } from '@/composables/useWorkoutBackup'
import { useOfflineQueue } from '@/composables/useOfflineQueue'
import { CONFIG } from '@/constants/config'

/**
 * Main composable for active workout state management
 * Orchestrates workoutStore, localStorage backup, offline queue, and timer
 *
 * @returns {Object} Active workout state and actions
 */
export function useActiveWorkout() {
  const workoutStore = useWorkoutStore()
  const exerciseStore = useExerciseStore()
  const { toStorageUnit, fromStorageUnit } = useUnits()
  const { handleError } = useErrorHandler()
  const { saveBackup, loadBackup, clearBackup, hasBackup } = useWorkoutBackup()
  const { enqueue, dequeue, processQueue } = useOfflineQueue()

  // Computed state from workoutStore
  const activeWorkout = computed(() => workoutStore.activeWorkout)
  const hasActiveWorkout = computed(() => workoutStore.hasActiveWorkout)

  // Calculate total sets
  const totalSets = computed(() => {
    if (!activeWorkout.value?.exercises) return 0
    return activeWorkout.value.exercises.reduce((total, exercise) => {
      return total + (exercise.sets?.length || 0)
    }, 0)
  })

  // Calculate total volume (in storage unit - kg)
  const totalVolume = computed(() => {
    if (!activeWorkout.value?.exercises) return 0
    return activeWorkout.value.exercises.reduce((total, exercise) => {
      return (
        total +
        (exercise.sets?.reduce((exTotal, set) => {
          return exTotal + set.weight * set.reps
        }, 0) || 0)
      )
    }, 0)
  })

  // Timer (reactive based on activeWorkout.startedAt)
  const timer = useWorkoutTimer(computed(() => activeWorkout.value?.startedAt))

  /**
   * Start a new workout
   *
   * @returns {Promise<string>} Workout ID
   */
  async function startWorkout() {
    try {
      // Check for existing active workout
      if (hasActiveWorkout.value) {
        handleError(
          new Error('Active workout already exists'),
          'workout.activeWorkout.errors.alreadyActive'
        )
        throw new Error('Active workout already exists')
      }

      // Start workout in Firestore
      const workoutId = await workoutStore.startWorkout()

      // Wait for Firestore listener to update activeWorkout with serverTimestamp
      // The listener updates within ~100ms in most cases
      await new Promise((resolve) => setTimeout(resolve, CONFIG.activeWorkout.FIRESTORE_LISTENER_WAIT_MS))

      // Save initial backup to localStorage only if we have valid data
      if (activeWorkout.value?.startedAt) {
        saveBackup(activeWorkout.value, [])
      } else {
        // If still no startedAt (very rare), create a minimal backup with fallback timestamp
        const fallbackWorkout = {
          id: workoutId,
          userId: workoutStore.activeWorkout?.userId,
          status: 'active',
          startedAt: new Date(), // Use current time as fallback
          exercises: [],
          totalVolume: 0,
          totalSets: 0,
        }
        saveBackup(fallbackWorkout, [])
      }

      return workoutId
    } catch (error) {
      handleError(error, 'workout.activeWorkout.errors.startFailed')
      throw error
    }
  }

  /**
   * Add exercise to active workout
   *
   * @param {string} exerciseId - Exercise ID (slug) from exerciseStore
   * @returns {Promise<void>}
   */
  async function addExercise(exerciseId) {
    try {
      if (!hasActiveWorkout.value) {
        throw new Error('No active workout')
      }

      // Get exercise details from store
      // Note: exerciseStore uses slug as id, so we look up by id
      const exercise = exerciseStore.exercises.find((ex) => ex.id === exerciseId)

      if (!exercise) {
        throw new Error(`Exercise not found: ${exerciseId}`)
      }

      // Get display name (handles bilingual names)
      const exerciseName = exerciseStore.getExerciseDisplayName(exercise)

      // Add to Firestore using the exercise ID (slug)
      await workoutStore.addExercise(exerciseId, exerciseName)

      // Update backup
      if (activeWorkout.value) {
        saveBackup(activeWorkout.value, [])
      }

      // Track as recent exercise
      exerciseStore.addToRecent(exerciseId)
    } catch (error) {
      handleError(error, 'workout.activeWorkout.errors.saveFailed')
      throw error
    }
  }

  /**
   * Add set to exercise in active workout
   *
   * @param {string} exerciseId - Exercise ID
   * @param {Object} setData - Set data
   * @param {number} setData.weight - Weight in user's preferred unit
   * @param {number} setData.reps - Number of reps
   * @param {number|null} setData.rpe - RPE (1-10 or null)
   * @param {string} setData.type - Set type ('normal', 'warmup', 'dropset')
   * @returns {Promise<void>}
   */
  async function addSet(exerciseId, setData) {
    try {
      if (!hasActiveWorkout.value) {
        throw new Error('No active workout')
      }

      // Convert weight to storage unit (kg)
      const storageWeight = toStorageUnit(setData.weight)

      const setWithStorageWeight = {
        ...setData,
        weight: storageWeight,
      }

      // Add to Firestore
      await workoutStore.addSet(exerciseId, setWithStorageWeight)

      // Update backup
      if (activeWorkout.value) {
        saveBackup(activeWorkout.value, [])
      }

      // Cache weight for next set pre-fill
      try {
        localStorage.setItem(CONFIG.storage.LAST_WEIGHT, setData.weight.toString())
        if (setData.rpe) {
          localStorage.setItem(CONFIG.storage.LAST_RPE, setData.rpe.toString())
        }
      } catch {
        // Ignore localStorage errors
      }
    } catch (error) {
      handleError(error, 'workout.activeWorkout.errors.saveFailed')
      throw error
    }
  }

  /**
   * Finish active workout
   *
   * @param {Object} options - Finish options
   * @param {string|null} options.notes - Optional workout notes
   * @param {Date|null} options.date - Optional workout completion date (defaults to current date)
   * @returns {Promise<void>}
   */
  async function finishWorkout(options = {}) {
    try {
      if (!hasActiveWorkout.value) {
        throw new Error('No active workout to finish')
      }

      // Stop timer
      timer.pause()

      // Extract options with defaults
      const { notes = null, date = null } = options

      // Finish workout in Firestore with custom date
      await workoutStore.finishWorkout({ date })

      // Clear localStorage backup
      clearBackup()

      // Clear last weight cache
      try {
        localStorage.removeItem(CONFIG.storage.LAST_WEIGHT)
        localStorage.removeItem(CONFIG.storage.LAST_RPE)
      } catch {
        // Ignore
      }
    } catch (error) {
      handleError(error, 'workout.activeWorkout.errors.saveFailed')
      throw error
    }
  }

  /**
   * Cancel/discard active workout
   *
   * @returns {Promise<void>}
   */
  async function cancelWorkout() {
    try {
      if (!hasActiveWorkout.value) {
        throw new Error('No active workout to cancel')
      }

      // Update status to cancelled in Firestore
      await workoutStore.updateWorkout(activeWorkout.value.id, {
        status: 'cancelled',
      })

      // Clear backup
      clearBackup()

      // Reset timer
      timer.reset()
    } catch (error) {
      handleError(error, 'workout.activeWorkout.errors.saveFailed')
      throw error
    }
  }

  /**
   * Recover workout from localStorage backup
   * Called on app load to restore crashed/interrupted workouts
   *
   * @returns {Promise<boolean>} True if recovered, false otherwise
   */
  async function recoverFromBackup() {
    try {
      // Check if backup exists
      if (!hasBackup()) {
        return false
      }

      const backup = loadBackup()
      if (!backup || !backup.workout) {
        clearBackup()
        return false
      }

      // Check if backup is too old (>24 hours)
      const backupAge = Date.now() - new Date(backup.localUpdatedAt).getTime()
      if (backupAge > CONFIG.activeWorkout.STALE_BACKUP_THRESHOLD) {
        // TODO: Show recovery dialog asking user if they want to restore
        if (import.meta.env.DEV) {
          console.warn('Backup is stale (>24h), skipping auto-recovery')
        }
        return false
      }

      // Check Firestore for active workout
      const firestoreWorkout = workoutStore.activeWorkout

      if (!firestoreWorkout) {
        // Firestore has no active workout but backup exists
        // This means the workout was likely cancelled/finished but backup wasn't cleared
        clearBackup()
        return false
      }

      // Compare timestamps to determine which is newer
      const backupTime = new Date(backup.localUpdatedAt)
      const firestoreTime = firestoreWorkout.lastSavedAt
        ? firestoreWorkout.lastSavedAt.toDate
          ? firestoreWorkout.lastSavedAt.toDate()
          : new Date(firestoreWorkout.lastSavedAt)
        : new Date(0)

      if (backupTime > firestoreTime && backup.pendingChanges.length > 0) {
        // Backup has unsynced changes - process offline queue
        await processQueue()
      }

      // Update backup with current Firestore state
      saveBackup(firestoreWorkout, [])

      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error recovering from backup:', error)
      }
      return false
    }
  }

  /**
   * Delete set from exercise in active workout
   *
   * @param {string} exerciseId - Exercise ID
   * @param {number} setIndex - Index of set to delete
   * @returns {Promise<void>}
   */
  async function deleteSet(exerciseId, setIndex) {
    try {
      if (!hasActiveWorkout.value) {
        throw new Error('No active workout')
      }

      // Find exercise index
      const exerciseIndex = activeWorkout.value.exercises.findIndex(
        (ex) => ex.exerciseId === exerciseId
      )

      if (exerciseIndex === -1) {
        throw new Error('Exercise not found in current workout')
      }

      // Remove set from local state
      const updatedExercises = [...activeWorkout.value.exercises]
      updatedExercises[exerciseIndex].sets.splice(setIndex, 1)

      // Recalculate total volume and sets
      const totalVolume = updatedExercises.reduce((total, exercise) => {
        return (
          total +
          exercise.sets.reduce((exTotal, set) => {
            return exTotal + set.weight * set.reps
          }, 0)
        )
      }, 0)

      const totalSets = updatedExercises.reduce((total, exercise) => {
        return total + exercise.sets.length
      }, 0)

      // Save backup
      saveBackup(activeWorkout.value, [])

      // Sync to Firestore
      await workoutStore.updateWorkout(activeWorkout.value.id, {
        exercises: updatedExercises,
        totalVolume,
        totalSets,
      })
    } catch (error) {
      handleError(error, 'workout.activeWorkout.errors.saveFailed')
      throw error
    }
  }

  /**
   * Get previous set for an exercise (for pre-filling weight)
   *
   * @param {string} exerciseId - Exercise ID
   * @returns {Object|null} Last set or null
   */
  function getPreviousSet(exerciseId) {
    if (!activeWorkout.value?.exercises) return null

    const exercise = activeWorkout.value.exercises.find((ex) => ex.exerciseId === exerciseId)

    if (!exercise?.sets || exercise.sets.length === 0) {
      return null
    }

    // Return last set
    return exercise.sets[exercise.sets.length - 1]
  }

  return {
    // State
    activeWorkout,
    hasActiveWorkout,
    totalSets,
    totalVolume,

    // Timer
    elapsed: timer.elapsed,
    formattedTime: timer.formattedTime,
    isTimerRunning: timer.isRunning,

    // Actions
    startWorkout,
    addExercise,
    addSet,
    deleteSet,
    finishWorkout,
    cancelWorkout,
    recoverFromBackup,
    getPreviousSet,
  }
}
