import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import ExerciseProgressTable from '@/pages/analytics/components/exercises/ExerciseProgressTable.vue'

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
  Search: { name: 'Search', template: '<svg data-testid="search-icon"></svg>' },
  ChevronDown: { name: 'ChevronDown', template: '<svg></svg>' },
  ChevronUp: { name: 'ChevronUp', template: '<svg></svg>' },
  TrendingUp: { name: 'TrendingUp', template: '<svg></svg>' },
  TrendingDown: { name: 'TrendingDown', template: '<svg></svg>' },
  Minus: { name: 'Minus', template: '<svg></svg>' },
  HelpCircle: { name: 'HelpCircle', template: '<svg></svg>' },
  Check: { name: 'Check', template: '<svg></svg>' },
}))

// Create mock refs that can be modified per test
let mockExerciseProgressTable

// Mock the analytics store with refs that storeToRefs can destructure
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({
    exerciseProgressTable: mockExerciseProgressTable,
  }),
}))

// Mock Input component to render a plain input
vi.mock('@/components/ui/input', () => ({
  Input: {
    name: 'Input',
    props: ['modelValue', 'placeholder', 'class'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" data-testid="search-input" />',
  },
}))

// Mock Select components
vi.mock('@/components/ui/select', () => ({
  Select: {
    name: 'Select',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="select-mock"><slot /></div>',
  },
  SelectContent: {
    name: 'SelectContent',
    template: '<div class="select-content"><slot /></div>',
  },
  SelectItem: {
    name: 'SelectItem',
    props: ['value'],
    template: '<div class="select-item" :data-value="value"><slot /></div>',
  },
  SelectTrigger: {
    name: 'SelectTrigger',
    template: '<button class="select-trigger"><slot /></button>',
  },
  SelectValue: {
    name: 'SelectValue',
    props: ['placeholder'],
    template: '<span class="select-value">{{ placeholder }}</span>',
  },
}))

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

  beforeEach(() => {
    // Reset mock data before each test
    mockExerciseProgressTable = ref([...mockExercises])
  })

  function createWrapper(exercises = mockExercises) {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Update mock data
    mockExerciseProgressTable.value = exercises

    return mount(ExerciseProgressTable, {
      global: {
        plugins: [pinia],
        stubs: {
          ExerciseProgressRow: {
            name: 'ExerciseProgressRow',
            props: ['exercise'],
            template: '<div class="exercise-row" data-testid="exercise-row">{{ exercise.name }}</div>',
          },
          LoadingSkeleton: {
            name: 'LoadingSkeleton',
            template: '<div class="loading-skeleton">Loading...</div>',
          },
          EmptyState: {
            name: 'EmptyState',
            props: ['title', 'description'],
            template: '<div class="empty-state">{{ title }}</div>',
          },
        },
      },
    })
  }

  describe('Rendering', () => {
    it('should render component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render all exercises', () => {
      const wrapper = createWrapper()
      const rows = wrapper.findAll('[data-testid="exercise-row"]')
      expect(rows.length).toBe(mockExercises.length)
    })

    it('should render table header on desktop', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.exerciseProgress.table.exercise')
      expect(wrapper.text()).toContain('analytics.exerciseProgress.table.estimated1RM')
    })
  })

  describe('Search Functionality', () => {
    it('should render search input', () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('[data-testid="search-input"]')
      expect(searchInput.exists()).toBe(true)
    })

    it('should filter exercises by search query', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('[data-testid="search-input"]')

      await searchInput.setValue('bench')
      await flushPromises()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].name).toBe('Bench Press')
    })

    it('should be case insensitive', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('[data-testid="search-input"]')

      await searchInput.setValue('SQUAT')
      await flushPromises()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].name).toBe('Squat')
    })

    it('should show no results when no matches', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('[data-testid="search-input"]')

      await searchInput.setValue('nonexistent exercise')
      await flushPromises()

      expect(wrapper.vm.hasNoResults).toBe(true)
    })

    it('should trim whitespace from search query', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('[data-testid="search-input"]')

      await searchInput.setValue('  bench  ')
      await flushPromises()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
    })

    it('should show all exercises when search is cleared', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('[data-testid="search-input"]')

      await searchInput.setValue('bench')
      await flushPromises()
      expect(wrapper.vm.sortedExercises.length).toBe(1)

      await searchInput.setValue('')
      await flushPromises()
      expect(wrapper.vm.sortedExercises.length).toBe(4)
    })
  })

  describe('Sort Functionality', () => {
    it('should sort by name alphabetically', async () => {
      const wrapper = createWrapper()
      wrapper.vm.sortBy = 'name'
      await flushPromises()

      const sorted = wrapper.vm.sortedExercises
      expect(sorted[0].name).toBe('Bench Press')
      expect(sorted[1].name).toBe('Deadlift')
      expect(sorted[2].name).toBe('Overhead Press')
      expect(sorted[3].name).toBe('Squat')
    })

    it('should sort by estimated 1RM (descending)', async () => {
      const wrapper = createWrapper()
      wrapper.vm.sortBy = 'estimated1RM'
      await flushPromises()

      const sorted = wrapper.vm.sortedExercises
      expect(sorted[0].estimated1RM).toBe(200) // Deadlift
      expect(sorted[1].estimated1RM).toBe(180) // Squat
      expect(sorted[2].estimated1RM).toBe(140) // Bench Press
      expect(sorted[3].estimated1RM).toBe(80) // OHP
    })

    it('should sort by last performed (most recent first)', async () => {
      const wrapper = createWrapper()
      wrapper.vm.sortBy = 'lastPerformed'
      await flushPromises()

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
      await flushPromises()

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
      await flushPromises()

      expect(wrapper.vm.sortedExercises.length).toBe(2)
      expect(wrapper.vm.sortedExercises.every((e) => e.trend === 'up')).toBe(true)
    })

    it('should filter stalled exercises', async () => {
      const wrapper = createWrapper()
      wrapper.vm.filterBy = 'stalled'
      await flushPromises()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].trend).toBe('flat')
    })

    it('should filter regressing exercises', async () => {
      const wrapper = createWrapper()
      wrapper.vm.filterBy = 'regressing'
      await flushPromises()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].trend).toBe('down')
    })

    it('should combine filter with search', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('[data-testid="search-input"]')

      wrapper.vm.filterBy = 'progressing'
      await searchInput.setValue('squat')
      await flushPromises()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
      expect(wrapper.vm.sortedExercises[0].name).toBe('Squat')
    })

    it('should combine filter with sort', async () => {
      const wrapper = createWrapper()
      wrapper.vm.filterBy = 'progressing'
      wrapper.vm.sortBy = 'estimated1RM'
      await flushPromises()

      const sorted = wrapper.vm.sortedExercises
      expect(sorted.length).toBe(2)
      expect(sorted[0].estimated1RM).toBeGreaterThan(sorted[1].estimated1RM)
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no exercises', () => {
      const wrapper = createWrapper([])
      expect(wrapper.vm.isEmpty).toBe(true)
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('should not show rows when empty', () => {
      const wrapper = createWrapper([])
      const rows = wrapper.findAll('[data-testid="exercise-row"]')
      expect(rows.length).toBe(0)
    })
  })

  describe('Controls', () => {
    it('should render search input component', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('[data-testid="search-input"]')
      expect(input.exists()).toBe(true)
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

      const wrapper = createWrapper(exercisesWithNew)
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

      const wrapper = createWrapper(exercisesWithLongName)
      const searchInput = wrapper.find('[data-testid="search-input"]')

      await searchInput.setValue('barbell bench')
      await flushPromises()

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

      const wrapper = createWrapper(exercisesWithSpecialChars)
      const searchInput = wrapper.find('[data-testid="search-input"]')

      await searchInput.setValue("fly's")
      await flushPromises()

      expect(wrapper.vm.sortedExercises.length).toBe(1)
    })
  })

  describe('Computed Properties', () => {
    it('should correctly determine isEmpty', () => {
      const wrapperWithData = createWrapper()
      expect(wrapperWithData.vm.isEmpty).toBe(false)

      const wrapperEmpty = createWrapper([])
      expect(wrapperEmpty.vm.isEmpty).toBe(true)
    })

    it('should correctly determine hasNoResults', async () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.hasNoResults).toBe(false)

      const searchInput = wrapper.find('[data-testid="search-input"]')
      await searchInput.setValue('nonexistent')
      await flushPromises()

      expect(wrapper.vm.hasNoResults).toBe(true)
    })

    it('should chain search -> filter -> sort correctly', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('[data-testid="search-input"]')

      // Search for exercises containing 'press'
      await searchInput.setValue('press')
      wrapper.vm.filterBy = 'all'
      wrapper.vm.sortBy = 'estimated1RM'
      await flushPromises()

      const sorted = wrapper.vm.sortedExercises
      // Should have: Bench Press (140) and Overhead Press (80)
      expect(sorted.length).toBe(2)
      expect(sorted[0].estimated1RM).toBeGreaterThan(sorted[1].estimated1RM)
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

      const wrapper = createWrapper(largeDataset)
      const searchInput = wrapper.find('[data-testid="search-input"]')

      await searchInput.setValue('Exercise 5')
      await flushPromises()

      // Should efficiently find matches
      expect(wrapper.vm.sortedExercises.length).toBeGreaterThan(0)
    })
  })
})
