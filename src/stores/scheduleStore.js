import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { useExerciseStore } from './exerciseStore'
import {
  fetchCollection,
  fetchDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  serverTimestamp,
  setDocument,
} from '@/firebase/firestore'
import {
  computeMuscleGroupsFromExercises,
  estimateDuration,
  validateTemplate,
} from '@/utils/templateUtils'
import {
  getWeekId,
  getWeekStartDate,
  createEmptyWeekSchedule,
} from '@/utils/scheduleUtils'

/**
 * @typedef {Object} TemplateExercise
 * @property {string} exerciseId - Reference to exercise
 * @property {string} exerciseName - Exercise name (denormalized)
 * @property {number} sets - Target sets
 * @property {number} reps - Target reps
 * @property {number|null} targetWeight - Optional target weight in kg
 * @property {number} restTime - Rest time in seconds
 * @property {string} notes - Exercise notes
 */

/**
 * @typedef {Object} WorkoutTemplate
 * @property {string} id - Template ID
 * @property {string} name - Template name
 * @property {string} description - Template description
 * @property {TemplateExercise[]} exercises - Template exercises
 * @property {string[]} muscleGroups - Auto-computed muscle groups
 * @property {number} estimatedDuration - Estimated duration in minutes
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Date|null} lastUsedAt - Last used timestamp
 * @property {number} usageCount - Number of times used
 * @property {string|null} sourcePresetId - ID of preset if created from preset
 */

/**
 * @typedef {Object} DaySchedule
 * @property {string|null} templateId - Reference to template
 * @property {string|null} templateName - Template name (denormalized)
 * @property {string[]} muscleGroups - Muscle groups (denormalized)
 * @property {boolean} completed - Whether workout was completed
 * @property {string|null} workoutId - Reference to completed workout
 */

