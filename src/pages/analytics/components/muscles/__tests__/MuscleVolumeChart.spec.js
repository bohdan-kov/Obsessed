import { describe, it, expect, beforeEach, vi } from 'vitest'
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
  CurveType: {
    MonotoneX: 'monotoneX',
    Linear: 'linear',
  },
}))

// Mock Unovis components
vi.mock('@unovis/vue', () => ({
  VisAxis: {
    name: 'VisAxis',
    props: ['type', 'tickLine', 'domainLine', 'gridLine', 'tickFormat', 'numTicks', 'x'],
    template: '<g class="vis-axis"></g>',
  },
  VisLine: {
    name: 'VisLine',
    props: ['x', 'y', 'color', 'lineWidth', 'curveType'],
    template: '<path class="vis-line"></path>',
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
    props: ['config', 'cursor'],
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
    back: '#3b82f6',
    chest: '#ef4444',
    legs: '#22c55e',
    shoulders: '#f97316',
    biceps: '#8b5cf6',
    triceps: '#ec4899',
    core: '#14b8a6',
    calves: '#eab308',
  },
}))

// Mock config
vi.mock('@/constants/config', () => ({
  CONFIG: {
    analytics: {
      CHART_MIN_POINT_SPACING: 40,
    },
  },
}))

// Mock dateUtils
vi.mock('@/utils/dateUtils', () => ({
  formatDateShort: (date, locale) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString(locale || 'uk', { month: 'short', day: 'numeric' })
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
}))

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useMediaQuery: vi.fn(() => ({ value: false })),
}))

// Module-level mock refs
let mockMuscleVolumeByDay
let mockLoading
let mockPeriod
let mockCurrentRange

// Mock analytics store
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({
    muscleVolumeByDay: mockMuscleVolumeByDay,
    loading: mockLoading,
    period: mockPeriod,
    currentRange: mockCurrentRange,
  }),
}))

import MuscleVolumeChart from '@/pages/analytics/components/muscles/MuscleVolumeChart.vue'

