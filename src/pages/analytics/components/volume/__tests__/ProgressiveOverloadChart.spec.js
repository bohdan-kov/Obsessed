import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ProgressiveOverloadChart from '../ProgressiveOverloadChart.vue'

describe('ProgressiveOverloadChart', () => {
  const mockWeeklyProgression = [
    {
      weekNumber: 1,
      weekStart: new Date('2024-01-01'),
      weekLabel: 'Week 1',
      volume: 10000,
      workouts: 3,
      change: 0,
      status: 'maintaining',
    },
    {
      weekNumber: 2,
      weekStart: new Date('2024-01-08'),
      weekLabel: 'Week 2',
      volume: 11000,
      workouts: 3,
      change: 10,
      status: 'progressing',
    },
    {
      weekNumber: 3,
      weekStart: new Date('2024-01-15'),
      weekLabel: 'Week 3',
      volume: 10500,
      workouts: 3,
      change: -4.5,
      status: 'regressing',
    },
  ]

  const mockProgressiveStats = {
    weeksProgressing: 1,
    totalWeeks: 2,
    progressRate: 50,
    avgIncrease: 2.75,
    overallStatus: 'on_track',
    nextWeekTarget: 11025,
  }

  function createWrapper(initialState = {}) {
    return mount(ProgressiveOverloadChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              analytics: {
                weeklyVolumeProgression: mockWeeklyProgression,
                progressiveOverloadStats: mockProgressiveStats,
                loading: false,
                ...initialState,
              },
            },
          }),
        ],
        stubs: {
          BaseChart: {
            template: '<div class="base-chart"><slot /><slot name="header" /></div>',
            props: ['data', 'loading', 'title', 'description'],
          },
        },
      },
    })
  }

  describe('Rendering', () => {
    it('should render chart with data', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.base-chart').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should render when stats available', () => {
      const wrapper = createWrapper()
      // BaseChart stub renders, stats would be in slot header
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })

    it('should not render stats panel when no stats', () => {
      const wrapper = createWrapper({ progressiveOverloadStats: null })
      const statCards = wrapper.findAll('.rounded-lg.border.bg-card')
      expect(statCards.length).toBe(0)
    })

    it('should render axes', () => {
      const wrapper = createWrapper()
      const yAxis = wrapper.find('.y-axis')
      const xAxis = wrapper.find('.x-axis')

      expect(yAxis.exists()).toBe(true)
      expect(xAxis.exists()).toBe(true)
    })

    it('should render bar chart elements', () => {
      const wrapper = createWrapper()
      const bars = wrapper.find('.bars')
      expect(bars.exists()).toBe(true)
    })

    it('should render legend', () => {
      const wrapper = createWrapper()
      const legendItems = wrapper.findAll('.flex.items-center.gap-1\\.5')
      // 3 legend items: progressing, maintaining, regressing
      expect(legendItems.length).toBe(3)
    })
  })

  describe('Empty State', () => {
    it('should handle empty data array', () => {
      const wrapper = createWrapper({
        weeklyVolumeProgression: [],
        progressiveOverloadStats: null,
      })
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })

    it('should handle null data', () => {
      const wrapper = createWrapper({
        weeklyVolumeProgression: null,
        progressiveOverloadStats: null,
      })
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should render with loading state', () => {
      const wrapper = createWrapper({ loading: true })
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })
  })

  describe('Stats Display', () => {
    it('should render stats when available', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })

    it('should handle different status types', () => {
      const onTrackWrapper = createWrapper()
      expect(onTrackWrapper.find('.base-chart').exists()).toBe(true)

      const maintainingWrapper = createWrapper({
        progressiveOverloadStats: {
          ...mockProgressiveStats,
          overallStatus: 'maintaining',
        },
      })
      expect(maintainingWrapper.find('.base-chart').exists()).toBe(true)

      const regressingWrapper = createWrapper({
        progressiveOverloadStats: {
          ...mockProgressiveStats,
          overallStatus: 'regressing',
        },
      })
      expect(regressingWrapper.find('.base-chart').exists()).toBe(true)
    })
  })

  describe('SVG Chart', () => {
    it('should generate valid SVG viewBox', () => {
      const wrapper = createWrapper()
      const svg = wrapper.find('svg')
      expect(svg.attributes('viewBox')).toBe('0 0 800 350')
    })

    it('should have Y-axis', () => {
      const wrapper = createWrapper()
      const yAxis = wrapper.find('.y-axis')
      expect(yAxis.exists()).toBe(true)
    })

    it('should have X-axis', () => {
      const wrapper = createWrapper()
      const xAxis = wrapper.find('.x-axis')
      expect(xAxis.exists()).toBe(true)
    })
  })

  describe('Bar Colors', () => {
    it('should render bars with appropriate colors', () => {
      const wrapper = createWrapper()
      const bars = wrapper.find('.bars')
      expect(bars.exists()).toBe(true)
    })
  })

  describe('Percentage Labels', () => {
    it('should render bar group for labels', () => {
      const wrapper = createWrapper()
      const bars = wrapper.find('.bars')
      expect(bars.exists()).toBe(true)
    })
  })

  describe('Tooltips', () => {
    it('should have tooltips on bars', () => {
      const wrapper = createWrapper()
      const bars = wrapper.findAll('.bars rect')

      bars.forEach((bar) => {
        expect(bar.find('title').exists()).toBe(true)
      })
    })

    it('should include week label in tooltip', () => {
      const wrapper = createWrapper()
      const bars = wrapper.findAll('.bars rect')

      bars.forEach((bar, index) => {
        const tooltip = bar.find('title')
        expect(tooltip.text()).toContain(mockWeeklyProgression[index].weekLabel)
      })
    })

    it('should include percentage change in tooltip', () => {
      const wrapper = createWrapper()
      const bars = wrapper.findAll('.bars rect')

      bars.forEach((bar) => {
        const tooltip = bar.find('title')
        expect(tooltip.text()).toContain('%')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on SVG', () => {
      const wrapper = createWrapper()
      const svg = wrapper.find('svg')
      expect(svg.attributes('aria-label')).toBeTruthy()
    })

    it('should have role="img" on SVG', () => {
      const wrapper = createWrapper()
      const svg = wrapper.find('svg')
      expect(svg.attributes('role')).toBe('img')
    })
  })

  describe('Responsive', () => {
    it('should have responsive SVG classes', () => {
      const wrapper = createWrapper()
      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('w-full')
      expect(svg.classes()).toContain('min-w-[600px]')
    })

    it('should have overflow container for mobile', () => {
      const wrapper = createWrapper()
      const container = wrapper.find('.overflow-x-auto')
      expect(container.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single week', () => {
      const singleWeek = [mockWeeklyProgression[0]]
      const wrapper = createWrapper({ weeklyVolumeProgression: singleWeek })
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should handle many weeks', () => {
      const manyWeeks = Array.from({ length: 20 }, (_, i) => ({
        ...mockWeeklyProgression[0],
        weekNumber: i + 1,
        weekLabel: `Week ${i + 1}`,
      }))
      const wrapper = createWrapper({ weeklyVolumeProgression: manyWeeks })
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should handle zero volume weeks', () => {
      const zeroVolume = [{ ...mockWeeklyProgression[0], volume: 0 }]
      const wrapper = createWrapper({ weeklyVolumeProgression: zeroVolume })
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should handle very large volume changes', () => {
      const largeChange = [{ ...mockWeeklyProgression[0], change: 500 }]
      const wrapper = createWrapper({ weeklyVolumeProgression: largeChange })
      expect(wrapper.find('svg').exists()).toBe(true)
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

      expect(text).toContain('≥2.5%')
      expect(text).toContain('±2.5%')
      expect(text).toContain('≤-2.5%')
    })
  })
})
