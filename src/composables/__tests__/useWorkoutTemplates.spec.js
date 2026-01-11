import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkoutTemplates } from '../useWorkoutTemplates'
import { useScheduleStore } from '@/stores/scheduleStore'
import { nextTick } from 'vue'

vi.mock('@/firebase/firestore', () => ({
  COLLECTIONS: { USERS: 'users' },
  subscribeToCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(),
  signOutUser: vi.fn(),
}))

describe('useWorkoutTemplates', () => {
  let scheduleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    scheduleStore = useScheduleStore()

    // Setup mock templates
    scheduleStore.templates = [
      {
        id: 't1',
        name: 'Push Day',
        muscleGroups: ['chest', 'shoulders'],
        exercises: [{ name: 'Bench Press' }],
        usageCount: 10,
        lastUsedAt: Date.now(),
      },
      {
        id: 't2',
        name: 'Pull Day',
        muscleGroups: ['back'],
        exercises: [{ name: 'Deadlift' }],
        usageCount: 5,
        lastUsedAt: Date.now() - 86400000,
      },
      {
        id: 't3',
        name: 'Leg Day',
        muscleGroups: ['legs'],
        exercises: [{ name: 'Squat' }],
        usageCount: 8,
        lastUsedAt: Date.now() - 172800000,
      },
    ]
  })

  describe('Basic Functionality', () => {
    it('should return all templates by default', () => {
      const { templates } = useWorkoutTemplates()
      expect(templates.value).toHaveLength(3)
    })

    it('should provide template summary', () => {
      const { summary } = useWorkoutTemplates()
      expect(summary.value.total).toBe(3)
      expect(summary.value.byMuscle).toBeDefined()
    })
  })

  describe('Search Filtering', () => {
    it('should filter templates by search query', async () => {
      const { templates, searchQuery } = useWorkoutTemplates()

      searchQuery.value = 'push'
      await nextTick()

      expect(templates.value).toHaveLength(1)
      expect(templates.value[0].name).toBe('Push Day')
    })

    it('should be case-insensitive in search', async () => {
      const { templates, searchQuery } = useWorkoutTemplates()

      searchQuery.value = 'PULL'
      await nextTick()

      expect(templates.value).toHaveLength(1)
      expect(templates.value[0].name).toBe('Pull Day')
    })

    it('should return empty array when no matches', async () => {
      const { templates, searchQuery } = useWorkoutTemplates()

      searchQuery.value = 'nonexistent'
      await nextTick()

      expect(templates.value).toHaveLength(0)
    })
  })

  describe('Muscle Group Filtering', () => {
    it('should filter templates by muscle group', async () => {
      const { templates, muscleFilter } = useWorkoutTemplates()

      muscleFilter.value = 'chest'
      await nextTick()

      expect(templates.value).toHaveLength(1)
      expect(templates.value[0].muscleGroups).toContain('chest')
    })

    it('should show all templates when filter is "all"', async () => {
      const { templates, muscleFilter } = useWorkoutTemplates()

      muscleFilter.value = 'all'
      await nextTick()

      expect(templates.value).toHaveLength(3)
    })

    it('should handle templates with multiple muscle groups', async () => {
      const { templates, muscleFilter } = useWorkoutTemplates()

      muscleFilter.value = 'shoulders'
      await nextTick()

      expect(templates.value).toHaveLength(1)
      expect(templates.value[0].name).toBe('Push Day')
    })
  })

  describe('Sorting', () => {
    it('should sort by usage count (default)', () => {
      const { templates } = useWorkoutTemplates()

      expect(templates.value[0].usageCount).toBe(10)
      expect(templates.value[1].usageCount).toBe(8)
      expect(templates.value[2].usageCount).toBe(5)
    })

    it('should sort by name alphabetically', async () => {
      const { templates, sortBy } = useWorkoutTemplates()

      sortBy.value = 'name'
      await nextTick()

      expect(templates.value[0].name).toBe('Leg Day')
      expect(templates.value[1].name).toBe('Pull Day')
      expect(templates.value[2].name).toBe('Push Day')
    })

    it('should sort by recent usage', async () => {
      const { templates, sortBy } = useWorkoutTemplates()

      sortBy.value = 'recent'
      await nextTick()

      // Most recent first
      expect(templates.value[0].name).toBe('Push Day')
      expect(templates.value[1].name).toBe('Pull Day')
      expect(templates.value[2].name).toBe('Leg Day')
    })
  })

  describe('Combined Filters', () => {
    it('should apply search and muscle filter together', async () => {
      const { templates, searchQuery, muscleFilter } = useWorkoutTemplates()

      searchQuery.value = 'day'
      muscleFilter.value = 'legs'
      await nextTick()

      expect(templates.value).toHaveLength(1)
      expect(templates.value[0].name).toBe('Leg Day')
    })

    it('should apply search, filter, and sort together', async () => {
      scheduleStore.templates.push({
        id: 't4',
        name: 'Advanced Push',
        muscleGroups: ['chest'],
        usageCount: 15,
        lastUsedAt: Date.now(),
      })

      const { templates, searchQuery, muscleFilter, sortBy } = useWorkoutTemplates()

      searchQuery.value = 'push'
      muscleFilter.value = 'chest'
      sortBy.value = 'name'
      await nextTick()

      expect(templates.value).toHaveLength(2)
      expect(templates.value[0].name).toBe('Advanced Push')
      expect(templates.value[1].name).toBe('Push Day')
    })
  })

  describe('Initial Filters', () => {
    it('should accept initial search filter', () => {
      const { templates, searchQuery } = useWorkoutTemplates({ search: 'leg' })

      expect(searchQuery.value).toBe('leg')
      expect(templates.value).toHaveLength(1)
      expect(templates.value[0].name).toBe('Leg Day')
    })

    it('should accept initial muscle filter', () => {
      const { templates, muscleFilter } = useWorkoutTemplates({ muscle: 'back' })

      expect(muscleFilter.value).toBe('back')
      expect(templates.value).toHaveLength(1)
      expect(templates.value[0].name).toBe('Pull Day')
    })

    it('should accept initial sort option', () => {
      const { templates, sortBy } = useWorkoutTemplates({ sortBy: 'name' })

      expect(sortBy.value).toBe('name')
      expect(templates.value[0].name).toBe('Leg Day')
    })
  })
})
