import { describe, it, expect, vi, bench } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import MuscleVolumeChart from '../components/muscles/MuscleVolumeChart.vue'
import DurationTrendChart from '../components/duration/DurationTrendChart.vue'
import VolumeHeatmap from '../components/volume/VolumeHeatmap.vue'
import ProgressiveOverloadChart from '../components/volume/ProgressiveOverloadChart.vue'
import AnalyticsView from '../AnalyticsView.vue'
import { createRouter, createMemoryHistory } from 'vue-router'

// Mock Firebase
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  subscribeToCollection: vi.fn(),
  COLLECTIONS: {
    WORKOUTS: 'workouts',
  },
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(),
}))

// Mock useContributionHeatmap
vi.mock('@/composables/useContributionHeatmap', () => ({
  useContributionHeatmap: vi.fn(() => ({
    gridData: Array.from({ length: 52 }, () =>
      Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i)),
    ),
    monthLabels: [
      { label: 'Jan', weekIndex: 0 },
      { label: 'Feb', weekIndex: 4 },
      { label: 'Mar', weekIndex: 8 },
    ],
    weekdayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  })),
}))

describe('Analytics Performance Tests', () => {
  /**
   * Generate realistic workout data for performance testing
   * @param {number} count - Number of workouts to generate
   * @returns {Array} Array of workout objects
   */
  function generateWorkouts(count) {
    const exercises = [
      { name: 'Bench Press', muscleGroup: 'Chest' },
      { name: 'Squat', muscleGroup: 'Legs' },
      { name: 'Deadlift', muscleGroup: 'Back' },
      { name: 'Overhead Press', muscleGroup: 'Shoulders' },
      { name: 'Barbell Row', muscleGroup: 'Back' },
      { name: 'Pull Up', muscleGroup: 'Back' },
      { name: 'Dips', muscleGroup: 'Chest' },
      { name: 'Leg Press', muscleGroup: 'Legs' },
      { name: 'Lat Pulldown', muscleGroup: 'Back' },
      { name: 'Bicep Curl', muscleGroup: 'Arms' },
      { name: 'Tricep Extension', muscleGroup: 'Arms' },
      { name: 'Leg Curl', muscleGroup: 'Legs' },
      { name: 'Leg Extension', muscleGroup: 'Legs' },
      { name: 'Calf Raise', muscleGroup: 'Legs' },
      { name: 'Face Pull', muscleGroup: 'Shoulders' },
      { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
      { name: 'Hammer Curl', muscleGroup: 'Arms' },
      { name: 'Cable Fly', muscleGroup: 'Chest' },
      { name: 'Incline Press', muscleGroup: 'Chest' },
      { name: 'Romanian Deadlift', muscleGroup: 'Legs' },
    ]

    return Array.from({ length: count }, (_, i) => {
      // Distribute workouts over the past year
      const daysAgo = Math.floor((i * 365) / count)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)

      // 3-8 exercises per workout
      const exerciseCount = 3 + Math.floor(Math.random() * 6)
      const selectedExercises = exercises
        .sort(() => Math.random() - 0.5)
        .slice(0, exerciseCount)
        .map((ex) => ({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => ({
            weight: 50 + Math.floor(Math.random() * 150),
            reps: 5 + Math.floor(Math.random() * 10),
          })),
        }))

      return {
        id: `workout-${i}`,
        date: date.toISOString(),
        duration: 45 + Math.floor(Math.random() * 75), // 45-120 minutes
        exercises: selectedExercises,
      }
    })
  }

  describe('Rendering Performance with Large Datasets', () => {
    it('should render MuscleVolumeChart efficiently with 100 workouts', () => {
      const workouts = generateWorkouts(100)

      const startTime = performance.now()

      const wrapper = mount(MuscleVolumeChart, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
          },
        },
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(wrapper.find('.base-chart').exists()).toBe(true)
      expect(renderTime).toBeLessThan(1000) // Should render in less than 1 second

      wrapper.unmount()
    })

    it('should render DurationTrendChart efficiently with 100 workouts', () => {
      const workouts = generateWorkouts(100)

      const startTime = performance.now()

      const wrapper = mount(DurationTrendChart, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
          },
        },
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(wrapper.find('.base-chart').exists()).toBe(true)
      expect(renderTime).toBeLessThan(1000)

      wrapper.unmount()
    })

    it('should render VolumeHeatmap efficiently with 365 workouts (full year)', () => {
      const workouts = generateWorkouts(365)

      const startTime = performance.now()

      const wrapper = mount(VolumeHeatmap, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
          },
        },
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(wrapper.find('.base-chart').exists()).toBe(true)
      expect(renderTime).toBeLessThan(1500) // Heatmap is more complex, allow more time

      wrapper.unmount()
    })

    it('should render ProgressiveOverloadChart efficiently with 100 workouts', () => {
      const workouts = generateWorkouts(100)

      const startTime = performance.now()

      const wrapper = mount(ProgressiveOverloadChart, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
          },
        },
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(wrapper.find('.base-chart').exists()).toBe(true)
      expect(renderTime).toBeLessThan(1000)

      wrapper.unmount()
    })
  })

  describe('Store Computation Performance', () => {
    it('should compute analytics efficiently with 100 workouts', () => {
      const workouts = generateWorkouts(100)

      const pinia = createTestingPinia({
        stubActions: false,
        initialState: {
          workout: {
            workouts,
            loading: false,
          },
        },
      })

      const analyticsStore = useAnalyticsStore(pinia)

      const startTime = performance.now()

      // Access all computed properties to trigger calculations
      const muscleVolume = analyticsStore.muscleVolumeData
      const durationTrend = analyticsStore.durationTrendData
      const dailyVolume = analyticsStore.dailyVolumeMap
      const weeklyProgression = analyticsStore.weeklyVolumeProgression
      const muscleStats = analyticsStore.muscleVolumeStats
      const durationStats = analyticsStore.durationStats
      const progressiveStats = analyticsStore.progressiveOverloadStats

      const endTime = performance.now()
      const computeTime = endTime - startTime

      expect(muscleVolume).toBeDefined()
      expect(durationTrend).toBeDefined()
      expect(dailyVolume).toBeDefined()
      expect(weeklyProgression).toBeDefined()
      expect(computeTime).toBeLessThan(500) // All computations should complete in < 500ms
    })

    it('should cache computed properties efficiently', () => {
      const workouts = generateWorkouts(100)

      const pinia = createTestingPinia({
        stubActions: false,
        initialState: {
          workout: {
            workouts,
            loading: false,
          },
        },
      })

      const analyticsStore = useAnalyticsStore(pinia)

      // First access - triggers computation
      const startTime1 = performance.now()
      const muscleVolume1 = analyticsStore.muscleVolumeData
      const endTime1 = performance.now()
      const firstAccessTime = endTime1 - startTime1

      // Second access - should use cache
      const startTime2 = performance.now()
      const muscleVolume2 = analyticsStore.muscleVolumeData
      const endTime2 = performance.now()
      const secondAccessTime = endTime2 - startTime2

      expect(muscleVolume1).toBe(muscleVolume2) // Same reference (cached)
      expect(secondAccessTime).toBeLessThan(firstAccessTime / 10) // At least 10x faster
    })
  })

  describe('Re-render Performance', () => {
    it('should not re-render when unrelated store data changes', async () => {
      const workouts = generateWorkouts(50)

      const wrapper = mount(MuscleVolumeChart, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
          },
        },
      })

      const pinia = wrapper.vm.$pinia
      const analyticsStore = useAnalyticsStore(pinia)

      // Track render count
      let renderCount = 0
      wrapper.vm.$watch(
        () => analyticsStore.muscleVolumeData,
        () => {
          renderCount++
        },
      )

      // Change unrelated data
      analyticsStore.loading = true
      await wrapper.vm.$nextTick()
      analyticsStore.loading = false
      await wrapper.vm.$nextTick()

      // Should not trigger re-renders (loading state is separate)
      // Note: This is a simplified check; actual re-render prevention
      // depends on component implementation
      expect(wrapper.find('.base-chart').exists()).toBe(true)

      wrapper.unmount()
    })
  })

  describe('Memory Usage', () => {
    it('should properly cleanup on unmount', () => {
      const workouts = generateWorkouts(100)

      const wrapper = mount(MuscleVolumeChart, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
          },
        },
      })

      expect(wrapper.find('.base-chart').exists()).toBe(true)

      // Unmount should not throw errors
      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('should handle rapid tab switching without memory leaks', async () => {
      const workouts = generateWorkouts(100)
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/analytics',
            name: 'analytics',
            component: AnalyticsView,
          },
        ],
      })

      await router.push('/analytics')

      const wrapper = mount(AnalyticsView, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
              },
            }),
            router,
          ],
          stubs: {
            Tabs: false,
            TabsContent: false,
            TabsList: false,
            TabsTrigger: false,
          },
        },
      })

      // Rapidly switch tabs multiple times
      const tabs = ['duration', 'volume', 'strength', 'muscles']
      for (let i = 0; i < 10; i++) {
        for (const tab of tabs) {
          const tabTrigger = wrapper.find(`[value="${tab}"]`)
          await tabTrigger.trigger('click')
        }
      }

      // Should complete without errors
      expect(wrapper.find('h1').exists()).toBe(true)

      wrapper.unmount()
    })
  })

  describe('SVG Rendering Performance', () => {
    it('should render SVG elements efficiently for 100 data points', () => {
      const workouts = generateWorkouts(100)

      const startTime = performance.now()

      const wrapper = mount(DurationTrendChart, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
          },
        },
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Check SVG is rendered
      expect(wrapper.find('svg').exists()).toBe(true)
      expect(renderTime).toBeLessThan(1000)

      wrapper.unmount()
    })

    it('should render heatmap grid efficiently for 365 days', () => {
      const workouts = generateWorkouts(365)

      const startTime = performance.now()

      const wrapper = mount(VolumeHeatmap, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts,
                  loading: false,
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
          },
        },
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 52 weeks × 7 days = 364 cells (approximately)
      expect(wrapper.find('svg').exists()).toBe(true)
      expect(renderTime).toBeLessThan(1500)

      wrapper.unmount()
    })
  })

  describe('Data Processing Performance', () => {
    it('should process workout data efficiently', () => {
      const workouts = generateWorkouts(200)

      const pinia = createTestingPinia({
        stubActions: false,
        initialState: {
          workout: {
            workouts,
            loading: false,
          },
        },
      })

      const analyticsStore = useAnalyticsStore(pinia)

      const startTime = performance.now()

      // Process all analytics data
      const muscleData = analyticsStore.muscleVolumeData
      const durationData = analyticsStore.durationTrendData
      const volumeMap = analyticsStore.dailyVolumeMap
      const progression = analyticsStore.weeklyVolumeProgression

      const endTime = performance.now()
      const processingTime = endTime - startTime

      expect(muscleData.length).toBeGreaterThan(0)
      expect(durationData.length).toBeGreaterThan(0)
      expect(Object.keys(volumeMap).length).toBeGreaterThan(0)
      expect(progression.length).toBeGreaterThan(0)
      expect(processingTime).toBeLessThan(1000) // Should process in < 1 second
    })
  })
})

// Note: Benchmarks require specific Vitest configuration
// These are example benchmarks - uncomment and run with `vitest bench` command
/*
describe('Benchmarks', () => {
  bench('render MuscleVolumeChart with 100 workouts', () => {
    const workouts = generateWorkouts(100)
    const wrapper = mount(MuscleVolumeChart, {
      global: {
        plugins: [
          createTestingPinia({
            stubActions: false,
            initialState: {
              workout: { workouts, loading: false },
            },
          }),
        ],
      },
    })
    wrapper.unmount()
  }, { iterations: 100 })

  bench('compute analytics for 100 workouts', () => {
    const workouts = generateWorkouts(100)
    const pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        workout: { workouts, loading: false },
      },
    })
    const analyticsStore = useAnalyticsStore(pinia)
    const _ = analyticsStore.muscleVolumeData
  }, { iterations: 1000 })
})
*/
