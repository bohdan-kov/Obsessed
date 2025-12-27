import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseChart from '@/pages/analytics/components/shared/BaseChart.vue'
import LoadingSkeleton from '@/pages/analytics/components/shared/LoadingSkeleton.vue'
import EmptyState from '@/pages/analytics/components/shared/EmptyState.vue'

describe('BaseChart', () => {
  let wrapper

  beforeEach(() => {
    wrapper = null
  })

  describe('Rendering', () => {
    it('renders with title and description', () => {
      wrapper = mount(BaseChart, {
        props: {
          title: 'Test Chart',
          description: 'Chart description',
          data: [1, 2, 3],
        },
      })

      expect(wrapper.text()).toContain('Test Chart')
      expect(wrapper.text()).toContain('Chart description')
    })

    it('renders header slot when provided', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [1, 2, 3],
        },
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
        },
      })

      expect(wrapper.find('.custom-header').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Header')
    })

    it('renders actions slot when provided', () => {
      wrapper = mount(BaseChart, {
        props: {
          title: 'Chart',
          data: [1, 2, 3],
        },
        slots: {
          actions: '<button class="custom-action">Export</button>',
        },
      })

      expect(wrapper.find('.custom-action').exists()).toBe(true)
      expect(wrapper.text()).toContain('Export')
    })

    it('renders chart content when data is provided', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [1, 2, 3],
        },
        slots: {
          default: '<div class="chart-content">Chart goes here</div>',
        },
      })

      expect(wrapper.find('.chart-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Chart goes here')
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      wrapper = mount(BaseChart, {
        props: {
          loading: true,
          data: [],
        },
      })

      expect(wrapper.findComponent(LoadingSkeleton).exists()).toBe(true)
    })

    it('does not show chart content when loading', () => {
      wrapper = mount(BaseChart, {
        props: {
          loading: true,
          data: [1, 2, 3],
        },
        slots: {
          default: '<div class="chart-content">Chart</div>',
        },
      })

      expect(wrapper.find('.chart-content').exists()).toBe(false)
    })

    it('passes skeleton type prop to LoadingSkeleton', () => {
      wrapper = mount(BaseChart, {
        props: {
          loading: true,
          skeletonType: 'table',
        },
      })

      const skeleton = wrapper.findComponent(LoadingSkeleton)
      expect(skeleton.props('type')).toBe('table')
    })

    it('passes height prop to LoadingSkeleton', () => {
      wrapper = mount(BaseChart, {
        props: {
          loading: true,
          height: '500px',
        },
      })

      const skeleton = wrapper.findComponent(LoadingSkeleton)
      expect(skeleton.props('height')).toBe('500px')
    })
  })

  describe('Empty State', () => {
    it('shows empty state when data is empty array', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [],
        },
      })

      expect(wrapper.findComponent(EmptyState).exists()).toBe(true)
    })

    it('shows empty state when data is empty object', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: {},
        },
      })

      expect(wrapper.findComponent(EmptyState).exists()).toBe(true)
    })

    it('shows empty state when data is null', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: null,
        },
      })

      expect(wrapper.findComponent(EmptyState).exists()).toBe(true)
    })

    it('uses custom empty title when provided', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [],
          emptyTitle: 'Custom Empty Title',
        },
      })

      const emptyState = wrapper.findComponent(EmptyState)
      expect(emptyState.props('title')).toBe('Custom Empty Title')
    })

    it('uses custom empty description when provided', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [],
          emptyDescription: 'Custom description',
        },
      })

      const emptyState = wrapper.findComponent(EmptyState)
      expect(emptyState.props('description')).toBe('Custom description')
    })

    it('uses custom empty icon when provided', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [],
          emptyIcon: 'calendar',
        },
      })

      const emptyState = wrapper.findComponent(EmptyState)
      expect(emptyState.props('icon')).toBe('calendar')
    })

    it('uses default empty messages when not provided', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [],
        },
      })

      const emptyState = wrapper.findComponent(EmptyState)
      // Should use i18n keys (mocked to return the key itself)
      expect(emptyState.props('title')).toBe('analytics.emptyStates.noData')
      expect(emptyState.props('description')).toBe('analytics.emptyStates.noWorkouts')
    })
  })

  describe('Error State', () => {
    it('shows error message when error prop is provided', () => {
      wrapper = mount(BaseChart, {
        props: {
          error: 'Failed to load data',
          data: [],
        },
      })

      expect(wrapper.text()).toContain('Failed to load data')
    })

    it('shows error icon in error state', () => {
      wrapper = mount(BaseChart, {
        props: {
          error: 'Error occurred',
          data: [],
        },
      })

      // Check for SVG alert triangle icon
      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
    })

    it('does not show chart content in error state', () => {
      wrapper = mount(BaseChart, {
        props: {
          error: 'Error',
          data: [1, 2, 3],
        },
        slots: {
          default: '<div class="chart-content">Chart</div>',
        },
      })

      expect(wrapper.find('.chart-content').exists()).toBe(false)
    })

    it('applies min-height style in error state', () => {
      wrapper = mount(BaseChart, {
        props: {
          error: 'Error',
          height: '600px',
          data: [],
        },
      })

      const errorContainer = wrapper.find('.error-state')
      expect(errorContainer.attributes('style')).toContain('min-height: 600px')
    })
  })

  describe('Chart Content State', () => {
    it('shows chart content when data is valid and not loading', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [1, 2, 3],
        },
        slots: {
          default: '<div class="my-chart">Chart</div>',
        },
      })

      expect(wrapper.find('.my-chart').exists()).toBe(true)
    })

    it('passes data to default slot', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [1, 2, 3],
        },
        slots: {
          default: `<template #default="{ data }">
            <div class="chart">{{ data.join(',') }}</div>
          </template>`,
        },
      })

      expect(wrapper.text()).toContain('1,2,3')
    })

    it('applies min-height style to chart content', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [1, 2, 3],
          height: '500px',
        },
      })

      const chartContent = wrapper.find('.chart-content')
      expect(chartContent.attributes('style')).toContain('min-height: 500px')
    })
  })

  describe('Props Validation', () => {
    it('accepts valid skeleton type', () => {
      wrapper = mount(BaseChart, {
        props: {
          skeletonType: 'table',
          loading: true,
        },
      })

      expect(wrapper.props('skeletonType')).toBe('table')
    })

    it('has default values for optional props', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [],
        },
      })

      expect(wrapper.props('title')).toBe('')
      expect(wrapper.props('description')).toBe('')
      expect(wrapper.props('loading')).toBe(false)
      expect(wrapper.props('error')).toBe(null)
      expect(wrapper.props('height')).toBe('400px')
      expect(wrapper.props('skeletonType')).toBe('chart')
    })
  })

  describe('Accessibility', () => {
    it('has accessible structure for error state', () => {
      wrapper = mount(BaseChart, {
        props: {
          error: 'Error occurred',
          data: [],
        },
      })

      const errorIcon = wrapper.find('[role="img"][aria-label="Error"]')
      expect(errorIcon.exists()).toBe(true)
    })

    it('renders CardHeader with proper hierarchy', () => {
      wrapper = mount(BaseChart, {
        props: {
          title: 'Chart Title',
          description: 'Description',
          data: [1, 2, 3],
        },
      })

      // Title should be in CardTitle component
      expect(wrapper.html()).toContain('Chart Title')
      expect(wrapper.html()).toContain('Description')
    })
  })

  describe('State Priority', () => {
    it('prioritizes loading over error', () => {
      wrapper = mount(BaseChart, {
        props: {
          loading: true,
          error: 'Error',
          data: [],
        },
      })

      expect(wrapper.findComponent(LoadingSkeleton).exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Error')
    })

    it('prioritizes loading over empty state', () => {
      wrapper = mount(BaseChart, {
        props: {
          loading: true,
          data: [],
        },
      })

      expect(wrapper.findComponent(LoadingSkeleton).exists()).toBe(true)
      expect(wrapper.findComponent(EmptyState).exists()).toBe(false)
    })

    it('prioritizes error over empty state', () => {
      wrapper = mount(BaseChart, {
        props: {
          error: 'Error occurred',
          data: [],
        },
      })

      expect(wrapper.text()).toContain('Error occurred')
      expect(wrapper.findComponent(EmptyState).exists()).toBe(false)
    })

    it('shows chart content only when no loading/error/empty', () => {
      wrapper = mount(BaseChart, {
        props: {
          data: [1, 2, 3],
        },
        slots: {
          default: '<div class="chart">Chart</div>',
        },
      })

      expect(wrapper.find('.chart').exists()).toBe(true)
      expect(wrapper.findComponent(LoadingSkeleton).exists()).toBe(false)
      expect(wrapper.findComponent(EmptyState).exists()).toBe(false)
    })
  })
})
