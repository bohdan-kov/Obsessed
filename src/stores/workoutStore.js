import { ref, computed, readonly } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { normalizeDate } from '@/utils/dateUtils'
import { CONFIG } from '@/constants/config'
import {
  fetchCollection,
  fetchDocument,
  createDocument,
  updateDocument,
  subscribeToCollection,
  serverTimestamp,
  Timestamp,
} from '@/firebase/firestore'
import { validateSetData } from '@/utils/setValidation'
import {
  createMockActiveWorkout as createMockActiveWorkoutData,
  generateMockWorkouts,
} from '@/utils/onboardingMockData'

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

  // Smart loading state
  const dataState = ref({
    status: 'idle', // 'idle' | 'loading' | 'loaded' | 'error'
    period: null,
    lastFetched: null,
    isSubscribed: false,
  })

  // Real-time listener cleanup
  let unsubscribeActive = null
  let unsubscribeWorkouts = null

  // Request coalescing
  let pendingRequest = null
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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
        const dateA = normalizeDate(a.completedAt)
        const dateB = normalizeDate(b.completedAt)
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

  /**
   * Get total count of exercises in active workout
   */
  const exerciseCount = computed(() => {
    return activeWorkout.value?.exercises?.length || 0
  })

  // Actions
  /**
   * Start a new workout
   * @param {Object} [templateData] - Optional template data to pre-populate workout
   * @param {string} [templateData.templateId] - Schedule template ID
   * @param {string} [templateData.templateName] - Template name
   * @param {Array} [templateData.exercises] - Pre-populated exercises from template
   * @returns {Promise<string>} Workout ID
   * @throws {Error} If user not authenticated or active workout exists
   */
  async function startWorkout(templateData = null) {
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

      // If starting from a schedule template, add template metadata and exercises
      if (templateData) {
        workoutData.sourceTemplateId = templateData.templateId
        workoutData.sourceTemplateName = templateData.templateName

        // Pre-populate exercises from template with empty sets arrays
        if (templateData.exercises && templateData.exercises.length > 0) {
          workoutData.exercises = templateData.exercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            sets: [],
            order: index,
            templateSuggestions: {
              suggestedSets: ex.sets || null,
              suggestedReps: ex.reps || null,
              suggestedRestTime: ex.restTime || null,
            },
          }))
        }
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
        console.error('[workoutStore] Error starting workout:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Start a workout from a plan template
   * Creates a new workout and pre-populates it with exercises from the plan
   * @param {string} planId - Plan ID
   * @returns {Promise<string>} Workout ID
   * @throws {Error} If plan not found or active workout exists
   */
  async function startWorkoutFromPlan(planId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to start workout from plan')
    }

    if (hasActiveWorkout.value) {
      throw new Error('Cannot start a new workout while one is active')
    }

    loading.value = true
    error.value = null

    try {
      // Import planStore dynamically to avoid circular dependency
      const { usePlanStore } = await import('./planStore')
      const planStore = usePlanStore()

      const plan = planStore.getPlanById(planId)
      if (!plan) {
        throw new Error('Plan not found')
      }

      // Start the workout first
      const workoutId = await startWorkout()

      // Add exercises from plan with suggestions
      const workoutPath = `users/${authStore.uid}/workouts`
      const exercises = plan.exercises.map((planEx, index) => ({
        exerciseId: planEx.exerciseId,
        exerciseName: planEx.exerciseName,
        sets: [],
        order: index,
        planSuggestions: {
          suggestedSets: planEx.suggestedSets || null,
          suggestedWeight: planEx.suggestedWeight || null, // Already in kg from plan
          suggestedReps: planEx.suggestedReps || null,
          notes: planEx.notes || null,
        },
      }))

      // Update workout with exercises and source plan reference
      await updateDocument(workoutPath, workoutId, {
        exercises,
        sourcePlanId: planId,
        lastSavedAt: serverTimestamp(),
      })

      // Update local state
      if (currentWorkout.value) {
        currentWorkout.value.exercises = exercises
        currentWorkout.value.sourcePlanId = planId
      }

      // Record plan usage
      await planStore.recordPlanUsage(planId)

      return workoutId
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[workoutStore] Error starting workout from plan:', err)
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
        console.error('[workoutStore] Error adding exercise:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if an exercise can be deleted
   * @param {string} exerciseId - Exercise ID to check
   * @returns {boolean} True if exercise can be deleted
   */
  function canDeleteExercise(exerciseId) {
    if (!activeWorkout.value) return false

    // Cannot delete the last exercise
    return exerciseCount.value > 1
  }

  /**
   * Add set to exercise in current workout
   * @param {string} exerciseId - Exercise ID
   * @param {Object} setData - Set data
   * @param {number} setData.weight - Weight in kg (already converted by component)
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

    // Validate set data
    const validation = validateSetData({
      weight, // Already in kg (storage unit)
      reps,
      rpe,
    })

    if (!validation.valid) {
      if (import.meta.env.DEV) {
        console.error('[WorkoutStore] Invalid set data:', validation.errors)
      }
      throw new Error('Invalid set data')
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

      // Weight is already in kg (converted by component before calling this action)
      // All weights are stored in kg in Firestore for consistency

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
        console.error('[workoutStore] Error adding set:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete exercise from active workout
   * @param {string} exerciseId - Exercise ID to delete
   * @returns {Promise<void>}
   * @throws {Error} If no active workout, exercise not found, or cannot delete last exercise
   */
  async function deleteExercise(exerciseId) {
    if (!activeWorkout.value) {
      throw new Error('No active workout')
    }

    const exerciseIndex = activeWorkout.value.exercises.findIndex(
      (ex) => ex.exerciseId === exerciseId
    )

    if (exerciseIndex === -1) {
      throw new Error('Exercise not found in current workout')
    }

    if (!canDeleteExercise(exerciseId)) {
      throw new Error('Cannot delete the last exercise')
    }

    loading.value = true
    error.value = null

    // Store original state for rollback
    const originalExercises = [...activeWorkout.value.exercises]
    const originalVolume = activeWorkout.value.totalVolume
    const originalSets = activeWorkout.value.totalSets

    try {
      // Optimistic update
      const updatedExercises = activeWorkout.value.exercises.filter(
        (ex) => ex.exerciseId !== exerciseId
      )

      // Reorder remaining exercises
      updatedExercises.forEach((ex, index) => {
        ex.order = index
      })

      // Recalculate total volume
      const totalVolume = updatedExercises.reduce((total, exercise) => {
        return (
          total +
          exercise.sets.reduce((exTotal, set) => {
            return exTotal + set.weight * set.reps
          }, 0)
        )
      }, 0)

      // Recalculate total sets
      const totalSets = updatedExercises.reduce((total, exercise) => {
        return total + exercise.sets.length
      }, 0)

      // Update Firestore
      const workoutPath = `users/${authStore.uid}/workouts`
      await updateDocument(workoutPath, activeWorkout.value.id, {
        exercises: updatedExercises,
        totalVolume,
        totalSets,
        lastSavedAt: serverTimestamp(),
      })

      // Update local state
      if (currentWorkout.value) {
        currentWorkout.value.exercises = updatedExercises
        currentWorkout.value.totalVolume = totalVolume
        currentWorkout.value.totalSets = totalSets
      }
    } catch (err) {
      // Rollback on error
      if (currentWorkout.value) {
        currentWorkout.value.exercises = originalExercises
        currentWorkout.value.totalVolume = originalVolume
        currentWorkout.value.totalSets = originalSets
      }

      if (import.meta.env.DEV) {
        console.error('[workoutStore] Error deleting exercise:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Duplicate exercise in active workout
   * @param {string} exerciseId - Exercise ID to duplicate
   * @returns {Promise<void>}
   * @throws {Error} If no active workout or exercise not found
   */
  async function duplicateExercise(exerciseId) {
    if (!activeWorkout.value) {
      throw new Error('No active workout')
    }

    const exerciseIndex = activeWorkout.value.exercises.findIndex(
      (ex) => ex.exerciseId === exerciseId
    )

    if (exerciseIndex === -1) {
      throw new Error('Exercise not found in current workout')
    }

    loading.value = true
    error.value = null

    try {
      const originalExercise = activeWorkout.value.exercises[exerciseIndex]

      // Create duplicate with empty sets
      const duplicatedExercise = {
        exerciseId: originalExercise.exerciseId,
        exerciseName: originalExercise.exerciseName,
        sets: [], // Empty sets array
        order: originalExercise.order + 1,
        notes: '',
        status: 'pending',
      }

      // Insert duplicate after original
      const updatedExercises = [...activeWorkout.value.exercises]
      updatedExercises.splice(exerciseIndex + 1, 0, duplicatedExercise)

      // Reorder subsequent exercises
      updatedExercises.forEach((ex, index) => {
        ex.order = index
      })

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
        console.error('[workoutStore] Error duplicating exercise:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Calculate total volume from exercises array
   * @param {Array} exercises - Array of exercises
   * @returns {number} Total volume in kg
   */
  function calculateTotalVolume(exercises) {
    return exercises.reduce((total, exercise) => {
      return (
        total +
        exercise.sets.reduce((exTotal, set) => {
          return exTotal + set.weight * set.reps
        }, 0)
      )
    }, 0)
  }

  /**
   * Delete multiple exercises in a single Firestore write
   * @param {string[]} exerciseIds - Array of exercise IDs to delete
   * @returns {Promise<void>}
   * @throws {Error} If would delete all exercises
   */
  async function deleteExercises(exerciseIds) {
    if (!activeWorkout.value) {
      throw new Error('No active workout')
    }

    // CRITICAL VALIDATION: Cannot delete all exercises
    const remainingCount = activeWorkout.value.exercises.length - exerciseIds.length
    if (remainingCount < 1) {
      throw new Error('Cannot delete all exercises')
    }

    loading.value = true
    error.value = null

    // Store original state for rollback
    const originalExercises = [...activeWorkout.value.exercises]
    const originalVolume = activeWorkout.value.totalVolume
    const originalSets = activeWorkout.value.totalSets

    try {
      // Filter out exercises from activeWorkout.value.exercises
      const updatedExercises = activeWorkout.value.exercises.filter(
        (ex) => !exerciseIds.includes(ex.exerciseId)
      )

      // Recalculate order values for remaining exercises
      updatedExercises.forEach((ex, index) => {
        ex.order = index
      })

      // Calculate new totalVolume and totalSets
      const newTotalVolume = calculateTotalVolume(updatedExercises)
      const newTotalSets = updatedExercises.reduce(
        (sum, ex) => sum + ex.sets.length,
        0
      )

      // Optimistic update
      activeWorkout.value.exercises = updatedExercises
      activeWorkout.value.totalVolume = newTotalVolume
      activeWorkout.value.totalSets = newTotalSets

      if (currentWorkout.value) {
        currentWorkout.value.exercises = updatedExercises
        currentWorkout.value.totalVolume = newTotalVolume
        currentWorkout.value.totalSets = newTotalSets
      }

      // Single Firestore write
      const workoutPath = `users/${authStore.uid}/workouts`
      await updateDocument(workoutPath, activeWorkout.value.id, {
        exercises: updatedExercises,
        totalVolume: newTotalVolume,
        totalSets: newTotalSets,
        lastSavedAt: serverTimestamp(),
      })
    } catch (err) {
      // Rollback on error
      activeWorkout.value.exercises = originalExercises
      activeWorkout.value.totalVolume = originalVolume
      activeWorkout.value.totalSets = originalSets

      if (currentWorkout.value) {
        currentWorkout.value.exercises = originalExercises
        currentWorkout.value.totalVolume = originalVolume
        currentWorkout.value.totalSets = originalSets
      }

      if (import.meta.env.DEV) {
        console.error('[workoutStore] Error deleting exercises:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Duplicate multiple exercises in a single Firestore write
   * @param {string[]} exerciseIds - Array of exercise IDs to duplicate
   * @returns {Promise<void>}
   */
  async function duplicateExercises(exerciseIds) {
    if (!activeWorkout.value) {
      throw new Error('No active workout')
    }

    loading.value = true
    error.value = null

    // Store original state for rollback
    const originalExercises = [...activeWorkout.value.exercises]

    try {
      const newExercises = []

      // Create duplicates and insert after originals
      activeWorkout.value.exercises.forEach((exercise) => {
        newExercises.push(exercise)

        if (exerciseIds.includes(exercise.exerciseId)) {
          // Create duplicate with only defined fields to avoid Firestore errors
          // Firestore's updateDoc() does not accept undefined values
          const duplicate = {
            exerciseId: `${exercise.exerciseId}_${Date.now()}_${Math.random().toString(CONFIG.firebase.ID_RANDOM_BASE).substring(CONFIG.firebase.ID_RANDOM_SUBSTRING_START, CONFIG.firebase.ID_RANDOM_SUBSTRING_START + CONFIG.firebase.ID_RANDOM_STRING_LENGTH)}`,
            exerciseName: exercise.exerciseName,
            sets: [], // Empty sets (template pattern)
            notes: '',
            status: 'pending',
            order: 0, // Will be recalculated below
          }

          // Only add optional fields if they exist on the original exercise
          if (exercise.exerciseType) {
            duplicate.exerciseType = exercise.exerciseType
          }
          if (exercise.muscleGroups) {
            duplicate.muscleGroups = exercise.muscleGroups
          }

          newExercises.push(duplicate)
        }
      })

      // Recalculate order values
      newExercises.forEach((ex, index) => {
        ex.order = index
      })

      // Optimistic update
      activeWorkout.value.exercises = newExercises
      if (currentWorkout.value) {
        currentWorkout.value.exercises = newExercises
      }

      // Single Firestore write
      const workoutPath = `users/${authStore.uid}/workouts`
      await updateDocument(workoutPath, activeWorkout.value.id, {
        exercises: newExercises,
        lastSavedAt: serverTimestamp(),
      })
    } catch (err) {
      // Rollback on error
      activeWorkout.value.exercises = originalExercises
      if (currentWorkout.value) {
        currentWorkout.value.exercises = originalExercises
      }

      if (import.meta.env.DEV) {
        console.error('[workoutStore] Error duplicating exercises:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update exercise in active workout (generic helper)
   * @param {string} exerciseId - Exercise ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   * @throws {Error} If no active workout or exercise not found
   */
  async function updateExercise(exerciseId, updates) {
    if (!activeWorkout.value) {
      throw new Error('No active workout')
    }

    const exerciseIndex = activeWorkout.value.exercises.findIndex(
      (ex) => ex.exerciseId === exerciseId
    )

    if (exerciseIndex === -1) {
      throw new Error('Exercise not found in current workout')
    }

    loading.value = true
    error.value = null

    try {
      const updatedExercises = [...activeWorkout.value.exercises]
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        ...updates,
      }

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
        console.error('[workoutStore] Error updating exercise:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update exercise notes
   * @param {string} exerciseId - Exercise ID
   * @param {string} notes - Notes text
   * @returns {Promise<void>}
   */
  async function updateExerciseNotes(exerciseId, notes) {
    return updateExercise(exerciseId, { notes })
  }

  /**
   * Update exercise status
   * @param {string} exerciseId - Exercise ID
   * @param {string} status - Status ('pending' | 'completed')
   * @returns {Promise<void>}
   */
  async function updateExerciseStatus(exerciseId, status) {
    return updateExercise(exerciseId, { status })
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
      const workoutId = activeWorkout.value.id

      // Store sourceTemplateId before update (in case listener clears activeWorkout)
      const sourceTemplateId = activeWorkout.value?.sourceTemplateId

      await updateDocument(workoutPath, workoutId, {
        status: 'completed',
        completedAt: Timestamp.fromDate(completedDate), // ✅ FIX: Use Timestamp.fromDate for proper Firebase serialization
        duration: validDuration,
      })

      // If workout was started from a schedule template, sync completion with schedule
      if (sourceTemplateId) {
        try {
          // Import scheduleStore dynamically to avoid circular dependency
          const { useScheduleStore } = await import('./scheduleStore')
          const scheduleStore = useScheduleStore()

          // Get week ID for the completion date
          const weekId = scheduleStore.getWeekId(completedDate)

          // Get day name (e.g., 'monday', 'tuesday', etc.)
          const dayName = completedDate
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toLowerCase()

          // Mark the scheduled day as completed
          await scheduleStore.markDayCompleted(weekId, dayName, workoutId)
        } catch (scheduleErr) {
          // Schedule sync is non-critical - log error but don't fail workout completion
          if (import.meta.env.DEV) {
            console.warn(
              '[workoutStore] Failed to sync workout with schedule:',
              scheduleErr
            )
          }
        }
      }

      currentWorkout.value = null

      // Cleanup active workout listener
      if (unsubscribeActive) {
        unsubscribeActive()
        unsubscribeActive = null
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[workoutStore] Error finishing workout:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch workouts for a specific period
   * @param {'week'|'month'|'quarter'|'year'|'all'} period - Time period
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
      let startDate = null

      switch (period) {
        case 'week':
          startDate = new Date()
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate = new Date()
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate = new Date()
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate = new Date()
          startDate.setFullYear(now.getFullYear() - 1)
          break
        case 'all':
          // No date filter - fetch all workouts
          startDate = null
          break
      }

      const workoutPath = `users/${authStore.uid}/workouts`
      const fetchOptions = {
        orderBy: [['startedAt', 'desc']],
      }

      // Only add date filter if startDate is set
      if (startDate !== null) {
        fetchOptions.where = [['startedAt', '>=', startDate]]
      }

      const fetchedWorkouts = await fetchCollection(workoutPath, fetchOptions)

      workouts.value = fetchedWorkouts
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[workoutStore] Error fetching workouts:', err)
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
          console.error('[workoutStore] Error in active workout subscription:', err)
        }
        error.value = err.message
      }
    )

    return unsubscribeActive
  }

  /**
   * Subscribe to all workouts real-time updates
   * @param {'week'|'month'|'quarter'|'year'|'all'} period - Time period
   * @returns {Function|null} Unsubscribe function
   */
  function subscribeToWorkouts(period = 'month') {
    if (!authStore.uid) return null

    // Cleanup existing subscription
    if (unsubscribeWorkouts) {
      unsubscribeWorkouts()
    }

    const now = new Date()
    let startDate = null

    switch (period) {
      case 'week':
        startDate = new Date()
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date()
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate = new Date()
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate = new Date()
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        // No date filter - subscribe to all workouts
        startDate = null
        break
    }

    const workoutPath = `users/${authStore.uid}/workouts`

    const subscribeOptions = {
      orderBy: [['startedAt', 'desc']],
    }

    // Only add date filter if startDate is set
    if (startDate !== null) {
      subscribeOptions.where = [['startedAt', '>=', startDate]]
    }

    unsubscribeWorkouts = subscribeToCollection(
      workoutPath,
      subscribeOptions,
      (fetchedWorkouts) => {
        workouts.value = fetchedWorkouts
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error('[workoutStore] Error in workouts subscription:', err)
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

  /**
   * Check if cached data is stale
   * @param {number|null} lastFetched - Timestamp of last fetch
   * @returns {boolean} True if data is stale
   */
  function isStale(lastFetched) {
    if (!lastFetched) return true
    return Date.now() - lastFetched > CACHE_TTL
  }

  /**
   * Smart data loading with caching, request coalescing, and subscription management
   * @param {Object} options - Loading options
   * @param {'week'|'month'|'quarter'|'year'|'all'} options.period - Time period to load
   * @param {boolean} options.subscribe - Whether to subscribe to real-time updates
   * @param {boolean} options.force - Force reload even if data is fresh
   * @returns {Promise<void>}
   * @throws {Error} If user not authenticated
   */
  async function ensureDataLoaded(options = {}) {
    const { period = 'month', subscribe = true, force = false } = options

    // Check authentication
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    // Check if fetch is needed
    const needsFetch =
      force ||
      dataState.value.status === 'idle' ||
      dataState.value.status === 'error' ||
      dataState.value.period !== period ||
      isStale(dataState.value.lastFetched)

    if (!needsFetch && dataState.value.status === 'loaded') {
      return // Data already fresh
    }

    // Request coalescing - if there's already a pending request with same period, return it
    if (pendingRequest && dataState.value.period === period) {
      return pendingRequest
    }

    // Execute fetch
    dataState.value.status = 'loading'
    dataState.value.period = period

    const request = (async () => {
      try {
        await fetchWorkouts(period)

        if (subscribe) {
          if (unsubscribeWorkouts) unsubscribeWorkouts()
          unsubscribeWorkouts = subscribeToWorkouts(period)
          dataState.value.isSubscribed = true
        }

        dataState.value.status = 'loaded'
        dataState.value.lastFetched = Date.now()
      } catch (err) {
        dataState.value.status = 'error'
        throw err
      } finally {
        pendingRequest = null
      }
    })()

    pendingRequest = request
    return request
  }

  /**
   * Fetch a single workout by ID
   * @param {string} workoutId - Workout ID to fetch
   * @returns {Promise<Workout>} Workout object
   * @throws {Error} If workout not found or fetch fails
   */
  async function fetchWorkout(workoutId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    // Check if workout already exists in store
    const existingWorkout = workouts.value.find((w) => w.id === workoutId)
    if (existingWorkout) {
      return existingWorkout
    }

    loading.value = true
    error.value = null

    try {
      const workoutPath = `users/${authStore.uid}/workouts`
      const workout = await fetchDocument(workoutPath, workoutId)

      if (!workout) {
        throw new Error('Workout not found')
      }

      // Add to workouts array (cache it)
      workouts.value.push(workout)

      return workout
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[workoutStore] Error fetching workout:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create mock active workout for onboarding (step 2)
   * Shows user how to log sets and complete workout
   * Demonstrates a realistic in-progress chest workout
   */
  function createMockActiveWorkout() {
    const mockActiveWorkout = createMockActiveWorkoutData(authStore.uid)

    // Set as current workout
    currentWorkout.value = mockActiveWorkout

    // Also add to workouts array so it shows in active state
    const existingIndex = workouts.value.findIndex(w => w.id === 'mock-active')
    if (existingIndex >= 0) {
      workouts.value[existingIndex] = mockActiveWorkout
    } else {
      workouts.value.unshift(mockActiveWorkout)
    }

    if (import.meta.env.DEV) {
      console.log('[workoutStore] Created mock active workout for onboarding')
    }
  }

  /**
   * Load mock workout data for onboarding
   * Generates realistic sample workouts to demonstrate app features
   * Covers all muscle groups: chest, back, legs, shoulders, biceps, triceps, core, calves
   */
  function loadMockWorkoutsForOnboarding() {
    const mockWorkouts = generateMockWorkouts(authStore.uid)

    // Load mock data into store
    workouts.value = mockWorkouts
    dataState.value = {
      status: 'loaded',
      period: 'month',
      lastFetched: Date.now(),
      isSubscribed: false,
    }
  }

  /**
   * Clear all workout data and unsubscribe from real-time updates
   * Should be called on logout
   */
  function clearData() {
    if (unsubscribeWorkouts) {
      unsubscribeWorkouts()
      unsubscribeWorkouts = null
    }
    if (unsubscribeActive) {
      unsubscribeActive()
      unsubscribeActive = null
    }
    workouts.value = []
    currentWorkout.value = null
    dataState.value = {
      status: 'idle',
      period: null,
      lastFetched: null,
      isSubscribed: false,
    }
    pendingRequest = null
  }

  return {
    // State - return refs directly
    currentWorkout,
    workouts,
    loading,
    error,
    dataState: readonly(dataState),

    // Getters - keep as computeds
    todaysWorkout,
    activeWorkout,
    completedWorkouts,
    recentWorkouts,
    hasActiveWorkout,
    exerciseCount,

    // Actions
    startWorkout,
    startWorkoutFromPlan,
    addExercise,
    addSet,
    deleteExercise,
    duplicateExercise,
    deleteExercises,
    duplicateExercises,
    updateExercise,
    updateExerciseNotes,
    updateExerciseStatus,
    finishWorkout,
    updateWorkout,
    fetchWorkouts,
    fetchWorkout,
    subscribeToActive,
    subscribeToWorkouts,
    unsubscribe,
    clearError,
    ensureDataLoaded,
    clearData,
    loadMockWorkoutsForOnboarding,
    createMockActiveWorkout,

    // Helpers
    canDeleteExercise,
  }
})
