import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ExerciseProgressTable from '../ExerciseProgressTable.vue'

describe('ExerciseProgressTable', () => {
  const mockExercises = [
    {
      id: 'ex1',
      name: 'Bench Press',
      estimated1RM: 140,
      bestPR: { weight: 120, reps: 5, date: new Date('2024-01-15'), estimated1RM: 140 },
      lastPerformed: new Date('2024-01-20'),
      trend: 'up',
      trendPercentage: 8.5,
      status: { label: 'Progressing', color: 'green', icon: 'trending-up' },
      history: [
        { date: new Date('2024-01-01'), bestSet: { weight: 100, reps: 10 }, sets: [] },
      ],
    },
    {
      id: 'ex2',
      name: 'Squat',
      estimated1RM: 180,
      bestPR: { weight: 160, reps: 5, date: new Date('2024-01-18'), estimated1RM: 187 },
      lastPerformed: new Date('2024-01-22'),
      trend: 'up',
      trendPercentage: 12.0,
      status: { label: 'Progressing', color: 'green', icon: 'trending-up' },
      history: [
        { date: new Date('2024-01-05'), bestSet: { weight: 140, reps: 8 }, sets: [] },
      ],
    },
    {
      id: 'ex3',
      name: 'Deadlift',
      estimated1RM: 200,
      bestPR: { weight: 180, reps: 5, date: new Date('2024-01-10'), estimated1RM: 210 },
      lastPerformed: new Date('2024-01-19'),
      trend: 'flat',
      trendPercentage: 1.2,
      status: { label: 'Stalled', color: 'yellow', icon: 'minus' },
      history: [
        { date: new Date('2024-01-02'), bestSet: { weight: 160, reps: 6 }, sets: [] },
      ],
    },
    {
      id: 'ex4',
      name: 'Overhead Press',
      estimated1RM: 80,
      bestPR: { weight: 70, reps: 5, date: new Date('2024-01-12'), estimated1RM: 82 },
      lastPerformed: new Date('2024-01-21'),
      trend: 'down',
      trendPercentage: -3.5,
      status: { label: 'Regressing', color: 'red', icon: 'trending-down' },
      history: [
        { date: new Date('2024-01-03'), bestSet: { weight: 60, reps: 8 }, sets: [] },
      ],
    },
  ]

  function createWrapper(initialState = {}) {
    return mount(ExerciseProgressTable, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              analytics: {
                exerciseProgressTable: initialState.exercises || mockExercises,
              },
            },
            stubActions: false,
          }),
        ],
      },
    })
  }

  describe('Rendering', () => {
    it('should render component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render title and description', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.exerciseProgress.title')
      expect(wrapper.text()).toContain('analytics.exerciseProgress.description')
    })

    it('should render all exercises', () => {
      const wrapper = createWrapper()
      const rows = wrapper.findAllComponents({ name: 'ExerciseProgressRow' })
      expect(rows.length).toBe(mockExercises.length)
    })

    it('should render table header on desktop', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.exerciseProgress.table.exercise')
      expect(wrapper.text()).toContain('analytics.exerciseProgress.table.estimated1RM')
    })

    it('should render results count', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('4')
      expect(wrapper.text()).toContain('exercises')
    })
  })

  describe('Search Functionality', () => {
    it('should render search input', () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.findComponent({ name: 'Input' })
      expect(searchInput.exists()).toBe(true)
    })

    it('should filter exercises by search query', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue('bench')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].name).toBe('Bench Press')
    })

    it('should be case insensitive', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue('SQUAT')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].name).toBe('Squat')
    })

    it('should show no results message when no matches', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue('nonexistent exercise')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.hasNoResults).toBe(true)
      expect(wrapper.text()).toContain('analytics.exerciseProgress.empty.noResults')
    })

    it('should trim whitespace from search query', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue('  bench  ')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
    })

    it('should show all exercises when search is cleared', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue('bench')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.sortedExercises.length).toBe(1)

      await searchInput.setValue('')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.sortedExercises.length).toBe(4)
    })
  })

  describe('Sort Functionality', () => {
    it('should sort by name alphabetically', async () => {
      const wrapper = createWrapper()
      wrapper.vm.sortBy = 'name'
      await wrapper.vm.$nextTick()

      const sorted = wrapper.vm.sortedExercises
      expect(sorted[0].name).toBe('Bench Press')
      expect(sorted[1].name).toBe('Deadlift')
      expect(sorted[2].name).toBe('Overhead Press')
      expect(sorted[3].name).toBe('Squat')
    })

    it('should sort by estimated 1RM (descending)', async () => {
      const wrapper = createWrapper()
      wrapper.vm.sortBy = 'estimated1RM'
      await wrapper.vm.$nextTick()

      const sorted = wrapper.vm.sortedExercises
      expect(sorted[0].estimated1RM).toBe(200) // Deadlift
      expect(sorted[1].estimated1RM).toBe(180) // Squat
      expect(sorted[2].estimated1RM).toBe(140) // Bench Press
      expect(sorted[3].estimated1RM).toBe(80) // OHP
    })

    it('should sort by last performed (most recent first)', async () => {
      const wrapper = createWrapper()
      wrapper.vm.sortBy = 'lastPerformed'
      await wrapper.vm.$nextTick()

      const sorted = wrapper.vm.sortedExercises
      // Squat (Jan 22) > OHP (Jan 21) > Bench (Jan 20) > Deadlift (Jan 19)
      expect(sorted[0].name).toBe('Squat')
      expect(sorted[1].name).toBe('Overhead Press')
      expect(sorted[2].name).toBe('Bench Press')
      expect(sorted[3].name).toBe('Deadlift')
    })

    it('should sort by trend (up > flat > down)', async () => {
      const wrapper = createWrapper()
      wrapper.vm.sortBy = 'trend'
      await wrapper.vm.$nextTick()

      const sorted = wrapper.vm.sortedExercises
      // Squat (+12%) > Bench (+8.5%) > Deadlift (flat) > OHP (-3.5%)
      expect(sorted[0].trend).toBe('up')
      expect(sorted[0].name).toBe('Squat')
      expect(sorted[sorted.length - 1].trend).toBe('down')
    })
  })

  describe('Filter Functionality', () => {
    it('should show all exercises by default', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.filterBy).toBe('all')
      expect(wrapper.vm.sortedExercises.length).toBe(4)
    })

    it('should filter progressing exercises', async () => {
      const wrapper = createWrapper()
      wrapper.vm.filterBy = 'progressing'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(2)
      expect(wrapper.vm.sortedExercises.every((e) => e.trend === 'up')).toBe(true)
    })

    it('should filter stalled exercises', async () => {
      const wrapper = createWrapper()
      wrapper.vm.filterBy = 'stalled'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].trend).toBe('flat')
    })

    it('should filter regressing exercises', async () => {
      const wrapper = createWrapper()
      wrapper.vm.filterBy = 'regressing'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].trend).toBe('down')
    })

    it('should combine filter with search', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')

      wrapper.vm.filterBy = 'progressing'
      await searchInput.setValue('squat')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].name).toBe('Squat')
    })

    it('should combine filter with sort', async () => {
      const wrapper = createWrapper()
      wrapper.vm.filterBy = 'progressing'
      wrapper.vm.sortBy = 'estimated1RM'
      await wrapper.vm.$nextTick()

      const sorted = wrapper.vm.sortedExercises
      expect(sorted.length).toBe(2)
      expect(sorted[0].estimated1RM).toBeGreaterThan(sorted[1].estimated1RM)
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no exercises', () => {
      const wrapper = createWrapper({ exercises: [] })
      expect(wrapper.vm.isEmpty).toBe(true)
      expect(wrapper.text()).toContain('analytics.exerciseProgress.empty.title')
    })

    it('should not show table when empty', () => {
      const wrapper = createWrapper({ exercises: [] })
      const rows = wrapper.findAllComponents({ name: 'ExerciseProgressRow' })
      expect(rows.length).toBe(0)
    })

    it('should show loading skeleton when loading', async () => {
      const wrapper = createWrapper()
      wrapper.vm.isLoading = true
      await wrapper.vm.$nextTick()

      const skeleton = wrapper.findComponent({ name: 'LoadingSkeleton' })
      expect(skeleton.exists()).toBe(true)
    })
  })

  describe('Controls', () => {
    it('should render sort selector', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAllComponents({ name: 'Select' })
      expect(selects.length).toBeGreaterThanOrEqual(2)
    })

    it('should render filter selector', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.exerciseProgress.filterBy')
    })

    it('should have correct sort options', () => {
      const wrapper = createWrapper()
      const options = wrapper.vm.sortOptions
      expect(options.length).toBe(4)
      expect(options.map((o) => o.value)).toEqual([
        'lastPerformed',
        'estimated1RM',
        'name',
        'trend',
      ])
    })

    it('should have correct filter options', () => {
      const wrapper = createWrapper()
      const options = wrapper.vm.filterOptions
      expect(options.length).toBe(4)
      expect(options.map((o) => o.value)).toEqual([
        'all',
        'progressing',
        'stalled',
        'regressing',
      ])
    })
  })

  describe('Edge Cases', () => {
    it('should handle exercises with insufficient_data trend', () => {
      const exercisesWithNew = [
        ...mockExercises,
        {
          id: 'ex5',
          name: 'New Exercise',
          estimated1RM: 50,
          bestPR: null,
          lastPerformed: new Date(),
          trend: 'insufficient_data',
          trendPercentage: 0,
          status: { label: 'New', color: 'gray', icon: 'help-circle' },
          history: [{ date: new Date(), bestSet: { weight: 50, reps: 10 }, sets: [] }],
        },
      ]

      const wrapper = createWrapper({ exercises: exercisesWithNew })
      expect(wrapper.vm.sortedExercises.length).toBe(5)
    })

    it('should handle very long exercise names in search', async () => {
      const exercisesWithLongName = [
        {
          id: 'ex1',
          name: 'Barbell Bench Press with Very Long Exercise Name That Should Be Searchable',
          estimated1RM: 100,
          bestPR: null,
          lastPerformed: new Date(),
          trend: 'up',
          trendPercentage: 5.0,
          status: { label: 'Progressing', color: 'green', icon: 'trending-up' },
          history: [],
        },
      ]

      const wrapper = createWrapper({ exercises: exercisesWithLongName })
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue('barbell bench')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
    })

    it('should handle special characters in search', async () => {
      const exercisesWithSpecialChars = [
        {
          id: 'ex1',
          name: "Dumbbell Fly's",
          estimated1RM: 60,
          bestPR: null,
          lastPerformed: new Date(),
          trend: 'up',
          trendPercentage: 5.0,
          status: { label: 'Progressing', color: 'green', icon: 'trending-up' },
          history: [],
        },
      ]

      const wrapper = createWrapper({ exercises: exercisesWithSpecialChars })
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue("fly's")
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
    })
  })

  describe('Computed Properties', () => {
    it('should correctly determine isEmpty', () => {
      const wrapperWithData = createWrapper()
      expect(wrapperWithData.vm.isEmpty).toBe(false)

      const wrapperEmpty = createWrapper({ exercises: [] })
      expect(wrapperEmpty.vm.isEmpty).toBe(true)
    })

    it('should correctly determine hasNoResults', async () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.hasNoResults).toBe(false)

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('nonexistent')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.hasNoResults).toBe(true)
    })

    it('should chain search -> filter -> sort correctly', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')

      // Search for exercises containing 'press'
      await searchInput.setValue('press')
      wrapper.vm.filterBy = 'all'
      wrapper.vm.sortBy = 'estimated1RM'
      await wrapper.vm.$nextTick()

      const sorted = wrapper.vm.sortedExercises
      // Should have: Bench Press (140) and Overhead Press (80)
      expect(sorted.length).toBe(2)
      expect(sorted[0].estimated1RM).toBeGreaterThan(sorted[1].estimated1RM)
    })
  })

  describe('Accessibility', () => {
    it('should have search icon for visual affordance', () => {
      const wrapper = createWrapper()
      const searchIcon = wrapper.findComponent({ name: 'SearchIcon' })
      expect(searchIcon.exists()).toBe(true)
    })

    it('should have placeholder text on search input', () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')
      expect(searchInput.attributes('placeholder')).toBe('analytics.exerciseProgress.search')
    })

    it('should have minimum touch target size (44px)', () => {
      const wrapper = createWrapper()
      const selects = wrapper.findAll('.min-h-11')
      expect(selects.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive grid layout', () => {
      const wrapper = createWrapper()
      const header = wrapper.find('.sm\\:grid')
      expect(header.exists()).toBe(true)
    })

    it('should hide header on mobile', () => {
      const wrapper = createWrapper()
      const header = wrapper.find('.hidden.sm\\:grid')
      expect(header.exists()).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should efficiently filter large datasets', async () => {
      // Create 100 exercises
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `ex${i}`,
        name: `Exercise ${i}`,
        estimated1RM: 100 + i,
        bestPR: null,
        lastPerformed: new Date(),
        trend: i % 3 === 0 ? 'up' : i % 3 === 1 ? 'flat' : 'down',
        trendPercentage: (i % 10) - 5,
        status: { label: 'Progressing', color: 'green', icon: 'trending-up' },
        history: [],
      }))

      const wrapper = createWrapper({ exercises: largeDataset })
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.setValue('Exercise 5')
      await wrapper.vm.$nextTick()

      // Should efficiently find matches
      expect(wrapper.vm.sortedExercises.length).toBeGreaterThan(0)
    })
  })
})
