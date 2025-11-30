import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Exercise Filters Composable
 * Provides client-side filtering and sorting logic for exercises
 *
 * @param {ComputedRef<Array>} exercises - Reactive array of exercises
 * @param {ComputedRef<Object>} filters - Reactive filter object
 * @param {ComputedRef<string>} searchQuery - Reactive search query
 * @param {ComputedRef<Array>} favoriteIds - Array of favorite exercise IDs
 * @param {ComputedRef<Array>} recentIds - Array of recently used exercise IDs
 * @returns {Object} Filtering utilities
 */
export function useExerciseFilters(
  exercises,
  filters,
  searchQuery,
  favoriteIds = computed(() => []),
  recentIds = computed(() => [])
) {
  const { locale } = useI18n()

  /**
   * Apply muscle group filter
   */
  const filteredByMuscleGroup = computed(() => {
    if (!filters.value.muscleGroup || filters.value.muscleGroup === 'all') {
      return exercises.value
    }

    return exercises.value.filter(
      (ex) =>
        ex.muscleGroup === filters.value.muscleGroup ||
        ex.secondaryMuscles?.includes(filters.value.muscleGroup)
    )
  })

  /**
   * Apply equipment filter
   */
  const filteredByEquipment = computed(() => {
    if (!filters.value.equipment || filters.value.equipment === 'all') {
      return filteredByMuscleGroup.value
    }

    return filteredByMuscleGroup.value.filter(
      (ex) => ex.equipment === filters.value.equipment
    )
  })

  /**
   * Apply exercise type filter
   */
  const filteredByType = computed(() => {
    if (!filters.value.exerciseType || filters.value.exerciseType === 'all') {
      return filteredByEquipment.value
    }

    return filteredByEquipment.value.filter(
      (ex) => ex.type === filters.value.exerciseType
    )
  })

  /**
   * Apply favorites filter
   */
  const filteredByFavorites = computed(() => {
    if (!filters.value.showFavoritesOnly) {
      return filteredByType.value
    }

    return filteredByType.value.filter((ex) => favoriteIds.value.includes(ex.id))
  })

  /**
   * Apply search query (bilingual)
   */
  const searchResults = computed(() => {
    if (!searchQuery.value?.trim()) {
      return filteredByFavorites.value
    }

    const query = searchQuery.value.toLowerCase().trim()

    return filteredByFavorites.value.filter((ex) => {
      // Search in bilingual names
      const nameUk = ex.name?.uk?.toLowerCase() || ''
      const nameEn = ex.name?.en?.toLowerCase() || ''

      // Also search in legacy string name (for backward compatibility)
      const nameLegacy = typeof ex.name === 'string' ? ex.name.toLowerCase() : ''

      // Search in muscle groups (primary and secondary)
      const primaryMuscleMatch = ex.muscleGroup?.toLowerCase().includes(query)
      const secondaryMuscleMatch = ex.secondaryMuscles?.some((muscle) =>
        muscle.toLowerCase().includes(query)
      )

      // Search in equipment
      const equipmentMatch = ex.equipment?.toLowerCase().includes(query)

      return (
        nameUk.includes(query) ||
        nameEn.includes(query) ||
        nameLegacy.includes(query) ||
        primaryMuscleMatch ||
        secondaryMuscleMatch ||
        equipmentMatch
      )
    })
  })

  /**
   * Get localized name for an exercise
   * @param {Object} exercise - Exercise object
   * @returns {string} Localized name
   */
  const getLocalizedName = (exercise) => {
    if (!exercise) return ''

    // If name is an object with bilingual support
    if (typeof exercise.name === 'object' && exercise.name !== null) {
      return exercise.name[locale.value] || exercise.name.uk || exercise.name.en || ''
    }

    // Legacy string name
    return exercise.name || ''
  }

  /**
   * Get localized description for an exercise
   * @param {Object} exercise - Exercise object
   * @returns {string} Localized description
   */
  const getLocalizedDescription = (exercise) => {
    if (!exercise?.description) return ''

    // If description is an object with bilingual support
    if (typeof exercise.description === 'object' && exercise.description !== null) {
      return (
        exercise.description[locale.value] ||
        exercise.description.uk ||
        exercise.description.en ||
        ''
      )
    }

    // Legacy string description
    return exercise.description || ''
  }

  /**
   * Sort exercises
   * @param {Array} exercisesToSort - Exercises to sort
   * @param {string} sortBy - Sort option
   * @returns {Array} Sorted exercises
   */
  const sortExercises = (exercisesToSort, sortBy) => {
    const sorted = [...exercisesToSort]

    switch (sortBy) {
      case 'alphabetical':
        sorted.sort((a, b) => {
          const nameA = getLocalizedName(a)
          const nameB = getLocalizedName(b)
          return nameA.localeCompare(nameB, locale.value)
        })
        break

      case 'muscleGroup':
        sorted.sort((a, b) => {
          const muscleA = a.muscleGroup || ''
          const muscleB = b.muscleGroup || ''

          if (muscleA === muscleB) {
            const nameA = getLocalizedName(a)
            const nameB = getLocalizedName(b)
            return nameA.localeCompare(nameB, locale.value)
          }

          return muscleA.localeCompare(muscleB)
        })
        break

      case 'recent':
        sorted.sort((a, b) => {
          const indexA = recentIds.value.indexOf(a.id)
          const indexB = recentIds.value.indexOf(b.id)

          // Not in recent list -> put at end
          if (indexA === -1 && indexB === -1) {
            // Alphabetical within non-recent
            const nameA = getLocalizedName(a)
            const nameB = getLocalizedName(b)
            return nameA.localeCompare(nameB, locale.value)
          }
          if (indexA === -1) return 1
          if (indexB === -1) return -1

          // Lower index = more recent
          return indexA - indexB
        })
        break

      case 'frequent':
        // This requires workout data, handled in the store
        // Here we just maintain the order
        break
    }

    return sorted
  }

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = computed(() => {
    return (
      (filters.value.muscleGroup && filters.value.muscleGroup !== 'all') ||
      (filters.value.equipment && filters.value.equipment !== 'all') ||
      (filters.value.exerciseType && filters.value.exerciseType !== 'all') ||
      filters.value.showFavoritesOnly ||
      searchQuery.value?.trim()
    )
  })

  /**
   * Get filter summary text
   */
  const filterSummary = computed(() => {
    const parts = []

    if (filters.value.muscleGroup && filters.value.muscleGroup !== 'all') {
      parts.push(filters.value.muscleGroup)
    }

    if (filters.value.equipment && filters.value.equipment !== 'all') {
      parts.push(filters.value.equipment)
    }

    if (filters.value.exerciseType && filters.value.exerciseType !== 'all') {
      parts.push(filters.value.exerciseType)
    }

    if (filters.value.showFavoritesOnly) {
      parts.push('favorites')
    }

    if (searchQuery.value?.trim()) {
      parts.push(`search: "${searchQuery.value.trim()}"`)
    }

    return parts.join(', ')
  })

  return {
    // Filtered results
    searchResults,

    // Utilities
    getLocalizedName,
    getLocalizedDescription,
    sortExercises,

    // Status
    hasActiveFilters,
    filterSummary,
  }
}
