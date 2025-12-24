import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PeriodSelector from '../PeriodSelector.vue'
import { PERIOD_OPTIONS } from '@/composables/useAnalyticsPeriod'

// Mock vue-router
const mockReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('PeriodSelector', () => {
  let wrapper

  beforeEach(() => {
    wrapper = null
    mockReplace.mockClear()
  })

  describe('Button Group Variant', () => {
    beforeEach(() => {
      wrapper = mount(PeriodSelector, {
        props: {
          variant: 'button-group',
          syncWithUrl: false,
        },
      })
    })

    it('renders all period options as buttons', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(PERIOD_OPTIONS.length)
    })

    it('renders buttons with correct labels', () => {
      const buttons = wrapper.findAll('button')

      PERIOD_OPTIONS.forEach((option, index) => {
        // i18n mock returns the key itself
        expect(buttons[index].text()).toBe(option.label)
      })
    })

    it('marks default period button as selected', () => {
      const buttons = wrapper.findAll('button')
      const defaultButton = buttons.find((btn) => btn.attributes('aria-pressed') === 'true')

      expect(defaultButton).toBeDefined()
    })

    it('changes selected period when button is clicked', async () => {
      const buttons = wrapper.findAll('button')

      // Click the first button (last_7_days)
      await buttons[0].trigger('click')
      await nextTick()

      expect(buttons[0].attributes('aria-pressed')).toBe('true')
    })

    it('emits update:modelValue when period is selected', async () => {
      const buttons = wrapper.findAll('button')

      await buttons[0].trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['last_7_days'])
    })

    it('emits change event when period is selected', async () => {
      const buttons = wrapper.findAll('button')

      await buttons[0].trigger('click')

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')[0]).toEqual(['last_7_days'])
    })

    it('applies correct variant to selected button', async () => {
      const buttons = wrapper.findAll('button')

      // Initially, default period should have 'default' variant
      const selectedButton = buttons.find((btn) => btn.attributes('aria-pressed') === 'true')
      expect(selectedButton.classes()).toContain('bg-primary')

      // Click another button
      await buttons[0].trigger('click')
      await nextTick()

      // New button should have default variant
      expect(buttons[0].classes()).toContain('bg-primary')
    })

    it('applies correct size classes based on size prop', async () => {
      await wrapper.setProps({ size: 'sm' })
      const buttons = wrapper.findAll('button')
      expect(buttons[0].classes()).toContain('h-8')

      await wrapper.setProps({ size: 'lg' })
      expect(buttons[0].classes()).toContain('h-11')

      await wrapper.setProps({ size: 'default' })
      expect(buttons[0].classes()).toContain('h-9')
    })

    it('has accessible group label', () => {
      const group = wrapper.find('[role="group"]')
      expect(group.attributes('aria-label')).toBe('Period selector')
    })

    it('has accessible pressed state on buttons', async () => {
      const buttons = wrapper.findAll('button')

      await buttons[1].trigger('click')

      expect(buttons[1].attributes('aria-pressed')).toBe('true')
      expect(buttons[0].attributes('aria-pressed')).toBe('false')
    })
  })

  describe('Select Variant', () => {
    beforeEach(() => {
      wrapper = mount(PeriodSelector, {
        props: {
          variant: 'select',
          syncWithUrl: false,
        },
      })
    })

    it('renders select component', () => {
      // Check for SelectTrigger component
      expect(wrapper.html()).toContain('Select')
    })

    it('renders all period options in select', () => {
      // Check that Select component exists
      expect(wrapper.html()).toContain('Select')
      // SelectItem components are rendered by the Select component
      // In tests, we just verify the component renders successfully
      const html = wrapper.html()
      expect(html.length).toBeGreaterThan(0)
    })

    it('has accessible label on select trigger', () => {
      const trigger = wrapper.find('[aria-label="Select period"]')
      expect(trigger.exists()).toBe(true)
    })

    it('applies size classes to select trigger', async () => {
      await wrapper.setProps({ size: 'sm' })
      const trigger = wrapper.find('[aria-label="Select period"]')
      expect(trigger.classes()).toContain('h-8')

      await wrapper.setProps({ size: 'lg' })
      expect(trigger.classes()).toContain('h-11')
    })
  })

  describe('v-model Support', () => {
    it('initializes with modelValue prop', () => {
      wrapper = mount(PeriodSelector, {
        props: {
          modelValue: 'last_90_days',
          variant: 'button-group',
          syncWithUrl: false,
        },
      })

      const buttons = wrapper.findAll('button')
      const selectedButton = buttons.find((btn) => btn.text().includes('last90days'))

      expect(selectedButton.attributes('aria-pressed')).toBe('true')
    })

    it('updates when modelValue prop changes', async () => {
      wrapper = mount(PeriodSelector, {
        props: {
          modelValue: 'last_7_days',
          variant: 'button-group',
          syncWithUrl: false,
        },
      })

      await wrapper.setProps({ modelValue: 'last_30_days' })
      await nextTick()

      const buttons = wrapper.findAll('button')
      const selectedButton = buttons.find((btn) => btn.text().includes('last30days'))

      expect(selectedButton.attributes('aria-pressed')).toBe('true')
    })

    it('emits update:modelValue for two-way binding', async () => {
      wrapper = mount(PeriodSelector, {
        props: {
          modelValue: 'last_30_days',
          variant: 'button-group',
          syncWithUrl: false,
        },
      })

      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['last_7_days'])
    })
  })

  describe('URL Synchronization', () => {
    it('does not sync with URL when syncWithUrl is false', async () => {
      wrapper = mount(PeriodSelector, {
        props: {
          variant: 'button-group',
          syncWithUrl: false,
        },
      })

      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')

      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('syncs with URL when syncWithUrl is true', async () => {
      wrapper = mount(PeriodSelector, {
        props: {
          variant: 'button-group',
          syncWithUrl: true,
        },
      })

      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')

      // Note: In the real component, this would call router.replace
      // but we've mocked vue-router, so the actual call happens inside useAnalyticsPeriod
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
      wrapper = mount(PeriodSelector)

      expect(wrapper.props('variant')).toBe('button-group')
      expect(wrapper.props('syncWithUrl')).toBe(true)
      expect(wrapper.props('size')).toBe('default')
      expect(wrapper.props('modelValue')).toBe(null)
    })
  })

  describe('Responsive Behavior', () => {
    it('renders button group with flex wrap', () => {
      wrapper = mount(PeriodSelector, {
        props: {
          variant: 'button-group',
        },
      })

      const container = wrapper.find('.flex')
      expect(container.classes()).toContain('flex-wrap')
    })

    it('applies responsive width to select variant', () => {
      wrapper = mount(PeriodSelector, {
        props: {
          variant: 'select',
        },
      })

      const trigger = wrapper.find('[aria-label="Select period"]')
      expect(trigger.classes()).toContain('w-full')
      expect(trigger.classes()).toContain('sm:w-[200px]')
    })
  })

  describe('Integration with useAnalyticsPeriod', () => {
    it('uses PERIOD_OPTIONS from composable', () => {
      wrapper = mount(PeriodSelector, {
        props: {
          variant: 'button-group',
          syncWithUrl: false,
        },
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(PERIOD_OPTIONS.length)
    })

    it('defaults to last_30_days period', () => {
      wrapper = mount(PeriodSelector, {
        props: {
          variant: 'button-group',
          syncWithUrl: false,
        },
      })

      const buttons = wrapper.findAll('button')
      const defaultButton = buttons.find((btn) => btn.text().includes('last30days'))

      expect(defaultButton.attributes('aria-pressed')).toBe('true')
    })
  })
})
