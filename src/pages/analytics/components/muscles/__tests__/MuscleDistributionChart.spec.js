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

// Mock @unovis/ts
vi.mock('@unovis/ts', () => ({
  Orientation: {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
  },
}))

// Mock Unovis components
vi.mock('@unovis/vue', () => ({
  VisAxis: {
    name: 'VisAxis',
    props: ['type', 'tickLine', 'domainLine', 'gridLine', 'tickFormat', 'numTicks', 'y', 'x'],
    template: '<g class="vis-axis" data-type="axis"></g>',
  },
  VisGroupedBar: {
    name: 'VisGroupedBar',
    props: ['x', 'y', 'color', 'roundedCorners', 'orientation', 'barPadding'],
    template: '<g class="vis-grouped-bar" data-type="bar"></g>',
  },
  VisXYContainer: {
    name: 'VisXYContainer',
    props: ['data', 'margin', 'yDomain', 'xDomain'],
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
    props: ['class'],
    template: '<div class="card"><slot /></div>',
  },
  CardContent: {
    name: 'CardContent',
    props: ['class'],
    template: '<div class="card-content"><slot /></div>',
  },
  CardDescription: {
    name: 'CardDescription',
    template: '<div class="card-description"><slot /></div>',
  },
  CardHeader: {
    name: 'CardHeader',
    props: ['class'],
    template: '<div class="card-header"><slot /></div>',
  },
  CardTitle: {
    name: 'CardTitle',
    template: '<div class="card-title"><slot /></div>',
  },
}))

