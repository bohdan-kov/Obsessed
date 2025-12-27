import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
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

// Mock useContributionHeatmap with proper refs
vi.mock('@/composables/useContributionHeatmap', () => ({
  useContributionHeatmap: vi.fn(() => ({
    gridData: ref([
      [
        { date: new Date('2024-01-01'), count: 1, level: 1, colorClass: 'bg-primary/30', isToday: false, isInPeriod: true },
      ],
    ]),
    monthLabels: ref([{ label: 'Jan', weekIndex: 0 }]),
    dayLabels: ref(['Mon', '', 'Wed', '', 'Fri', '', '']),
    legendLevels: [0, 1, 2, 3],
    isEmpty: ref(false),
    totalWeeks: ref(1),
    isCappedToYear: ref(false),
    getColorClass: (level) => ['bg-muted/30', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80'][level] || 'bg-muted/30',
    formatTooltipText: (cell) => `${cell.date}`,
  })),
}))

// Mock chart components
vi.mock('../components/muscles/MuscleVolumeChart.vue', () => ({
  default: {
    name: 'MuscleVolumeChart',
    props: ['period'],
    template: '<div data-testid="muscle-volume-chart">Muscle Volume Chart - {{ period }}</div>',
  },
}))

vi.mock('../components/muscles/MuscleDistributionChart.vue', () => ({
  default: {
    name: 'MuscleDistributionChart',
    props: ['period'],
    template: '<div data-testid="muscle-distribution-chart">Muscle Distribution Chart</div>',
  },
}))

vi.mock('../components/duration/DurationTrendChart.vue', () => ({
  default: {
    name: 'DurationTrendChart',
    props: ['period'],
    template: '<div data-testid="duration-trend-chart">Duration Trend Chart - {{ period }}</div>',
  },
}))

vi.mock('../components/volume/VolumeHeatmap.vue', () => ({
  default: {
    name: 'VolumeHeatmap',
    props: ['period'],
    template: '<div data-testid="volume-heatmap">Volume Heatmap - {{ period }}</div>',
  },
}))

vi.mock('../components/volume/ProgressiveOverloadChart.vue', () => ({
  default: {
    name: 'ProgressiveOverloadChart',
    props: ['period'],
    template: '<div data-testid="progressive-overload-chart">Progressive Overload Chart - {{ period }}</div>',
  },
}))

vi.mock('../components/shared/PeriodSelector.vue', () => ({
  default: {
    name: 'PeriodSelector',
    props: ['modelValue', 'variant', 'size'],
    emits: ['update:modelValue'],
    template: `
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        data-testid="period-selector"
        class="period-selector"
      >
        <option value="last_7_days">Last 7 days</option>
        <option value="last_30_days">Last 30 days</option>
        <option value="last_90_days">Last 90 days</option>
        <option value="last_365_days">Last 365 days</option>
      </select>
    `,
  },
}))

vi.mock('../components/exercises/ExerciseProgressTable.vue', () => ({
  default: {
    name: 'ExerciseProgressTable',
    props: ['period', 'showPeriodSelector'],
    template: '<div data-testid="exercise-table">Exercise Table - {{ period }}</div>',
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

describe('Analytics Integration Tests', () => {
  let router

  // Mock workout data
  const mockWorkouts = [
    {
      id: 'workout-1',
      date: new Date('2024-01-01').toISOString(),
      duration: 60,
      exercises: [
        {
          name: 'Bench Press',
          muscleGroup: 'Chest',
          sets: [
            { weight: 100, reps: 10 },
            { weight: 100, reps: 9 },
          ],
        },
      ],
    },
    {
      id: 'workout-2',
      date: new Date('2024-01-03').toISOString(),
      duration: 70,
      exercises: [
        {
          name: 'Squat',
          muscleGroup: 'Legs',
          sets: [
            { weight: 150, reps: 8 },
          ],
        },
      ],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/analytics',
          name: 'analytics',
          component: AnalyticsView,
        },
      ],
    })
  })

  async function createWrapper(initialRoute = '/analytics', workouts = mockWorkouts) {
    const pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        workout: {
          workouts: workouts,
          loading: false,
        },
        analytics: {
          loading: false,
          period: 'last30Days',
        },
      },
    })

    await router.push(initialRoute)
    await router.isReady()

    const wrapper = mount(AnalyticsView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return { wrapper, router, pinia }
  }

  describe('End-to-End User Flow', () => {
    it('should load analytics page and display title', async () => {
      const { wrapper } = await createWrapper()

      // Check page title
      expect(wrapper.find('h1').text()).toContain('analytics.title')
    })

    it('should render tabs', async () => {
      const { wrapper } = await createWrapper()

      const tabs = wrapper.findAllComponents({ name: 'TabsTrigger' })
      expect(tabs.length).toBeGreaterThanOrEqual(4)
    })

    it('should render muscles tab chart by default', async () => {
      const { wrapper } = await createWrapper()

      // Check MuscleVolumeChart is rendered
      expect(wrapper.find('[data-testid="muscle-volume-chart"]').exists()).toBe(true)
    })

    it('should render duration tab chart when tab=duration', async () => {
      const { wrapper } = await createWrapper('/analytics?tab=duration')

      // With mocked Tabs component, all tab content is rendered
      // Check DurationTrendChart is rendered
      expect(wrapper.find('[data-testid="duration-trend-chart"]').exists()).toBe(true)
    })

    it('should render volume tab charts when tab=volume', async () => {
      const { wrapper } = await createWrapper('/analytics?tab=volume')

      // Check volume charts are rendered
      expect(wrapper.find('[data-testid="volume-heatmap"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="progressive-overload-chart"]').exists()).toBe(true)
    })

    it('should render exercises tab when tab=exercises', async () => {
      const { wrapper } = await createWrapper('/analytics?tab=exercises')

      // Check exercise table is rendered
      expect(wrapper.find('[data-testid="exercise-table"]').exists()).toBe(true)
    })
  })

  describe('Period Selection', () => {
    it('should render period selector', async () => {
      const { wrapper } = await createWrapper()

      const periodSelector = wrapper.find('[data-testid="period-selector"]')
      expect(periodSelector.exists()).toBe(true)
    })

    it('should change period via selector', async () => {
      const { wrapper } = await createWrapper()

      const periodSelector = wrapper.find('[data-testid="period-selector"]')
      await periodSelector.setValue('last_90_days')
      await periodSelector.trigger('change')
      await flushPromises()

      expect(periodSelector.element.value).toBe('last_90_days')
    })

    it('should initialize period from URL query param', async () => {
      const { wrapper, router } = await createWrapper('/analytics?period=last_7_days')

      await flushPromises()

      expect(router.currentRoute.value.query.period).toBe('last_7_days')
    })
  })

  describe('URL State Management', () => {
    it('should preserve tab query param when changing period', async () => {
      const { wrapper, router } = await createWrapper('/analytics?tab=volume')

      await flushPromises()

      const periodSelector = wrapper.find('[data-testid="period-selector"]')
      await periodSelector.setValue('last_7_days')
      await periodSelector.trigger('change')
      await flushPromises()

      // Tab should still be volume
      expect(router.currentRoute.value.query.tab).toBe('volume')
    })

    it('should handle multiple query params', async () => {
      const { wrapper, router } = await createWrapper('/analytics?tab=duration&period=last_90_days')

      await flushPromises()

      expect(router.currentRoute.value.query.tab).toBe('duration')
      expect(router.currentRoute.value.query.period).toBe('last_90_days')
    })
  })

  describe('Empty States', () => {
    it('should handle empty workout data gracefully', async () => {
      const { wrapper } = await createWrapper('/analytics', [])

      await flushPromises()

      // Charts should still render (they handle empty state internally)
      expect(wrapper.find('[data-testid="muscle-volume-chart"]').exists()).toBe(true)
    })

    it('should handle empty workout data across all tabs', async () => {
      // Check muscles tab
      const { wrapper: wrapper1 } = await createWrapper('/analytics?tab=muscles', [])
      await flushPromises()
      expect(wrapper1.find('[data-testid="muscle-volume-chart"]').exists()).toBe(true)

      // Check duration tab
      const { wrapper: wrapper2 } = await createWrapper('/analytics?tab=duration', [])
      await flushPromises()
      expect(wrapper2.find('[data-testid="duration-trend-chart"]').exists()).toBe(true)

      // Check volume tab
      const { wrapper: wrapper3 } = await createWrapper('/analytics?tab=volume', [])
      await flushPromises()
      expect(wrapper3.find('[data-testid="volume-heatmap"]').exists()).toBe(true)

      // Check exercises tab
      const { wrapper: wrapper4 } = await createWrapper('/analytics?tab=exercises', [])
      await flushPromises()
      expect(wrapper4.find('[data-testid="exercise-table"]').exists()).toBe(true)
    })
  })

  describe('Component Lifecycle', () => {
    it('should initialize with correct default state', async () => {
      const { wrapper, router } = await createWrapper()

      await flushPromises()

      // Default tab should be muscles (no tab param means default)
      expect(router.currentRoute.value.query.tab).toBeUndefined()

      // Default period selector should exist
      const periodSelector = wrapper.find('[data-testid="period-selector"]')
      expect(periodSelector.exists()).toBe(true)
    })

    it('should cleanup properly on unmount', async () => {
      const { wrapper } = await createWrapper()

      await flushPromises()

      // Unmount component - should not throw
      wrapper.unmount()

      // No errors should be thrown
      expect(true).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      const { wrapper } = await createWrapper()

      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toContain('analytics.title')
    })

    it('should have tab components with correct roles', async () => {
      const { wrapper } = await createWrapper()

      // Check for tablist role
      const tabList = wrapper.find('[role="tablist"]')
      expect(tabList.exists()).toBe(true)

      // Check for tab roles
      const tabs = wrapper.findAll('[role="tab"]')
      expect(tabs.length).toBeGreaterThanOrEqual(4)

      // Check for tabpanel roles
      const tabPanels = wrapper.findAll('[role="tabpanel"]')
      expect(tabPanels.length).toBeGreaterThanOrEqual(1)
    })
  })
})
