import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'

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

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
  Calendar: { name: 'Calendar', template: '<svg data-testid="calendar-icon"></svg>' },
  Info: { name: 'Info', template: '<svg data-testid="info-icon"></svg>' },
}))

// Mock Card components
vi.mock('@/components/ui/card', () => ({
  Card: {
    name: 'Card',
    template: '<div class="card"><slot /></div>',
  },
  CardContent: {
    name: 'CardContent',
    template: '<div class="card-content"><slot /></div>',
  },
  CardDescription: {
    name: 'CardDescription',
    template: '<div class="card-description"><slot /></div>',
  },
  CardHeader: {
    name: 'CardHeader',
    template: '<div class="card-header"><slot /></div>',
  },
  CardTitle: {
    name: 'CardTitle',
    template: '<div class="card-title"><slot /></div>',
  },
}))

// Module-level mock refs that can be modified per test
let mockDailyVolumeMap

// Mock analytics store with refs that storeToRefs can destructure
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({
    dailyVolumeMap: mockDailyVolumeMap,
  }),
}))

// Mock useContributionHeatmap composable with configurable data
let mockGridData
let mockMonthLabels
let mockDayLabels
let mockLegendLevels
let mockIsEmpty
let mockTotalWeeks
let mockIsCappedToYear

vi.mock('@/composables/useContributionHeatmap', () => ({
  useContributionHeatmap: () => ({
    gridData: mockGridData,
    monthLabels: mockMonthLabels,
    dayLabels: mockDayLabels,
    legendLevels: mockLegendLevels,
    isEmpty: mockIsEmpty,
    totalWeeks: mockTotalWeeks,
    isCappedToYear: mockIsCappedToYear,
  }),
}))

// Mock dateUtils with all exports
vi.mock('@/utils/dateUtils', () => ({
  toLocalDateString: (date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  },
  formatDate: (date, locale) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString(locale || 'uk')
  },
  getRollingRange: vi.fn(() => ({
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  })),
  getThisMonthRange: vi.fn(() => ({
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  })),
  getLastMonthRange: vi.fn(() => ({
    start: new Date('2023-12-01'),
    end: new Date('2023-12-31'),
  })),
  getAllTimeRange: vi.fn(() => ({
    start: new Date('2023-01-01'),
    end: new Date('2024-12-31'),
  })),
  normalizeDate: vi.fn((date) => new Date(date)),
  isValidDate: vi.fn(() => true),
  getStartOfDay: vi.fn((date) => new Date(date)),
  diffInDays: vi.fn(() => 30),
  isSameDay: vi.fn(() => false),
  formatDateShort: vi.fn((date) => 'Jan 1'),
}))

import VolumeHeatmap from '@/pages/analytics/components/volume/VolumeHeatmap.vue'

