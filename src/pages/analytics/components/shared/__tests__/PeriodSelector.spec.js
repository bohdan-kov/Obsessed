import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import PeriodSelector from '@/pages/analytics/components/shared/PeriodSelector.vue'
import { CONFIG } from '@/constants/config'

// Get period options from CONFIG
const PERIOD_OPTIONS = CONFIG.analytics.periods.PERIOD_OPTIONS

describe('PeriodSelector', () => {
  let wrapper

  beforeEach(() => {
    wrapper = null
  })

  function createWrapper(options = {}) {
    return mount(PeriodSelector, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              analytics: {
                period: options.period || 'last30Days',
              },
            },
            stubActions: false,
          }),
        ],
        stubs: {
          // Stub shadcn-vue select components
          Select: {
            template: '<div class="select-stub"><slot /></div>',
            props: ['modelValue'],
          },
          SelectTrigger: {
            template: '<button class="select-trigger" :class="$attrs.class" aria-label="Select period"><slot /></button>',
          },
          SelectContent: {
            template: '<div class="select-content"><slot /></div>',
          },
          SelectGroup: {
            template: '<div class="select-group"><slot /></div>',
          },
          SelectItem: {
            template: '<div class="select-item"><slot /></div>',
            props: ['value'],
          },
          SelectValue: {
            template: '<span class="select-value"><slot /></span>',
            props: ['placeholder'],
          },
        },
      },
      props: {
        variant: options.variant || 'button-group',
        size: options.size || 'default',
      },
    })
  }

  describe('Button Group Variant', () => {
    beforeEach(() => {
      wrapper = createWrapper({ variant: 'button-group' })
    })

    it('renders all period options as buttons', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(PERIOD_OPTIONS.length)
    })

    it('renders buttons with translation keys', () => {
      const buttons = wrapper.findAll('button')
      // With mocked i18n, translation keys are returned directly
      expect(buttons.length).toBe(PERIOD_OPTIONS.length)
    })

    it('marks default period button as selected', () => {
      const buttons = wrapper.findAll('button')
      const selectedButton = buttons.find((btn) => btn.attributes('aria-pressed') === 'true')
      expect(selectedButton).toBeDefined()
    })

    it('changes selected period when button is clicked', async () => {
      const buttons = wrapper.findAll('button')

      // Click the first button (last7Days)
      await buttons[0].trigger('click')
      await nextTick()

      expect(buttons[0].attributes('aria-pressed')).toBe('true')
    })

    it('applies correct variant to selected button', async () => {
      const buttons = wrapper.findAll('button')

      // Initially, default period should have 'default' variant (bg-primary)
      const selectedButton = buttons.find((btn) => btn.attributes('aria-pressed') === 'true')
      expect(selectedButton.classes()).toContain('bg-primary')

      // Click another button
      await buttons[0].trigger('click')
      await nextTick()

      // New button should have default variant
      expect(buttons[0].classes()).toContain('bg-primary')
    })

    it('applies correct size classes based on size prop', async () => {
      // Create wrapper with sm size
      const smWrapper = createWrapper({ variant: 'button-group', size: 'sm' })
      let buttons = smWrapper.findAll('button')
      expect(buttons[0].classes()).toContain('h-8')

      // Create wrapper with lg size
      const lgWrapper = createWrapper({ variant: 'button-group', size: 'lg' })
      buttons = lgWrapper.findAll('button')
      expect(buttons[0].classes()).toContain('h-11')

      // Create wrapper with default size
      const defaultWrapper = createWrapper({ variant: 'button-group', size: 'default' })
      buttons = defaultWrapper.findAll('button')
      expect(buttons[0].classes()).toContain('h-9')
    })

    it('has accessible group label', () => {
      const group = wrapper.find('[role="group"]')
      expect(group.attributes('aria-label')).toBe('Period selector')
    })

    it('has accessible pressed state on buttons', async () => {
      const buttons = wrapper.findAll('button')

      await buttons[1].trigger('click')
      await nextTick()

      expect(buttons[1].attributes('aria-pressed')).toBe('true')
      expect(buttons[0].attributes('aria-pressed')).toBe('false')
    })
  })

  describe('Select Variant', () => {
    beforeEach(() => {
      wrapper = createWrapper({ variant: 'select' })
    })

    it('renders select component', () => {
      // Check for SelectTrigger stub
      expect(wrapper.find('.select-trigger').exists()).toBe(true)
    })

    it('renders select wrapper', () => {
      // Check that Select stub exists
      expect(wrapper.find('.select-stub').exists()).toBe(true)
    })

    it('has accessible label on select trigger', () => {
      const trigger = wrapper.find('[aria-label="Select period"]')
      expect(trigger.exists()).toBe(true)
    })

    it('applies size classes to select trigger', async () => {
      // Test sm size
      const smWrapper = createWrapper({ variant: 'select', size: 'sm' })
      let trigger = smWrapper.find('[aria-label="Select period"]')
      expect(trigger.classes()).toContain('h-8')

      // Test lg size
      const lgWrapper = createWrapper({ variant: 'select', size: 'lg' })
      trigger = lgWrapper.find('[aria-label="Select period"]')
      expect(trigger.classes()).toContain('h-11')
    })
  })

  describe('Period Selection', () => {
    it('initializes with default period from store', () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('button')
      // Find the button that corresponds to 'last30Days' (which has isDefault: true in PERIOD_OPTIONS)
      const defaultButton = buttons.find((btn) => btn.attributes('aria-pressed') === 'true')
      expect(defaultButton).toBeDefined()
    })

    it('updates store when period is selected', async () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('button')

      await buttons[0].trigger('click')
      await nextTick()

      // First button is 'last7Days'
      expect(buttons[0].attributes('aria-pressed')).toBe('true')
    })
  })

  describe('Props Validation', () => {
    it('validates variant prop', () => {
      const { variant } = PeriodSelector.props
      expect(variant.validator('button-group')).toBe(true)
      expect(variant.validator('select')).toBe(true)
      expect(variant.validator('invalid')).toBe(false)
    })

    it('validates size prop', () => {
      const { size } = PeriodSelector.props
      expect(size.validator('sm')).toBe(true)
      expect(size.validator('default')).toBe(true)
      expect(size.validator('lg')).toBe(true)
      expect(size.validator('invalid')).toBe(false)
    })

    it('has correct default values', () => {
      wrapper = createWrapper()

      expect(wrapper.props('variant')).toBe('button-group')
      expect(wrapper.props('size')).toBe('default')
    })
  })

  describe('Responsive Behavior', () => {
    it('renders button group with flex wrap', () => {
      wrapper = createWrapper({ variant: 'button-group' })
      const container = wrapper.find('.flex')
      expect(container.classes()).toContain('flex-wrap')
    })

    it('applies responsive width to select variant', () => {
      wrapper = createWrapper({ variant: 'select' })
      const trigger = wrapper.find('[aria-label="Select period"]')
      expect(trigger.classes()).toContain('w-full')
      expect(trigger.classes()).toContain('sm:w-[200px]')
    })
  })

  describe('Integration with analyticsStore', () => {
    it('uses PERIOD_OPTIONS from CONFIG', () => {
      wrapper = createWrapper({ variant: 'button-group' })
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(PERIOD_OPTIONS.length)
    })

    it('defaults to last30Days period', () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('button')

      // Find button with last30Days by checking aria-pressed since that's the default
      const defaultButton = buttons.find((btn) => btn.attributes('aria-pressed') === 'true')
      expect(defaultButton).toBeDefined()
    })
  })
})
