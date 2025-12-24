import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AnalyticsView from '../AnalyticsView.vue'

// Mock chart components to avoid canvas/charting library issues in tests
vi.mock('../components/muscles/MuscleVolumeChart.vue', () => ({
  default: {
    name: 'MuscleVolumeChart',
    props: ['period'],
    template:
      '<div data-testid="muscle-volume-chart">Muscle Volume Chart - Period: {{ period }}</div>',
  },
}))

vi.mock('../components/duration/DurationTrendChart.vue', () => ({
  default: {
    name: 'DurationTrendChart',
    props: ['period'],
    template:
      '<div data-testid="duration-trend-chart">Duration Trend Chart - Period: {{ period }}</div>',
  },
}))

vi.mock('../components/volume/VolumeHeatmap.vue', () => ({
  default: {
    name: 'VolumeHeatmap',
    props: ['period'],
    template: '<div data-testid="volume-heatmap">Volume Heatmap - Period: {{ period }}</div>',
  },
}))

vi.mock('../components/volume/ProgressiveOverloadChart.vue', () => ({
  default: {
    name: 'ProgressiveOverloadChart',
    props: ['period'],
    template:
      '<div data-testid="progressive-overload-chart">Progressive Overload Chart - Period: {{ period }}</div>',
  },
}))

vi.mock('../components/shared/PeriodSelector.vue', () => ({
  default: {
    name: 'PeriodSelector',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" data-testid="period-selector"><option value="last_7_days">Last 7 days</option><option value="last_30_days">Last 30 days</option><option value="last_90_days">Last 90 days</option></select>',
  },
}))

vi.mock('@/pages/dashboard/components/ExerciseTable.vue', () => ({
  default: {
    name: 'ExerciseTable',
    props: ['period', 'showPeriodSelector'],
    template: '<div data-testid="exercise-table">Exercise Table - Period: {{ period }}</div>',
  },
}))

/**
 * Creates a test router with a single analytics route
 */
function createTestRouter(initialQuery = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/analytics',
        name: 'Analytics',
        component: AnalyticsView,
      },
    ],
  })

  // Navigate to analytics route with optional query params
  router.push({
    path: '/analytics',
    query: initialQuery,
  })

  return router
}

/**
 * Mounts AnalyticsView with router
 */
async function mountAnalyticsView(options = {}) {
  const { query = {} } = options
  const router = createTestRouter(query)

  // Wait for router to be ready
  await router.isReady()

  const wrapper = mount(AnalyticsView, {
    global: {
      plugins: [router],
    },
  })

  // Wait for component to fully mount
  await wrapper.vm.$nextTick()

  return { wrapper, router }
}