describe('VolumeHeatmap', () => {
  const defaultGridData = [
    [
      { date: new Date('2024-01-01'), dateStr: '2024-01-01', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-02'), dateStr: '2024-01-02', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-03'), dateStr: '2024-01-03', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-04'), dateStr: '2024-01-04', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-05'), dateStr: '2024-01-05', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-06'), dateStr: '2024-01-06', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-07'), dateStr: '2024-01-07', count: 0, level: 0, isToday: true, isInPeriod: true },
    ],
    [
      { date: new Date('2024-01-08'), dateStr: '2024-01-08', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-09'), dateStr: '2024-01-09', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-10'), dateStr: '2024-01-10', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-11'), dateStr: '2024-01-11', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-12'), dateStr: '2024-01-12', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-13'), dateStr: '2024-01-13', count: 0, level: 0, isToday: false, isInPeriod: true },
      { date: new Date('2024-01-14'), dateStr: '2024-01-14', count: 0, level: 0, isToday: false, isInPeriod: true },
    ],
  ]

  const mockDailyVolumeMapData = {
    '2024-01-01': 0,
    '2024-01-02': 2000,
    '2024-01-03': 5000,
    '2024-01-04': 8000,
    '2024-01-05': 10000,
  }

  beforeEach(() => {
    // Reset all mock refs before each test with default values
    mockDailyVolumeMap = ref(mockDailyVolumeMapData)
    mockGridData = ref(defaultGridData)
    mockMonthLabels = computed(() => [{ label: 'Jan', weekIndex: 0 }])
    mockDayLabels = computed(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    mockLegendLevels = computed(() => [0, 1, 2, 3])
    mockIsEmpty = computed(() => false)
    mockTotalWeeks = computed(() => 2)
    mockIsCappedToYear = computed(() => false)
  })

  function createWrapper(options = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Apply custom options to mock refs
    if (options.dailyVolumeMap !== undefined) {
      mockDailyVolumeMap.value = options.dailyVolumeMap
    }
    if (options.isEmpty !== undefined) {
      mockIsEmpty = computed(() => options.isEmpty)
    }
    if (options.gridData !== undefined) {
      mockGridData.value = options.gridData
    }

    return mount(VolumeHeatmap, {
      global: {
        plugins: [pinia],
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('should render heatmap with data', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.contribution-heatmap').exists()).toBe(true)
    })

    it('should render Card component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.card').exists()).toBe(true)
    })

    it('should render month labels', () => {
      const wrapper = createWrapper()
      const monthLabels = wrapper.findAll('.month-label')
      expect(monthLabels.length).toBeGreaterThan(0)
    })

    it('should render weekday labels', () => {
      const wrapper = createWrapper()
      const weekdayLabels = wrapper.findAll('.day-label')
      expect(weekdayLabels.length).toBe(7)
    })

    it('should render heatmap grid', () => {
      const wrapper = createWrapper()
      const grid = wrapper.find('.weeks-grid')
      expect(grid.exists()).toBe(true)
    })

    it('should render cells for each day', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.day-cell')
      // 2 weeks x 7 days = 14 cells
      expect(cells.length).toBe(14)
    })

    it('should render legend', () => {
      const wrapper = createWrapper()
      const legend = wrapper.find('.legend')
      expect(legend.exists()).toBe(true)
    })

    it('should render legend color cells', () => {
      const wrapper = createWrapper()
      const legendCells = wrapper.findAll('.legend-cell')
      // 4 legend levels (0, 1, 2, 3)
      expect(legendCells.length).toBe(4)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when data is empty', () => {
      const wrapper = createWrapper({ isEmpty: true, gridData: [] })
      // Component should show empty state
      expect(wrapper.find('[data-testid="calendar-icon"]').exists()).toBe(true)
    })

    it('should handle null volume map gracefully', () => {
      const wrapper = createWrapper({ dailyVolumeMap: null })
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Color Coding', () => {
    it('should apply color classes to cells', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.day-cell')

      const hasColorClass = cells.some(
        (cell) => cell.classes().some((c) => c.includes('bg-'))
      )
      expect(hasColorClass).toBe(true)
    })

    it('should mark today cell with is-today class', () => {
      const wrapper = createWrapper()
      const todayCell = wrapper.find('.day-cell.is-today')
      expect(todayCell.exists()).toBe(true)
    })
  })

  describe('Tooltips', () => {
    it('should have aria-label on cells for accessibility', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.day-cell')

      cells.forEach((cell) => {
        expect(cell.attributes('aria-label')).toBeTruthy()
      })
    })

    it('should have tabindex for keyboard accessibility', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.day-cell')

      cells.forEach((cell) => {
        expect(cell.attributes('tabindex')).toBe('0')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.contribution-heatmap').exists()).toBe(true)
    })

    it('should have keyboard-accessible cells', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.day-cell')

      cells.forEach((cell) => {
        expect(cell.attributes('tabindex')).toBe('0')
      })
    })
  })

  describe('Responsive', () => {
    it('should have heatmap container for scrolling', () => {
      const wrapper = createWrapper()
      const container = wrapper.find('.heatmap-container')
      expect(container.exists()).toBe(true)
    })

    it('should have proper grid layout', () => {
      const wrapper = createWrapper()
      const grid = wrapper.find('.weeks-grid')
      expect(grid.exists()).toBe(true)
    })
  })

  describe('Legend', () => {
    it('should display "Less" label', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('analytics.volume.heatmap.legend.less')
    })

    it('should display "More" label', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('analytics.volume.heatmap.legend.more')
    })

    it('should have legend color cells', () => {
      const wrapper = createWrapper()
      const legendCells = wrapper.findAll('.legend-cell')
      expect(legendCells.length).toBeGreaterThan(0)
    })
  })

  describe('Card Header', () => {
    it('should display title', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.volume.heatmap.title')
    })

    it('should display description', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.volume.heatmap.description')
    })
  })

  describe('Edge Cases', () => {
    it('should handle all zero volumes', () => {
      const allZeros = {
        '2024-01-01': 0,
        '2024-01-02': 0,
        '2024-01-03': 0,
      }
      const wrapper = createWrapper({ dailyVolumeMap: allZeros })
      expect(wrapper.find('.contribution-heatmap').exists()).toBe(true)
    })

    it('should handle very large volumes', () => {
      const largeVolumes = {
        '2024-01-01': 999999,
        '2024-01-02': 888888,
      }
      const wrapper = createWrapper({ dailyVolumeMap: largeVolumes })
      expect(wrapper.find('.contribution-heatmap').exists()).toBe(true)
    })

    it('should handle sparse data (many gaps)', () => {
      const sparseData = {
        '2024-01-01': 5000,
        '2024-01-15': 6000,
        '2024-01-30': 7000,
      }
      const wrapper = createWrapper({ dailyVolumeMap: sparseData })
      expect(wrapper.find('.contribution-heatmap').exists()).toBe(true)
    })
  })

  describe('Interactions', () => {
    it('should handle cell hover events', async () => {
      const wrapper = createWrapper()
      const cell = wrapper.find('.day-cell')

      await cell.trigger('mouseenter')
      expect(wrapper.vm.showTooltip).toBe(true)

      await cell.trigger('mouseleave')
      expect(wrapper.vm.showTooltip).toBe(false)
    })

    it('should handle cell click events (mobile)', async () => {
      const wrapper = createWrapper()
      const cell = wrapper.find('.day-cell')

      await cell.trigger('click')
      expect(wrapper.vm.showTooltip).toBe(true)
    })

    it('should handle cell focus events', async () => {
      const wrapper = createWrapper()
      const cell = wrapper.find('.day-cell')

      await cell.trigger('focus')
      expect(wrapper.vm.showTooltip).toBe(true)

      await cell.trigger('blur')
      expect(wrapper.vm.showTooltip).toBe(false)
    })
  })
})
