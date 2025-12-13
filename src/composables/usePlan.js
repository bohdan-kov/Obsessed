/**
 * usePlan Composable
 * High-level orchestrator for workout plans
 * Wraps planStore with error handling, weight conversion, and toast notifications
 */
import { computed } from 'vue'
import { usePlanStore } from '@/stores/planStore'
import { useUnits } from './useUnits'
import { useErrorHandler } from './useErrorHandler'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'

export function usePlan() {
  const planStore = usePlanStore()
  const { toStorageUnit, fromStorageUnit } = useUnits()
  const { handleError } = useErrorHandler()
  const { t } = useI18n()
  const { toast } = useToast()

  // Re-export store getters
  const plans = computed(() => planStore.plans)
  const sortedPlans = computed(() => planStore.sortedPlans)
  const recentPlans = computed(() => planStore.recentPlans)
  const planCount = computed(() => planStore.planCount)
  const canCreatePlan = computed(() => planStore.canCreatePlan)
  const loading = computed(() => planStore.loading)

  /**
   * Get plan by ID with weight conversion to display unit
   * @param {string} planId - Plan ID
   * @returns {Object|undefined} Plan with converted weights
   */
  function getPlan(planId) {
    const plan = planStore.getPlanById(planId)
    if (!plan) return undefined

    // Convert weights from storage unit (kg) to display unit
    return {
      ...plan,
      exercises: plan.exercises.map((ex) => ({
        ...ex,
        suggestedWeight: ex.suggestedWeight ? fromStorageUnit(ex.suggestedWeight) : null,
      })),
    }
  }

  /**
   * Fetch all plans
   * @returns {Promise<void>}
   */
  async function fetchPlans() {
    try {
      await planStore.fetchPlans()
    } catch (error) {
      handleError(error, t('plans.toast.fetchError'), 'usePlan.fetchPlans')
      throw error
    }
  }

  /**
   * Subscribe to real-time plan updates
   * @returns {Function} Unsubscribe function
   */
  function subscribeToPlans() {
    try {
      return planStore.subscribeToPlans()
    } catch (error) {
      handleError(error, t('plans.toast.fetchError'), 'usePlan.subscribeToPlans')
      throw error
    }
  }

  /**
   * Create a new plan
   * Converts weights to storage unit (kg) before saving
   * @param {Object} planData - Plan data
   * @returns {Promise<string>} Created plan ID
   */
  async function createPlan(planData) {
    try {
      // Convert weights to storage unit (kg)
      const planToCreate = {
        ...planData,
        exercises: planData.exercises.map((ex) => ({
          ...ex,
          suggestedWeight: ex.suggestedWeight ? toStorageUnit(ex.suggestedWeight) : null,
        })),
      }

      const planId = await planStore.createPlan(planToCreate)
      toast({
        title: t('plans.toast.created'),
      })
      return planId
    } catch (error) {
      handleError(error, t('plans.toast.createError'), 'usePlan.createPlan')
      throw error
    }
  }

  /**
   * Update an existing plan
   * Converts weights to storage unit (kg) before saving
   * @param {string} planId - Plan ID
   * @param {Object} updates - Plan updates
   * @returns {Promise<void>}
   */
  async function updatePlan(planId, updates) {
    try {
      // Convert weights to storage unit (kg) if exercises are being updated
      const updatesToSave = { ...updates }
      if (updates.exercises) {
        updatesToSave.exercises = updates.exercises.map((ex) => ({
          ...ex,
          suggestedWeight: ex.suggestedWeight ? toStorageUnit(ex.suggestedWeight) : null,
        }))
      }

      await planStore.updatePlan(planId, updatesToSave)
      toast({
        title: t('plans.toast.updated'),
      })
    } catch (error) {
      handleError(error, t('plans.toast.updateError'), 'usePlan.updatePlan')
      throw error
    }
  }

  /**
   * Delete a plan
   * @param {string} planId - Plan ID
   * @returns {Promise<void>}
   */
  async function deletePlan(planId) {
    try {
      await planStore.deletePlan(planId)
      toast({
        title: t('plans.toast.deleted'),
      })
    } catch (error) {
      handleError(error, t('plans.toast.deleteError'), 'usePlan.deletePlan')
      throw error
    }
  }

  /**
   * Duplicate a plan
   * @param {string} planId - Plan ID to duplicate
   * @returns {Promise<string>} New plan ID
   */
  async function duplicatePlan(planId) {
    try {
      const originalPlan = getPlan(planId)
      if (!originalPlan) {
        throw new Error(t('plans.errors.planNotFound'))
      }

      const duplicatedPlan = {
        name: `${originalPlan.name} (Copy)`,
        description: originalPlan.description,
        exercises: originalPlan.exercises,
        tags: originalPlan.tags,
      }

      const newPlanId = await createPlan(duplicatedPlan)
      toast({
        title: t('plans.toast.duplicated'),
      })
      return newPlanId
    } catch (error) {
      handleError(error, t('plans.toast.createError'), 'usePlan.duplicatePlan')
      throw error
    }
  }

  /**
   * Record that a plan was used
   * @param {string} planId - Plan ID
   * @returns {Promise<void>}
   */
  async function recordUsage(planId) {
    try {
      await planStore.recordPlanUsage(planId)
    } catch (error) {
      // Silently fail - not critical
      if (import.meta.env.DEV) {
        console.error('Error recording plan usage:', error)
      }
    }
  }

  return {
    // State
    plans,
    sortedPlans,
    recentPlans,
    planCount,
    canCreatePlan,
    loading,

    // Actions
    getPlan,
    fetchPlans,
    subscribeToPlans,
    createPlan,
    updatePlan,
    deletePlan,
    duplicatePlan,
    recordUsage,
  }
}
