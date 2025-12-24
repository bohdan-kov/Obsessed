import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { ref, computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import VolumeHeatmap from '../VolumeHeatmap.vue'

// Mock useContributionHeatmap composable
vi.mock('@/composables/useContributionHeatmap', () => ({
  useContributionHeatmap: vi.fn(() => {
    const gridData = ref([
      [
        { date: new Date('2024-01-01'), dateStr: '2024-01-01', count: 0, level: 0 },
        { date: new Date('2024-01-02'), dateStr: '2024-01-02', count: 0, level: 0 },
        { date: new Date('2024-01-03'), dateStr: '2024-01-03', count: 0, level: 0 },
        { date: new Date('2024-01-04'), dateStr: '2024-01-04', count: 0, level: 0 },
        { date: new Date('2024-01-05'), dateStr: '2024-01-05', count: 0, level: 0 },
        { date: new Date('2024-01-06'), dateStr: '2024-01-06', count: 0, level: 0 },
        { date: new Date('2024-01-07'), dateStr: '2024-01-07', count: 0, level: 0 },
      ],
      [
        { date: new Date('2024-01-08'), dateStr: '2024-01-08', count: 0, level: 0 },
        { date: new Date('2024-01-09'), dateStr: '2024-01-09', count: 0, level: 0 },
        { date: new Date('2024-01-10'), dateStr: '2024-01-10', count: 0, level: 0 },
        { date: new Date('2024-01-11'), dateStr: '2024-01-11', count: 0, level: 0 },
        { date: new Date('2024-01-12'), dateStr: '2024-01-12', count: 0, level: 0 },
        { date: new Date('2024-01-13'), dateStr: '2024-01-13', count: 0, level: 0 },
        { date: new Date('2024-01-14'), dateStr: '2024-01-14', count: 0, level: 0 },
      ],
    ])

    const monthLabels = computed(() => [{ label: 'Jan', weekIndex: 0 }])
    const dayLabels = computed(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])

    return {
      gridData,
      monthLabels,
      dayLabels,
    }
  }),
}))

