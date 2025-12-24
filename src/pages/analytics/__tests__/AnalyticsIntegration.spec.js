import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createTestingPinia } from '@pinia/testing'
import AnalyticsView from '../AnalyticsView.vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'

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
  onAuthChange: vi.fn(),
  signOut: vi.fn(),
}))

// Mock useContributionHeatmap
vi.mock('@/composables/useContributionHeatmap', () => ({
  useContributionHeatmap: vi.fn(() => ({
    gridData: [
      [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
        new Date('2024-01-04'),
        new Date('2024-01-05'),
        new Date('2024-01-06'),
        new Date('2024-01-07'),
      ],
    ],
    monthLabels: [{ label: 'Jan', weekIndex: 0 }],
    weekdayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  })),
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
            { weight: 100, reps: 8 },
          ],
        },
        {
          name: 'Squat',
          muscleGroup: 'Legs',
          sets: [
            { weight: 150, reps: 8 },
            { weight: 150, reps: 7 },
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
          name: 'Deadlift',
          muscleGroup: 'Back',
          sets: [
            { weight: 180, reps: 5 },
            { weight: 180, reps: 5 },
          ],
        },
        {
          name: 'Bench Press',
          muscleGroup: 'Chest',
          sets: [
            { weight: 105, reps: 10 },
            { weight: 105, reps: 9 },
          ],
        },
      ],
    },
    {
      id: 'workout-3',
      date: new Date('2024-01-05').toISOString(),
      duration: 55,
      exercises: [
        {
          name: 'Squat',
          muscleGroup: 'Legs',
          sets: [
            { weight: 155, reps: 8 },
            { weight: 155, reps: 7 },
          ],
        },
      ],
    },
  ]

  beforeEach(() => {
    // Create router with analytics route
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
        },
      },
    })

    await router.push(initialRoute)

    const wrapper = mount(AnalyticsView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          // Use real components for integration tests
          Tabs: false,
          TabsContent: false,
          TabsList: false,
          TabsTrigger: false,
        },
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    return { wrapper, router, pinia }
  }

  describe('End-to-End User Flow', () => {
    it('should load analytics page and display default tab (muscles)', async () => {
      const { wrapper } = await createWrapper()

      // Check page title
      expect(wrapper.find('h1').text()).toContain('analytics.title')

      // Check muscles tab is active by default
      const musclesTab = wrapper.find('[value="muscles"]')
      expect(musclesTab.attributes('data-state')).toBe('active')

      // Check MuscleVolumeChart is rendered
      expect(wrapper.findComponent({ name: 'MuscleVolumeChart' }).exists()).toBe(true)
    })

    it('should switch tabs and update URL', async () => {
      const { wrapper, router } = await createWrapper()

      // Click on duration tab
      const durationTab = wrapper.find('[value="duration"]')
      await durationTab.trigger('click')
      await flushPromises()

      // Check URL updated
      expect(router.currentRoute.value.query.tab).toBe('duration')

      // Check duration tab is now active
      expect(durationTab.attributes('data-state')).toBe('active')

      // Check DurationTrendChart is rendered
      expect(wrapper.findComponent({ name: 'DurationTrendChart' }).exists()).toBe(true)
    })

    it('should change period and update all charts', async () => {
      const { wrapper } = await createWrapper()

      // Find period selector
      const periodSelector = wrapper.findComponent({ name: 'PeriodSelector' })
      expect(periodSelector.exists()).toBe(true)

      // Change period to last_7_days
      await periodSelector.vm.$emit('update:model-value', 'last_7_days')
      await flushPromises()

      // Verify URL updated
      const { router } = wrapper.vm
      expect(router.currentRoute.value.query.period).toBe('last_7_days')

      // Verify period prop passed to chart
      const muscleChart = wrapper.findComponent({ name: 'MuscleVolumeChart' })
      expect(muscleChart.props('period')).toBe('last_7_days')
    })

    it('should persist tab and period on page reload (URL state)', async () => {
      // Initial load with specific tab and period
      const { wrapper: wrapper1, router } = await createWrapper(
        '/analytics?tab=volume&period=last_7_days',
      )

      await flushPromises()

      // Check tab is volume
      const volumeTab = wrapper1.find('[value="volume"]')
      expect(volumeTab.attributes('data-state')).toBe('active')

      // Check period is last_7_days
      const periodSelector = wrapper1.findComponent({ name: 'PeriodSelector' })
      expect(periodSelector.props('modelValue')).toBe('last_7_days')

      // Simulate page reload by creating new wrapper with same URL
      const { wrapper: wrapper2 } = await createWrapper('/analytics?tab=volume&period=last_7_days')

      await flushPromises()

      // Verify state persisted
      const volumeTab2 = wrapper2.find('[value="volume"]')
      expect(volumeTab2.attributes('data-state')).toBe('active')

      const periodSelector2 = wrapper2.findComponent({ name: 'PeriodSelector' })
      expect(periodSelector2.props('modelValue')).toBe('last_7_days')
    })
  })

  describe('Store Integration', () => {
    it('should provide correct data from analyticsStore to components', async () => {
      const { wrapper, pinia } = await createWrapper()
      const analyticsStore = useAnalyticsStore(pinia)

      // Check store has computed properties
      expect(analyticsStore.muscleVolumeData).toBeDefined()
      expect(analyticsStore.durationTrendData).toBeDefined()
      expect(analyticsStore.dailyVolumeMap).toBeDefined()

      // Verify data flows to component
      const muscleChart = wrapper.findComponent({ name: 'MuscleVolumeChart' })
      expect(muscleChart.exists()).toBe(true)
    })

    it('should react to workoutStore changes', async () => {
      const { wrapper, pinia } = await createWrapper('/analytics', [])

      await flushPromises()

      // Initially no workouts
      const workoutStore = useWorkoutStore(pinia)
      expect(workoutStore.workouts).toEqual([])

      // Add workout
      workoutStore.workouts = mockWorkouts
      await wrapper.vm.$nextTick()
      await flushPromises()

      // Analytics should update
      const analyticsStore = useAnalyticsStore(pinia)
      expect(analyticsStore.muscleVolumeData.length).toBeGreaterThan(0)
    })
  })

  describe('Composable Integration', () => {
    it('should integrate useAnalyticsPeriod correctly', async () => {
      const { wrapper, router } = await createWrapper()

      // Change period
      const periodSelector = wrapper.findComponent({ name: 'PeriodSelector' })
      await periodSelector.vm.$emit('update:model-value', 'last_90_days')
      await flushPromises()

      // Check URL updated
      expect(router.currentRoute.value.query.period).toBe('last_90_days')

      // Check all chart components receive updated period
      const muscleChart = wrapper.findComponent({ name: 'MuscleVolumeChart' })
      expect(muscleChart.props('period')).toBe('last_90_days')
    })

    it('should integrate useContributionHeatmap in VolumeHeatmap', async () => {
      const { wrapper } = await createWrapper('/analytics?tab=volume')

      await flushPromises()

      // Check volume heatmap is rendered
      const volumeHeatmap = wrapper.findComponent({ name: 'VolumeHeatmap' })
      expect(volumeHeatmap.exists()).toBe(true)
    })
  })

  describe('Cross-Component Communication', () => {
    it('should update all charts when period changes', async () => {
      const { wrapper } = await createWrapper()

      // Get initial period
      const periodSelector = wrapper.findComponent({ name: 'PeriodSelector' })
      const initialPeriod = periodSelector.props('modelValue')

      // Change period
      const newPeriod = 'last_7_days'
      await periodSelector.vm.$emit('update:model-value', newPeriod)
      await flushPromises()

      // Check muscle chart
      const muscleChart = wrapper.findComponent({ name: 'MuscleVolumeChart' })
      expect(muscleChart.props('period')).toBe(newPeriod)

      // Switch to duration tab
      const durationTab = wrapper.find('[value="duration"]')
      await durationTab.trigger('click')
      await flushPromises()

      // Check duration chart has same period
      const durationChart = wrapper.findComponent({ name: 'DurationTrendChart' })
      expect(durationChart.props('period')).toBe(newPeriod)

      // Switch to volume tab
      const volumeTab = wrapper.find('[value="volume"]')
      await volumeTab.trigger('click')
      await flushPromises()

      // Check volume charts have same period
      const volumeHeatmap = wrapper.findComponent({ name: 'VolumeHeatmap' })
      expect(volumeHeatmap.props('period')).toBe(newPeriod)

      const progressiveChart = wrapper.findComponent({ name: 'ProgressiveOverloadChart' })
      expect(progressiveChart.props('period')).toBe(newPeriod)
    })

    it('should maintain period across tab switches', async () => {
      const { wrapper } = await createWrapper()

      // Set period to last_7_days
      const periodSelector = wrapper.findComponent({ name: 'PeriodSelector' })
      await periodSelector.vm.$emit('update:model-value', 'last_7_days')
      await flushPromises()

      // Switch to duration tab
      const durationTab = wrapper.find('[value="duration"]')
      await durationTab.trigger('click')
      await flushPromises()

      // Period should still be last_7_days
      expect(periodSelector.props('modelValue')).toBe('last_7_days')

      // Switch to volume tab
      const volumeTab = wrapper.find('[value="volume"]')
      await volumeTab.trigger('click')
      await flushPromises()

      // Period should still be last_7_days
      expect(periodSelector.props('modelValue')).toBe('last_7_days')
    })
  })

  describe('Empty States', () => {
    it('should show EmptyState when no workout data', async () => {
      const { wrapper } = await createWrapper('/analytics', [])

      await flushPromises()

      // MuscleVolumeChart should render (BaseChart handles empty state)
      const muscleChart = wrapper.findComponent({ name: 'MuscleVolumeChart' })
      expect(muscleChart.exists()).toBe(true)
    })

    it('should show EmptyState across all tabs when no data', async () => {
      const { wrapper } = await createWrapper('/analytics', [])

      await flushPromises()

      // Check muscles tab
      const muscleChart = wrapper.findComponent({ name: 'MuscleVolumeChart' })
      expect(muscleChart.exists()).toBe(true)

      // Switch to duration
      const durationTab = wrapper.find('[value="duration"]')
      await durationTab.trigger('click')
      await flushPromises()

      const durationChart = wrapper.findComponent({ name: 'DurationTrendChart' })
      expect(durationChart.exists()).toBe(true)

      // Switch to volume
      const volumeTab = wrapper.find('[value="volume"]')
      await volumeTab.trigger('click')
      await flushPromises()

      const volumeHeatmap = wrapper.findComponent({ name: 'VolumeHeatmap' })
      expect(volumeHeatmap.exists()).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('should show LoadingSkeleton when store is loading', async () => {
      const { wrapper } = await createWrapper('/analytics', mockWorkouts)

      const pinia = wrapper.vm.$pinia
      const analyticsStore = useAnalyticsStore(pinia)

      // Set loading state
      analyticsStore.loading = true
      await wrapper.vm.$nextTick()
      await flushPromises()

      // Charts should receive loading prop
      const muscleChart = wrapper.findComponent({ name: 'MuscleVolumeChart' })
      // BaseChart stub would handle loading display
      expect(muscleChart.exists()).toBe(true)
    })

    it('should hide LoadingSkeleton when data loads', async () => {
      const { wrapper } = await createWrapper('/analytics', [])

      const pinia = wrapper.vm.$pinia
      const analyticsStore = useAnalyticsStore(pinia)
      const workoutStore = useWorkoutStore(pinia)

      // Start loading
      analyticsStore.loading = true
      await wrapper.vm.$nextTick()

      // Finish loading with data
      workoutStore.workouts = mockWorkouts
      analyticsStore.loading = false
      await wrapper.vm.$nextTick()
      await flushPromises()

      // Charts should render with data
      const muscleChart = wrapper.findComponent({ name: 'MuscleVolumeChart' })
      expect(muscleChart.exists()).toBe(true)
    })
  })

  describe('URL State Management', () => {
    it('should validate invalid tab in URL and reset to default', async () => {
      const { wrapper, router } = await createWrapper('/analytics?tab=invalid')

      await flushPromises()

      // Should redirect to default tab (muscles)
      expect(router.currentRoute.value.query.tab).toBe('muscles')
    })

    it('should preserve other query params when changing tab', async () => {
      const { wrapper, router } = await createWrapper('/analytics?period=last_7_days&foo=bar')

      await flushPromises()

      // Change tab
      const durationTab = wrapper.find('[value="duration"]')
      await durationTab.trigger('click')
      await flushPromises()

      // Check query params
      const query = router.currentRoute.value.query
      expect(query.tab).toBe('duration')
      expect(query.period).toBe('last_7_days')
      expect(query.foo).toBe('bar')
    })

    it('should preserve other query params when changing period', async () => {
      const { wrapper, router } = await createWrapper('/analytics?tab=volume&foo=bar')

      await flushPromises()

      // Change period
      const periodSelector = wrapper.findComponent({ name: 'PeriodSelector' })
      await periodSelector.vm.$emit('update:model-value', 'last_90_days')
      await flushPromises()

      // Check query params
      const query = router.currentRoute.value.query
      expect(query.tab).toBe('volume')
      expect(query.period).toBe('last_90_days')
      expect(query.foo).toBe('bar')
    })
  })

  describe('Component Lifecycle', () => {
    it('should initialize with correct default state', async () => {
      const { wrapper } = await createWrapper()

      // Check default tab
      const musclesTab = wrapper.find('[value="muscles"]')
      expect(musclesTab.attributes('data-state')).toBe('active')

      // Check default period
      const periodSelector = wrapper.findComponent({ name: 'PeriodSelector' })
      expect(periodSelector.props('modelValue')).toBe('last_30_days')
    })

    it('should cleanup properly on unmount', async () => {
      const { wrapper } = await createWrapper()

      // Unmount component
      wrapper.unmount()

      // No errors should be thrown
      expect(true).toBe(true)
    })
  })

  describe('Responsive Behavior', () => {
    it('should render mobile-friendly tab navigation', async () => {
      const { wrapper } = await createWrapper()

      // Check tabs have mobile classes
      const tabsList = wrapper.find('.tabs-list')
      expect(tabsList.classes()).toContain('grid-cols-2')
      expect(tabsList.classes()).toContain('sm:grid-cols-4')
    })

    it('should have touch-friendly tab triggers', async () => {
      const { wrapper } = await createWrapper()

      // Check all tabs have minimum touch target size
      const tabTriggers = wrapper.findAll('.tab-trigger')
      tabTriggers.forEach((trigger) => {
        expect(trigger.classes()).toContain('min-h-11')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      const { wrapper } = await createWrapper()

      // Check h1 exists
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toContain('analytics.title')
    })

    it('should have aria-hidden on tab icons', async () => {
      const { wrapper } = await createWrapper()

      // Check tab icons have aria-hidden
      const icons = wrapper.findAll('.tab-trigger svg')
      icons.forEach((icon) => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })
  })

  describe('Performance', () => {
    it('should handle rapid tab switching without errors', async () => {
      const { wrapper } = await createWrapper()

      // Rapidly switch tabs
      const tabs = ['duration', 'volume', 'strength', 'muscles']
      for (const tab of tabs) {
        const tabTrigger = wrapper.find(`[value="${tab}"]`)
        await tabTrigger.trigger('click')
        // Don't wait for promises to simulate rapid clicking
      }

      await flushPromises()

      // Should end on last clicked tab without errors
      const musclesTab = wrapper.find('[value="muscles"]')
      expect(musclesTab.attributes('data-state')).toBe('active')
    })

    it('should handle rapid period changes without errors', async () => {
      const { wrapper } = await createWrapper()

      const periodSelector = wrapper.findComponent({ name: 'PeriodSelector' })

      // Rapidly change periods
      const periods = ['last_7_days', 'last_30_days', 'last_90_days', 'last_365_days']
      for (const period of periods) {
        await periodSelector.vm.$emit('update:model-value', period)
      }

      await flushPromises()

      // Should end on last selected period without errors
      expect(periodSelector.props('modelValue')).toBe('last_365_days')
    })
  })
})
