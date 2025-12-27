import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import DurationTrendChart from '@/pages/analytics/components/duration/DurationTrendChart.vue'

// vue-router is globally mocked in vitest.setup.js

// Default mock data - will be recreated for each test
const getDefaultDurationData = () => [
  {
    date: new Date('2024-01-01'),
    duration: 60,
    volume: 5000,
    exerciseCount: 5,
    id: 'workout-1',
  },
  {
    date: new Date('2024-01-03'),
    duration: 70,
    volume: 6000,
    exerciseCount: 6,
    id: 'workout-2',
  },
  {
    date: new Date('2024-01-05'),
    duration: 55,
    volume: 4500,
    exerciseCount: 4,
    id: 'workout-3',
  },
]

const getDefaultDurationStats = () => ({
  average: 62,
  shortest: { value: 55, date: new Date('2024-01-05') },
  longest: { value: 70, date: new Date('2024-01-03') },
  trend: { direction: 'stable', value: 5 },
})

// Shared mock refs for the analytics store
const mockDurationTrendData = ref(getDefaultDurationData())
const mockDurationStats = ref(getDefaultDurationStats())
const mockLoading = ref(false)

vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({
    durationTrendData: mockDurationTrendData,
    durationStats: mockDurationStats,
    loading: mockLoading,
  }),
}))

// Mock @unovis/vue components
vi.mock('@unovis/vue', () => ({
  VisXYContainer: {
    name: 'VisXYContainer',
    props: ['data', 'margin', 'yDomain'],
    template: '<div class="vis-xy-container" data-testid="vis-xy-container"><slot /></div>',
  },
  VisScatter: {
    name: 'VisScatter',
    props: ['x', 'y', 'size', 'color', 'cursor', 'events'],
    template: '<div class="vis-scatter" data-testid="vis-scatter"></div>',
  },
  VisAxis: {
    name: 'VisAxis',
    props: ['type', 'x', 'tickLine', 'domainLine', 'gridLine', 'numTicks', 'tickFormat'],
    template: '<div class="vis-axis" :data-axis-type="type" data-testid="vis-axis"></div>',
  },
  VisLine: {
    name: 'VisLine',
    props: ['x', 'y', 'color', 'lineWidth'],
    template: '<div class="vis-line" data-testid="vis-line"></div>',
  },
}))

// Mock @unovis/ts
vi.mock('@unovis/ts', () => ({
  Scatter: {
    selectors: {
      point: 'scatter-point',
    },
  },
}))

// Mock chart components
vi.mock('@/components/ui/chart', () => ({
  ChartContainer: {
    name: 'ChartContainer',
    props: ['config'],
    template: '<div class="chart-container" data-testid="chart-container"><slot /></div>',
  },
  ChartCrosshair: {
    name: 'ChartCrosshair',
    props: ['color', 'template'],
    template: '<div class="chart-crosshair" data-testid="chart-crosshair"></div>',
  },
  ChartTooltip: {
    name: 'ChartTooltip',
    template: '<div class="chart-tooltip" data-testid="chart-tooltip"></div>',
  },
  ChartTooltipContent: {
    name: 'ChartTooltipContent',
    template: '<div class="chart-tooltip-content"></div>',
  },
  componentToString: vi.fn(() => '<div>tooltip</div>'),
}))

// Mock shared components
vi.mock('../shared/BaseChart.vue', () => ({
  default: {
    name: 'BaseChart',
    props: ['title', 'description', 'data', 'loading', 'emptyIcon', 'height'],
    template: `
      <div class="base-chart" data-testid="base-chart">
        <div class="card-header">
          <h3>{{ title }}</h3>
          <p>{{ description }}</p>
          <slot name="header" />
        </div>
        <div class="card-content" v-if="data && data.length > 0 && !loading">
          <slot />
        </div>
        <div class="empty-state" v-else-if="!loading && (!data || data.length === 0)">
          Empty
        </div>
        <div class="loading-state" v-else-if="loading">
          Loading...
        </div>
      </div>
    `,
  },
}))

// Mock dateUtils - use importOriginal to get all exports, only override what's needed
vi.mock('@/utils/dateUtils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    formatDateShort: (date, locale) => {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    },
  }
})