/**
 * @typedef {Object} WeeklySchedule
 * @property {string} id - Week ID (e.g., "2026-W02")
 * @property {string} userId - User ID
 * @property {Date} weekStart - Monday of the week
 * @property {Object} days - Days object with monday-sunday keys
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

export const useScheduleStore = defineStore('schedule', () => {
  const authStore = useAuthStore()
  const exerciseStore = useExerciseStore()

  // ============================================================
  // STATE
  // ============================================================

  const templates = ref([])
  const currentSchedule = ref(null)
  const scheduleCache = ref(new Map())
  const loading = ref(false)
  const error = ref(null)

  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================

  /**
   * Templates grouped by primary muscle group
   */
  const templatesByMuscle = computed(() => {
    const groups = {}
    templates.value.forEach((t) => {
      const primary = t.muscleGroups[0] || 'other'
      if (!groups[primary]) groups[primary] = []
      groups[primary].push(t)
    })
    return groups
  })

  /**
   * Templates sorted by usage (most used first)
   */
  const templatesByUsage = computed(() => {
    return [...templates.value].sort((a, b) => b.usageCount - a.usageCount)
  })

  /**
   * Templates sorted by last used (most recent first)
   */
  const recentTemplates = computed(() => {
    return [...templates.value]
      .filter((t) => t.lastUsedAt)
      .sort((a, b) => {
        const dateA = a.lastUsedAt?.toDate ? a.lastUsedAt.toDate() : new Date(a.lastUsedAt)
        const dateB = b.lastUsedAt?.toDate ? b.lastUsedAt.toDate() : new Date(b.lastUsedAt)
        return dateB - dateA
      })
      .slice(0, 5)
  })

  /**
   * Today's scheduled workout
   */
  const todaysWorkout = computed(() => {
    if (!currentSchedule.value) return null
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    return currentSchedule.value.days[today]
  })

  /**
   * Current week adherence stats
   */
  const weekAdherence = computed(() => {
    if (!currentSchedule.value) return { completed: 0, planned: 0, percentage: 0 }

    const days = Object.values(currentSchedule.value.days)
    const planned = days.filter((d) => d.templateId).length
    const completed = days.filter((d) => d.completed).length

    return {
      completed,
      planned,
      percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0,
    }
  })

  // ============================================================
  // TEMPLATE ACTIONS
  // ============================================================

  /**
   * Fetch all workout templates for current user
   */
  async function fetchTemplates() {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      const path = `users/${authStore.uid}/workoutTemplates`
      templates.value = await fetchCollection(path, {
        orderBy: [['updatedAt', 'desc']],
      })
      return templates.value
    } catch (err) {
      error.value = err.message
      if (import.meta.env.DEV) {
        console.error('[scheduleStore] Failed to fetch templates:', err)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get template by ID
   */
  function getTemplateById(templateId) {
    return templates.value.find((t) => t.id === templateId)
  }

  /**
   * Create new workout template
   */
  async function createTemplate(templateData) {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      // Validate template
      const validation = validateTemplate(templateData)
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '))
      }

      const path = `users/${authStore.uid}/workoutTemplates`

      // Compute muscle groups from exercises
      const muscleGroups = computeMuscleGroupsFromExercises(
        templateData.exercises,
        exerciseStore
      )

      // Estimate duration
      const estimatedDuration = estimateDuration(templateData.exercises)

      const newTemplate = {
        ...templateData,
        muscleGroups,
        estimatedDuration,
        lastUsedAt: null,
        usageCount: 0,
      }

      const docId = await createDocument(path, newTemplate)
      await fetchTemplates() // Refresh list
      return docId
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update existing template
   */
  async function updateTemplate(templateId, updates) {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      const path = `users/${authStore.uid}/workoutTemplates`

      // Recompute muscle groups if exercises changed
      if (updates.exercises) {
        updates.muscleGroups = computeMuscleGroupsFromExercises(updates.exercises, exerciseStore)
        updates.estimatedDuration = estimateDuration(updates.exercises)
      }

      await updateDocument(path, templateId, updates)
      await fetchTemplates()
    } catch (err) {
      error.value = err.message
      if (import.meta.env.DEV) {
        console.error('[scheduleStore] Failed to update template:', err)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete template
   */
  async function deleteTemplate(templateId) {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      const path = `users/${authStore.uid}/workoutTemplates`
      await deleteDocument(path, templateId)

      templates.value = templates.value.filter((t) => t.id !== templateId)
    } catch (err) {
      error.value = err.message
      if (import.meta.env.DEV) {
        console.error('[scheduleStore] Failed to delete template:', err)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Duplicate template
   */
  async function duplicateTemplate(templateId) {
    const original = getTemplateById(templateId)
    if (!original) {
      throw new Error('Template not found')
    }

    const duplicate = {
      name: `${original.name} (Copy)`,
      description: original.description,
      exercises: [...original.exercises],
      sourcePresetId: null,
    }

    return await createTemplate(duplicate)
  }

  // ============================================================
  // SCHEDULE ACTIONS
  // ============================================================

  /**
   * Fetch schedule for a given week
   */
  async function fetchScheduleForWeek(weekId) {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      // Check cache first
      if (scheduleCache.value.has(weekId)) {
        currentSchedule.value = scheduleCache.value.get(weekId)
        loading.value = false
        return currentSchedule.value
      }

      const path = `users/${authStore.uid}/schedules`
      let schedule = await fetchDocument(path, weekId)

      if (!schedule) {
        // Create empty schedule for this week
        schedule = await createEmptySchedule(weekId)
      }

      currentSchedule.value = schedule
      scheduleCache.value.set(weekId, schedule)

      return schedule
    } catch (err) {
      error.value = err.message
      if (import.meta.env.DEV) {
        console.error('[scheduleStore] Failed to fetch schedule:', err)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create empty schedule for a week
   */
  async function createEmptySchedule(weekId) {
    if (!authStore.uid) {
      throw new Error('User not authenticated')
    }

    const emptySchedule = createEmptyWeekSchedule(weekId, authStore.uid)
    const path = `users/${authStore.uid}/schedules`

    await setDocument(path, weekId, emptySchedule)

    return emptySchedule
  }

  /**
   * Assign template to a specific day
   */
  async function assignTemplateToDay(weekId, dayName, templateId) {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      const template = getTemplateById(templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      const path = `users/${authStore.uid}/schedules`

      await updateDocument(path, weekId, {
        [`days.${dayName}`]: {
          templateId: template.id,
          templateName: template.name,
          muscleGroups: template.muscleGroups,
          completed: false,
          workoutId: null,
        },
      })

      // Invalidate cache for this week
      scheduleCache.value.delete(weekId)

      // Refresh current schedule
      await fetchScheduleForWeek(weekId)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove template from day (make it a rest day)
   */
  async function removeTemplateFromDay(weekId, dayName) {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      const path = `users/${authStore.uid}/schedules`

      await updateDocument(path, weekId, {
        [`days.${dayName}`]: {
          templateId: null,
          templateName: null,
          muscleGroups: [],
          completed: false,
          workoutId: null,
        },
      })

      scheduleCache.value.delete(weekId)
      await fetchScheduleForWeek(weekId)
    } catch (err) {
      error.value = err.message
      if (import.meta.env.DEV) {
        console.error('[scheduleStore] Failed to remove template:', err)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark day as completed (called after workout is saved)
   */
  async function markDayCompleted(weekId, dayName, workoutId) {
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      const path = `users/${authStore.uid}/schedules`

      await updateDocument(path, weekId, {
        [`days.${dayName}.completed`]: true,
        [`days.${dayName}.workoutId`]: workoutId,
      })

      // Update local state if this is the current schedule
      if (currentSchedule.value && currentSchedule.value.id === weekId) {
        currentSchedule.value.days[dayName].completed = true
        currentSchedule.value.days[dayName].workoutId = workoutId
      }

      // Invalidate cache
      scheduleCache.value.delete(weekId)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[scheduleStore] Failed to mark day completed:', err)
      }
      throw err
    }
  }

  /**
   * Batch assign template to multiple days
   */
  async function assignTemplateToMultipleDays(weekId, dayNames, templateId) {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      const template = getTemplateById(templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      const path = `users/${authStore.uid}/schedules`
      const updates = {}

      dayNames.forEach((dayName) => {
        updates[`days.${dayName}`] = {
          templateId: template.id,
          templateName: template.name,
          muscleGroups: template.muscleGroups,
          completed: false,
          workoutId: null,
        }
      })

      await updateDocument(path, weekId, updates)

      scheduleCache.value.delete(weekId)
      await fetchScheduleForWeek(weekId)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // PRESET ACTIONS
  // ============================================================

  /**
   * Create templates from a preset split
   */
  async function createTemplatesFromPreset(preset, locale = 'uk') {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      const templateIds = []

      for (const presetTemplate of preset.templates) {
        const templateData = {
          name: presetTemplate.name[locale] || presetTemplate.name.en,
          description: preset.description[locale] || preset.description.en,
          exercises: presetTemplate.exercises.map((ex) => {
            const exerciseData = exerciseStore.getExerciseById(ex.exerciseId)
            return {
              exerciseId: ex.exerciseId,
              exerciseName: exerciseData?.name || ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              targetWeight: ex.targetWeight || null,
              restTime: ex.restTime,
              notes: ex.notes || '',
            }
          }),
          sourcePresetId: preset.id,
        }

        const templateId = await createTemplate(templateData)
        templateIds.push(templateId)
      }

      return templateIds
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply a preset split to current week's schedule
   * Creates templates from preset and assigns them to days in a cycle
   * @param {string} presetId - Preset ID from splitPresets
   * @param {string} weekId - Week ID to apply preset to
   * @param {string} locale - Locale for template names
   */
  async function applyPreset(presetId, weekId, locale = 'uk') {
    loading.value = true
    error.value = null
    try {
      if (!authStore.uid) {
        throw new Error('User not authenticated')
      }

      // Import preset data
      const { getPresetById } = await import('@/constants/splitPresets')
      const preset = getPresetById(presetId)

      if (!preset) {
        throw new Error('Preset not found')
      }

      // Step 1: Create templates from preset
      const templateIds = await createTemplatesFromPreset(preset, locale)

      // Step 2: Assign templates to days using schedule pattern
      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const path = `users/${authStore.uid}/schedules`
      const updates = {}

      // Use schedulePattern if provided, otherwise fall back to sequential assignment
      const schedulePattern = preset.schedulePattern || []

      for (let i = 0; i < dayOrder.length; i++) {
        const dayName = dayOrder[i]
        const templateIndexForDay = schedulePattern[i]

        if (templateIndexForDay !== null && templateIndexForDay !== undefined) {
          // Assign template based on pattern
          const templateId = templateIds[templateIndexForDay]
          const template = getTemplateById(templateId)

          if (template) {
            updates[`days.${dayName}`] = {
              templateId: template.id,
              templateName: template.name,
              muscleGroups: template.muscleGroups,
              completed: false,
              workoutId: null,
            }
          }
        } else {
          // Rest day
          updates[`days.${dayName}`] = {
            templateId: null,
            templateName: null,
            muscleGroups: [],
            completed: false,
            workoutId: null,
          }
        }
      }

      // Step 3: Save to Firestore
      await updateDocument(path, weekId, updates)

      // Step 4: Refresh cache and current schedule
      scheduleCache.value.delete(weekId)
      await fetchScheduleForWeek(weekId)

      return templateIds
    } catch (err) {
      error.value = err.message
      if (import.meta.env.DEV) {
        console.error('[scheduleStore] Failed to apply preset:', err)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  /**
   * Clear schedule cache
   */
  function clearScheduleCache() {
    scheduleCache.value.clear()
    currentSchedule.value = null
  }

  /**
   * Clear all store data (on logout)
   */
  function clearStore() {
    templates.value = []
    currentSchedule.value = null
    scheduleCache.value.clear()
    loading.value = false
    error.value = null
  }

  // ============================================================
  // EXPORTS
  // ============================================================

  return {
    // State
    templates,
    currentSchedule,
    scheduleCache,
    loading,
    error,

    // Computed
    templatesByMuscle,
    templatesByUsage,
    recentTemplates,
    todaysWorkout,
    weekAdherence,

    // Template Actions
    fetchTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,

    // Schedule Actions
    fetchScheduleForWeek,
    createEmptySchedule,
    assignTemplateToDay,
    removeTemplateFromDay,
    markDayCompleted,
    assignTemplateToMultipleDays,

    // Preset Actions
    createTemplatesFromPreset,
    applyPreset,

    // Utilities
    clearScheduleCache,
    clearStore,
    getWeekId,
    getWeekStartDate,
  }
})
