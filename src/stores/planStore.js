import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { CONFIG } from '@/constants/config'
import { validatePlan } from '@/utils/planValidation'
import {
  fetchCollection,
  createDocument,
  updateDocument,
  subscribeToCollection,
  serverTimestamp,
  COLLECTIONS,
} from '@/firebase/firestore'

/**
 * @typedef {Object} PlanExercise
 * @property {string} exerciseId - Exercise ID
 * @property {string} exerciseName - Exercise name (denormalized)
 * @property {number} order - Order in plan (0-indexed)
 * @property {number} [suggestedSets] - Suggested number of sets (1-10)
 * @property {number} [suggestedWeight] - Suggested weight in kg
 * @property {string} [suggestedReps] - Suggested reps ("8", "8-12", "AMRAP")
 * @property {string} [notes] - Exercise notes
 * @property {string} [muscleGroup] - Muscle group (denormalized)
 * @property {string} [equipment] - Equipment (denormalized)
 */

/**
 * @typedef {Object} WorkoutPlan
 * @property {string} id - Plan ID
 * @property {string} userId - User ID
 * @property {string} name - Plan name (2-50 chars)
 * @property {string} [description] - Plan description (0-200 chars)
 * @property {PlanExercise[]} exercises - Exercises in plan (1-15)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Date} [lastUsedAt] - Last used timestamp (null until first use)
 * @property {number} usageCount - Number of times used (starts at 0)
 * @property {boolean} isArchived - Soft delete flag
 * @property {string[]} [tags] - Plan tags (future feature)
 */

