import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import {
  fetchCollection,
  createDocument,
  updateDocument,
  subscribeToCollection,
  serverTimestamp,
} from '@/firebase/firestore'

/**
 * @typedef {Object} WorkoutSet
 * @property {number} weight - Weight in kg or lbs
 * @property {number} reps - Number of repetitions
 * @property {number} [rpe] - Rate of Perceived Exertion (1-10)
 * @property {string} type - 'normal' | 'warmup' | 'dropset' | 'superset'
 * @property {Date} completedAt - Timestamp when set was completed
 */

/**
 * @typedef {Object} WorkoutExercise
 * @property {string} exerciseId - Reference to exercise
 * @property {string} exerciseName - Exercise name (denormalized)
 * @property {WorkoutSet[]} sets - Array of sets
 * @property {number} order - Order in workout
 * @property {string} [notes] - Exercise notes
 */

/**
 * @typedef {Object} Workout
 * @property {string} id - Workout ID
 * @property {string} userId - User ID
 * @property {string} status - 'active' | 'completed' | 'cancelled'
 * @property {Date} startedAt - When workout started
 * @property {Date} [completedAt] - When workout finished
 * @property {WorkoutExercise[]} exercises - Exercises in workout
 * @property {number} duration - Duration in seconds
 * @property {number} totalVolume - Total weight × reps
 * @property {string} [notes] - Workout notes
 */

