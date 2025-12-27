import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

// Mock Firebase modules first (before any store imports)
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  subscribeToCollection: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  fetchDocument: vi.fn(),
  setDocument: vi.fn(),
  subscribeToDocument: vi.fn(),
  COLLECTIONS: {
    USERS: 'users',
    WORKOUTS: 'workouts',
    EXERCISES: 'exercises',
  },
}))

vi.mock('@/firebase/auth', () => ({
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  createAccount: vi.fn(),
  signOut: vi.fn(),
  onAuthChange: vi.fn(),
  resetPassword: vi.fn(),
  sendVerificationEmail: vi.fn(),
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  Flame: {
    name: 'Flame',
    template: '<svg data-testid="flame-icon"></svg>',
  },
  Calendar: {
    name: 'Calendar',
    template: '<svg data-testid="calendar-icon"></svg>',
  },
  Star: {
    name: 'Star',
    template: '<svg data-testid="star-icon"></svg>',
  },
}))

// Create mock refs that can be modified per test
let mockLongestStreak
let mockMostActiveDay
let mockAverageWorkoutsPerWeek

// Mock the analytics store with refs that storeToRefs can destructure
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({
    // storeToRefs expects the store to have reactive properties
    longestStreak: mockLongestStreak,
    mostActiveDay: mockMostActiveDay,
    averageWorkoutsPerWeek: mockAverageWorkoutsPerWeek,
  }),
}))

import QuickStatsStrip from '@/pages/dashboard/components/charts/QuickStatsStrip.vue'

