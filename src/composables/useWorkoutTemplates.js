import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useI18n } from 'vue-i18n'

/**
 * Composable for managing workout templates with filtering and sorting
 * @param {Object} filters - Initial filter configuration
 * @param {string} filters.search - Initial search query
 * @param {string} filters.muscle - Initial muscle filter
 * @param {string} filters.sortBy - Initial sort order ('usage' | 'name' | 'recent')
 * @returns {Object} Template management interface
 */
export function useWorkoutTemplates(filters = {}) {
  const scheduleStore = useScheduleStore()
  const { templates } = storeToRefs(scheduleStore)
  const { t } = useI18n()

  const searchQuery = ref(filters.search || '')
  const muscleFilter = ref(filters.muscle || 'all')
  const sortBy = ref(filters.sortBy || 'usage') // 'usage' | 'name' | 'recent'

  const filteredTemplates = computed(() => {
    let result = templates.value

    // Filter by search query
    if (searchQuery.value) {
      result = result.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )
    }

    // Filter by muscle group
    if (muscleFilter.value !== 'all') {
      result = result.filter((t) => t.muscleGroups.includes(muscleFilter.value))
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy.value) {
        case 'usage':
          return b.usageCount - a.usageCount
        case 'name':
          return a.name.localeCompare(b.name)
        case 'recent':
          return (b.lastUsedAt || 0) - (a.lastUsedAt || 0)
        default:
          return 0
      }
    })

    return result
  })

  const templateSummary = computed(() => {
    return {
      total: templates.value.length,
      byMuscle: scheduleStore.templatesByMuscle,
    }
  })

  return {
    templates: filteredTemplates,
    summary: templateSummary,
    searchQuery,
    muscleFilter,
    sortBy,
  }
}