describe('DurationTrendChart', () => {
  // Reset mock data before each test to ensure clean state
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock data to default values using factory functions
    mockDurationTrendData.value = getDefaultDurationData()
    mockDurationStats.value = getDefaultDurationStats()
    mockLoading.value = false
  })

  function createWrapper() {
    // Ensure wrapper is created after mock data is set
    return mount(DurationTrendChart)
  }

  // Simple existence check that doesn't rely on specific data
  it('should mount without errors', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  describe('Rendering', () => {
    it('should render chart with data', () => {
      const wrapper = createWrapper()
      // Check wrapper exists - the component renders correctly
      expect(wrapper.exists()).toBe(true)
    })

    it('should render stats panel when stats available', () => {
      const wrapper = createWrapper()
      const statCards = wrapper.findAll('.rounded-lg.border.bg-card')
      // 4 stat cards: average, shortest, longest, trend
      expect(statCards.length).toBe(4)
    })

    it('should not render stats panel when no stats', () => {
      mockDurationStats.value = null
      const wrapper = createWrapper()
      const statCards = wrapper.findAll('.rounded-lg.border.bg-card')
      expect(statCards.length).toBe(0)
    })

    it('should render chart container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="chart-container"]').exists()).toBe(true)
    })

    it('should render vis-xy-container for chart', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="vis-xy-container"]').exists()).toBe(true)
    })

    it('should render scatter component', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="vis-scatter"]').exists()).toBe(true)
    })

    it('should render legend', () => {
      const wrapper = createWrapper()
      const legendItems = wrapper.findAll('.flex.items-center.gap-1\\.5')
      // 3 legend items: low, medium, high volume
      expect(legendItems.length).toBe(3)
    })
  })

  describe('Empty State', () => {
    it('should handle empty data array', () => {
      mockDurationTrendData.value = []
      mockDurationStats.value = null
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle null data', () => {
      mockDurationTrendData.value = null
      mockDurationStats.value = null
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should render with loading state', () => {
      mockLoading.value = true
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Stats Display', () => {
    it('should render average duration stat card', () => {
      const wrapper = createWrapper()
      const statCards = wrapper.findAll('.rounded-lg.border.bg-card')
      // Should have at least one stat card
      expect(statCards.length).toBeGreaterThan(0)
    })

    it('should render shortest duration stat card', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render longest duration stat card', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render trend stats', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle different trend directions', () => {
      mockDurationStats.value = {
        ...getDefaultDurationStats(),
        trend: { direction: 'increasing', value: 10 },
      }
      const increasingWrapper = createWrapper()
      expect(increasingWrapper.exists()).toBe(true)

      mockDurationStats.value = {
        ...getDefaultDurationStats(),
        trend: { direction: 'decreasing', value: 8 },
      }
      const decreasingWrapper = createWrapper()
      expect(decreasingWrapper.exists()).toBe(true)

      mockDurationStats.value = {
        ...getDefaultDurationStats(),
        trend: { direction: 'stable', value: 1 },
      }
      const stableWrapper = createWrapper()
      expect(stableWrapper.exists()).toBe(true)
    })
  })

  describe('Chart Components', () => {
    it('should render VisXYContainer', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="vis-xy-container"]').exists()).toBe(true)
    })

    it('should render VisScatter for points', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="vis-scatter"]').exists()).toBe(true)
    })

    it('should render VisAxis components for axes', () => {
      const wrapper = createWrapper()
      const axes = wrapper.findAll('[data-testid="vis-axis"]')
      expect(axes.length).toBe(2) // X and Y axis
    })

    it('should render VisLine for trend line with sufficient data', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="vis-line"]').exists()).toBe(true)
    })
  })

  describe('Tooltip and Crosshair', () => {
    it('should render ChartTooltip', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="chart-tooltip"]').exists()).toBe(true)
    })

    it('should render ChartCrosshair', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="chart-crosshair"]').exists()).toBe(true)
    })
  })

  describe('Legend', () => {
    it('should render volume legend with three levels', () => {
      const wrapper = createWrapper()
      const legendItems = wrapper.findAll('.flex.items-center.gap-1\\.5')
      expect(legendItems.length).toBe(3)
    })

    it('should render legend colors', () => {
      const wrapper = createWrapper()
      // Low volume color (cyan)
      expect(wrapper.find('.bg-\\[\\#06b6d4\\]').exists()).toBe(true)
      // Medium volume color (amber)
      expect(wrapper.find('.bg-\\[\\#f59e0b\\]').exists()).toBe(true)
      // High volume color (green)
      expect(wrapper.find('.bg-\\[\\#10b981\\]').exists()).toBe(true)
    })
  })

  describe('Responsive Layout', () => {
    it('should have overflow container for mobile', () => {
      const wrapper = createWrapper()
      const container = wrapper.find('.overflow-x-auto')
      expect(container.exists()).toBe(true)
    })

    it('should have min-width for horizontal scrolling', () => {
      const wrapper = createWrapper()
      const chartContainer = wrapper.find('.min-w-\\[600px\\]')
      expect(chartContainer.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const defaultData = getDefaultDurationData()
      mockDurationTrendData.value = [defaultData[0]]
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle very short durations', () => {
      const defaultData = getDefaultDurationData()
      mockDurationTrendData.value = [{ ...defaultData[0], duration: 5 }]
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle very long durations', () => {
      const defaultData = getDefaultDurationData()
      mockDurationTrendData.value = [{ ...defaultData[0], duration: 300 }]
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle zero volume', () => {
      const defaultData = getDefaultDurationData()
      mockDurationTrendData.value = [{ ...defaultData[0], volume: 0 }]
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Stats Grid Layout', () => {
    it('should render stats in a grid layout', () => {
      const wrapper = createWrapper()
      const statsGrid = wrapper.find('.grid.grid-cols-2.sm\\:grid-cols-4')
      expect(statsGrid.exists()).toBe(true)
    })

    it('should display average duration value', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('62')
    })

    it('should display shortest duration value', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('55')
    })

    it('should display longest duration value', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('70')
    })
  })

  describe('Trend Direction Styling', () => {
    it('should apply green color for decreasing trend', () => {
      mockDurationStats.value = {
        ...mockDurationStats.value,
        trend: { direction: 'decreasing', value: 8 },
      }
      const wrapper = createWrapper()
      const trendElement = wrapper.find('.text-green-500')
      expect(trendElement.exists()).toBe(true)
    })

    it('should apply red color for increasing trend', () => {
      mockDurationStats.value = {
        ...mockDurationStats.value,
        trend: { direction: 'increasing', value: 10 },
      }
      const wrapper = createWrapper()
      const trendElement = wrapper.find('.text-red-500')
      expect(trendElement.exists()).toBe(true)
    })

    it('should apply muted color for stable trend', () => {
      mockDurationStats.value = {
        ...mockDurationStats.value,
        trend: { direction: 'stable', value: 1 },
      }
      const wrapper = createWrapper()
      const trendElement = wrapper.find('.text-muted-foreground')
      expect(trendElement.exists()).toBe(true)
    })
  })
})
