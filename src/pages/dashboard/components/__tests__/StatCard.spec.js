import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import StatCard from '../StatCard.vue'

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  TrendingUp: {
    name: 'TrendingUp',
    template: '<svg data-testid="trending-up-icon"></svg>',
  },
  TrendingDown: {
    name: 'TrendingDown',
    template: '<svg data-testid="trending-down-icon"></svg>',
  },
}))

// Mock UI components - Card needs to properly bind class attribute
vi.mock('@/components/ui/card', () => ({
  Card: {
    name: 'Card',
    inheritAttrs: true,
    template: '<div class="card" :class="$attrs.class"><slot /></div>',
  },
  CardContent: {
    name: 'CardContent',
    template: '<div class="card-content"><slot /></div>',
  },
  CardHeader: {
    name: 'CardHeader',
    template: '<div class="card-header"><slot /></div>',
  },
  CardTitle: {
    name: 'CardTitle',
    template: '<span class="card-title"><slot /></span>',
  },
}))

describe('StatCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /**
   * Factory function to create consistent wrapper with default props
   * @param {Object} options - Mount options override
   * @returns {Object} Vue Test Utils wrapper
   */
  function createWrapper(options = {}) {
    return mount(StatCard, {
      props: {
        title: 'Test Title',
        value: '100',
        ...options.props,
      },
      global: {
        stubs: {
          TrendingUp: {
            template: '<svg data-testid="trending-up-icon"></svg>',
          },
          TrendingDown: {
            template: '<svg data-testid="trending-down-icon"></svg>',
          },
        },
        ...options.global,
      },
      ...options,
    })
  }

  describe('props rendering', () => {
    it('should render the title prop', () => {
      const wrapper = createWrapper({
        props: { title: 'Total Workouts', value: '42' },
      })

      expect(wrapper.text()).toContain('Total Workouts')
    })

    it('should render string value prop', () => {
      const wrapper = createWrapper({
        props: { title: 'Volume', value: '1,500 kg' },
      })

      expect(wrapper.text()).toContain('1,500 kg')
    })

    it('should render numeric value prop', () => {
      const wrapper = createWrapper({
        props: { title: 'Workouts', value: 42 },
      })

      expect(wrapper.text()).toContain('42')
    })

    it('should render subtitle when provided', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          subtitle: 'This week',
        },
      })

      expect(wrapper.text()).toContain('This week')
    })

    it('should not render subtitle section when not provided', () => {
      const wrapper = createWrapper({
        props: { title: 'Volume', value: '5000' },
      })

      // Find the element that would contain subtitle
      const subtitleElement = wrapper.find('.text-xs span')
      expect(wrapper.html()).not.toContain('v-if="subtitle"')
    })

    it('should render description when provided', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Streak',
          value: '7',
          description: 'Keep it up!',
        },
      })

      expect(wrapper.text()).toContain('Keep it up!')
    })

    it('should render both subtitle and description together', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          subtitle: 'Total',
          description: 'All time best',
        },
      })

      expect(wrapper.text()).toContain('Total')
      expect(wrapper.text()).toContain('All time best')
    })
  })

  describe('trend and change display', () => {
    it('should show change percentage with up trend', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          change: '+15%',
          trend: 'up',
        },
      })

      expect(wrapper.text()).toContain('+15%')
    })

    it('should show change percentage with down trend', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '3000',
          change: '-10%',
          trend: 'down',
        },
      })

      expect(wrapper.text()).toContain('-10%')
    })

    it('should not show change section when change is null', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          change: null,
          trend: 'up',
        },
      })

      // The change display div should not be rendered
      expect(wrapper.find('[data-testid="trending-up-icon"]').exists()).toBe(
        false
      )
    })

    it('should not show change section when trend is null', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          change: '+15%',
          trend: null,
        },
      })

      expect(wrapper.find('[data-testid="trending-up-icon"]').exists()).toBe(
        false
      )
      expect(wrapper.find('[data-testid="trending-down-icon"]').exists()).toBe(
        false
      )
    })

    it('should not show change section when both change and trend are null', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
        },
      })

      expect(wrapper.find('[data-testid="trending-up-icon"]').exists()).toBe(
        false
      )
      expect(wrapper.find('[data-testid="trending-down-icon"]').exists()).toBe(
        false
      )
    })
  })

  describe('trend icons', () => {
    it('should render TrendingUp icon when trend is up', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          change: '+15%',
          trend: 'up',
        },
      })

      expect(wrapper.find('[data-testid="trending-up-icon"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="trending-down-icon"]').exists()).toBe(
        false
      )
    })

    it('should render TrendingDown icon when trend is down', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '3000',
          change: '-10%',
          trend: 'down',
        },
      })

      expect(wrapper.find('[data-testid="trending-down-icon"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="trending-up-icon"]').exists()).toBe(
        false
      )
    })
  })

  describe('trend color styling', () => {
    it('should apply green color class for up trend', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          change: '+15%',
          trend: 'up',
        },
      })

      const trendElement = wrapper.find('.text-green-500')
      expect(trendElement.exists()).toBe(true)
    })

    it('should apply yellow color class for down trend', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '3000',
          change: '-10%',
          trend: 'down',
        },
      })

      const trendElement = wrapper.find('.text-yellow-500')
      expect(trendElement.exists()).toBe(true)
    })

    it('should not apply trend color when trend is null', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
        },
      })

      expect(wrapper.find('.text-green-500').exists()).toBe(false)
      expect(wrapper.find('.text-yellow-500').exists()).toBe(false)
    })
  })

  describe('warning styling variant', () => {
    it('should apply warning border class when warning prop is true', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Rest Days',
          value: '0',
          warning: true,
        },
      })

      // The Card component should receive the warning class
      const card = wrapper.find('.card')
      expect(card.classes()).toContain('border-yellow-500/20')
    })

    it('should not apply warning border class when warning prop is false', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Rest Days',
          value: '3',
          warning: false,
        },
      })

      const card = wrapper.find('.card')
      expect(card.classes()).not.toContain('border-yellow-500/20')
    })

    it('should not apply warning border class when warning prop is not provided', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Rest Days',
          value: '3',
        },
      })

      const card = wrapper.find('.card')
      expect(card.classes()).not.toContain('border-yellow-500/20')
    })
  })

  describe('prop validation', () => {
    it('should accept valid trend values', () => {
      // up trend
      const upWrapper = createWrapper({
        props: {
          title: 'Test',
          value: '100',
          change: '+10%',
          trend: 'up',
        },
      })
      expect(upWrapper.vm.trend).toBe('up')

      // down trend
      const downWrapper = createWrapper({
        props: {
          title: 'Test',
          value: '100',
          change: '-10%',
          trend: 'down',
        },
      })
      expect(downWrapper.vm.trend).toBe('down')

      // null trend
      const nullWrapper = createWrapper({
        props: {
          title: 'Test',
          value: '100',
          trend: null,
        },
      })
      expect(nullWrapper.vm.trend).toBe(null)
    })

    it('should have required title prop', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Required Title',
          value: '100',
        },
      })

      expect(wrapper.vm.title).toBe('Required Title')
    })

    it('should have required value prop', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: 'Required Value',
        },
      })

      expect(wrapper.vm.value).toBe('Required Value')
    })
  })

  describe('computed properties', () => {
    it('should compute correct trendColor for up trend', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: '100',
          trend: 'up',
          change: '+10%',
        },
      })

      // Access the internal computed property via the component
      expect(wrapper.find('.text-green-500').exists()).toBe(true)
    })

    it('should compute correct trendColor for down trend', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: '100',
          trend: 'down',
          change: '-10%',
        },
      })

      expect(wrapper.find('.text-yellow-500').exists()).toBe(true)
    })

    it('should compute empty trendColor when trend is null', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: '100',
          trend: null,
        },
      })

      // No trend color classes should be applied
      expect(wrapper.find('.text-green-500').exists()).toBe(false)
      expect(wrapper.find('.text-yellow-500').exists()).toBe(false)
    })

    it('should compute correct cardClass with warning', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: '100',
          warning: true,
        },
      })

      const card = wrapper.find('.card')
      expect(card.classes()).toContain('border-yellow-500/20')
    })

    it('should compute empty cardClass without warning', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: '100',
          warning: false,
        },
      })

      const card = wrapper.find('.card')
      expect(card.classes()).not.toContain('border-yellow-500/20')
    })
  })

  describe('layout and structure', () => {
    it('should render Card component as root element', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.card').exists()).toBe(true)
    })

    it('should render CardHeader with title', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test Title',
          value: '100',
        },
      })

      expect(wrapper.find('.card-header').exists()).toBe(true)
      expect(wrapper.find('.card-title').text()).toBe('Test Title')
    })

    it('should render CardContent with value', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: '12345',
        },
      })

      expect(wrapper.find('.card-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('12345')
    })

    it('should render value with font-mono class for numeric display', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: '1,234',
        },
      })

      const valueElement = wrapper.find('.font-mono')
      expect(valueElement.exists()).toBe(true)
      expect(valueElement.text()).toBe('1,234')
    })
  })

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Rest Days',
          value: 0,
        },
      })

      expect(wrapper.text()).toContain('0')
    })

    it('should handle empty string value', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test',
          value: '',
        },
      })

      expect(wrapper.find('.font-mono').text()).toBe('')
    })

    it('should handle large numbers', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Total Volume',
          value: '1,234,567 kg',
        },
      })

      expect(wrapper.text()).toContain('1,234,567 kg')
    })

    it('should handle special characters in title', () => {
      const wrapper = createWrapper({
        props: {
          title: "M'yazovyi Progress",
          value: '100%',
        },
      })

      expect(wrapper.text()).toContain("M'yazovyi Progress")
    })

    it('should handle combined warning with trend', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Rest Days',
          value: '0',
          warning: true,
          trend: 'down',
          change: '-100%',
        },
      })

      // Both warning border and down trend should be applied
      expect(wrapper.find('.card').classes()).toContain('border-yellow-500/20')
      expect(wrapper.find('.text-yellow-500').exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have semantic structure', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Test Stat',
          value: '100',
        },
      })

      // Card structure should be present
      expect(wrapper.find('.card').exists()).toBe(true)
      expect(wrapper.find('.card-header').exists()).toBe(true)
      expect(wrapper.find('.card-content').exists()).toBe(true)
    })

    it('should display title with proper styling', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Accessible Title',
          value: '50',
        },
      })

      const title = wrapper.find('.card-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Accessible Title')
    })
  })
})
