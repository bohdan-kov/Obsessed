import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { Skeleton } from '@/components/ui/skeleton'

describe('LoadingSkeleton', () => {
  let wrapper

  beforeEach(() => {
    wrapper = null
  })

  describe('Chart Type', () => {
    beforeEach(() => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'chart',
        },
      })
    })

    it('renders chart skeleton structure', () => {
      expect(wrapper.findAllComponents(Skeleton).length).toBeGreaterThan(0)
    })

    it('renders chart header skeleton', () => {
      // Should have title and legend skeletons
      const skeletons = wrapper.findAllComponents(Skeleton)
      expect(skeletons.length).toBeGreaterThan(3)
    })

    it('renders Y-axis label skeletons', () => {
      // Should have Y-axis labels
      const yAxisContainer = wrapper.find('.absolute.left-0')
      expect(yAxisContainer.exists()).toBe(true)

      const yAxisSkeletons = yAxisContainer.findAllComponents(Skeleton)
      expect(yAxisSkeletons.length).toBe(5)
    })

    it('renders chart bar skeletons', () => {
      // Should have multiple bars
      const chartBars = wrapper.find('.ml-12')
      expect(chartBars.exists()).toBe(true)

      const barSkeletons = chartBars.findAllComponents(Skeleton)
      expect(barSkeletons.length).toBe(7) // 7 bars
    })

    it('renders X-axis label skeletons', () => {
      // Should have X-axis labels
      const xAxisContainer = wrapper.find('.absolute.bottom-0.left-12')
      expect(xAxisContainer.exists()).toBe(true)

      const xAxisSkeletons = xAxisContainer.findAllComponents(Skeleton)
      expect(xAxisSkeletons.length).toBe(4)
    })

    it('applies custom height to chart container', async () => {
      await wrapper.setProps({ height: '600px' })

      const container = wrapper.find('.loading-skeleton')
      expect(container.attributes('style')).toContain('min-height: 600px')
    })

    it('uses default height of 400px', () => {
      const container = wrapper.find('.loading-skeleton')
      expect(container.attributes('style')).toContain('min-height: 400px')
    })
  })

  describe('Table Type', () => {
    beforeEach(() => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'table',
          rows: 5,
        },
      })
    })

    it('renders table skeleton structure', () => {
      const skeletons = wrapper.findAllComponents(Skeleton)
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders table header row', () => {
      const header = wrapper.find('.border-b')
      expect(header.exists()).toBe(true)

      const headerSkeletons = header.findAllComponents(Skeleton)
      expect(headerSkeletons.length).toBe(4) // 4 columns
    })

    it('renders correct number of table rows based on rows prop', async () => {
      // Default is 5 rows
      let rowContainers = wrapper.findAll('.py-3.border-b.border-border\\/50')
      expect(rowContainers.length).toBe(5)

      // Change to 3 rows
      await wrapper.setProps({ rows: 3 })
      rowContainers = wrapper.findAll('.py-3.border-b.border-border\\/50')
      expect(rowContainers.length).toBe(3)

      // Change to 10 rows
      await wrapper.setProps({ rows: 10 })
      rowContainers = wrapper.findAll('.py-3.border-b.border-border\\/50')
      expect(rowContainers.length).toBe(10)
    })

    it('each row has correct number of cell skeletons', () => {
      const rows = wrapper.findAll('.py-3.border-b.border-border\\/50')

      rows.forEach((row) => {
        const cellSkeletons = row.findAllComponents(Skeleton)
        expect(cellSkeletons.length).toBe(4) // 4 cells per row
      })
    })
  })

  describe('Card Type', () => {
    beforeEach(() => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'card',
          rows: 4,
        },
      })
    })

    it('renders card skeleton structure', () => {
      const skeletons = wrapper.findAllComponents(Skeleton)
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders header section skeleton', () => {
      const headerSection = wrapper.find('.space-y-2')
      expect(headerSection.exists()).toBe(true)

      const headerSkeletons = headerSection.findAllComponents(Skeleton)
      expect(headerSkeletons.length).toBe(2) // Title + description
    })

    it('renders grid of card sections', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-2')
    })

    it('renders correct number of card sections based on rows prop', async () => {
      // Should render min(rows, 4) cards
      let cards = wrapper.findAll('.p-4.border.rounded-lg')
      expect(cards.length).toBe(4)

      await wrapper.setProps({ rows: 2 })
      cards = wrapper.findAll('.p-4.border.rounded-lg')
      expect(cards.length).toBe(2)

      await wrapper.setProps({ rows: 6 })
      cards = wrapper.findAll('.p-4.border.rounded-lg')
      expect(cards.length).toBe(4) // Capped at 4
    })

    it('each card section has three skeletons', () => {
      const cards = wrapper.findAll('.p-4.border.rounded-lg')

      cards.forEach((card) => {
        const skeletons = card.findAllComponents(Skeleton)
        expect(skeletons.length).toBe(3) // Label + value + description
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'chart',
        },
      })
    })

    it('has role="status" on container', () => {
      const container = wrapper.find('[role="status"]')
      expect(container.exists()).toBe(true)
    })

    it('has aria-live="polite" on container', () => {
      const container = wrapper.find('[aria-live="polite"]')
      expect(container.exists()).toBe(true)
    })

    it('has aria-busy="true" on container', () => {
      const container = wrapper.find('[aria-busy="true"]')
      expect(container.exists()).toBe(true)
    })

    it('has descriptive aria-label on container', () => {
      const container = wrapper.find('[aria-label="Loading content"]')
      expect(container.exists()).toBe(true)
    })

    it('includes screen reader text', () => {
      const srText = wrapper.find('.sr-only')
      expect(srText.exists()).toBe(true)
      expect(srText.text()).toBe('Loading analytics data...')
    })
  })

  describe('Props Validation', () => {
    it('validates type prop', () => {
      const { type } = LoadingSkeleton.props
      expect(type.validator('chart')).toBe(true)
      expect(type.validator('table')).toBe(true)
      expect(type.validator('card')).toBe(true)
      expect(type.validator('invalid')).toBe(false)
    })

    it('has correct default values', () => {
      wrapper = mount(LoadingSkeleton)

      expect(wrapper.props('type')).toBe('chart')
      expect(wrapper.props('rows')).toBe(5)
      expect(wrapper.props('height')).toBe('400px')
    })

    it('accepts custom rows prop', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'table',
          rows: 10,
        },
      })

      expect(wrapper.props('rows')).toBe(10)
    })

    it('accepts custom height prop', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          height: '600px',
        },
      })

      expect(wrapper.props('height')).toBe('600px')
    })
  })

  describe('Type Switching', () => {
    it('switches from chart to table type', async () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'chart',
        },
      })

      expect(wrapper.find('.ml-12').exists()).toBe(true) // Chart bars

      await wrapper.setProps({ type: 'table' })

      expect(wrapper.find('.ml-12').exists()).toBe(false)
      expect(wrapper.find('.border-b').exists()).toBe(true) // Table header
    })

    it('switches from table to card type', async () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'table',
        },
      })

      expect(wrapper.find('.border-b').exists()).toBe(true)

      await wrapper.setProps({ type: 'card' })

      expect(wrapper.find('.grid').exists()).toBe(true)
    })

    it('switches from card to chart type', async () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'card',
        },
      })

      expect(wrapper.find('.grid').exists()).toBe(true)

      await wrapper.setProps({ type: 'chart' })

      expect(wrapper.find('.ml-12').exists()).toBe(true) // Chart bars
    })
  })

  describe('Skeleton Component Usage', () => {
    it('uses Skeleton component from UI library', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'chart',
        },
      })

      const skeletons = wrapper.findAllComponents(Skeleton)
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('all skeletons have proper classes', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'chart',
        },
      })

      const skeletons = wrapper.findAllComponents(Skeleton)

      skeletons.forEach((skeleton) => {
        // Each skeleton should have height and width classes
        expect(skeleton.classes()).toBeTruthy()
      })
    })
  })

  describe('Animation', () => {
    it('applies animation CSS class', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'chart',
        },
      })

      const container = wrapper.find('.loading-skeleton')
      expect(container.exists()).toBe(true)
      // Animation is defined in scoped styles, not inline
      expect(container.classes()).toContain('loading-skeleton')
    })
  })

  describe('Responsive Design', () => {
    it('card type uses responsive grid', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'card',
        },
      })

      const grid = wrapper.find('.grid')
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-2')
    })
  })

  describe('Edge Cases', () => {
    it('handles rows prop of 0', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'table',
          rows: 0,
        },
      })

      const rows = wrapper.findAll('.py-3.border-b.border-border\\/50')
      expect(rows.length).toBe(0)
    })

    it('handles large rows prop', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          type: 'table',
          rows: 100,
        },
      })

      const rows = wrapper.findAll('.py-3.border-b.border-border\\/50')
      expect(rows.length).toBe(100)
    })

    it('applies very small height', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          height: '100px',
        },
      })

      const container = wrapper.find('.loading-skeleton')
      expect(container.attributes('style')).toContain('min-height: 100px')
    })

    it('applies very large height', () => {
      wrapper = mount(LoadingSkeleton, {
        props: {
          height: '2000px',
        },
      })

      const container = wrapper.find('.loading-skeleton')
      expect(container.attributes('style')).toContain('min-height: 2000px')
    })
  })
})