describe('VolumeHeatmap', () => {
  const mockDailyVolumeMap = {
    '2024-01-01': 0,
    '2024-01-02': 2000,
    '2024-01-03': 5000,
    '2024-01-04': 8000,
    '2024-01-05': 10000,
  }

  function createWrapper(volumeMapOverride = null) {
    const pinia = createTestingPinia({
      stubActions: false,
    })

    const wrapper = mount(VolumeHeatmap, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseChart: {
            template: '<div class="base-chart"><slot /></div>',
            props: ['data', 'loading', 'title', 'description'],
          },
        },
      },
    })

    // Mock the store's computed properties
    const analyticsStore = useAnalyticsStore(pinia)
    analyticsStore.dailyVolumeMap = volumeMapOverride || mockDailyVolumeMap
    analyticsStore.loading = false

    return wrapper
  }

  describe('Rendering', () => {
    it('should render heatmap with data', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.base-chart').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should render month labels', () => {
      const wrapper = createWrapper()
      const monthLabels = wrapper.findAll('.month-labels text')
      expect(monthLabels.length).toBeGreaterThan(0)
    })

    it('should render weekday labels', () => {
      const wrapper = createWrapper()
      const weekdayLabels = wrapper.findAll('.weekday-labels text')
      expect(weekdayLabels.length).toBe(7)
    })

    it('should render heatmap grid', () => {
      const wrapper = createWrapper()
      const grid = wrapper.find('.heatmap-grid')
      expect(grid.exists()).toBe(true)
    })

    it('should render cells for each day', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')
      // 2 weeks × 7 days = 14 cells
      expect(cells.length).toBe(14)
    })

    it('should render legend', () => {
      const wrapper = createWrapper()
      const legend = wrapper.findAll('.rounded-sm')
      // 5 legend items (0 + 4 intensity levels)
      expect(legend.length).toBe(5)
    })
  })

  describe('Empty State', () => {
    it('should handle empty volume map', () => {
      const wrapper = createWrapper({ dailyVolumeMap: {} })
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })

    it('should handle null volume map', () => {
      const wrapper = createWrapper({ dailyVolumeMap: null })
      expect(wrapper.find('.base-chart').exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should pass loading prop to BaseChart', () => {
      const wrapper = createWrapper({ loading: true })
      expect(wrapper.findComponent({ name: 'BaseChart' }).props('loading')).toBe(true)
    })
  })

  describe('Color Coding', () => {
    it('should apply correct color for zero volume', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')

      // Check if any cell has muted color (for zero volume)
      const hasMutedColor = cells.some((cell) => cell.classes().includes('fill-muted/30'))
      expect(hasMutedColor).toBe(true)
    })

    it('should apply correct color for low volume', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')

      // Check if any cell has green-200 color (for low volume)
      const hasLowColor = cells.some((cell) => cell.classes().includes('fill-green-200'))
      expect(hasLowColor).toBe(true)
    })

    it('should apply correct color for medium volume', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')

      // Check if any cell has green-300 or green-400 color
      const hasMediumColor = cells.some(
        (cell) =>
          cell.classes().includes('fill-green-300') || cell.classes().includes('fill-green-400'),
      )
      expect(hasMediumColor).toBe(true)
    })

    it('should apply correct color for high volume', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')

      // Check if any cell has green-500 color (for high volume)
      const hasHighColor = cells.some((cell) => cell.classes().includes('fill-green-500'))
      expect(hasHighColor).toBe(true)
    })
  })

  describe('Tooltips', () => {
    it('should have tooltips on cells', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')

      cells.forEach((cell) => {
        expect(cell.find('title').exists()).toBe(true)
      })
    })

    it('should show "No workout" for zero volume days', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')

      // Find cell with zero volume
      const zeroVolumeCell = cells.find((cell) => cell.classes().includes('fill-muted/30'))

      if (zeroVolumeCell) {
        const tooltip = zeroVolumeCell.find('title')
        expect(tooltip.text()).toContain('analytics.volume.heatmap.noWorkout')
      }
    })
  })

  describe('SVG Dimensions', () => {
    it('should calculate correct SVG width', () => {
      const wrapper = createWrapper()
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBeTruthy()
    })

    it('should calculate correct SVG height', () => {
      const wrapper = createWrapper()
      const svg = wrapper.find('svg')
      expect(svg.attributes('height')).toBeTruthy()
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

    it('should have role="button" on cells', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')

      cells.forEach((cell) => {
        expect(cell.attributes('role')).toBe('button')
      })
    })

    it('should have aria-label on cells', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.heatmap-grid rect')

      cells.forEach((cell) => {
        expect(cell.attributes('aria-label')).toBeTruthy()
      })
    })
  })

  describe('Responsive', () => {
    it('should have overflow container for mobile', () => {
      const wrapper = createWrapper()
      const container = wrapper.find('.overflow-x-auto')
      expect(container.exists()).toBe(true)
    })

    it('should have min-width on SVG', () => {
      const wrapper = createWrapper()
      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('min-w-full')
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

    it('should have 5 color boxes in legend', () => {
      const wrapper = createWrapper()
      const legendColors = wrapper.findAll('.flex.items-center.gap-1 > div')
      expect(legendColors.length).toBe(5)
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
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should handle very large volumes', () => {
      const largeVolumes = {
        '2024-01-01': 999999,
        '2024-01-02': 888888,
      }
      const wrapper = createWrapper({ dailyVolumeMap: largeVolumes })
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should handle sparse data (many gaps)', () => {
      const sparseData = {
        '2024-01-01': 5000,
        '2024-01-15': 6000,
        '2024-01-30': 7000,
      }
      const wrapper = createWrapper({ dailyVolumeMap: sparseData })
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })
})
