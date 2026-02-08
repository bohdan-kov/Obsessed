/**
 * usePlanForm Composable
 * Manages form state for creating and editing workout plans
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CONFIG } from '@/constants/config'
import { validatePlan } from '@/utils/planValidation'

export function usePlanForm(initialPlan = null, mode = 'create') {
  const { locale } = useI18n()

  // Form state
  const name = ref(initialPlan?.name || '')
  const description = ref(initialPlan?.description || '')
  const exercises = ref(initialPlan?.exercises || [])
  const tags = ref(initialPlan?.tags || [])

  // Validation errors
  const errors = ref({})

  // Track if form has been modified
  const originalData = initialPlan
    ? JSON.stringify({
        name: initialPlan.name,
        description: initialPlan.description,
        exercises: initialPlan.exercises,
        tags: initialPlan.tags,
      })
    : null

  const isDirty = computed(() => {
    if (mode === 'create') {
      return name.value.trim() !== '' || description.value.trim() !== '' || exercises.value.length > 0
    }

    const currentData = JSON.stringify({
      name: name.value,
      description: description.value,
      exercises: exercises.value,
      tags: tags.value,
    })

    return currentData !== originalData
  })

  // Validation state
  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0 && name.value.trim().length >= CONFIG.plans.NAME_MIN_LENGTH && exercises.value.length >= CONFIG.plans.MIN_EXERCISES_PER_PLAN
  })

  /**
   * Add an exercise to the plan
   * @param {Object} exercise - Exercise object from exercise library
   */
  function addExercise(exercise) {
    if (exercises.value.length >= CONFIG.plans.MAX_EXERCISES_PER_PLAN) {
      errors.value.exercises = `Maximum ${CONFIG.plans.MAX_EXERCISES_PER_PLAN} exercises reached`
      return
    }

    // Extract localized string for current locale (prevent storing translation objects)
    let exerciseName = exercise.id
    if (exercise.name) {
      if (typeof exercise.name === 'string') {
        exerciseName = exercise.name
      } else {
        exerciseName = exercise.name[locale.value] || exercise.name.en || exercise.name.uk || exercise.id
      }
    }

    const newExercise = {
      exerciseId: exercise.id,
      exerciseName,
      order: exercises.value.length,
      suggestedSets: null,
      suggestedWeight: null,
      suggestedReps: null,
      notes: null,
      muscleGroup: exercise.muscleGroup || null,
      equipment: exercise.equipment || null,
    }

    exercises.value.push(newExercise)
    delete errors.value.exercises
  }

  /**
   * Remove an exercise from the plan
   * @param {number} index - Exercise index
   */
  function removeExercise(index) {
    exercises.value.splice(index, 1)

    // Update order values
    exercises.value.forEach((ex, i) => {
      ex.order = i
    })

    // Validate after removal
    if (exercises.value.length === 0) {
      errors.value.exercises = 'Plan must have at least 1 exercise'
    }
  }

  /**
   * Reorder exercises
   * @param {number} fromIndex - Source index
   * @param {number} toIndex - Target index
   */
  function reorderExercises(fromIndex, toIndex) {
    const exercise = exercises.value.splice(fromIndex, 1)[0]
    exercises.value.splice(toIndex, 0, exercise)

    // Update order values
    exercises.value.forEach((ex, i) => {
      ex.order = i
    })
  }

  /**
   * Update an exercise's suggestions
   * @param {number} index - Exercise index
   * @param {Object} updates - Updates to apply
   */
  function updateExercise(index, updates) {
    if (index < 0 || index >= exercises.value.length) return

    exercises.value[index] = {
      ...exercises.value[index],
      ...updates,
    }
  }

  /**
   * Validate the form
   * @returns {boolean} True if valid
   */
  function validate() {
    errors.value = {}

    const planData = {
      name: name.value.trim(),
      description: description.value.trim() || null,
      exercises: exercises.value,
      tags: tags.value,
    }

    const validation = validatePlan(planData)

    if (!validation.success) {
      errors.value = validation.errors
      return false
    }

    return true
  }

  /**
   * Get form data for submission
   * @returns {Object} Plan data ready for store
   */
  function getSubmitData() {
    return {
      name: name.value.trim(),
      description: description.value.trim() || null,
      exercises: exercises.value.map((ex, index) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        order: index,
        suggestedSets: ex.suggestedSets || null,
        suggestedWeight: ex.suggestedWeight || null,
        suggestedReps: ex.suggestedReps?.trim() || null,
        notes: ex.notes?.trim() || null,
        muscleGroup: ex.muscleGroup || null,
        equipment: ex.equipment || null,
      })),
      tags: tags.value,
    }
  }

  /**
   * Reset form to initial state
   */
  function reset() {
    if (initialPlan) {
      name.value = initialPlan.name || ''
      description.value = initialPlan.description || ''
      exercises.value = initialPlan.exercises || []
      tags.value = initialPlan.tags || []
    } else {
      name.value = ''
      description.value = ''
      exercises.value = []
      tags.value = []
    }
    errors.value = {}
  }

  /**
   * Load plan data into form (for edit mode)
   * @param {Object} plan - Plan to load
   */
  function loadPlan(plan) {
    name.value = plan.name || ''
    description.value = plan.description || ''
    exercises.value = plan.exercises || []
    tags.value = plan.tags || []
    errors.value = {}
  }

  // Watch for changes and validate on blur
  watch(name, (newValue) => {
    if (newValue.trim().length === 0) {
      errors.value.name = 'Plan name is required'
    } else if (newValue.trim().length < CONFIG.plans.NAME_MIN_LENGTH) {
      errors.value.name = `Name must be at least ${CONFIG.plans.NAME_MIN_LENGTH} characters`
    } else if (newValue.trim().length > CONFIG.plans.NAME_MAX_LENGTH) {
      errors.value.name = `Name must be at most ${CONFIG.plans.NAME_MAX_LENGTH} characters`
    } else {
      delete errors.value.name
    }
  })

  watch(description, (newValue) => {
    if (newValue.trim().length > CONFIG.plans.DESCRIPTION_MAX_LENGTH) {
      errors.value.description = `Description must be at most ${CONFIG.plans.DESCRIPTION_MAX_LENGTH} characters`
    } else {
      delete errors.value.description
    }
  })

  watch(
    exercises,
    (newValue) => {
      if (newValue.length === 0) {
        errors.value.exercises = 'Plan must have at least 1 exercise'
      } else if (newValue.length > CONFIG.plans.MAX_EXERCISES_PER_PLAN) {
        errors.value.exercises = `Plan can have at most ${CONFIG.plans.MAX_EXERCISES_PER_PLAN} exercises`
      } else {
        delete errors.value.exercises
      }
    },
    { deep: true }
  )

  return {
    // State
    name,
    description,
    exercises,
    tags,
    errors,

    // Computed
    isDirty,
    isValid,

    // Actions
    addExercise,
    removeExercise,
    reorderExercises,
    updateExercise,
    validate,
    getSubmitData,
    reset,
    loadPlan,
  }
}
