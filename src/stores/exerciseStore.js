import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import {
  fetchCollection,
  createDocument,
  updateDocument,
  subscribeToCollection,
} from '@/firebase/firestore'
import { MUSCLE_GROUPS } from '@/shared/config/constants'
import { defaultExercises } from '@/data/defaultExercises'

/**
 * @typedef {Object} Exercise
 * @property {string} id - Exercise ID
 * @property {string} name - Exercise name
 * @property {string} category - Exercise category
 * @property {string[]} muscleGroups - Primary muscle groups
 * @property {string[]} [secondaryMuscles] - Secondary muscles
 * @property {string} equipment - Required equipment
 * @property {string} [description] - Exercise description
 * @property {string} [videoUrl] - Tutorial video URL
 * @property {boolean} isCustom - Whether it's a user-created exercise
 */

const STORAGE_KEY = 'obsessed_recent_exercises'
const MAX_RECENT = 10

export const useExerciseStore = defineStore('exercise', () => {
  const authStore = useAuthStore()

  // State
  const exercises = ref([])
  const customExercises = ref([])
  const categories = ref([
    'compound',
    'isolation',
    'cardio',
    'stretching',
    'plyometric',
  ])
  const recentlyUsed = ref([])
  const loading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')

  // Real-time listener cleanup
  let unsubscribeCustom = null

  // Initialize recently used from localStorage
  function initRecentlyUsed() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        recentlyUsed.value = JSON.parse(stored)
      }
    } catch (err) {
      console.error('Error loading recently used exercises:', err)
    }
  }

  // Getters
  /**
   * Get all exercises (shared + custom)
   */
  const allExercises = computed(() => {
    return [...exercises.value, ...customExercises.value]
  })

  /**
   * Group exercises by muscle group
   */
  const byMuscleGroup = computed(() => {
    const grouped = {}

    MUSCLE_GROUPS.forEach((group) => {
      grouped[group.id] = allExercises.value.filter(
        (exercise) =>
          exercise.muscleGroup === group.id ||
          exercise.secondaryMuscles?.includes(group.id)
      )
    })

    return grouped
  })

  /**
   * Search results based on current query
   */
  const searchResults = computed(() => {
    if (!searchQuery.value.trim()) {
      return allExercises.value
    }

    const query = searchQuery.value.toLowerCase().trim()

    return allExercises.value.filter((exercise) => {
      const nameMatch = exercise.name.toLowerCase().includes(query)
      const categoryMatch = exercise.category?.toLowerCase().includes(query)
      const primaryMuscleMatch = exercise.muscleGroup?.toLowerCase().includes(query)
      const secondaryMuscleMatch = exercise.secondaryMuscles?.some((muscle) =>
        muscle.toLowerCase().includes(query)
      )
      const equipmentMatch = exercise.equipment?.toLowerCase().includes(query)

      return (
        nameMatch ||
        categoryMatch ||
        primaryMuscleMatch ||
        secondaryMuscleMatch ||
        equipmentMatch
      )
    })
  })

  /**
   * Get recently used exercises with full exercise data
   */
  const recentExercises = computed(() => {
    return recentlyUsed.value
      .map((id) => allExercises.value.find((ex) => ex.id === id))
      .filter(Boolean) // Remove undefined entries
  })

  /**
   * Get exercises by category
   */
  const byCategory = computed(() => {
    const grouped = {}

    categories.value.forEach((category) => {
      grouped[category] = allExercises.value.filter(
        (exercise) => exercise.category === category
      )
    })

    return grouped
  })

  // Actions
  /**
   * Load default exercises from local data
   * Default exercises are stored locally to avoid cluttering Firestore
   * @returns {Promise<void>}
   */
  async function fetchExercises() {
    loading.value = true
    error.value = null

    try {
      // Use slug as id for default exercises
      exercises.value = defaultExercises.map((ex) => ({
        ...ex,
        id: ex.slug,
        isCustom: false,
      }))
    } catch (err) {
      console.error('Error loading default exercises:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch user's custom exercises
   * @returns {Promise<void>}
   */
  async function fetchCustomExercises() {
    if (!authStore.uid) return

    loading.value = true
    error.value = null

    try {
      const customPath = `users/${authStore.uid}/customExercises`
      const fetchedCustom = await fetchCollection(customPath, {
        orderBy: [['name', 'asc']],
      })

      customExercises.value = fetchedCustom.map((ex) => ({
        ...ex,
        isCustom: true,
      }))
    } catch (err) {
      console.error('Error fetching custom exercises:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Subscribe to user's custom exercises real-time updates
   * @returns {Function|null} Unsubscribe function
   */
  function subscribeToCustom() {
    if (!authStore.uid) return null

    // Cleanup existing subscription
    if (unsubscribeCustom) {
      unsubscribeCustom()
    }

    const customPath = `users/${authStore.uid}/customExercises`

    unsubscribeCustom = subscribeToCollection(
      customPath,
      {
        orderBy: [['name', 'asc']],
      },
      (fetchedCustom) => {
        customExercises.value = fetchedCustom.map((ex) => ({
          ...ex,
          isCustom: true,
        }))
      },
      (err) => {
        console.error('Error in custom exercises subscription:', err)
        error.value = err.message
      }
    )

    return unsubscribeCustom
  }

  /**
   * Search exercises by query
   * @param {string} query - Search query
   */
  function searchExercises(query) {
    searchQuery.value = query
  }

  /**
   * Clear search query
   */
  function clearSearch() {
    searchQuery.value = ''
  }

  /**
   * Add custom exercise
   * @param {Object} exerciseData - Exercise data
   * @param {string} exerciseData.name - Exercise name
   * @param {string} exerciseData.category - Category
   * @param {string[]} exerciseData.muscleGroups - Muscle groups
   * @param {string} exerciseData.equipment - Equipment
   * @param {string} [exerciseData.description] - Description
   * @returns {Promise<string>} Exercise ID
   * @throws {Error} If user not authenticated
   */
  async function addCustomExercise(exerciseData) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated to add custom exercises')
    }

    loading.value = true
    error.value = null

    try {
      const exercise = {
        ...exerciseData,
        userId: authStore.uid,
        createdAt: new Date().toISOString(),
      }

      const customPath = `users/${authStore.uid}/customExercises`
      const exerciseId = await createDocument(customPath, exercise)

      return exerciseId
    } catch (err) {
      console.error('Error adding custom exercise:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update custom exercise
   * @param {string} exerciseId - Exercise ID
   * @param {Object} updates - Exercise updates
   * @returns {Promise<void>}
   * @throws {Error} If user not authenticated
   */
  async function updateCustomExercise(exerciseId, updates) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    loading.value = true
    error.value = null

    try {
      const customPath = `users/${authStore.uid}/customExercises`
      await updateDocument(customPath, exerciseId, updates)
    } catch (err) {
      console.error('Error updating custom exercise:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Add exercise to recently used list
   * Stored in localStorage for quick access
   * @param {string} exerciseId - Exercise ID
   */
  function addToRecent(exerciseId) {
    try {
      // Remove if already exists
      const filtered = recentlyUsed.value.filter((id) => id !== exerciseId)

      // Add to beginning
      recentlyUsed.value = [exerciseId, ...filtered].slice(0, MAX_RECENT)

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyUsed.value))
    } catch (err) {
      console.error('Error adding to recent exercises:', err)
    }
  }

  /**
   * Get exercise by ID
   * @param {string} exerciseId - Exercise ID
   * @returns {Exercise|undefined}
   */
  function getExerciseById(exerciseId) {
    return allExercises.value.find((ex) => ex.id === exerciseId)
  }

  /**
   * Filter exercises by muscle group
   * @param {string} muscleGroupId - Muscle group ID
   * @returns {Exercise[]}
   */
  function filterByMuscleGroup(muscleGroupId) {
    return allExercises.value.filter(
      (exercise) =>
        exercise.muscleGroup === muscleGroupId ||
        exercise.secondaryMuscles?.includes(muscleGroupId)
    )
  }

  /**
   * Filter exercises by category
   * @param {string} category - Category name
   * @returns {Exercise[]}
   */
  function filterByCategory(category) {
    return allExercises.value.filter((exercise) => exercise.category === category)
  }

  /**
   * Cleanup subscriptions
   */
  function unsubscribe() {
    if (unsubscribeCustom) {
      unsubscribeCustom()
      unsubscribeCustom = null
    }
  }

  /**
   * Get localized display name for an exercise
   * Handles both bilingual objects and simple strings
   * @param {Exercise} exercise - Exercise object
   * @returns {string} Localized exercise name
   */
  function getExerciseDisplayName(exercise) {
    if (!exercise || !exercise.name) return ''

    // Handle bilingual structure: { uk: '...', en: '...' }
    if (typeof exercise.name === 'object') {
      // Get current locale from localStorage or default to 'uk'
      const currentLocale = localStorage.getItem('obsessed_locale') || 'uk'
      return exercise.name[currentLocale] || exercise.name.en || exercise.name.uk || ''
    }

    // Handle simple string (legacy support)
    return exercise.name
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null
  }

  // Initialize
  initRecentlyUsed()

  return {
    // State
    exercises: computed(() => exercises.value),
    customExercises: computed(() => customExercises.value),
    categories: computed(() => categories.value),
    recentlyUsed: computed(() => recentlyUsed.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    searchQuery: computed(() => searchQuery.value),

    // Getters
    allExercises,
    byMuscleGroup,
    byCategory,
    searchResults,
    recentExercises,

    // Actions
    fetchExercises,
    fetchCustomExercises,
    subscribeToCustom,
    searchExercises,
    clearSearch,
    addCustomExercise,
    updateCustomExercise,
    addToRecent,
    getExerciseById,
    getExerciseDisplayName,
    filterByMuscleGroup,
    filterByCategory,
    unsubscribe,
    clearError,
  }
})