export const useWorkoutStore = defineStore('workout', () => {
  const authStore = useAuthStore()

  // State
  const currentWorkout = ref(null)
  const workouts = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Real-time listener cleanup
  let unsubscribeActive = null
  let unsubscribeWorkouts = null

  // Getters
  /**
   * Get today's workout (completed or active)
   */
  const todaysWorkout = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return workouts.value.find((workout) => {
      const workoutDate = workout.startedAt?.toDate
        ? workout.startedAt.toDate()
        : new Date(workout.startedAt)
      workoutDate.setHours(0, 0, 0, 0)
      return workoutDate.getTime() === today.getTime()
    })
  })

  /**
   * Get active workout (status = 'active')
   */
  const activeWorkout = computed(() => {
    return workouts.value.find((w) => w.status === 'active') || currentWorkout.value
  })

  /**
   * Get all completed workouts (sorted by completion date descending)
   */
  const completedWorkouts = computed(() => {
    return workouts.value
      .filter((w) => w.status === 'completed')
      .sort((a, b) => {
        const dateA = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt)
        const dateB = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt)
        return dateB - dateA
      })
  })

  /**
   * Get recent workouts (last 10 completed)
   */
  const recentWorkouts = computed(() => {
    return completedWorkouts.value.slice(0, 10)
  })

  /**
   * Check if there's an active workout
   */
  const hasActiveWorkout = computed(() => !!activeWorkout.value)

  // Actions
  /**
   * Start a new workout
   * @returns {Promise<string>} Workout ID
   * @throws {Error} If user not authenticated or active workout exists
   */
  async function startWorkout() {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to start workout')
    }

    if (hasActiveWorkout.value) {
      throw new Error('Cannot start a new workout while one is active')
    }

    loading.value = true
    error.value = null

    try {
      const workoutData = {
        userId: authStore.uid,
        status: 'active',
        startedAt: serverTimestamp(),
        lastSavedAt: serverTimestamp(),
        exercises: [],
        duration: 0,
        totalVolume: 0,
        totalSets: 0,
      }

      const workoutPath = `users/${authStore.uid}/workouts`
      const workoutId = await createDocument(workoutPath, workoutData)

      currentWorkout.value = {
        id: workoutId,
        ...workoutData,
        startedAt: new Date(),
      }

      // Start real-time listener for active workout
      subscribeToActive()

      return workoutId
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error starting workout:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Add exercise to current workout
   * @param {string} exerciseId - Exercise ID
   * @param {string} exerciseName - Exercise name
   * @returns {Promise<void>}
   * @throws {Error} If no active workout
   */
  async function addExercise(exerciseId, exerciseName) {
    if (!activeWorkout.value) {
      throw new Error('No active workout')
    }

    loading.value = true
    error.value = null

    try {
      const exercise = {
        exerciseId,
        exerciseName,
        sets: [],
        order: activeWorkout.value.exercises.length,
      }

      const updatedExercises = [...activeWorkout.value.exercises, exercise]

      const workoutPath = `users/${authStore.uid}/workouts`
      await updateDocument(workoutPath, activeWorkout.value.id, {
        exercises: updatedExercises,
        lastSavedAt: serverTimestamp(),
      })

      // Update local state
      if (currentWorkout.value) {
        currentWorkout.value.exercises = updatedExercises
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error adding exercise:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Add set to exercise in current workout
   * @param {string} exerciseId - Exercise ID
   * @param {Object} setData - Set data
   * @param {number} setData.weight - Weight
   * @param {number} setData.reps - Reps
   * @param {number} [setData.rpe] - RPE
   * @param {string} [setData.type='normal'] - Set type
   * @returns {Promise<void>}
   * @throws {Error} If no active workout or exercise not found
   */
  async function addSet(exerciseId, { weight, reps, rpe, type = 'normal' }) {
    if (!activeWorkout.value) {
      throw new Error('No active workout')
    }

    loading.value = true
    error.value = null

    try {
      const exerciseIndex = activeWorkout.value.exercises.findIndex(
        (ex) => ex.exerciseId === exerciseId
      )

      if (exerciseIndex === -1) {
        throw new Error('Exercise not found in current workout')
      }

      const newSet = {
        weight,
        reps,
        rpe: rpe || null,
        type,
        completedAt: new Date().toISOString(), // ✅ FIXED: Use ISO string instead of serverTimestamp()
      }

      const updatedExercises = [...activeWorkout.value.exercises]
      updatedExercises[exerciseIndex].sets.push(newSet)

      // Calculate total volume
      const totalVolume = updatedExercises.reduce((total, exercise) => {
        return (
          total +
          exercise.sets.reduce((exTotal, set) => {
            return exTotal + set.weight * set.reps
          }, 0)
        )
      }, 0)

      // Calculate total sets
      const totalSets = updatedExercises.reduce((total, exercise) => {
        return total + exercise.sets.length
      }, 0)

      const workoutPath = `users/${authStore.uid}/workouts`
      await updateDocument(workoutPath, activeWorkout.value.id, {
        exercises: updatedExercises,
        totalVolume,
        totalSets,
        lastSavedAt: serverTimestamp(), // ✅ OK: Top-level field
      })

      // Update local state
      if (currentWorkout.value) {
        currentWorkout.value.exercises = updatedExercises
        currentWorkout.value.totalVolume = totalVolume
        currentWorkout.value.totalSets = totalSets
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error adding set:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Finish current workout
   * @param {Object} options - Finish options
   * @param {Date|null} options.date - Optional custom completion date (defaults to current date)
   * @returns {Promise<void>}
   * @throws {Error} If no active workout
   */
  async function finishWorkout(options = {}) {
    if (!activeWorkout.value) {
      throw new Error('No active workout to finish')
    }

    loading.value = true
    error.value = null

    try {
      const { date = null } = options

      // Use custom date or current date for completedAt field
      const completedDate = date || new Date()

      const startTime = activeWorkout.value.startedAt?.toDate
        ? activeWorkout.value.startedAt.toDate()
        : new Date(activeWorkout.value.startedAt)

      // Calculate duration based on ACTUAL time elapsed (now - startedAt)
      // This ensures duration is always positive and reflects real workout time
      // completedAt is just for categorization (which day to show in history)
      const now = new Date()
      const duration = Math.max(0, Math.floor((now - startTime) / 1000)) // in seconds, ensure non-negative

      // Validation: Ensure duration is non-negative
      if (duration < 0) {
        // Duration should never be negative - this is a data integrity safeguard
      }

      // Additional safeguard: Ensure duration is a positive integer
      const validDuration = Math.max(0, Math.floor(duration))

      const workoutPath = `users/${authStore.uid}/workouts`
      await updateDocument(workoutPath, activeWorkout.value.id, {
        status: 'completed',
        completedAt: completedDate,
        duration: validDuration,
      })

      currentWorkout.value = null

      // Cleanup active workout listener
      if (unsubscribeActive) {
        unsubscribeActive()
        unsubscribeActive = null
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error finishing workout:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch workouts for a specific period
   * @param {'week'|'month'|'quarter'|'year'} period - Time period
   * @returns {Promise<void>}
   */
  async function fetchWorkouts(period = 'month') {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    loading.value = true
    error.value = null

    try {
      const now = new Date()
      let startDate = new Date()

      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      const workoutPath = `users/${authStore.uid}/workouts`
      const fetchedWorkouts = await fetchCollection(workoutPath, {
        where: [['startedAt', '>=', startDate]],
        orderBy: [['startedAt', 'desc']],
      })

      workouts.value = fetchedWorkouts
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error fetching workouts:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Subscribe to active workout real-time updates
   * @returns {Function|null} Unsubscribe function
   */
  function subscribeToActive() {
    if (!authStore.uid) return null

    // Cleanup existing subscription
    if (unsubscribeActive) {
      unsubscribeActive()
    }

    const workoutPath = `users/${authStore.uid}/workouts`

    unsubscribeActive = subscribeToCollection(
      workoutPath,
      {
        where: [['status', '==', 'active']],
        limit: 1,
      },
      (activeWorkouts) => {
        if (activeWorkouts.length > 0) {
          currentWorkout.value = activeWorkouts[0]
        } else {
          currentWorkout.value = null
        }
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error('Error in active workout subscription:', err)
        }
        error.value = err.message
      }
    )

    return unsubscribeActive
  }

  /**
   * Subscribe to all workouts real-time updates
   * @param {'week'|'month'|'quarter'|'year'} period - Time period
   * @returns {Function|null} Unsubscribe function
   */
  function subscribeToWorkouts(period = 'month') {
    if (!authStore.uid) return null

    // Cleanup existing subscription
    if (unsubscribeWorkouts) {
      unsubscribeWorkouts()
    }

    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const workoutPath = `users/${authStore.uid}/workouts`

    unsubscribeWorkouts = subscribeToCollection(
      workoutPath,
      {
        where: [['startedAt', '>=', startDate]],
        orderBy: [['startedAt', 'desc']],
      },
      (fetchedWorkouts) => {
        workouts.value = fetchedWorkouts
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error('Error in workouts subscription:', err)
        }
        error.value = err.message
      }
    )

    return unsubscribeWorkouts
  }

  /**
   * Cleanup all subscriptions
   */
  function unsubscribe() {
    if (unsubscribeActive) {
      unsubscribeActive()
      unsubscribeActive = null
    }

    if (unsubscribeWorkouts) {
      unsubscribeWorkouts()
      unsubscribeWorkouts = null
    }
  }

  /**
   * Generic workout update helper
   * @param {string} workoutId - Workout ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async function updateWorkout(workoutId, updates) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    const workoutPath = `users/${authStore.uid}/workouts`
    await updateDocument(workoutPath, workoutId, {
      ...updates,
      lastSavedAt: serverTimestamp(),
    })
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null
  }

  return {
    // State - return refs directly
    currentWorkout,
    workouts,
    loading,
    error,

    // Getters - keep as computeds
    todaysWorkout,
    activeWorkout,
    completedWorkouts,
    recentWorkouts,
    hasActiveWorkout,

    // Actions
    startWorkout,
    addExercise,
    addSet,
    finishWorkout,
    updateWorkout,
    fetchWorkouts,
    subscribeToActive,
    subscribeToWorkouts,
    unsubscribe,
    clearError,
  }
})
