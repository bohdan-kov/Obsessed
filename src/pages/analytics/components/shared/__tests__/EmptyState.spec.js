import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../EmptyState.vue'
import { Button } from '@/components/ui/button'

describe('EmptyState', () => {
  let wrapper

  beforeEach(() => {
    wrapper = null
  })

  describe('Rendering', () => {
    it('renders with required title prop', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data available',
        },
      })

      expect(wrapper.text()).toContain('No data available')
    })

    it('renders with optional description', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          description: 'Start tracking to see data',
        },
      })

      expect(wrapper.text()).toContain('No data')
      expect(wrapper.text()).toContain('Start tracking to see data')
    })

    it('renders without description when not provided', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      expect(wrapper.find('p').exists()).toBe(false)
    })

    it('applies custom height', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          height: '500px',
        },
      })

      const container = wrapper.find('.empty-state')
      expect(container.attributes('style')).toContain('min-height: 500px')
    })

    it('has default height of 400px', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const container = wrapper.find('.empty-state')
      expect(container.attributes('style')).toContain('min-height: 400px')
    })
  })

  describe('Icon Rendering', () => {
    it('renders default inbox icon', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
      expect(svg.attributes('aria-hidden')).toBe('true')
    })

    it('renders custom icon when specified', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No workouts',
          icon: 'calendar',
        },
      })

      const iconContainer = wrapper.find('[role="img"]')
      expect(iconContainer.attributes('aria-label')).toBe('calendar icon')
    })

    it('supports different icon types', () => {
      const icons = ['inbox', 'bar-chart-2', 'activity', 'calendar', 'dumbbell', 'trending-up']

      icons.forEach((icon) => {
        wrapper = mount(EmptyState, {
          props: {
            title: 'Test',
            icon,
          },
        })

        const svg = wrapper.find('svg')
        expect(svg.exists()).toBe(true)
      })
    })

    it('falls back to inbox icon for unknown icon names', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'Test',
          icon: 'unknown-icon',
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
      // Should render inbox icon paths
    })

    it('renders SVG with correct viewBox', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'Test',
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    })

    it('renders multiple paths for complex icons', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'Test',
          icon: 'inbox',
        },
      })

      const paths = wrapper.findAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })
  })

  describe('Action Button', () => {
    it('does not render action button when actionText is not provided', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      expect(wrapper.findComponent(Button).exists()).toBe(false)
    })

    it('renders action button when actionText is provided', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          actionText: 'Start tracking',
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Start tracking')
    })

    it('does not render button when actionText is empty string', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          actionText: '',
        },
      })

      expect(wrapper.findComponent(Button).exists()).toBe(false)
    })

    it('does not render button when actionText is only whitespace', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          actionText: '   ',
        },
      })

      expect(wrapper.findComponent(Button).exists()).toBe(false)
    })

    it('emits action event when button is clicked', async () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          actionText: 'Click me',
        },
      })

      const button = wrapper.findComponent(Button)
      await button.trigger('click')

      expect(wrapper.emitted('action')).toBeTruthy()
      expect(wrapper.emitted('action').length).toBe(1)
    })

    it('applies custom action variant', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          actionText: 'Action',
          actionVariant: 'outline',
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('variant')).toBe('outline')
    })

    it('uses default variant when not specified', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          actionText: 'Action',
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.props('variant')).toBe('default')
    })

    it('button has minimum size for touch targets', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          actionText: 'Action',
        },
      })

      const button = wrapper.findComponent(Button)
      expect(button.classes()).toContain('min-h-11')
      expect(button.classes()).toContain('min-w-11')
    })
  })

  describe('Action Slot', () => {
    it('renders action slot when provided', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
        slots: {
          action: '<div class="custom-action">Custom Action</div>',
        },
      })

      expect(wrapper.find('.custom-action').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Action')
    })

    it('action slot is independent of actionText prop', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          actionText: 'Button Action',
        },
        slots: {
          action: '<div class="slot-action">Slot Action</div>',
        },
      })

      // Both should be rendered
      expect(wrapper.findComponent(Button).exists()).toBe(true)
      expect(wrapper.find('.slot-action').exists()).toBe(true)
    })

    it('renders action slot without actionText', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
        slots: {
          action: '<button class="custom-btn">Custom</button>',
        },
      })

      expect(wrapper.find('.custom-btn').exists()).toBe(true)
      expect(wrapper.findComponent(Button).exists()).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('has role="status" on container', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const container = wrapper.find('[role="status"]')
      expect(container.exists()).toBe(true)
    })

    it('has aria-live="polite" on container', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const container = wrapper.find('[aria-live="polite"]')
      expect(container.exists()).toBe(true)
    })

    it('icon has role="img" with descriptive aria-label', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          icon: 'calendar',
        },
      })

      const iconContainer = wrapper.find('[role="img"]')
      expect(iconContainer.exists()).toBe(true)
      expect(iconContainer.attributes('aria-label')).toBe('calendar icon')
    })

    it('SVG has aria-hidden="true"', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('aria-hidden')).toBe('true')
    })

    it('uses semantic heading for title', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'Empty State Title',
        },
      })

      const heading = wrapper.find('h3')
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('Empty State Title')
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive text sizes', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const heading = wrapper.find('h3')
      expect(heading.classes()).toContain('text-base')
      expect(heading.classes()).toContain('md:text-lg')
    })

    it('applies responsive icon sizes', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const iconContainer = wrapper.find('[role="img"]')
      expect(iconContainer.classes()).toContain('h-16')
      expect(iconContainer.classes()).toContain('w-16')
      expect(iconContainer.classes()).toContain('md:h-20')
      expect(iconContainer.classes()).toContain('md:w-20')
    })

    it('applies responsive spacing', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const container = wrapper.find('.empty-state')
      expect(container.classes()).toContain('p-6')
      expect(container.classes()).toContain('md:p-8')
    })
  })

  describe('Animation', () => {
    it('applies animation CSS class', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const container = wrapper.find('.empty-state')
      expect(container.exists()).toBe(true)
      // Animation is defined in scoped styles, not inline
      expect(container.classes()).toContain('empty-state')
    })
  })

  describe('Props Validation', () => {
    it('requires title prop', () => {
      const { title } = EmptyState.props
      expect(title.required).toBe(true)
    })

    it('has correct default values', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'Test',
        },
      })

      expect(wrapper.props('icon')).toBe('inbox')
      expect(wrapper.props('description')).toBe('')
      expect(wrapper.props('actionText')).toBe(null)
      expect(wrapper.props('actionVariant')).toBe('default')
      expect(wrapper.props('height')).toBe('400px')
    })
  })

  describe('Layout and Styling', () => {
    it('centers content vertically and horizontally', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const container = wrapper.find('.empty-state')
      expect(container.classes()).toContain('flex')
      expect(container.classes()).toContain('flex-col')
      expect(container.classes()).toContain('items-center')
      expect(container.classes()).toContain('justify-center')
    })

    it('uses text-center for content', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
        },
      })

      const container = wrapper.find('.empty-state')
      expect(container.classes()).toContain('text-center')
    })

    it('constrains description width', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          description: 'Long description text',
        },
      })

      const description = wrapper.find('p')
      expect(description.classes()).toContain('max-w-sm')
    })

    it('applies proper spacing between elements', () => {
      wrapper = mount(EmptyState, {
        props: {
          title: 'No data',
          description: 'Description',
          actionText: 'Action',
        },
      })

      const iconContainer = wrapper.find('[role="img"]')
      const heading = wrapper.find('h3')
      const description = wrapper.find('p')

      expect(iconContainer.classes()).toContain('mb-4')
      expect(iconContainer.classes()).toContain('md:mb-6')
      expect(heading.classes()).toContain('mb-2')
      expect(description.classes()).toContain('mb-6')
    })
  })
})