describe('MuscleVolumeChart', () => {
  const mockMuscleVolumeData = [
    {
      date: '2024-01-01',
      back: 5000,
      chest: 4000,
      legs: 6000,
      shoulders: 3000,
      biceps: 2000,
      triceps: 2500,
      core: 1500,
      calves: 1000,
    },
    {
      date: '2024-01-08',
      back: 5500,
      chest: 4200,
      legs: 6500,
      shoulders: 3200,
      biceps: 2100,
      triceps: 2600,
      core: 1600,
      calves: 1100,
    },
  ]

  beforeEach(() => {
    // Reset all mock refs before each test
    mockMuscleVolumeByDay = ref(mockMuscleVolumeData)
    mockLoading = ref(false)
    mockPeriod = ref(30)
    mockCurrentRange = ref({
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    })
  })

  function createWrapper(options = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Apply custom options to mock refs
    if (options.muscleVolumeByDay !== undefined) {
      mockMuscleVolumeByDay.value = options.muscleVolumeByDay
    }
    if (options.loading !== undefined) {
      mockLoading.value = options.loading
    }
    if (options.period !== undefined) {
      mockPeriod.value = options.period
    }

    return mount(MuscleVolumeChart, {
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
      expect(wrapper.text()).toContain('analytics.muscles.volumeOverTime.title')
    })

    it('should render card description', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('analytics.muscles.volumeOverTime.description')
    })

    it('should render all muscle legend buttons', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')
      // 8 muscle groups
      expect(buttons.length).toBe(8)
    })

    it('should render VisXYContainer when data exists', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'VisXYContainer' }).exists()).toBe(true)
    })

    it('should render VisLine for each visible muscle', () => {
      const wrapper = createWrapper()
      const lines = wrapper.findAllComponents({ name: 'VisLine' })
      // Initially 3 muscles are visible: back, chest, legs
      expect(lines.length).toBe(3)
    })

    it('should render VisAxis components', () => {
      const wrapper = createWrapper()
      const axes = wrapper.findAllComponents({ name: 'VisAxis' })
      expect(axes.length).toBe(2) // X and Y axis
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      const wrapper = createWrapper({ muscleVolumeByDay: [] })
      expect(wrapper.text()).toContain('analytics.muscles.volumeOverTime.emptyState')
    })

    it('should show empty state when data is null', () => {
      const wrapper = createWrapper({ muscleVolumeByDay: null })
      expect(wrapper.text()).toContain('analytics.muscles.volumeOverTime.emptyState')
    })

    it('should not show chart container when empty', () => {
      const wrapper = createWrapper({ muscleVolumeByDay: [] })
      expect(wrapper.find('.chart-container').exists()).toBe(false)
    })
  })

  describe('Loading State', () => {
    it('should show loading state when loading', () => {
      const wrapper = createWrapper({ loading: true })
      expect(wrapper.text()).toContain('common.loading')
    })

    it('should not show chart container when loading', () => {
      const wrapper = createWrapper({ loading: true })
      expect(wrapper.find('.chart-container').exists()).toBe(false)
    })
  })

  describe('Muscle Toggling', () => {
    it('should toggle muscle visibility when button clicked', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')
      const backButton = buttons[0] // First muscle (back)

      // Initially should be pressed (visible)
      expect(backButton.attributes('aria-pressed')).toBe('true')

      // Click to toggle off
      await backButton.trigger('click')
      expect(backButton.attributes('aria-pressed')).toBe('false')

      // Click to toggle back on
      await backButton.trigger('click')
      expect(backButton.attributes('aria-pressed')).toBe('true')
    })

    it('should maintain at least one visible muscle', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')

      // Initially 3 muscles are visible (back, chest, legs)
      const initialVisibleCount = buttons.filter(
        (btn) => btn.attributes('aria-pressed') === 'true'
      ).length
      expect(initialVisibleCount).toBe(3)
    })

    it('should not allow disabling the last visible muscle', async () => {
      const wrapper = createWrapper()

      // Disable all but one
      wrapper.vm.visibleMuscles = new Set(['back'])
      await flushPromises()

      const backButton = wrapper.findAll('button')[0]

      // Try to click the last visible muscle
      await backButton.trigger('click')

      // Should still be visible (can't disable last one)
      expect(wrapper.vm.visibleMuscles.has('back')).toBe(true)
    })

    it('should update visible muscles array when toggling', async () => {
      const wrapper = createWrapper()

      expect(wrapper.vm.visibleMusclesArray).toContain('back')
      expect(wrapper.vm.visibleMusclesArray).toContain('chest')
      expect(wrapper.vm.visibleMusclesArray).toContain('legs')

      // Toggle shoulders on
      const shouldersButton = wrapper.findAll('button')[3]
      await shouldersButton.trigger('click')

      expect(wrapper.vm.visibleMusclesArray).toContain('shoulders')
    })
  })

  describe('Chart Configuration', () => {
    it('should have chart config for all muscles', () => {
      const wrapper = createWrapper()
      const config = wrapper.vm.chartConfig

      expect(config.back).toBeDefined()
      expect(config.chest).toBeDefined()
      expect(config.legs).toBeDefined()
      expect(config.shoulders).toBeDefined()
      expect(config.biceps).toBeDefined()
      expect(config.triceps).toBeDefined()
      expect(config.core).toBeDefined()
      expect(config.calves).toBeDefined()
    })

    it('should have visible chart config for only visible muscles', () => {
      const wrapper = createWrapper()
      const visibleConfig = wrapper.vm.visibleChartConfig

      // Initially 3 muscles visible
      expect(Object.keys(visibleConfig).length).toBe(3)
      expect(visibleConfig.back).toBeDefined()
      expect(visibleConfig.chest).toBeDefined()
      expect(visibleConfig.legs).toBeDefined()
    })

    it('should calculate correct Y domain based on visible muscles', () => {
      const wrapper = createWrapper()
      const [min, max] = wrapper.vm.yDomain

      expect(min).toBe(0)
      expect(max).toBeGreaterThan(0)
    })
  })

  describe('Data Formatting', () => {
    it('should format date labels correctly', () => {
      const wrapper = createWrapper()
      const label = wrapper.vm.formatDateLabel(0)

      // Should return a formatted date
      expect(label).toBeTruthy()
    })

    it('should format Y-axis values correctly', () => {
      const wrapper = createWrapper()
      const formatted = wrapper.vm.formatYAxisValue(5000)

      // Y-axis values don't show unit (showUnit: false) for cleaner axis labels
      expect(formatted).toBe('5000')
    })

    it('should format tooltip values correctly for muscles', () => {
      const wrapper = createWrapper()
      const formatted = wrapper.vm.formatTooltipValue(5000, 'back')

      expect(formatted).toBe('5000 kg')
    })

    it('should pass through non-muscle keys in tooltip', () => {
      const wrapper = createWrapper()
      const formatted = wrapper.vm.formatTooltipValue('test', 'date')

      expect(formatted).toBe('test')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on toggle buttons', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')

      buttons.forEach((button) => {
        expect(button.attributes('aria-label')).toBeTruthy()
      })
    })

    it('should have aria-pressed attribute on buttons', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')

      buttons.forEach((button) => {
        expect(button.attributes('aria-pressed')).toBeDefined()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should have scroll wrapper for chart', () => {
      const wrapper = createWrapper()
      const scrollWrapper = wrapper.find('.chart-scroll-wrapper')
      expect(scrollWrapper.exists()).toBe(true)
    })

    it('should calculate min width for mobile scroll', () => {
      const wrapper = createWrapper()
      // Default is not mobile, so should be 'auto'
      expect(wrapper.vm.chartMinWidth).toBe('auto')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values for all muscles', () => {
      const dataWithZeros = [
        {
          date: '2024-01-01',
          back: 0,
          chest: 0,
          legs: 0,
          shoulders: 0,
          biceps: 0,
          triceps: 0,
          core: 0,
          calves: 0,
        },
      ]

      const wrapper = createWrapper({ muscleVolumeByDay: dataWithZeros })
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('should handle very large values', () => {
      const dataWithLargeValues = [
        {
          date: '2024-01-01',
          back: 999999,
          chest: 888888,
          legs: 777777,
          shoulders: 666666,
          biceps: 555555,
          triceps: 444444,
          core: 333333,
          calves: 222222,
        },
      ]

      const wrapper = createWrapper({ muscleVolumeByDay: dataWithLargeValues })
      expect(wrapper.find('.chart-container').exists()).toBe(true)
    })

    it('should handle single data point', () => {
      const singlePoint = [
        {
          date: '2024-01-01',
          back: 5000,
          chest: 4000,
          legs: 6000,
          shoulders: 3000,
          biceps: 2000,
          triceps: 2500,
          core: 1500,
          calves: 1000,
        },
      ]

      const wrapper = createWrapper({ muscleVolumeByDay: singlePoint })
      expect(wrapper.find('.chart-container').exists()).toBe(true)
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

  describe('Legend Styling', () => {
    it('should show colored indicator for each muscle', () => {
      const wrapper = createWrapper()
      const indicators = wrapper.findAll('button span.rounded-sm')

      expect(indicators.length).toBe(8)
    })

    it('should display muscle names in legend', () => {
      const wrapper = createWrapper()
      const text = wrapper.text()

      expect(text).toContain('common.muscleGroups.back')
      expect(text).toContain('common.muscleGroups.chest')
      expect(text).toContain('common.muscleGroups.legs')
    })
  })
})
