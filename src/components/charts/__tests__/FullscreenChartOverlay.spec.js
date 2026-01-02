import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FullscreenChartOverlay from '../FullscreenChartOverlay.vue'

describe('FullscreenChartOverlay', () => {
  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: false,
          title: 'Test Chart',
        },
      })

      // Overlay should not be in DOM
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('should render when isOpen is true', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true, // Stub Teleport for easier testing
          },
        },
      })

      // Overlay should be in DOM
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })

    it('should render with default title when title prop is not provided', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      // Should render without errors
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

      // Title element should not render if no title provided
      expect(wrapper.find('h2').exists()).toBe(false)
    })
  })

  describe('Props', () => {
    it('should display the title prop in header', () => {
      const testTitle = 'Volume by Muscle Over Time'

      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: testTitle,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const titleElement = wrapper.find('h2')
      expect(titleElement.exists()).toBe(true)
      expect(titleElement.text()).toBe(testTitle)
    })

    it('should accept isOpen prop as boolean', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.props('isOpen')).toBe(true)
    })
  })

  describe('Close button', () => {
    it('should emit close event when close button is clicked', async () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const closeButton = wrapper.find('button[aria-label*="Закрити"], button[aria-label*="Close"]')
      expect(closeButton.exists()).toBe(true)

      await closeButton.trigger('click')

      // Should emit close event
      expect(wrapper.emitted()).toHaveProperty('close')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('should have proper aria-label for accessibility', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const closeButton = wrapper.find('button')
      const ariaLabel = closeButton.attributes('aria-label')

      // Should have aria-label (either Ukrainian or English)
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel.length).toBeGreaterThan(0)
    })

    it('should have minimum 44x44px touch target', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const closeButton = wrapper.find('button')

      // Should have w-11 h-11 classes (44x44px in Tailwind)
      expect(closeButton.classes()).toContain('w-11')
      expect(closeButton.classes()).toContain('h-11')
    })

    it('should have touch-manipulation class for better mobile UX', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const closeButton = wrapper.find('button')
      expect(closeButton.classes()).toContain('touch-manipulation')
    })
  })

  describe('ARIA attributes', () => {
    it('should have role="dialog"', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.exists()).toBe(true)
    })

    it('should have aria-modal="true"', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('should have descriptive aria-label', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const dialog = wrapper.find('[role="dialog"]')
      const ariaLabel = dialog.attributes('aria-label')

      // Should have aria-label (from i18n key charts.fullscreen.active)
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel.length).toBeGreaterThan(0)
    })
  })

  describe('Slot content', () => {
    it('should render slotted chart content', () => {
      const slotContent = '<div class="test-chart">Chart Content</div>'

      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        slots: {
          default: slotContent,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      // Slot content should be rendered
      const chartContent = wrapper.find('.test-chart')
      expect(chartContent.exists()).toBe(true)
      expect(chartContent.text()).toBe('Chart Content')
    })

    it('should render complex slot content', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        slots: {
          default: `
            <div class="chart-container">
              <div class="chart-header">Header</div>
              <div class="chart-body">Body</div>
            </div>
          `,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.find('.chart-container').exists()).toBe(true)
      expect(wrapper.find('.chart-header').exists()).toBe(true)
      expect(wrapper.find('.chart-body').exists()).toBe(true)
    })
  })

  describe('Layout structure', () => {
    it('should have fixed positioning to cover full viewport', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const overlay = wrapper.find('[role="dialog"]')

      // Should have fixed positioning classes
      expect(overlay.classes()).toContain('fixed')
      expect(overlay.classes()).toContain('inset-0')
    })

    it('should have high z-index to overlay other content', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const overlay = wrapper.find('[role="dialog"]')

      // Should have z-50 class for high stacking order
      expect(overlay.classes()).toContain('z-50')
    })

    it('should have header with close button, title, and spacer', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      // Header should exist
      const header = wrapper.find('.flex.items-center.justify-between')
      expect(header.exists()).toBe(true)

      // Close button (first child)
      const closeButton = header.find('button')
      expect(closeButton.exists()).toBe(true)

      // Title (second child)
      const title = header.find('h2')
      expect(title.exists()).toBe(true)

      // Spacer (third child, for symmetry)
      const spacer = header.find('.w-11.shrink-0')
      expect(spacer.exists()).toBe(true)
    })

    it('should have content area with flex layout', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      // Content area should have flex-1 for flexible height
      const content = wrapper.find('.flex-1.overflow-hidden.flex.flex-col')
      expect(content.exists()).toBe(true)
    })
  })

  describe('Transitions', () => {
    it('should apply fade transition classes', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      // Check Transition component exists
      const transition = wrapper.findComponent({ name: 'Transition' })
      expect(transition.exists()).toBe(true)

      // Check transition props
      expect(transition.props('enterActiveClass')).toBe('transition-opacity duration-200 ease-out')
      expect(transition.props('enterFromClass')).toBe('opacity-0')
      expect(transition.props('enterToClass')).toBe('opacity-100')
      expect(transition.props('leaveActiveClass')).toBe('transition-opacity duration-200 ease-in')
      expect(transition.props('leaveFromClass')).toBe('opacity-100')
      expect(transition.props('leaveToClass')).toBe('opacity-0')
    })
  })

  describe('iOS Safe Areas', () => {
    it('should have header element with proper structure for safe areas', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const header = wrapper.find('.flex.items-center.justify-between')

      // Verify header element exists (where safe area padding would be applied)
      expect(header.exists()).toBe(true)

      // Verify it has the expected classes
      expect(header.classes()).toContain('px-4')
      expect(header.classes()).toContain('py-3')

      // Note: Inline style attributes (env() CSS) are stripped by Vue Test Utils
      // These are tested in browser/E2E tests, not unit tests
    })

    it('should have content area with proper structure for safe areas', () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const content = wrapper.find('.flex-1.overflow-hidden.flex.flex-col')

      // Verify content element exists (where safe area padding would be applied)
      expect(content.exists()).toBe(true)

      // Verify it has flex and overflow classes
      expect(content.classes()).toContain('flex-1')
      expect(content.classes()).toContain('overflow-hidden')
      expect(content.classes()).toContain('flex')
      expect(content.classes()).toContain('flex-col')

      // Note: Inline style attributes (env() CSS) are stripped by Vue Test Utils
      // These are tested in browser/E2E tests, not unit tests
    })
  })

  describe('Reactivity', () => {
    it('should react to isOpen prop changes', async () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: false,
          title: 'Test Chart',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      // Initially not rendered
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

      // Update prop to true
      await wrapper.setProps({ isOpen: true })

      // Should now be rendered
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

      // Update prop back to false
      await wrapper.setProps({ isOpen: false })

      // Should be removed again
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('should react to title prop changes', async () => {
      const wrapper = mount(FullscreenChartOverlay, {
        props: {
          isOpen: true,
          title: 'Initial Title',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.find('h2').text()).toBe('Initial Title')

      // Update title
      await wrapper.setProps({ title: 'Updated Title' })

      expect(wrapper.find('h2').text()).toBe('Updated Title')
    })
  })
})
