import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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
  TrendingUp: { name: 'TrendingUp', template: '<svg data-testid="trending-up-icon"></svg>' },
  TrendingDown: { name: 'TrendingDown', template: '<svg data-testid="trending-down-icon"></svg>' },
  Minus: { name: 'Minus', template: '<svg data-testid="minus-icon"></svg>' },
}))

// Mock Unovis components
vi.mock('@unovis/vue', () => ({
  VisAxis: {
    name: 'VisAxis',
    props: ['type', 'tickLine', 'domainLine', 'gridLine', 'tickFormat', 'numTicks', 'x'],
    template: '<g class="vis-axis"></g>',
  },
  VisGroupedBar: {
    name: 'VisGroupedBar',
    props: ['x', 'y', 'color', 'roundedCorners'],
    template: '<g class="vis-grouped-bar"></g>',
  },
  VisXYContainer: {
    name: 'VisXYContainer',
    props: ['data', 'margin', 'yDomain'],
    template: '<div class="vis-xy-container"><slot /></div>',
  },
}))

// Mock chart components
vi.mock('@/components/ui/chart', () => ({
  ChartContainer: {
    name: 'ChartContainer',
    props: ['config'],
    template: '<div class="chart-container"><slot /></div>',
  },
  ChartCrosshair: {
    name: 'ChartCrosshair',
    props: ['template', 'color'],
    template: '<div class="chart-crosshair"></div>',
  },
  ChartTooltip: {
    name: 'ChartTooltip',
    template: '<div class="chart-tooltip"></div>',
  },
  ChartTooltipContent: {
    name: 'ChartTooltipContent',
    template: '<div></div>',
  },
  componentToString: vi.fn(() => ''),
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

// Mock dateUtils
vi.mock('@/utils/dateUtils', () => ({
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
}))

// Module-level mock refs
let mockWeeklyVolumeProgression
let mockProgressiveOverloadStats
let mockLoading

// Mock analytics store
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({
    weeklyVolumeProgression: mockWeeklyVolumeProgression,
    progressiveOverloadStats: mockProgressiveOverloadStats,
    loading: mockLoading,
  }),
}))

import ProgressiveOverloadChart from '@/pages/analytics/components/volume/ProgressiveOverloadChart.vue'