describe('QuickStatsStrip', () => {
  beforeEach(() => {
    // Reset refs before each test with default values
    mockLongestStreak = ref({ days: 0, startDate: null, endDate: null })
    mockMostActiveDay = ref(null)
    mockAverageWorkoutsPerWeek = ref(0)
  })

  /**
   * Factory function to mount component with mocked analytics store
   */
  function createWrapper(analyticsState = {}) {
    // Set up Pinia
    const pinia = createPinia()
    setActivePinia(pinia)

    // Update the refs with test-specific values
    if (analyticsState.longestStreak !== undefined) {
      mockLongestStreak.value = analyticsState.longestStreak
    }
    if (analyticsState.mostActiveDay !== undefined) {
      mockMostActiveDay.value = analyticsState.mostActiveDay
    }
    if (analyticsState.averageWorkoutsPerWeek !== undefined) {
      mockAverageWorkoutsPerWeek.value = analyticsState.averageWorkoutsPerWeek
    }

    return mount(QuickStatsStrip, {
      global: {
        plugins: [pinia],
      },
    })
  }

  describe('Component rendering', () => {
    it('should render all three stat items', () => {
      const wrapper = createWrapper()

      const statItems = wrapper.findAll('.stat-item')
      expect(statItems).toHaveLength(3)
    })

    it('should have role="status" for accessibility', () => {
      const wrapper = createWrapper()

      const statsStrip = wrapper.find('.stats-strip')
      expect(statsStrip.attributes('role')).toBe('status')
    })

    it('should render all three icons', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('[data-testid="flame-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="calendar-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="star-icon"]').exists()).toBe(true)
    })
  })

  describe('Best Streak stat', () => {
    it('should display best streak value when data exists', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 7, startDate: '2024-01-01', endDate: '2024-01-07' },
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.days')
    })

    it('should display "no data" when streak is 0', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 0, startDate: null, endDate: null },
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.noData')
    })

    it('should display correct translation key for best streak label', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 5, startDate: '2024-01-01', endDate: '2024-01-05' },
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.bestStreak')
    })

    it('should handle single day streak', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 1, startDate: '2024-01-01', endDate: '2024-01-01' },
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.days')
    })
  })

  describe('Average Workouts Per Week stat', () => {
    it('should display average workouts when data exists', () => {
      const wrapper = createWrapper({
        averageWorkoutsPerWeek: 3.5,
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.perWeek')
    })

    it('should display "no data" when average is 0', () => {
      const wrapper = createWrapper({
        averageWorkoutsPerWeek: 0,
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.noData')
    })

    it('should display correct translation key for avg per week label', () => {
      const wrapper = createWrapper({
        averageWorkoutsPerWeek: 4.2,
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.avgPerWeek')
    })

    it('should handle fractional averages', () => {
      const wrapper = createWrapper({
        averageWorkoutsPerWeek: 2.7,
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.perWeek')
    })
  })

  describe('Most Active Day stat', () => {
    it('should display most active day when data exists', () => {
      const wrapper = createWrapper({
        mostActiveDay: { dayIndex: 1, dayKey: 'mon', count: 5 },
      })

      expect(wrapper.text()).toContain('dashboard.charts.daysOfWeek.mon')
    })

    it('should display "no data" when mostActiveDay is null', () => {
      const wrapper = createWrapper({
        mostActiveDay: null,
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.noData')
    })

    it('should display correct translation key for most active day label', () => {
      const wrapper = createWrapper({
        mostActiveDay: { dayIndex: 3, dayKey: 'wed', count: 8 },
      })

      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.mostActiveDay')
    })

    it('should handle all days of the week', () => {
      const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

      daysOfWeek.forEach((dayKey, dayIndex) => {
        const wrapper = createWrapper({
          mostActiveDay: { dayIndex, dayKey, count: 3 },
        })

        expect(wrapper.text()).toContain(`dashboard.charts.daysOfWeek.${dayKey}`)
      })
    })
  })

  describe('Empty state handling', () => {
    it('should show all "no data" when all stats are empty', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 0, startDate: null, endDate: null },
        averageWorkoutsPerWeek: 0,
        mostActiveDay: null,
      })

      const noDataCount = (wrapper.text().match(/dashboard\.charts\.heatmap\.quickStats\.noData/g) || []).length
      expect(noDataCount).toBe(3)
    })

    it('should show mixed state when some stats have data', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 5, startDate: '2024-01-01', endDate: '2024-01-05' },
        averageWorkoutsPerWeek: 0,
        mostActiveDay: { dayIndex: 1, dayKey: 'mon', count: 3 },
      })

      // Should have 1 "no data" for averageWorkoutsPerWeek
      const noDataCount = (wrapper.text().match(/dashboard\.charts\.heatmap\.quickStats\.noData/g) || []).length
      expect(noDataCount).toBe(1)
    })
  })

  describe('Responsive layout', () => {
    it('should have flex-direction column by default (desktop)', () => {
      const wrapper = createWrapper()

      const statsStrip = wrapper.find('.stats-strip')
      expect(statsStrip.classes()).toContain('stats-strip')
    })

    it('should have proper stat-item structure for all breakpoints', () => {
      const wrapper = createWrapper()

      const statItems = wrapper.findAll('.stat-item')
      statItems.forEach((item) => {
        expect(item.find('.stat-icon').exists()).toBe(true)
        expect(item.find('.stat-content').exists()).toBe(true)
        expect(item.find('.stat-label').exists()).toBe(true)
        expect(item.find('.stat-value').exists()).toBe(true)
      })
    })
  })

  describe('i18n integration', () => {
    it('should use correct translation keys for all labels', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 7, startDate: '2024-01-01', endDate: '2024-01-07' },
        averageWorkoutsPerWeek: 3.5,
        mostActiveDay: { dayIndex: 1, dayKey: 'mon', count: 5 },
      })

      const text = wrapper.text()

      expect(text).toContain('dashboard.charts.heatmap.quickStats.bestStreak')
      expect(text).toContain('dashboard.charts.heatmap.quickStats.avgPerWeek')
      expect(text).toContain('dashboard.charts.heatmap.quickStats.mostActiveDay')
    })

    it('should use parameterized translations for values', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 10, startDate: '2024-01-01', endDate: '2024-01-10' },
        averageWorkoutsPerWeek: 4.0,
        mostActiveDay: { dayIndex: 5, dayKey: 'fri', count: 7 },
      })

      const text = wrapper.text()

      expect(text).toContain('dashboard.charts.heatmap.quickStats.days')
      expect(text).toContain('dashboard.charts.heatmap.quickStats.perWeek')
    })
  })

  describe('Edge cases', () => {
    it('should handle very large streak values', () => {
      const wrapper = createWrapper({
        longestStreak: { days: 365, startDate: '2024-01-01', endDate: '2024-12-31' },
      })

      expect(wrapper.find('.stats-strip').exists()).toBe(true)
      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.days')
    })

    it('should handle very high workout frequency', () => {
      const wrapper = createWrapper({
        averageWorkoutsPerWeek: 14.0,
      })

      expect(wrapper.find('.stats-strip').exists()).toBe(true)
      expect(wrapper.text()).toContain('dashboard.charts.heatmap.quickStats.perWeek')
    })

    it('should handle decimal precision for workout frequency', () => {
      const wrapper = createWrapper({
        averageWorkoutsPerWeek: 3.14159,
      })

      expect(wrapper.find('.stats-strip').exists()).toBe(true)
    })
  })
})