export const usePlanStore = defineStore('plan', () => {
  const authStore = useAuthStore()

  // State
  const plans = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Real-time listener cleanup
  let unsubscribe = null

  // Getters
  /**
   * Get total number of non-archived plans
   */
  const planCount = computed(() => plans.value.filter((p) => !p.isArchived).length)

  /**
   * Check if user can create more plans (max 30)
   */
  const canCreatePlan = computed(() => planCount.value < CONFIG.plans.MAX_PLANS_PER_USER)

  /**
   * Get non-archived plans sorted by last used date (desc), then created date (desc)
   * Note: We filter archived plans client-side to avoid requiring Firestore composite indexes
   */
  const sortedPlans = computed(() => {
    return [...plans.value]
      .filter((plan) => !plan.isArchived) // Client-side filter to avoid composite index
      .sort((a, b) => {
        // If both have lastUsedAt, sort by that
        if (a.lastUsedAt && b.lastUsedAt) {
          const dateA = a.lastUsedAt.toDate ? a.lastUsedAt.toDate() : new Date(a.lastUsedAt)
          const dateB = b.lastUsedAt.toDate ? b.lastUsedAt.toDate() : new Date(b.lastUsedAt)
          return dateB - dateA
        }

        // Plans with lastUsedAt come first
        if (a.lastUsedAt && !b.lastUsedAt) return -1
        if (!a.lastUsedAt && b.lastUsedAt) return 1

        // If neither has lastUsedAt, sort by createdAt
        const createdA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
        const createdB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
        return createdB - createdA
      })
  })

  /**
   * Get recently used plans (top 5)
   */
  const recentPlans = computed(() => {
    return sortedPlans.value
      .filter((plan) => plan.lastUsedAt)
      .slice(0, CONFIG.plans.RECENT_PLANS_COUNT)
  })

  /**
   * Get plan by ID
   * @param {string} planId - Plan ID
   * @returns {WorkoutPlan|undefined}
   */
  function getPlanById(planId) {
    return plans.value.find((plan) => plan.id === planId)
  }

  // Actions
  /**
   * Fetch all plans for the current user
   * Note: We fetch all plans (including archived) and filter client-side
   * to avoid requiring Firestore composite indexes. With max 30 plans per user,
   * client-side filtering is performant.
   * @returns {Promise<void>}
   */
  async function fetchPlans() {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to fetch plans')
    }

    loading.value = true
    error.value = null

    try {
      const collectionPath = `users/${authStore.uid}/${COLLECTIONS.WORKOUT_PLANS}`
      // Fetch all plans without query constraints to avoid composite index requirement
      const fetchedPlans = await fetchCollection(collectionPath)

      plans.value = fetchedPlans
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error fetching plans:', err)
      }
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Subscribe to real-time updates for plans
   * Note: We subscribe to all plans (including archived) and filter client-side
   * to avoid requiring Firestore composite indexes. With max 30 plans per user,
   * client-side filtering is performant.
   * @returns {Function} Unsubscribe function
   */
  function subscribeToPlans() {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to subscribe to plans')
    }

    // Clean up existing subscription
    if (unsubscribe) {
      unsubscribe()
    }

    const collectionPath = `users/${authStore.uid}/${COLLECTIONS.WORKOUT_PLANS}`

    // Subscribe without query constraints to avoid composite index requirement
    unsubscribe = subscribeToCollection(
      collectionPath,
      {}, // No where/orderBy - filter/sort on client
      (fetchedPlans) => {
        plans.value = fetchedPlans
        loading.value = false
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.error('Error in plans subscription:', err)
        }
        error.value = err.message
        loading.value = false
      }
    )

    return unsubscribe
  }

  /**
   * Create a new workout plan
   * @param {Object} planData - Plan data (name, description, exercises)
   * @returns {Promise<string>} Created plan ID
   */
  async function createPlan(planData) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to create plans')
    }

    if (!canCreatePlan.value) {
      throw new Error(`Maximum of ${CONFIG.plans.MAX_PLANS_PER_USER} plans reached`)
    }

    // Validate plan data
    const validation = validatePlan(planData)
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Invalid plan data')
    }

    loading.value = true
    error.value = null

    try {
      const collectionPath = `users/${authStore.uid}/${COLLECTIONS.WORKOUT_PLANS}`

      const planToCreate = {
        userId: authStore.uid,
        name: planData.name.trim(),
        description: planData.description?.trim() || null,
        exercises: planData.exercises.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          order: index,
          suggestedSets: ex.suggestedSets || null,
          suggestedWeight: ex.suggestedWeight || null, // Already in kg from form
          suggestedReps: ex.suggestedReps?.trim() || null,
          notes: ex.notes?.trim() || null,
          muscleGroup: ex.muscleGroup || null,
          equipment: ex.equipment || null,
        })),
        usageCount: 0,
        lastUsedAt: null,
        isArchived: false,
        tags: planData.tags || [],
      }

      const planId = await createDocument(collectionPath, planToCreate)

      // Optimistically add to local state (will be updated by real-time listener)
      const newPlan = {
        id: planId,
        ...planToCreate,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      plans.value.unshift(newPlan)

      return planId
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error creating plan:', err)
      }
      error.value = err.message

      // Rollback optimistic update
      plans.value = plans.value.filter((p) => p.id !== 'temp-id')
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing workout plan
   * @param {string} planId - Plan ID
   * @param {Object} updates - Plan updates
   * @returns {Promise<void>}
   */
  async function updatePlan(planId, updates) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to update plans')
    }

    const plan = getPlanById(planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    if (plan.userId !== authStore.uid) {
      throw new Error('Unauthorized to update this plan')
    }

    // Validate updates
    const validation = validatePlan({ ...plan, ...updates })
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Invalid plan data')
    }

    loading.value = true
    error.value = null

    // Store original for rollback
    const originalPlan = { ...plan }

    try {
      // Optimistic update
      const index = plans.value.findIndex((p) => p.id === planId)
      if (index !== -1) {
        plans.value[index] = { ...plans.value[index], ...updates }
      }

      const collectionPath = `users/${authStore.uid}/${COLLECTIONS.WORKOUT_PLANS}`

      const sanitizedUpdates = {
        name: updates.name?.trim(),
        description: updates.description?.trim() || null,
        exercises: updates.exercises?.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          order: index,
          suggestedSets: ex.suggestedSets || null,
          suggestedWeight: ex.suggestedWeight || null, // Already in kg from form
          suggestedReps: ex.suggestedReps?.trim() || null,
          notes: ex.notes?.trim() || null,
          muscleGroup: ex.muscleGroup || null,
          equipment: ex.equipment || null,
        })),
        tags: updates.tags,
      }

      // Remove undefined fields
      Object.keys(sanitizedUpdates).forEach((key) => {
        if (sanitizedUpdates[key] === undefined) {
          delete sanitizedUpdates[key]
        }
      })

      await updateDocument(collectionPath, planId, sanitizedUpdates)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error updating plan:', err)
      }
      error.value = err.message

      // Rollback optimistic update
      const index = plans.value.findIndex((p) => p.id === planId)
      if (index !== -1) {
        plans.value[index] = originalPlan
      }

      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a plan (soft delete - sets isArchived to true)
   * @param {string} planId - Plan ID
   * @returns {Promise<void>}
   */
  async function deletePlan(planId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to delete plans')
    }

    const plan = getPlanById(planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    if (plan.userId !== authStore.uid) {
      throw new Error('Unauthorized to delete this plan')
    }

    loading.value = true
    error.value = null

    // Store original for rollback
    const originalPlans = [...plans.value]

    try {
      // Optimistic update - remove from local state
      plans.value = plans.value.filter((p) => p.id !== planId)

      const collectionPath = `users/${authStore.uid}/${COLLECTIONS.WORKOUT_PLANS}`

      // Soft delete
      await updateDocument(collectionPath, planId, {
        isArchived: true,
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error deleting plan:', err)
      }
      error.value = err.message

      // Rollback optimistic update
      plans.value = originalPlans
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Record plan usage - increment usageCount and update lastUsedAt
   * @param {string} planId - Plan ID
   * @returns {Promise<void>}
   */
  async function recordPlanUsage(planId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to record plan usage')
    }

    const plan = getPlanById(planId)
    if (!plan) {
      if (import.meta.env.DEV) {
        console.warn('Plan not found for usage recording:', planId)
      }
      return // Silently fail
    }

    try {
      const collectionPath = `users/${authStore.uid}/${COLLECTIONS.WORKOUT_PLANS}`

      // Optimistic update
      const index = plans.value.findIndex((p) => p.id === planId)
      if (index !== -1) {
        plans.value[index].usageCount = (plans.value[index].usageCount || 0) + 1
        // Use current timestamp for optimistic UI update
        // This will be replaced by the actual Firestore Timestamp from the real-time listener
        plans.value[index].lastUsedAt = new Date()
      }

      await updateDocument(collectionPath, planId, {
        usageCount: (plan.usageCount || 0) + 1,
        lastUsedAt: serverTimestamp(),
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error recording plan usage:', err)
      }
      // Don't throw - this is not critical
    }
  }

  /**
   * Clear all data and cleanup subscriptions (on logout)
   */
  function clearData() {
    plans.value = []
    loading.value = false
    error.value = null

    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    // State
    plans,
    loading,
    error,

    // Getters
    planCount,
    canCreatePlan,
    sortedPlans,
    recentPlans,
    getPlanById,

    // Actions
    fetchPlans,
    subscribeToPlans,
    createPlan,
    updatePlan,
    deletePlan,
    recordPlanUsage,
    clearData,
  }
})
