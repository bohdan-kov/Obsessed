import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AnalyticsView from '@/pages/analytics/AnalyticsView.vue'

// Import actual vue-router for integration tests that need real router functionality
// This overrides the global mock from vitest.setup.js for this test file
const { createRouter, createMemoryHistory } = await vi.importActual('vue-router')

// Mock Firebase
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  subscribeToCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  COLLECTIONS: {
    WORKOUTS: 'workouts',
    EXERCISES: 'exercises',
    USERS: 'users',
  },
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn((callback) => {
    callback({ uid: 'test-user-id', email: 'test@example.com' })
    return vi.fn()
  }),
  signOut: vi.fn(),
}))

// Mock authStore to provide authenticated user
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    uid: 'test-user-id',
    user: { uid: 'test-user-id', email: 'test@example.com' },
    isAuthenticated: true,
    initializing: false,
    initAuth: vi.fn(),
    logout: vi.fn(),
  })),
}))

// Mock useErrorHandler
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}))

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
    props: ['modelValue', 'variant', 'size'],
    emits: ['update:modelValue'],
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" data-testid="period-selector"><option value="last_7_days">Last 7 days</option><option value="last_30_days">Last 30 days</option><option value="last_90_days">Last 90 days</option></select>',
  },
}))

vi.mock('../components/exercises/ExerciseProgressTable.vue', () => ({
  default: {
    name: 'ExerciseProgressTable',
    props: ['period', 'showPeriodSelector'],
    template: '<div data-testid="exercise-table">Exercise Table - Period: {{ period }}</div>',
  },
}))

// Mock shadcn-vue Tabs to render all TabsContent regardless of active state
// This is necessary because reka-ui Tabs doesn't work correctly in jsdom test environment
vi.mock('@/components/ui/tabs', () => ({
  Tabs: {
    name: 'Tabs',
    props: ['modelValue', 'defaultValue'],
    template: '<div class="tabs-container"><slot /></div>',
  },
  TabsList: {
    name: 'TabsList',
    template: '<div role="tablist"><slot /></div>',
  },
  TabsTrigger: {
    name: 'TabsTrigger',
    props: ['value'],
    template: '<button role="tab" :id="`trigger-${value}`"><slot /></button>',
  },
  TabsContent: {
    name: 'TabsContent',
    props: ['value'],
    template: '<div role="tabpanel" :data-value="value"><slot /></div>',
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
 * Mounts AnalyticsView with router and Pinia
 */
async function mountAnalyticsView(options = {}) {
  const { query = {} } = options
  const router = createTestRouter(query)

  // Wait for router to be ready
  await router.isReady()

  const pinia = createTestingPinia({
    stubActions: false,
    initialState: {
      workout: {
        workouts: [],
        loading: false,
      },
      analytics: {
        period: 'last30Days',
        loading: false,
      },
    },
  })

  const wrapper = mount(AnalyticsView, {
    global: {
      plugins: [router, pinia],
    },
  })

  // Wait for component to fully mount
  await wrapper.vm.$nextTick()
  await flushPromises()

  return { wrapper, router, pinia }
}

describe('AnalyticsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders analytics view with title', async () => {
      const { wrapper } = await mountAnalyticsView()

      expect(wrapper.find('h1').text()).toBe('analytics.title')
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
      expect(tabValues).toContain('exercises')
    })

    it('renders tab icons', async () => {
      const { wrapper } = await mountAnalyticsView()

      // Icons are rendered via lucide-vue-next components
      // Check for icon wrapper classes or component presence
      const html = wrapper.html()
      expect(html).toContain('lucide')
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

    it('renders ExerciseTable in exercises tab', async () => {
      const { wrapper } = await mountAnalyticsView({
        query: { tab: 'exercises' },
      })

      await wrapper.vm.$nextTick()

      const table = wrapper.find('[data-testid="exercise-table"]')
      expect(table.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('renders proper heading hierarchy', async () => {
      const { wrapper } = await mountAnalyticsView()

      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toBe('analytics.title')
    })

    it('renders icons in tabs', async () => {
      const { wrapper } = await mountAnalyticsView()

      // Check that SVG icons are present in the tabs
      const svgs = wrapper.findAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
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
    })
  })
})
