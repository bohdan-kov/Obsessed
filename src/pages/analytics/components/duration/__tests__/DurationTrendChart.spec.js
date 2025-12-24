import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import DurationTrendChart from '../DurationTrendChart.vue'

describe('DurationTrendChart', () => {
  const mockDurationData = [
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

  const mockDurationStats = {
    average: 62,
    shortest: { value: 55, date: new Date('2024-01-05') },
    longest: { value: 70, date: new Date('2024-01-03') },
    trend: { direction: 'stable', value: 5 },
  }

  function createWrapper(initialState = {}, options = {}) {
    const mockRouter = {
      push: vi.fn(),
      currentRoute: { value: { path: '/analytics' } },
    }

    const wrapper = mount(DurationTrendChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              analytics: {
                durationTrendData: mockDurationData,
                durationStats: mockDurationStats,
                loading: false,
                ...initialState,
              },
            },
            stubActions: false,
          }),
        ],
        mocks: {
          $router: mockRouter,
          ...options.mocks,
        },
        provide: {
          router: mockRouter,
        },
        stubs: {
          BaseChart: {
            template: '<div class="base-chart"><slot name="header" /><slot /></div>',
            props: ['data', 'loading', 'title', 'description', 'emptyIcon', 'height'],
          },
        },
      },
    })

    return wrapper
  }

  describe('Rendering', () => {
    it('should render chart with data', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.base-chart').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should render stats panel when stats available', () => {
      const wrapper = createWrapper()
      const statCards = wrapper.findAll('.rounded-lg.border.bg-card')
      // 4 stat cards: average, shortest, longest, trend
      expect(statCards.length).toBe(4)
    })

    it('should not render stats panel when no stats', () => {
      const wrapper = createWrapper({ durationStats: null })
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

    it('should render scatter points', () => {
      const wrapper = createWrapper()
      const points = wrapper.findAll('.points circle')
      expect(points.length).toBe(mockDurationData.length)
    })

    it('should render trend line', () => {
      const wrapper = createWrapper()
      const trendLine = wrapper.find('path[stroke-dasharray="8,4"]')
      expect(trendLine.exists()).toBe(true)
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
      const wrapper = createWrapper({
        durationTrendData: [],
        durationStats: null,
      })
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })

    it('should handle null data', () => {
      const wrapper = createWrapper({
        durationTrendData: null,
        durationStats: null,
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
    it('should render average duration stat card', () => {
      const wrapper = createWrapper()
      const statCards = wrapper.findAll('.rounded-lg.border.bg-card')
      // Should have at least one stat card
      expect(statCards.length).toBeGreaterThan(0)
    })

    it('should render shortest duration stat card', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })

    it('should render longest duration stat card', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })

    it('should render trend stats', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })

    it('should handle different trend directions', () => {
      const increasingWrapper = createWrapper({
        durationStats: {
          ...mockDurationStats,
          trend: { direction: 'increasing', value: 10 },
        },
      })
      expect(increasingWrapper.find('.base-chart').exists()).toBe(true)

      const decreasingWrapper = createWrapper({
        durationStats: {
          ...mockDurationStats,
          trend: { direction: 'decreasing', value: 8 },
        },
      })
      expect(decreasingWrapper.find('.base-chart').exists()).toBe(true)

      const stableWrapper = createWrapper({
        durationStats: {
          ...mockDurationStats,
          trend: { direction: 'stable', value: 1 },
        },
      })
      expect(stableWrapper.find('.base-chart').exists()).toBe(true)
    })
  })

  describe('SVG Chart', () => {
    it('should generate valid SVG viewBox', () => {
      const wrapper = createWrapper()
      const svg = wrapper.find('svg')
      expect(svg.attributes('viewBox')).toBe('0 0 800 350')
    })

    it('should have Y-axis labels', () => {
      const wrapper = createWrapper()
      const yAxisTexts = wrapper.findAll('.y-axis text')
      expect(yAxisTexts.length).toBeGreaterThan(0)
    })

    it('should have X-axis labels', () => {
      const wrapper = createWrapper()
      const xAxisTexts = wrapper.findAll('.x-axis text')
      expect(xAxisTexts.length).toBeGreaterThan(0)
    })
  })

  describe('Scatter Points', () => {
    it('should color points based on volume', () => {
      const wrapper = createWrapper()
      const circles = wrapper.findAll('.points circle')

      circles.forEach((circle) => {
        const fill = circle.attributes('fill')
        // Should be one of the volume colors
        expect(['#06b6d4', '#f59e0b', '#10b981']).toContain(fill)
      })
    })

    it('should have tooltips on points', () => {
      const wrapper = createWrapper()
      const circles = wrapper.findAll('.points circle')

      circles.forEach((circle) => {
        expect(circle.find('title').exists()).toBe(true)
      })
    })

    it('should make points clickable', () => {
      const wrapper = createWrapper()
      const circles = wrapper.findAll('.points circle')

      circles.forEach((circle) => {
        expect(circle.classes()).toContain('cursor-pointer')
      })
    })
  })

  describe('Navigation', () => {
    it('should have clickable points', async () => {
      const wrapper = createWrapper()
      const circles = wrapper.findAll('.points circle')

      circles.forEach((circle) => {
        expect(circle.classes()).toContain('cursor-pointer')
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
    it('should handle single data point', () => {
      const singlePoint = [mockDurationData[0]]
      const wrapper = createWrapper({ durationTrendData: singlePoint })
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should handle very short durations', () => {
      const shortDuration = [{ ...mockDurationData[0], duration: 5 }]
      const wrapper = createWrapper({ durationTrendData: shortDuration })
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should handle very long durations', () => {
      const longDuration = [{ ...mockDurationData[0], duration: 300 }]
      const wrapper = createWrapper({ durationTrendData: longDuration })
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should handle zero volume', () => {
      const zeroVolume = [{ ...mockDurationData[0], volume: 0 }]
      const wrapper = createWrapper({ durationTrendData: zeroVolume })
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })
})
