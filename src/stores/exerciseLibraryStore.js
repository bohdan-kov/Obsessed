import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { useExerciseStore } from './exerciseStore'
import { useUserStore } from './userStore'
import { useWorkoutStore } from './workoutStore'
import { fetchDocument, setDocument, deleteDocument } from '@/firebase/firestore'
import { CONFIG } from '@/constants/config'
import { useErrorHandler } from '@/composables/useErrorHandler'

/**
 * @typedef {Object} ExerciseFilters
 * @property {string|null} muscleGroup - Filter by muscle group
 * @property {string|null} equipment - Filter by equipment type
 * @property {string|null} exerciseType - Filter by compound/isolation
 * @property {boolean} showFavoritesOnly - Show only favorite exercises
 */

/**
 * Exercise Library Store
 * Manages filtering, sorting, notes, and favorites for exercises
 * Depends on exerciseStore for the actual exercise data
 */
export const useExerciseLibraryStore = defineStore('exerciseLibrary', () => {
  const authStore = useAuthStore()
  const exerciseStore = useExerciseStore()
  const userStore = useUserStore()
  const workoutStore = useWorkoutStore()
  const { handleError } = useErrorHandler()

  // State
  const filters = ref({
    muscleGroup: null,
    equipment: null,
    exerciseType: null,
    showFavoritesOnly: false,
  })
  const sortBy = ref('alphabetical')
  const searchQuery = ref('')
  const notes = ref({}) // { [exerciseId]: { text, updatedAt, saving } }
  const selectedExerciseId = ref(null)
  const loading = ref(false)
  const currentPage = ref(1) // Pagination: current page number
  const itemsPerPage = ref(CONFIG.exercise.EXERCISES_PER_PAGE) // Dynamic items per page

  // Real-time listener cleanup
  let unsubscribeNotes = null

  // Getters
  /**
   * Get favorite exercise IDs from user settings
   */
  const favorites = computed(() => {
    return userStore.settings?.favoriteExercises || []
  })

  /**
   * Get recently used exercise IDs from user settings
   */
  const recentlyUsed = computed(() => {
    return userStore.settings?.recentlyUsedExercises || []
  })

  /**
   * Check if an exercise is favorited
   * @param {string} exerciseId - Exercise ID
   * @returns {boolean} True if favorited
   */
  function isFavorite(exerciseId) {
    return favorites.value.includes(exerciseId)
  }

  /**
   * Get note for an exercise
   * @param {string} exerciseId - Exercise ID
   * @returns {ComputedRef<Object>}
   */
  const getNote = (exerciseId) => {
    return computed(() => notes.value[exerciseId] || { text: '', updatedAt: null })
  }

  /**
   * Get searchable name strings for an exercise
   * Handles both bilingual objects and simple strings
   * @param {Object} exercise - Exercise object
   * @returns {{ uk: string, en: string }}
   */
  function getSearchableNames(exercise) {
    if (!exercise || !exercise.name) {
      return { uk: '', en: '' }
    }

    // Handle bilingual structure: { uk: '...', en: '...' }
    if (typeof exercise.name === 'object') {
      return {
        uk: (exercise.name.uk || '').toLowerCase(),
        en: (exercise.name.en || '').toLowerCase(),
      }
    }

    // Handle simple string (fallback for legacy data)
    const name = exercise.name.toLowerCase()
    return { uk: name, en: name }
  }

  /**
   * Get filtered and sorted exercises
   */
  const filteredAndSortedExercises = computed(() => {
    let result = [...exerciseStore.allExercises]

    // Apply favorites filter first
    if (filters.value.showFavoritesOnly) {
      result = result.filter((ex) => favorites.value.includes(ex.id))
    }

    // Apply muscle group filter
    if (filters.value.muscleGroup && filters.value.muscleGroup !== 'all') {
      result = result.filter(
        (ex) =>
          ex.muscleGroup === filters.value.muscleGroup ||
          ex.secondaryMuscles?.includes(filters.value.muscleGroup)
      )
    }

    // Apply equipment filter
    if (filters.value.equipment && filters.value.equipment !== 'all') {
      result = result.filter((ex) => ex.equipment === filters.value.equipment)
    }

    // Apply exercise type filter
    if (filters.value.exerciseType && filters.value.exerciseType !== 'all') {
      result = result.filter((ex) => ex.type === filters.value.exerciseType)
    }

    // Apply search query (bilingual search in UK and EN names)
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter((ex) => {
        const names = getSearchableNames(ex)
        return names.uk.includes(query) || names.en.includes(query)
      })
    }

    // Apply sorting
    result = applySorting(result, sortBy.value)

    return result
  })

  /**
   * Get favorite exercises with full data
   */
  const favoriteExercises = computed(() => {
    return favorites.value
      .map((id) => exerciseStore.getExerciseById(id))
      .filter(Boolean) // Remove undefined entries
  })

  /**
   * Get recently used exercises with full data
   */
  const recentExercises = computed(() => {
    return recentlyUsed.value
      .map((id) => exerciseStore.getExerciseById(id))
      .filter(Boolean)
  })

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = computed(() => {
    return (
      filters.value.muscleGroup ||
      filters.value.equipment ||
      filters.value.exerciseType ||
      filters.value.showFavoritesOnly ||
      searchQuery.value.trim()
    )
  })

  /**
   * Get paginated exercises (current page only)
   * Page-based pagination: shows only the current page items
   */
  const paginatedExercises = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage.value
    const endIndex = startIndex + itemsPerPage.value
    return filteredAndSortedExercises.value.slice(startIndex, endIndex)
  })

  /**
   * Total number of pages
   */
  const totalPages = computed(() => {
    const totalItems = filteredAndSortedExercises.value.length
    return Math.ceil(totalItems / itemsPerPage.value)
  })

  /**
   * Check if there is a next page
   */
  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value
  })

  /**
   * Check if there is a previous page
   */
  const hasPreviousPage = computed(() => {
    return currentPage.value > 1
  })

  /**
   * Total number of exercises (after filters)
   */
  const totalExercises = computed(() => filteredAndSortedExercises.value.length)

  /**
   * Number of exercises currently visible on this page
   */
  const visibleExerciseCount = computed(() => paginatedExercises.value.length)

  /**
   * Get range of items shown on current page (e.g., "1-20")
   */
  const currentPageRange = computed(() => {
    if (totalExercises.value === 0) {
      return { start: 0, end: 0 }
    }
    const start = (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(currentPage.value * itemsPerPage.value, totalExercises.value)
    return { start, end }
  })

  // Actions
  /**
   * Go to a specific page
   * @param {number} page - Page number (1-indexed)
   */
  function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  /**
   * Go to next page
   */
  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value += 1
    }
  }

  /**
   * Go to previous page
   */
  function previousPage() {
    if (hasPreviousPage.value) {
      currentPage.value -= 1
    }
  }

  /**
   * Reset pagination to first page
   * Called when filters or search changes
   */
  function resetPagination() {
    currentPage.value = 1
  }

  /**
   * Set items per page (for dynamic pagination)
   * @param {number} count - Number of items per page
   */
  function setItemsPerPage(count) {
    if (count > 0) {
      itemsPerPage.value = count
      // Reset to first page when items per page changes
      // unless we're on the first page already
      if (currentPage.value > totalPages.value) {
        resetPagination()
      }
    }
  }

  /**
   * Apply sorting to exercises
   * @param {Array} exercises - Exercises to sort
   * @param {string} sortOption - Sort option
   * @returns {Array} Sorted exercises
   */
  function applySorting(exercises, sortOption) {
    const sorted = [...exercises]

    switch (sortOption) {
      case 'alphabetical':
        sorted.sort((a, b) => {
          const nameA = a.name?.uk || a.name || ''
          const nameB = b.name?.uk || b.name || ''
          return nameA.localeCompare(nameB, 'uk')
        })
        break

      case 'muscleGroup':
        sorted.sort((a, b) => {
          const muscleA = a.muscleGroup || ''
          const muscleB = b.muscleGroup || ''
          if (muscleA === muscleB) {
            const nameA = a.name?.uk || a.name || ''
            const nameB = b.name?.uk || b.name || ''
            return nameA.localeCompare(nameB, 'uk')
          }
          return muscleA.localeCompare(muscleB)
        })
        break

      case 'recent':
        sorted.sort((a, b) => {
          const indexA = recentlyUsed.value.indexOf(a.id)
          const indexB = recentlyUsed.value.indexOf(b.id)

          // Not in recent list -> put at end
          if (indexA === -1 && indexB === -1) return 0
          if (indexA === -1) return 1
          if (indexB === -1) return -1

          // Lower index = more recent
          return indexA - indexB
        })
        break

      case 'frequent': {
        // Pre-compute all usage counts ONCE to avoid O(n²) performance
        const usageCounts = new Map()
        sorted.forEach(ex => {
          usageCounts.set(ex.id, countExerciseUsage(ex.id))
        })

        // Now sort using cached counts
        sorted.sort((a, b) => {
          const countA = usageCounts.get(a.id) || 0
          const countB = usageCounts.get(b.id) || 0
          return countB - countA // Descending
        })
        break
      }
    }

    return sorted
  }

  /**
   * Count how many times an exercise has been used in workouts
   * @param {string} exerciseId - Exercise ID
   * @returns {number} Usage count
   */
  function countExerciseUsage(exerciseId) {
    return workoutStore.workouts.reduce((count, workout) => {
      const hasExercise = workout.exercises?.some((ex) => ex.exerciseId === exerciseId)
      return count + (hasExercise ? 1 : 0)
    }, 0)
  }

  /**
   * Set a filter value
   * @param {string} key - Filter key
   * @param {any} value - Filter value
   */
  function setFilter(key, value) {
    if (key in filters.value) {
      filters.value[key] = value
      resetPagination() // Reset to first page when filter changes
    }
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    filters.value = {
      muscleGroup: null,
      equipment: null,
      exerciseType: null,
      showFavoritesOnly: false,
    }
    searchQuery.value = ''
    resetPagination() // Reset to first page when clearing filters
  }

  /**
   * Set sort option
   * @param {string} option - Sort option
   */
  function setSortBy(option) {
    sortBy.value = option
    resetPagination() // Reset to first page when sort changes
  }

  /**
   * Set search query
   * @param {string} query - Search query
   */
  function setSearchQuery(query) {
    searchQuery.value = query
    resetPagination() // Reset to first page when search changes
  }

  /**
   * Toggle favorite status for an exercise
   * Delegates to userStore
   * @param {string} exerciseId - Exercise ID
   * @returns {Promise<boolean>} New favorite status
   */
  async function toggleFavorite(exerciseId) {
    try {
      await userStore.toggleFavoriteExercise(exerciseId)
      return favorites.value.includes(exerciseId)
    } catch (error) {
      handleError(error, 'Failed to update favorites')
      throw error
    }
  }

  /**
   * Save note for an exercise
   * Works for both base exercises and custom exercises
   * Notes are stored in a separate subcollection: users/{userId}/exerciseNotes/{exerciseId}
   * @param {string} exerciseId - Exercise ID (can be a base exercise slug or custom exercise ID)
   * @param {string} text - Note text
   * @returns {Promise<void>}
   */
  async function saveNote(exerciseId, text) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    try {
      // Optimistic update
      notes.value[exerciseId] = {
        ...notes.value[exerciseId],
        text,
        saving: true,
      }

      // Notes are stored in a subcollection under the user document
      // This works for both base exercises (slug-based IDs) and custom exercises (Firestore IDs)
      const notePath = `users/${authStore.uid}/exerciseNotes`

      // Use setDocument with merge to create if not exists or update if exists
      // This ensures we can save notes for any exercise, regardless of whether
      // the exercise itself exists in Firestore (important for base exercises)
      await setDocument(
        notePath,
        exerciseId,
        {
          note: text,
          // Don't pass updatedAt here - it's added automatically by setDocument
        },
        { merge: true }
      )

      // Update local state with current timestamp
      // The actual server timestamp will be synced from Firestore
      notes.value[exerciseId] = {
        text,
        updatedAt: new Date(),
        saving: false,
      }
    } catch (error) {
      // Revert optimistic update on error
      await loadNote(exerciseId)

      // Use i18n-ready error message
      // The error handler will log technical details, show user-friendly message
      handleError(error, 'exercises.toast.notesSaveFailed', { isI18nKey: true })
      throw error
    }
  }

  /**
   * Load note for an exercise
   * Works for both base exercises and custom exercises
   * @param {string} exerciseId - Exercise ID (can be a base exercise slug or custom exercise ID)
   * @returns {Promise<void>}
   */
  async function loadNote(exerciseId) {
    if (!authStore.uid) return

    try {
      const notePath = `users/${authStore.uid}/exerciseNotes`
      const noteData = await fetchDocument(notePath, exerciseId)

      if (noteData) {
        notes.value[exerciseId] = {
          text: noteData.note || '',
          updatedAt: noteData.updatedAt,
          saving: false,
        }
      } else {
        // No note exists yet - initialize with empty state
        notes.value[exerciseId] = {
          text: '',
          updatedAt: null,
          saving: false,
        }
      }
    } catch (error) {
      handleError(error, 'exercises.toast.notesLoadFailed', { isI18nKey: true })
      // Initialize with empty state on error
      notes.value[exerciseId] = {
        text: '',
        updatedAt: null,
        saving: false,
      }
    }
  }

  /**
   * Create a new exercise
   * Delegates to exerciseStore
   * @param {Object} exerciseData - Exercise data
   * @returns {Promise<string>} Exercise ID
   */
  async function createExercise(exerciseData) {
    try {
      loading.value = true
      const exerciseId = await exerciseStore.addCustomExercise(exerciseData)
      return exerciseId
    } catch (error) {
      handleError(error, 'Failed to create exercise')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an exercise
   * Delegates to exerciseStore
   * @param {string} exerciseId - Exercise ID
   * @param {Object} updates - Exercise updates
   * @returns {Promise<void>}
   */
  async function updateExercise(exerciseId, updates) {
    try {
      loading.value = true
      await exerciseStore.updateCustomExercise(exerciseId, updates)
    } catch (error) {
      handleError(error, 'Failed to update exercise')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete an exercise
   * Soft delete if used in workouts, hard delete otherwise
   * @param {string} exerciseId - Exercise ID
   * @returns {Promise<void>}
   */
  async function deleteExercise(exerciseId) {
    if (!authStore.uid) {
      throw new Error('User must be authenticated')
    }

    try {
      loading.value = true

      // Check if exercise is used in any workouts
      const usageCount = countExerciseUsage(exerciseId)

      if (usageCount > 0) {
        // Soft delete: mark as deleted but preserve data
        await exerciseStore.updateCustomExercise(exerciseId, {
          deleted: true,
          deletedAt: new Date(),
        })
      } else {
        // Hard delete: completely remove from Firestore
        const customPath = `users/${authStore.uid}/customExercises`
        await deleteDocument(customPath, exerciseId)
      }

      // Remove from favorites if present
      if (favorites.value.includes(exerciseId)) {
        await toggleFavorite(exerciseId)
      }
    } catch (error) {
      handleError(error, 'Failed to delete exercise')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Select an exercise (for detail view)
   * @param {string|null} exerciseId - Exercise ID or null to deselect
   */
  function selectExercise(exerciseId) {
    selectedExerciseId.value = exerciseId
  }

  /**
   * Get selected exercise
   */
  const selectedExercise = computed(() => {
    if (!selectedExerciseId.value) return null
    return exerciseStore.getExerciseById(selectedExerciseId.value)
  })

  /**
   * Load cache from localStorage
   */
  function loadFromCache() {
    try {
      const cached = localStorage.getItem(CONFIG.exercise.CACHE_KEY)
      if (!cached) return null

      const data = JSON.parse(cached)

      // Check version and TTL
      if (
        data.version !== CONFIG.exercise.CACHE_VERSION ||
        Date.now() - data.timestamp > CONFIG.exercise.CACHE_TTL
      ) {
        localStorage.removeItem(CONFIG.exercise.CACHE_KEY)
        return null
      }

      return data.exercises
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[exerciseLibraryStore] Error loading cache:', error)
      }
      return null
    }
  }

  /**
   * Save to cache in localStorage
   * @param {Array} exercises - Exercises to cache
   */
  function saveToCache(exercises) {
    try {
      const data = {
        version: CONFIG.exercise.CACHE_VERSION,
        timestamp: Date.now(),
        exercises,
      }
      localStorage.setItem(CONFIG.exercise.CACHE_KEY, JSON.stringify(data))
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[exerciseLibraryStore] Error saving cache:', error)
      }
    }
  }

  /**
   * Clear cache
   */
  function clearCache() {
    localStorage.removeItem(CONFIG.exercise.CACHE_KEY)
  }

  /**
   * Cleanup subscriptions
   */
  function unsubscribe() {
    if (unsubscribeNotes) {
      unsubscribeNotes()
      unsubscribeNotes = null
    }
  }

  return {
    // State - return direct refs for two-way binding reactivity
    filters,
    sortBy,
    searchQuery,
    notes,
    selectedExerciseId,
    loading,
    currentPage,
    itemsPerPage,

    // Getters
    favorites,
    recentlyUsed,
    isFavorite,
    getNote,
    filteredAndSortedExercises,
    favoriteExercises,
    recentExercises,
    hasActiveFilters,
    selectedExercise,
    paginatedExercises,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    totalExercises,
    visibleExerciseCount,
    currentPageRange,

    // Actions
    setFilter,
    resetFilters,
    setSortBy,
    setSearchQuery,
    toggleFavorite,
    saveNote,
    loadNote,
    createExercise,
    updateExercise,
    deleteExercise,
    selectExercise,
    countExerciseUsage,
    loadFromCache,
    saveToCache,
    clearCache,
    unsubscribe,
    goToPage,
    nextPage,
    previousPage,
    resetPagination,
    setItemsPerPage,
  }
})