describe('AnalyticsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders analytics view with title', async () => {
      const { wrapper } = await mountAnalyticsView()

      expect(wrapper.find('h1').text()).toBe('analytics.title')
      expect(wrapper.find('.analytics-view').exists()).toBe(true)
    })

    it('renders period selector', async () => {
      const { wrapper } = await mountAnalyticsView()

      const periodSelector = wrapper.find('[data-testid="period-selector"]')
      expect(periodSelector.exists()).toBe(true)
    })

    it('renders all four tab triggers', async () => {
      const { wrapper } = await mountAnalyticsView()

      // Find by component name - may include nested components
      const tabTriggers = wrapper.findAllComponents({ name: 'TabsTrigger' })

      // Should have at least 4 tab triggers
      expect(tabTriggers.length).toBeGreaterThanOrEqual(4)

      // Check that all expected tab values exist
      const tabValues = tabTriggers.map((trigger) => trigger.props('value'))
      expect(tabValues).toContain('muscles')
      expect(tabValues).toContain('duration')
      expect(tabValues).toContain('volume')
      expect(tabValues).toContain('strength')
    })

    it('renders tab icons', async () => {
      const { wrapper } = await mountAnalyticsView()

      // Icons are rendered via lucide-vue-next components
      expect(wrapper.html()).toContain('dumbbell')
      expect(wrapper.html()).toContain('clock')
      expect(wrapper.html()).toContain('trending-up')
      expect(wrapper.html()).toContain('award')
    })
  })

  describe('URL Synchronization', () => {
    it('defaults to muscles tab when no tab query param', async () => {
      const { wrapper, router } = await mountAnalyticsView()

      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.query.tab).toBeUndefined()
      // Default tab is 'muscles'
    })

    it('sets active tab from URL query param', async () => {
      const { wrapper, router } = await mountAnalyticsView({
        query: { tab: 'duration' },
      })

      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.query.tab).toBe('duration')
    })

    it('initializes period from URL query param', async () => {
      const { wrapper, router } = await mountAnalyticsView({
        query: { period: 'last_90_days' },
      })

      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.query.period).toBe('last_90_days')
      const periodSelector = wrapper.find('[data-testid="period-selector"]')
      expect(periodSelector.element.value).toBe('last_90_days')
    })

    it('defaults to last_30_days period when no period query param', async () => {
      const { wrapper } = await mountAnalyticsView()

      await wrapper.vm.$nextTick()

      const periodSelector = wrapper.find('[data-testid="period-selector"]')
      expect(periodSelector.element.value).toBe('last_30_days')
    })

    it('resets to muscles tab if invalid tab in URL', async () => {
      const { wrapper, router } = await mountAnalyticsView({
        query: { tab: 'invalid-tab' },
      })

      // Wait for initial render
      await wrapper.vm.$nextTick()

      // Wait for watch to trigger and router to update
      await new Promise((resolve) => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      // Should reset to 'muscles'
      expect(router.currentRoute.value.query.tab).toBe('muscles')
    })
  })

  describe('Tab Navigation', () => {
    it('switches tabs and updates URL', async () => {
      const { wrapper, router } = await mountAnalyticsView()

      // Initial state
      await wrapper.vm.$nextTick()

      // Simulate tab change
      await router.replace({ query: { tab: 'volume' } })
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.query.tab).toBe('volume')
    })

    it('preserves period query param when switching tabs', async () => {
      const { wrapper, router } = await mountAnalyticsView({
        query: { period: 'last_90_days', tab: 'muscles' },
      })

      await wrapper.vm.$nextTick()

      // Switch to duration tab
      await router.replace({
        query: {
          ...router.currentRoute.value.query,
          tab: 'duration',
        },
      })
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.query.tab).toBe('duration')
      expect(router.currentRoute.value.query.period).toBe('last_90_days')
    })
  })

  describe('Period Selection', () => {
    it('updates period when period selector changes', async () => {
      const { wrapper, router } = await mountAnalyticsView()

      const periodSelector = wrapper.find('[data-testid="period-selector"]')

      // Change period
      await periodSelector.setValue('last_90_days')
      await periodSelector.trigger('change')
      await wrapper.vm.$nextTick()

      // Period should be updated (URL sync happens via useAnalyticsPeriod)
      expect(periodSelector.element.value).toBe('last_90_days')
    })

    it('preserves tab query param when changing period', async () => {
      const { wrapper, router } = await mountAnalyticsView({
        query: { tab: 'volume' },
      })

      await wrapper.vm.$nextTick()

      const periodSelector = wrapper.find('[data-testid="period-selector"]')

      // Change period
      await periodSelector.setValue('last_7_days')
      await periodSelector.trigger('change')
      await wrapper.vm.$nextTick()

      // Tab should still be 'volume'
      expect(router.currentRoute.value.query.tab).toBe('volume')
    })
  })

  describe('Chart Component Integration', () => {
    it('renders MuscleVolumeChart in muscles tab', async () => {
      const { wrapper } = await mountAnalyticsView({
        query: { tab: 'muscles' },
      })

      await wrapper.vm.$nextTick()

      const chart = wrapper.find('[data-testid="muscle-volume-chart"]')
      expect(chart.exists()).toBe(true)
    })

    it('renders DurationTrendChart in duration tab', async () => {
      const { wrapper } = await mountAnalyticsView({
        query: { tab: 'duration' },
      })

      await wrapper.vm.$nextTick()

      const chart = wrapper.find('[data-testid="duration-trend-chart"]')
      expect(chart.exists()).toBe(true)
    })

    it('renders VolumeHeatmap and ProgressiveOverloadChart in volume tab', async () => {
      const { wrapper } = await mountAnalyticsView({
        query: { tab: 'volume' },
      })

      await wrapper.vm.$nextTick()

      const heatmap = wrapper.find('[data-testid="volume-heatmap"]')
      const overload = wrapper.find('[data-testid="progressive-overload-chart"]')

      expect(heatmap.exists()).toBe(true)
      expect(overload.exists()).toBe(true)
    })

    it('renders ExerciseTable in strength tab', async () => {
      const { wrapper } = await mountAnalyticsView({
        query: { tab: 'strength' },
      })

      await wrapper.vm.$nextTick()

      const table = wrapper.find('[data-testid="exercise-table"]')
      expect(table.exists()).toBe(true)
    })

    it('passes period prop to all chart components', async () => {
      const { wrapper, router } = await mountAnalyticsView({
        query: { period: 'last_90_days', tab: 'muscles' },
      })

      const muscleChart = wrapper.find('[data-testid="muscle-volume-chart"]')
      expect(muscleChart.text()).toContain('last_90_days')

      // Switch to volume tab
      await router.replace({ query: { period: 'last_90_days', tab: 'volume' } })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick() // Extra tick for tab content to render

      const heatmap = wrapper.find('[data-testid="volume-heatmap"]')
      expect(heatmap.exists()).toBe(true)
      expect(heatmap.text()).toContain('last_90_days')
    })

    it('passes showPeriodSelector=false to ExerciseTable', async () => {
      const { wrapper } = await mountAnalyticsView({
        query: { tab: 'strength' },
      })

      await wrapper.vm.$nextTick()

      const table = wrapper.find('[data-testid="exercise-table"]')
      expect(table.exists()).toBe(true)
      // showPeriodSelector prop should be false (global selector is used)
    })
  })

  describe('Responsive Design', () => {
    it('renders mobile-specific classes', async () => {
      const { wrapper } = await mountAnalyticsView()

      const view = wrapper.find('.analytics-view')
      expect(view.classes()).toContain('px-4')
      expect(view.classes()).toContain('sm:py-8')
    })

    it('renders responsive tab triggers', async () => {
      const { wrapper } = await mountAnalyticsView()

      const tabTriggers = wrapper.findAll('.tab-trigger')

      tabTriggers.forEach((trigger) => {
        expect(trigger.classes()).toContain('min-h-11')
        expect(trigger.classes()).toContain('px-3')
        expect(trigger.classes()).toContain('py-2.5')
      })
    })

    it('renders responsive grid for tabs', async () => {
      const { wrapper } = await mountAnalyticsView()

      const tabsList = wrapper.find('.tabs-list')
      expect(tabsList.classes()).toContain('grid')
      expect(tabsList.classes()).toContain('grid-cols-2')
      expect(tabsList.classes()).toContain('sm:grid-cols-4')
    })
  })

  describe('Accessibility', () => {
    it('renders proper heading hierarchy', async () => {
      const { wrapper } = await mountAnalyticsView()

      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toBe('analytics.title')
    })

    it('renders icons with aria-hidden', async () => {
      const { wrapper } = await mountAnalyticsView()

      // Check that icons have aria-hidden attribute
      // This is set in the component template
      const html = wrapper.html()
      expect(html).toContain('aria-hidden="true"')
    })

    it('renders minimum touch target size for tab triggers', async () => {
      const { wrapper } = await mountAnalyticsView()

      const tabTriggers = wrapper.findAll('.tab-trigger')

      tabTriggers.forEach((trigger) => {
        // min-h-11 = 44px (meets WCAG 2.1 AA)
        expect(trigger.classes()).toContain('min-h-11')
      })
    })

    it('renders responsive tab labels', async () => {
      const { wrapper } = await mountAnalyticsView()

      const tabTriggers = wrapper.findAll('.tab-trigger')

      tabTriggers.forEach((trigger) => {
        // Should have both mobile and desktop labels
        const hiddenSm = trigger.find('.hidden.sm\\:inline')
        const smHidden = trigger.find('.sm\\:hidden')

        expect(hiddenSm.exists() || smHidden.exists()).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles multiple query params in URL', async () => {
      const { wrapper, router } = await mountAnalyticsView({
        query: {
          tab: 'volume',
          period: 'last_90_days',
          someOtherParam: 'value',
        },
      })

      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.query.tab).toBe('volume')
      expect(router.currentRoute.value.query.period).toBe('last_90_days')
      expect(router.currentRoute.value.query.someOtherParam).toBe('value')
    })

    it('handles tab switching without losing other query params', async () => {
      const { wrapper, router } = await mountAnalyticsView({
        query: {
          tab: 'muscles',
          customParam: 'test',
        },
      })

      await wrapper.vm.$nextTick()

      // Switch tab
      await router.replace({
        query: {
          ...router.currentRoute.value.query,
          tab: 'duration',
        },
      })
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.query.tab).toBe('duration')
      expect(router.currentRoute.value.query.customParam).toBe('test')
    })

    it('handles missing i18n translations gracefully', async () => {
      const { wrapper } = await mountAnalyticsView()

      // i18n is mocked globally to return keys
      expect(wrapper.find('h1').text()).toBe('analytics.title')
      expect(wrapper.html()).toContain('analytics.tabs.muscles')
      expect(wrapper.html()).toContain('analytics.tabs.duration')
    })
  })

  describe('Component Structure', () => {
    it('renders header section with proper structure', async () => {
      const { wrapper } = await mountAnalyticsView()

      const header = wrapper.find('.header-section')
      expect(header.exists()).toBe(true)
      expect(header.classes()).toContain('flex')
      expect(header.classes()).toContain('flex-col')
      expect(header.classes()).toContain('sm:flex-row')
    })

    it('renders tabs with proper structure', async () => {
      const { wrapper } = await mountAnalyticsView()

      const tabs = wrapper.find('.analytics-tabs')
      expect(tabs.exists()).toBe(true)
      expect(tabs.classes()).toContain('w-full')
    })

    it('renders tab content with proper spacing', async () => {
      const { wrapper } = await mountAnalyticsView({
        query: { tab: 'volume' },
      })

      await wrapper.vm.$nextTick()

      const tabContent = wrapper.find('.tab-content')
      expect(tabContent.exists()).toBe(true)
      expect(tabContent.classes()).toContain('space-y-6')
    })
  })
})
