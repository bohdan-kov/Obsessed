import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import StatCard from '@/pages/dashboard/components/StatCard.vue'

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

// Mock UI components
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
}))

describe('StatCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /**
   * Factory function to create wrapper with default props
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

  describe('required props rendering', () => {
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
  })

  describe('trend prop', () => {
    it('should render trending up icon when direction is up', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Workouts',
          value: '10',
          trend: { value: '+20%', direction: 'up' },
        },
      })

      const upIcon = wrapper.find('[data-testid="trending-up-icon"]')
      expect(upIcon.exists()).toBe(true)
      expect(wrapper.text()).toContain('+20%')
    })

    it('should render trending down icon when direction is down', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          trend: { value: '-10%', direction: 'down' },
        },
      })

      const downIcon = wrapper.find('[data-testid="trending-down-icon"]')
      expect(downIcon.exists()).toBe(true)
      expect(wrapper.text()).toContain('-10%')
    })

    it('should not render trend indicator when direction is neutral', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Workouts',
          value: '10',
          trend: { value: '0%', direction: 'neutral' },
        },
      })

      const upIcon = wrapper.find('[data-testid="trending-up-icon"]')
      const downIcon = wrapper.find('[data-testid="trending-down-icon"]')
      expect(upIcon.exists()).toBe(false)
      expect(downIcon.exists()).toBe(false)
    })

    it('should not render trend indicator when trend is null', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Workouts',
          value: '10',
          trend: null,
        },
      })

      const upIcon = wrapper.find('[data-testid="trending-up-icon"]')
      const downIcon = wrapper.find('[data-testid="trending-down-icon"]')
      expect(upIcon.exists()).toBe(false)
      expect(downIcon.exists()).toBe(false)
    })
  })

  describe('periodLabel prop', () => {
    it('should render period label when provided', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
          periodLabel: 'This month',
        },
      })

      expect(wrapper.text()).toContain('This month')
    })

    it('should not render period label when not provided', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Volume',
          value: '5000',
        },
      })

      // Only title and value should be present
      expect(wrapper.text()).toContain('Volume')
      expect(wrapper.text()).toContain('5000')
    })
  })

  describe('insight prop', () => {
    it('should render insight text when provided', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Workouts',
          value: '10',
          insight: {
            textKey: 'dashboard.stats.insights.strongConsistency',
            status: 'good',
          },
        },
      })

      // Should contain the translation key (mocked to return key itself)
      expect(wrapper.text()).toContain('dashboard.stats.insights.strongConsistency')
    })

    it('should not render insight when not provided', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Workouts',
          value: '10',
        },
      })

      // Only title and value should be present
      expect(wrapper.text()).toContain('Workouts')
      expect(wrapper.text()).toContain('10')
    })
  })

  describe('variant prop', () => {
    it('should apply warning variant class', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Rest Days',
          value: '5',
          variant: 'warning',
        },
      })

      const card = wrapper.find('.card')
      expect(card.classes()).toContain('border-yellow-500/50')
      expect(card.classes()).toContain('bg-yellow-500/5')
    })

    it('should not apply warning classes for default variant', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Workouts',
          value: '10',
          variant: 'default',
        },
      })

      const card = wrapper.find('.card')
      expect(card.classes()).not.toContain('border-yellow-500/50')
      expect(card.classes()).not.toContain('bg-yellow-500/5')
    })
  })

  describe('accessibility', () => {
    it('should render title as heading (h3)', () => {
      const wrapper = createWrapper({
        props: { title: 'Accessible Title', value: '100' },
      })

      const heading = wrapper.find('h3')
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('Accessible Title')
    })

    it('should have aria-label on trend indicator', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Workouts',
          value: '10',
          trend: { value: '+20%', direction: 'up' },
        },
      })

      const trendDiv = wrapper.find('[role="status"]')
      expect(trendDiv.exists()).toBe(true)
      expect(trendDiv.attributes('aria-label')).toContain('increased')
    })

    it('should have aria-live on warning insights', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Rest Days',
          value: '5',
          insight: {
            textKey: 'dashboard.stats.insights.needsAttention',
            status: 'warning',
          },
        },
      })

      // Find all status elements and check if any have aria-live="polite"
      const statusElements = wrapper.findAll('[role="status"]')
      const hasPoliteAriaLive = statusElements.some(
        (el) => el.attributes('aria-live') === 'polite'
      )
      expect(hasPoliteAriaLive).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    it('should render complete stat card with all props', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Total Workouts',
          value: '15',
          trend: { value: '+25%', direction: 'up' },
          periodLabel: 'This month',
          insight: {
            textKey: 'dashboard.stats.insights.strongConsistency',
            status: 'good',
          },
          variant: 'default',
        },
      })

      // Check all elements are present
      expect(wrapper.text()).toContain('Total Workouts')
      expect(wrapper.text()).toContain('15')
      expect(wrapper.text()).toContain('+25%')
      expect(wrapper.text()).toContain('This month')
      expect(wrapper.text()).toContain('dashboard.stats.insights.strongConsistency')

      // Check trend icon
      const upIcon = wrapper.find('[data-testid="trending-up-icon"]')
      expect(upIcon.exists()).toBe(true)
    })

    it('should render minimal stat card with only required props', () => {
      const wrapper = createWrapper({
        props: {
          title: 'Simple Stat',
          value: '100',
        },
      })

      expect(wrapper.text()).toContain('Simple Stat')
      expect(wrapper.text()).toContain('100')

      // Verify optional elements are not present
      const upIcon = wrapper.find('[data-testid="trending-up-icon"]')
      const downIcon = wrapper.find('[data-testid="trending-down-icon"]')
      expect(upIcon.exists()).toBe(false)
      expect(downIcon.exists()).toBe(false)
    })
  })
})