describe('ProgressiveOverloadChart', () => {
  const mockWeeklyProgressionData = [
    {
      week: 'Week 1',
      weekStart: new Date('2024-01-01'),
      volume: 10000,
      workouts: 3,
      change: 0,
      status: 'maintaining',
    },
    {
      week: 'Week 2',
      weekStart: new Date('2024-01-08'),
      volume: 11000,
      workouts: 3,
      change: 10,
      status: 'progressing',
    },
    {
      week: 'Week 3',
      weekStart: new Date('2024-01-15'),
      volume: 10500,
      workouts: 3,
      change: -4.5,
      status: 'regressing',
    },
  ]

  const mockProgressiveStatsData = {
    weeksProgressing: 1,
    totalWeeks: 2,
    progressRate: 50,
    avgIncrease: 2.75,
    overallStatus: 'on_track',
    nextWeekTarget: 11025,
  }

  beforeEach(() => {
    // Reset mock refs before each test
    mockWeeklyVolumeProgression = ref(mockWeeklyProgressionData)
    mockProgressiveOverloadStats = ref(mockProgressiveStatsData)
    mockLoading = ref(false)
  })

  function createWrapper(options = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Apply custom options to mock refs
    if (options.weeklyVolumeProgression !== undefined) {
      mockWeeklyVolumeProgression.value = options.weeklyVolumeProgression
    }
    if (options.progressiveOverloadStats !== undefined) {
      mockProgressiveOverloadStats.value = options.progressiveOverloadStats
    }
    if (options.loading !== undefined) {
      mockLoading.value = options.loading
    }

    return mount(ProgressiveOverloadChart, {
      global: {
        plugins: [pinia],
      },
    })
  }

  describe('Rendering', () => {
    it('should render chart container with data', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('should render card title', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.volume.progressiveOverload.title')
    })

    it('should render card description', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.volume.progressiveOverload.description')
    })

    it('should render stats panel when stats available', () => {
      const wrapper = createWrapper()
      const statCards = wrapper.findAll('.rounded-lg.border.bg-card')
      expect(statCards.length).toBe(4) // 4 stat cards
    })

    it('should not render stats panel when no stats', () => {
      const wrapper = createWrapper({ progressiveOverloadStats: null })
      const statCards = wrapper.findAll('.rounded-lg.border.bg-card')
      expect(statCards.length).toBe(0)
    })

    it('should render VisXYContainer when data exists', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'VisXYContainer' }).exists()).toBe(true)
    })

    it('should render VisGroupedBar for bar chart', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'VisGroupedBar' }).exists()).toBe(true)
    })

    it('should render VisAxis components', () => {
      const wrapper = createWrapper()
      const axes = wrapper.findAllComponents({ name: 'VisAxis' })
      expect(axes.length).toBe(2) // X and Y axis
    })

    it('should render legend', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('analytics.volume.progressiveOverload.statusLabels.progressing')
      expect(text).toContain('analytics.volume.progressiveOverload.statusLabels.maintaining')
      expect(text).toContain('analytics.volume.progressiveOverload.statusLabels.regressing')
    })
  })

  describe('Empty State', () => {
    it('should handle empty data array', () => {
      const wrapper = createWrapper({
        weeklyVolumeProgression: [],
        progressiveOverloadStats: null,
      })
      // Should show empty state
      expect(wrapper.text()).toContain('analytics.emptyStates.noData')
    })

    it('should handle null data', () => {
      const wrapper = createWrapper({
        weeklyVolumeProgression: null,
        progressiveOverloadStats: null,
      })
      expect(wrapper.text()).toContain('analytics.emptyStates.noData')
    })

    it('should not show chart container when empty', () => {
      const wrapper = createWrapper({
        weeklyVolumeProgression: [],
        progressiveOverloadStats: null,
      })
      expect(wrapper.find('.chart-container').exists()).toBe(false)
    })
  })

  describe('Stats Display', () => {
    it('should display weeks progressing stat', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('analytics.volume.progressiveOverload.stats.weeksProgressing')
      expect(text).toContain('1/2')
      expect(text).toContain('50%')
    })

    it('should display average increase stat', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('analytics.volume.progressiveOverload.stats.avgIncrease')
      expect(text).toContain('+2.8%') // 2.75 rounded
    })

    it('should display overall status stat', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.volume.progressiveOverload.stats.status')
    })

    it('should display next target stat', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()
      expect(text).toContain('analytics.volume.progressiveOverload.stats.nextTarget')
    })

    it('should handle different status types with correct styling', () => {
      // Test on_track status
      const onTrackWrapper = createWrapper()
      expect(onTrackWrapper.find('.text-green-500').exists()).toBe(true)

      // Test maintaining status
      const maintainingWrapper = createWrapper({
        progressiveOverloadStats: {
          ...mockProgressiveStatsData,
          overallStatus: 'maintaining',
          avgIncrease: 1.5,
        },
      })
      expect(maintainingWrapper.find('.text-amber-500').exists()).toBe(true)

      // Test regressing status
      const regressingWrapper = createWrapper({
        progressiveOverloadStats: {
          ...mockProgressiveStatsData,
          overallStatus: 'regressing',
          avgIncrease: -3.0,
        },
      })
      expect(regressingWrapper.find('.text-red-500').exists()).toBe(true)
    })
  })

  describe('Chart Data Transformation', () => {
    it('should transform weekly progression data for chart', () => {
      const wrapper = createWrapper()
      const chartData = wrapper.vm.chartData

      expect(chartData.length).toBe(3)
      expect(chartData[0].weekIndex).toBe(0)
      expect(chartData[0].weekLabel).toBe('Week 1')
      expect(chartData[0].volume).toBe(10000)
    })

    it('should calculate correct Y domain', () => {
      const wrapper = createWrapper()
      const [min, max] = wrapper.vm.yDomain

      expect(min).toBe(0)
      expect(max).toBeGreaterThan(11000) // Max volume * 1.1
    })
  })

  describe('Legend', () => {
    it('should display all status types in legend', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()

      expect(text).toContain('analytics.volume.progressiveOverload.statusLabels.progressing')
      expect(text).toContain('analytics.volume.progressiveOverload.statusLabels.maintaining')
      expect(text).toContain('analytics.volume.progressiveOverload.statusLabels.regressing')
    })

    it('should show threshold values in legend', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()

      // Check for the >= symbol or full text
      expect(text).toMatch(/≥2\.5%|>=2\.5%/)
      expect(text).toMatch(/±2\.5%/)
      expect(text).toMatch(/≤-2\.5%|<=-2\.5%/)
    })

    it('should render legend icons', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="trending-up-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="minus-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="trending-down-icon"]').exists()).toBe(true)
    })
  })

  describe('Responsive', () => {
    it('should have overflow container for mobile', () => {
      const wrapper = createWrapper()
      const container = wrapper.find('.overflow-x-auto')
      expect(container.exists()).toBe(true)
    })

    it('should have minimum width for chart', () => {
      const wrapper = createWrapper()
      const minWidthContainer = wrapper.find('.min-w-\\[600px\\]')
      expect(minWidthContainer.exists()).toBe(true)
    })
  })

  describe('Tooltip Integration', () => {
    it('should render ChartTooltip component', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'ChartTooltip' }).exists()).toBe(true)
    })

    it('should render ChartCrosshair component', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'ChartCrosshair' }).exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single week', () => {
      const singleWeek = [mockWeeklyProgressionData[0]]
      const wrapper = createWrapper({ weeklyVolumeProgression: singleWeek })
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('should handle many weeks', () => {
      const manyWeeks = Array.from({ length: 20 }, (_, i) => ({
        ...mockWeeklyProgressionData[0],
        week: `Week ${i + 1}`,
      }))
      const wrapper = createWrapper({ weeklyVolumeProgression: manyWeeks })
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('should handle zero volume weeks', () => {
      const zeroVolume = [{ ...mockWeeklyProgressionData[0], volume: 0 }]
      const wrapper = createWrapper({ weeklyVolumeProgression: zeroVolume })
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('should handle very large volume changes', () => {
      const largeChange = [{ ...mockWeeklyProgressionData[0], change: 500 }]
      const wrapper = createWrapper({ weeklyVolumeProgression: largeChange })
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('should handle negative average increase', () => {
      const wrapper = createWrapper({
        progressiveOverloadStats: {
          ...mockProgressiveStatsData,
          avgIncrease: -5.5,
        },
      })
      // Should not show + sign for negative numbers
      expect(wrapper.text()).toContain('-5.5%')
    })
  })

  describe('Color Coding', () => {
    it('should apply correct color for progressing status', () => {
      const wrapper = createWrapper()
      // Test that getBarColor returns correct colors
      const color = wrapper.vm.getBarColor({ status: 'progressing' })
      expect(color).toContain('142') // Green hue
    })

    it('should apply correct color for maintaining status', () => {
      const wrapper = createWrapper()
      const color = wrapper.vm.getBarColor({ status: 'maintaining' })
      expect(color).toContain('43') // Amber hue
    })

    it('should apply correct color for regressing status', () => {
      const wrapper = createWrapper()
      const color = wrapper.vm.getBarColor({ status: 'regressing' })
      expect(color).toContain('0') // Red hue (starts with 0)
    })
  })

  describe('Status Label Translation', () => {
    it('should translate status labels correctly', () => {
      const wrapper = createWrapper()
      const label = wrapper.vm.getStatusLabel('on_track')
      expect(label).toBe('analytics.volume.progressiveOverload.statusLabels.on_track')
    })
  })
})
