import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { useWorkoutStore } from './workoutStore'
import { useAuthStore } from './authStore'
import { useExerciseStore } from './exerciseStore'
import {
  fetchCollection,
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  COLLECTIONS,
} from '@/firebase/firestore'
import {
  calculateStrengthProgress,
  calculateVolumeProgress,
  calculateFrequencyProgress,
  calculateStreakProgress,
} from '@/utils/progressCalculator'
import {
  determineGoalStatus,
  calculateExpectedProgress,
  getPeriodBoundaries,
} from '@/utils/goalUtils'
import { detectMilestones, getMilestoneCelebrationMessage } from '@/utils/milestoneUtils'
import { validateGoal } from '@/utils/goalValidation'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { toast } from 'vue-sonner'

/**
 * @typedef {Object} StrengthGoal
 * @property {string} id - Goal ID
 * @property {string} userId - User ID
 * @property {'strength'} type - Goal type
 * @property {'active'|'completed'|'failed'|'paused'} status - Goal status
 * @property {string} exerciseName - Exercise name
 * @property {number} targetWeight - Target weight in kg
 * @property {string} targetWeightUnit - User's preferred unit
 * @property {number} currentWeight - Initial 1RM in kg
 * @property {string} startDate - ISO date string
 * @property {string} deadline - ISO date string
 * @property {string} [notes] - Optional notes
 * @property {number[]} milestonesReached - Array of reached milestone percentages
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

export const useGoalsStore = defineStore('goals', () => {
  // Dependencies
  const workoutStore = useWorkoutStore()
  const authStore = useAuthStore()
  const exerciseStore = useExerciseStore()
  const { handleError } = useErrorHandler()

  // State
  const goals = ref([])
  const loading = ref(false)
  const error = ref(null)
  let unsubscribe = null

  // ===== Getters (Basic) =====

  const activeGoals = computed(() => goals.value.filter((g) => g.status === 'active'))

  const completedGoals = computed(() => goals.value.filter((g) => g.status === 'completed'))

  const pausedGoals = computed(() => goals.value.filter((g) => g.status === 'paused'))

  const failedGoals = computed(() => goals.value.filter((g) => g.status === 'failed'))

  // ===== Getters (By Type) =====

  const strengthGoals = computed(() => activeGoals.value.filter((g) => g.type === 'strength'))

  const volumeGoals = computed(() => activeGoals.value.filter((g) => g.type === 'volume'))

  const frequencyGoals = computed(() => activeGoals.value.filter((g) => g.type === 'frequency'))

  const streakGoals = computed(() => activeGoals.value.filter((g) => g.type === 'streak'))

  // ===== Computed: Strength Goal Progress =====

  const strengthGoalProgress = computed(() => {
    const workouts = workoutStore.completedWorkouts
    const exerciseMap = exerciseStore.exerciseMap

    return strengthGoals.value.map((goal) => {
      // Calculate current progress
      const progressData = calculateStrengthProgress(goal, workouts, exerciseMap)

      // Calculate expected progress
      const expectedProgress = calculateExpectedProgress(goal)

      // Determine status
      const now = new Date()
      const deadline = new Date(goal.deadline)
      const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

      const status = determineGoalStatus(
        progressData.progressPercent,
        expectedProgress,
        daysRemaining
      )

      return {
        ...goal,
        ...progressData,
        expectedProgress,
        status,
        daysRemaining,
      }
    })
  })

  // ===== Computed: Volume Goal Progress =====

  const volumeGoalProgress = computed(() => {
    const workouts = workoutStore.completedWorkouts
    const exerciseMap = exerciseStore.exerciseMap

    return volumeGoals.value.map((goal) => {
      // Get period boundaries
      const { start: periodStart, end: periodEnd } = getPeriodBoundaries(goal.period, new Date())

      // Calculate current volume
      const progressData = calculateVolumeProgress(goal, workouts, periodStart, periodEnd, exerciseMap)

      // Calculate expected progress
      const now = new Date()
      const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
      const daysPassed = Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24))
      const expectedProgress = (daysPassed / totalDays) * 100

      const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24))

      // Determine status
      let status = 'on-pace'
      if (progressData.progressPercent >= 100) {
        status = 'achieved'
      } else if (progressData.progressPercent > expectedProgress + 5) {
        status = 'ahead'
      } else if (progressData.progressPercent < expectedProgress - 10) {
        status = 'behind'
      }

      return {
        ...goal,
        ...progressData,
        expectedProgress,
        status,
        daysRemaining,
        periodStart,
        periodEnd,
      }
    })
  })

  // ===== Computed: Frequency Goal Progress =====

  const frequencyGoalProgress = computed(() => {
    const workouts = workoutStore.completedWorkouts
    const exerciseMap = exerciseStore.exerciseMap

    return frequencyGoals.value.map((goal) => {
      const { start: periodStart, end: periodEnd } = getPeriodBoundaries(goal.period, new Date())

      const progressData = calculateFrequencyProgress(
        goal,
        workouts,
        periodStart,
        periodEnd,
        exerciseMap
      )

      const now = new Date()
      const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
      const daysPassed = Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24))
      const expectedProgress = (daysPassed / totalDays) * 100

      const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24))

      let status = 'on-pace'
      if (progressData.progressPercent >= 100) {
        status = 'achieved'
      } else if (progressData.progressPercent > expectedProgress + 5) {
        status = 'ahead'
      } else if (progressData.progressPercent < expectedProgress - 10) {
        status = 'behind'
      }

      return {
        ...goal,
        ...progressData,
        expectedProgress,
        status,
        daysRemaining,
        periodStart,
        periodEnd,
      }
    })
  })

  // ===== Computed: Streak Goal Progress =====

  const streakGoalProgress = computed(() => {
    const workouts = workoutStore.completedWorkouts

    return streakGoals.value.map((goal) => {
      const progressData = calculateStreakProgress(goal, workouts)

      const target = goal.streakType === 'daily' ? goal.targetDays : goal.targetWeeks
      const progressPercent = (progressData.currentStreak / target) * 100

      const status = progressPercent >= 100 ? 'completed' : 'active'

      return {
        ...goal,
        ...progressData,
        progressPercent,
        status,
        daysRemaining: target - progressData.currentStreak,
      }
    })
  })

  // ===== Computed: All Goal Progress (Combined) =====

  const allGoalProgress = computed(() => {
    return [
      ...strengthGoalProgress.value,
      ...volumeGoalProgress.value,
      ...frequencyGoalProgress.value,
      ...streakGoalProgress.value,
    ]
  })

  // ===== Computed: Goal Statistics =====

  const goalStats = computed(() => {
    const total = goals.value.length
    const active = activeGoals.value.length
    const completed = completedGoals.value.length

    // Calculate average progress across ALL goals (including active ones)
    // This gives a more meaningful "completion rate" than just counting finished goals
    let completionRate = 0
    if (allGoalProgress.value.length > 0) {
      const totalProgress = allGoalProgress.value.reduce((sum, g) => sum + (g.progressPercent || 0), 0)
      completionRate = totalProgress / allGoalProgress.value.length
    }

    const onTrack = allGoalProgress.value.filter(
      (g) => g.status === 'on-track' || g.status === 'ahead' || g.status === 'achieved'
    ).length

    return {
      total,
      active,
      completed,
      completionRate,
      onTrack,
      atRisk: allGoalProgress.value.filter((g) => g.status === 'at-risk').length,
    }
  })

  // ===== Actions: CRUD Operations =====

  /**
   * Fetch all goals for current user
   */
  async function fetchGoals() {
    if (!authStore.uid) {
      if (import.meta.env.DEV) {
        console.warn('[goalsStore] fetchGoals: No authenticated user')
      }
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await fetchCollection(COLLECTIONS.GOALS, {
        where: [['userId', '==', authStore.uid]],
        orderBy: [['createdAt', 'desc']],
      })

      goals.value = data
    } catch (err) {
      error.value = err.message
      handleError(err, 'Failed to fetch goals', { context: 'fetchGoals' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Subscribe to real-time goal updates
   */
  function subscribeToGoals() {
    if (!authStore.uid) {
      if (import.meta.env.DEV) {
        console.warn('[goalsStore] subscribeToGoals: No authenticated user')
      }
      return
    }

    // Cleanup existing subscription
    if (unsubscribe) {
      unsubscribe()
    }

    unsubscribe = subscribeToCollection(
      COLLECTIONS.GOALS,
      {
        where: [['userId', '==', authStore.uid]],
        orderBy: [['createdAt', 'desc']],
      },
      (data) => {
        goals.value = data
      },
      (err) => {
        error.value = err.message
        handleError(err, 'Goal subscription error', { context: 'subscribeToGoals' })
      }
    )
  }

  /**
   * Create new goal
   * @param {Object} goalData - Goal data (validated before calling)
   * @returns {Promise<string>} - Document ID
   */
  async function createGoal(goalData) {
    if (!authStore.uid) {
      throw new Error('User not authenticated')
    }

    // Validate goal
    const validation = validateGoal(goalData, workoutStore.completedWorkouts)
    if (!validation.valid) {
      throw new Error(`Invalid goal: ${validation.errors.join(', ')}`)
    }

    loading.value = true
    error.value = null

    try {
      const newGoal = {
        ...goalData,
        userId: authStore.uid,
        status: 'active',
        milestonesReached: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const docId = await createDocument(COLLECTIONS.GOALS, newGoal)

      return docId
    } catch (err) {
      error.value = err.message
      handleError(err, 'Failed to create goal', { context: 'createGoal', goalData })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing goal
   * @param {string} goalId
   * @param {Object} updates
   */
  async function updateGoal(goalId, updates) {
    // CRITICAL: Check authentication before attempting update
    if (!authStore.uid) {
      if (import.meta.env.DEV) {
        console.warn('[goalsStore] updateGoal: No authenticated user')
      }
      return
    }

    // Find the goal to ensure we have the userId
    const goal = goals.value.find((g) => g.id === goalId)
    if (!goal) {
      if (import.meta.env.DEV) {
        console.warn('[goalsStore] updateGoal: Goal not found', goalId)
      }
      return
    }

    // Validate ownership
    if (goal.userId !== authStore.uid) {
      const err = new Error('Cannot update goal: permission denied')
      handleError(err, 'Permission denied', { context: 'updateGoal', goalId })
      throw err
    }

    loading.value = true
    error.value = null

    try {
      // CRITICAL: Include userId in updates to satisfy Firestore validation rules
      // The Firestore rules require that request.resource.data.userId == request.auth.uid
      await updateDocument(COLLECTIONS.GOALS, goalId, {
        ...updates,
        userId: authStore.uid, // Ensure userId is always included
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      error.value = err.message
      handleError(err, 'Failed to update goal', { context: 'updateGoal', goalId, updates })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete goal
   * @param {string} goalId
   */
  async function deleteGoal(goalId) {
    loading.value = true
    error.value = null

    try {
      await deleteDocument(COLLECTIONS.GOALS, goalId)
    } catch (err) {
      error.value = err.message
      handleError(err, 'Failed to delete goal', { context: 'deleteGoal', goalId })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete goal (mark as completed)
   * @param {string} goalId
   */
  async function completeGoal(goalId) {
    await updateGoal(goalId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
  }

  /**
   * Pause goal
   * @param {string} goalId
   */
  async function pauseGoal(goalId) {
    await updateGoal(goalId, { status: 'paused' })
  }

  /**
   * Resume paused goal
   * @param {string} goalId
   */
  async function resumeGoal(goalId) {
    await updateGoal(goalId, { status: 'active' })
  }

  /**
   * Fail goal (deadline passed without completion)
   * @param {string} goalId
   */
  async function failGoal(goalId) {
    await updateGoal(goalId, {
      status: 'failed',
      failedAt: new Date().toISOString(),
    })
  }

  // ===== Actions: Progress Management =====

  /**
   * Check all active goals for milestone achievements
   * Called after workout is added
   */
  function checkMilestones() {
    // CRITICAL: Don't attempt to update goals if user is not authenticated
    if (!authStore.uid) {
      if (import.meta.env.DEV) {
        console.warn('[goalsStore] checkMilestones: No authenticated user')
      }
      return
    }

    allGoalProgress.value.forEach((goal) => {
      // Detect newly reached milestones
      const newMilestones = detectMilestones(goal.progressPercent, goal.milestonesReached || [])

      if (newMilestones.length > 0) {
        // Update goal with new milestones
        updateGoal(goal.id, {
          milestonesReached: [...(goal.milestonesReached || []), ...newMilestones],
        })

        // Show celebration notification for each new milestone
        newMilestones.forEach((milestone) => {
          const rawGoal = goals.value.find((g) => g.id === goal.id)
          const message = getMilestoneCelebrationMessage(milestone, rawGoal || goal)

          // Show toast notification with celebration
          toast.success(message, {
            description: milestone === 100 ? 'Congratulations!' : `${milestone}% of the way there!`,
            duration: milestone === 100 ? 6000 : 4000, // Longer duration for completion
          })

          if (import.meta.env.DEV) {
            console.log(`🎉 Milestone reached for goal ${goal.id}: ${milestone}%`)
          }
        })
      }
    })
  }

  /**
   * Check for automatic goal completions
   * Called after workout is added
   */
  function checkAutoCompletions() {
    // CRITICAL: Don't attempt to update goals if user is not authenticated
    if (!authStore.uid) {
      if (import.meta.env.DEV) {
        console.warn('[goalsStore] checkAutoCompletions: No authenticated user')
      }
      return
    }

    // CRITICAL: Check against raw goals.value status (Firestore state), not computed progress status
    // The computed progress includes dynamic status like 'ahead', 'behind', etc.
    // We need to check the actual Firestore status which is 'active', 'completed', 'paused', 'failed'

    // Auto-complete strength goals at 100%
    strengthGoalProgress.value.forEach((progressGoal) => {
      // Find the raw goal from Firestore
      const rawGoal = goals.value.find((g) => g.id === progressGoal.id)

      if (rawGoal && progressGoal.progressPercent >= 100 && rawGoal.status === 'active') {
        if (import.meta.env.DEV) {
          console.log(`[Goals] Auto-completing strength goal: ${progressGoal.exerciseName} - ${progressGoal.progressPercent}%`)
        }
        completeGoal(progressGoal.id)
      }
    })

    // Auto-complete volume goals at 100%
    volumeGoalProgress.value.forEach((progressGoal) => {
      const rawGoal = goals.value.find((g) => g.id === progressGoal.id)

      if (rawGoal && progressGoal.progressPercent >= 100 && rawGoal.status === 'active') {
        if (import.meta.env.DEV) {
          console.log(`[Goals] Auto-completing volume goal: ${progressGoal.exerciseName || 'Volume goal'} - ${progressGoal.progressPercent}%`)
        }
        completeGoal(progressGoal.id)
      }
    })

    // Auto-complete frequency goals at 100%
    frequencyGoalProgress.value.forEach((progressGoal) => {
      const rawGoal = goals.value.find((g) => g.id === progressGoal.id)

      if (rawGoal && progressGoal.progressPercent >= 100 && rawGoal.status === 'active') {
        if (import.meta.env.DEV) {
          console.log(`[Goals] Auto-completing frequency goal: ${progressGoal.exerciseName || 'Frequency goal'} - ${progressGoal.progressPercent}%`)
        }
        completeGoal(progressGoal.id)
      }
    })

    // Auto-complete streak goals at 100%
    streakGoalProgress.value.forEach((progressGoal) => {
      const rawGoal = goals.value.find((g) => g.id === progressGoal.id)

      if (rawGoal && progressGoal.progressPercent >= 100 && rawGoal.status === 'active') {
        if (import.meta.env.DEV) {
          console.log(`[Goals] Auto-completing streak goal - ${progressGoal.progressPercent}%`)
        }
        completeGoal(progressGoal.id)
      }
    })

    // Check for deadline expirations
    allGoalProgress.value.forEach((progressGoal) => {
      const rawGoal = goals.value.find((g) => g.id === progressGoal.id)

      if (rawGoal && rawGoal.status === 'active' && progressGoal.deadline) {
        const now = new Date()
        const deadline = new Date(progressGoal.deadline)

        if (now > deadline && progressGoal.progressPercent < 100) {
          if (import.meta.env.DEV) {
            console.log(`[Goals] Auto-failing goal: ${progressGoal.id} - deadline passed`)
          }
          failGoal(progressGoal.id)
        }
      }
    })
  }

  /**
   * Update all goal progress
   * Called when workouts change
   */
  function updateAllGoalProgress() {
    checkMilestones()
    checkAutoCompletions()
  }

  // ===== Watchers =====

  /**
   * Watch for new workouts and auto-update goal progress
   * CRITICAL: Only update goals if user is authenticated
   */
  watch(
    () => workoutStore.workouts.length,
    (newLength, oldLength) => {
      // CRITICAL: Don't update goals if user is not authenticated
      if (!authStore.uid) {
        if (import.meta.env.DEV) {
          console.warn('[goalsStore] Workout watcher: No authenticated user, skipping goal update')
        }
        return
      }

      if (newLength > oldLength) {
        // New workout added
        if (import.meta.env.DEV) {
          console.log('[Goals] New workout detected, updating progress...')
        }
        nextTick(() => {
          updateAllGoalProgress()
        })
      }
    }
  )

  /**
   * Watch for auth state and subscribe/unsubscribe
   */
  watch(
    () => authStore.uid,
    (newUid) => {
      if (newUid) {
        subscribeToGoals()
      } else {
        cleanup()
        goals.value = []
      }
    },
    { immediate: true }
  )

  // ===== Lifecycle =====

  /**
   * Cleanup subscriptions
   */
  function cleanup() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // ===== Return Public API =====
  return {
    // State
    goals,
    loading,
    error,

    // Getters
    activeGoals,
    completedGoals,
    pausedGoals,
    failedGoals,
    strengthGoals,
    volumeGoals,
    frequencyGoals,
    streakGoals,

    // Computed Progress
    strengthGoalProgress,
    volumeGoalProgress,
    frequencyGoalProgress,
    streakGoalProgress,
    allGoalProgress,
    goalStats,

    // Actions
    fetchGoals,
    subscribeToGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    pauseGoal,
    resumeGoal,
    failGoal,
    updateAllGoalProgress,
    checkMilestones,
    cleanup,
  }
})