// Mock chartUtils
vi.mock('@/utils/chartUtils', () => ({
  MUSCLE_COLORS: {
    chest: '#ef4444',
    back: '#3b82f6',
    legs: '#22c55e',
    shoulders: '#f97316',
    biceps: '#8b5cf6',
    triceps: '#ec4899',
    core: '#14b8a6',
    calves: '#eab308',
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
let mockMuscleDistribution
let mockLoading

// Mock analytics store
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({
    muscleDistribution: mockMuscleDistribution,
    loading: mockLoading,
  }),
}))

import MuscleDistributionChart from '@/pages/analytics/components/muscles/MuscleDistributionChart.vue'

describe('MuscleDistributionChart', () => {
  const mockMuscleDistributionData = [
    { muscle: 'chest', sets: 150, percentage: 30 },
    { muscle: 'back', sets: 125, percentage: 25 },
    { muscle: 'legs', sets: 100, percentage: 20 },
    { muscle: 'shoulders', sets: 75, percentage: 15 },
    { muscle: 'biceps', sets: 50, percentage: 10 },
  ]

  beforeEach(() => {
    // Reset mock refs before each test
    mockMuscleDistribution = ref(mockMuscleDistributionData)
    mockLoading = ref(false)
  })

  function createWrapper(options = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Apply custom options to mock refs
    if (options.muscleDistribution !== undefined) {
      mockMuscleDistribution.value = options.muscleDistribution
    }
    if (options.loading !== undefined) {
      mockLoading.value = options.loading
    }

    return mount(MuscleDistributionChart, {
      global: {
        plugins: [pinia],
      },
    })
  }

  describe('Rendering', () => {
    it('renders chart container with muscle distribution data', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('displays card title', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.muscles.distribution.title')
    })

    it('displays card description', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.muscles.distribution.description')
    })

    it('renders VisXYContainer when data exists', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'VisXYContainer' }).exists()).toBe(true)
    })

    it('renders VisGroupedBar for horizontal bars', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'VisGroupedBar' }).exists()).toBe(true)
    })

    it('renders VisAxis components for axes', () => {
      const wrapper = createWrapper()
      const axes = wrapper.findAllComponents({ name: 'VisAxis' })
      expect(axes.length).toBe(2) // Y-axis (muscle names) and X-axis (percentages)
    })
  })

  describe('Loading State', () => {
    it('shows loading state when loading', () => {
      const wrapper = createWrapper({ loading: true })
      expect(wrapper.text()).toContain('common.loading')
    })

    it('does not show chart container when loading', () => {
      const wrapper = createWrapper({ loading: true })
      expect(wrapper.find('.chart-container').exists()).toBe(false)
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no data', () => {
      const wrapper = createWrapper({ muscleDistribution: [] })
      expect(wrapper.text()).toContain('analytics.muscles.distribution.emptyState')
    })

    it('does not show chart container when empty', () => {
      const wrapper = createWrapper({ muscleDistribution: [] })
      expect(wrapper.find('.chart-container').exists()).toBe(false)
    })

    it('shows empty state icon (SVG)', () => {
      const wrapper = createWrapper({ muscleDistribution: [] })
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })

  describe('Data Transformation', () => {
    it('transforms muscle distribution data for chart', () => {
      const wrapper = createWrapper()
      const chartData = wrapper.vm.chartData

      expect(chartData.length).toBe(5)
      expect(chartData[0].muscle).toBe('chest')
      expect(chartData[0].percentage).toBe(30)
    })

    it('includes translated muscle names in chart data', () => {
      const wrapper = createWrapper()
      const chartData = wrapper.vm.chartData

      // Since $t returns key, muscleName should be the translation key
      expect(chartData[0].muscleName).toBe('common.muscleGroups.chest')
    })

    it('builds chart config with colors for each muscle', () => {
      const wrapper = createWrapper()
      const config = wrapper.vm.chartConfig

      expect(config.chest).toBeDefined()
      expect(config.chest.color).toBeDefined()
      expect(config.back).toBeDefined()
    })
  })

  describe('Chart Configuration', () => {
    it('passes correct props to VisXYContainer', () => {
      const wrapper = createWrapper()
      const container = wrapper.findComponent({ name: 'VisXYContainer' })

      expect(container.props('data')).toHaveLength(5)
      expect(container.props('xDomain')).toEqual([0, 100])
    })

    it('passes correct margin to VisXYContainer', () => {
      const wrapper = createWrapper()
      const container = wrapper.findComponent({ name: 'VisXYContainer' })
      const margin = container.props('margin')

      expect(margin).toBeDefined()
      expect(margin.left).toBeGreaterThan(0)
    })
  })

  describe('Helper Functions', () => {
    it('getBarColor returns correct color for muscle', () => {
      const wrapper = createWrapper()
      // Access the internal function via vm
      const color = wrapper.vm.getBarColor({ muscle: 'chest' })
      expect(color).toBe('#ef4444')
    })

    it('formatMuscleLabel returns muscle name from chart data', () => {
      const wrapper = createWrapper()
      const label = wrapper.vm.formatMuscleLabel(0)
      expect(label).toBe('common.muscleGroups.chest')
    })

    it('formatPercentageLabel formats value as percentage', () => {
      const wrapper = createWrapper()
      const label = wrapper.vm.formatPercentageLabel(50)
      expect(label).toBe('50%')
    })

    it('formatTooltipValue formats percentage correctly', () => {
      const wrapper = createWrapper()
      const value = wrapper.vm.formatTooltipValue(25, 'percentage')
      expect(value).toBe('25%')
    })

    it('formatTooltipValue formats sets correctly', () => {
      const wrapper = createWrapper()
      const value = wrapper.vm.formatTooltipValue(100, 'sets')
      expect(value).toContain('100')
      expect(value).toContain('common.sets')
    })
  })

  describe('Dynamic Height', () => {
    it('calculates height based on number of muscles', () => {
      const wrapper = createWrapper()
      // 5 muscles * 50px = 250px, but minimum is 300px
      const chartWrapper = wrapper.find('.aspect-auto')
      expect(chartWrapper.exists()).toBe(true)
    })

    it('has minimum height for small datasets', () => {
      const smallData = [{ muscle: 'chest', sets: 100, percentage: 100 }]
      const wrapper = createWrapper({ muscleDistribution: smallData })

      // Should still render with proper height
      expect(wrapper.find('.aspect-auto').exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles null muscle distribution gracefully', () => {
      const wrapper = createWrapper({ muscleDistribution: null })
      // Should show empty state
      expect(wrapper.text()).toContain('analytics.muscles.distribution.emptyState')
    })

    it('handles single muscle correctly', () => {
      const singleMuscle = [{ muscle: 'chest', sets: 100, percentage: 100 }]
      const wrapper = createWrapper({ muscleDistribution: singleMuscle })

      expect(wrapper.vm.chartData.length).toBe(1)
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('handles all muscles with equal distribution', () => {
      const equalDistribution = [
        { muscle: 'chest', sets: 50, percentage: 12.5 },
        { muscle: 'back', sets: 50, percentage: 12.5 },
        { muscle: 'legs', sets: 50, percentage: 12.5 },
        { muscle: 'shoulders', sets: 50, percentage: 12.5 },
        { muscle: 'biceps', sets: 50, percentage: 12.5 },
        { muscle: 'triceps', sets: 50, percentage: 12.5 },
        { muscle: 'core', sets: 50, percentage: 12.5 },
        { muscle: 'calves', sets: 50, percentage: 12.5 },
      ]
      const wrapper = createWrapper({ muscleDistribution: equalDistribution })

      expect(wrapper.vm.chartData.length).toBe(8)
    })

    it('handles muscle with zero sets', () => {
      const withZero = [
        { muscle: 'chest', sets: 100, percentage: 50 },
        { muscle: 'back', sets: 0, percentage: 0 },
      ]
      const wrapper = createWrapper({ muscleDistribution: withZero })

      expect(wrapper.vm.chartData[1].sets).toBe(0)
    })
  })

  describe('Tooltip Integration', () => {
    it('renders ChartTooltip component', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'ChartTooltip' }).exists()).toBe(true)
    })

    it('renders ChartCrosshair component', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'ChartCrosshair' }).exists()).toBe(true)
    })
  })
})
