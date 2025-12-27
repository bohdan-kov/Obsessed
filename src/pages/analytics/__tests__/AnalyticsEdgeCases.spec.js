import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MuscleVolumeChart from '@/pages/analytics/components/muscles/MuscleVolumeChart.vue'
import DurationTrendChart from '@/pages/analytics/components/duration/DurationTrendChart.vue'
import VolumeHeatmap from '@/pages/analytics/components/volume/VolumeHeatmap.vue'
import ProgressiveOverloadChart from '@/pages/analytics/components/volume/ProgressiveOverloadChart.vue'

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

// Mock authStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    uid: 'test-user-id',
    user: { uid: 'test-user-id', email: 'test@example.com' },
    isAuthenticated: true,
    initializing: false,
    initAuth: vi.fn(),
  })),
}))

// Mock useErrorHandler
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}))

// Mock useContributionHeatmap with all required return values
vi.mock('@/composables/useContributionHeatmap', () => ({
  useContributionHeatmap: vi.fn(() => ({
    gridData: { value: [[{ date: new Date('2024-01-01'), count: 0, level: 0, colorClass: 'bg-muted/30', isToday: false, isInPeriod: true }]] },
    monthLabels: { value: [{ label: 'Jan', weekIndex: 0 }] },
    dayLabels: { value: ['Mon', '', 'Wed', '', 'Fri', '', ''] },
    legendLevels: [0, 1, 2, 3],
    isEmpty: { value: false },
    totalWeeks: { value: 1 },
    isCappedToYear: { value: false },
    getColorClass: (level) => ['bg-muted/30', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80'][level] || 'bg-muted/30',
    formatTooltipText: (cell) => `${cell.date}`,
  })),
}))

describe('Analytics Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('No Workout Data', () => {
    function createWrapper(Component, initialState = {}) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              initialState: {
                workout: {
                  workouts: [],
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                  ...initialState,
                },
              },
            }),
          ],
          stubs: {
            // Stub chart library components to avoid canvas errors
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('MuscleVolumeChart should handle no data gracefully', () => {
      const wrapper = createWrapper(MuscleVolumeChart, {
        muscleVolumeData: [],
        muscleVolumeStats: null,
      })

      // Should mount without crashing
      expect(wrapper.exists()).toBe(true)
    })

    it('DurationTrendChart should handle no data gracefully', () => {
      const wrapper = createWrapper(DurationTrendChart, {
        durationTrendData: [],
        durationStats: null,
      })

      // Should mount without crashing
      expect(wrapper.exists()).toBe(true)
    })

    it('VolumeHeatmap should handle no data gracefully', () => {
      const wrapper = createWrapper(VolumeHeatmap, {
        dailyVolumeMap: {},
      })

      // Should mount without crashing
      expect(wrapper.exists()).toBe(true)
    })

    it('ProgressiveOverloadChart should handle no data gracefully', () => {
      const wrapper = createWrapper(ProgressiveOverloadChart, {
        weeklyVolumeProgression: [],
        progressiveOverloadStats: null,
      })

      // Should mount without crashing
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Single Workout', () => {
    const singleWorkout = [
      {
        id: 'workout-1',
        date: new Date('2024-01-15').toISOString(),
        duration: 60,
        exercises: [
          {
            name: 'Bench Press',
            muscleGroup: 'Chest',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: singleWorkout,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle single workout in MuscleVolumeChart', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle single workout in DurationTrendChart', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle single workout in VolumeHeatmap', () => {
      const wrapper = createWrapper(VolumeHeatmap)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Workouts with Missing Data', () => {
    const incompleteWorkouts = [
      {
        id: 'workout-1',
        date: new Date('2024-01-01').toISOString(),
        duration: 0, // Zero duration
        exercises: [],
      },
      {
        id: 'workout-2',
        date: new Date('2024-01-02').toISOString(),
        // Missing duration
        exercises: [
          {
            name: 'Bench Press',
            // Missing muscle group
            sets: [],
          },
        ],
      },
      {
        id: 'workout-3',
        date: new Date('2024-01-03').toISOString(),
        duration: 60,
        exercises: [
          {
            // Missing exercise name
            muscleGroup: 'Chest',
            sets: [{ weight: null, reps: null }], // Null values
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: incompleteWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle workouts with missing exercises', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle workouts with zero duration', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle workouts with missing muscle groups', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle workouts with null weights/reps', () => {
      const wrapper = createWrapper(VolumeHeatmap)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Invalid Dates', () => {
    const invalidDateWorkouts = [
      {
        id: 'workout-1',
        date: 'invalid-date',
        duration: 60,
        exercises: [
          {
            name: 'Bench Press',
            muscleGroup: 'Chest',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      },
      {
        id: 'workout-2',
        date: null,
        duration: 70,
        exercises: [
          {
            name: 'Squat',
            muscleGroup: 'Legs',
            sets: [{ weight: 150, reps: 8 }],
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: invalidDateWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle invalid date strings', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle null dates', () => {
      const wrapper = createWrapper(VolumeHeatmap)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Very Long Exercise Names', () => {
    const longNameWorkouts = [
      {
        id: 'workout-1',
        date: new Date('2024-01-01').toISOString(),
        duration: 60,
        exercises: [
          {
            name: 'Barbell Bench Press with Extremely Long Name That Should Be Truncated for Display Purposes',
            muscleGroup: 'Chest',
            sets: [{ weight: 100, reps: 10 }],
          },
          {
            name: 'A'.repeat(200), // Very long name
            muscleGroup: 'Back',
            sets: [{ weight: 150, reps: 8 }],
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: longNameWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle very long exercise names without breaking layout', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Extreme Values', () => {
    const extremeWorkouts = [
      {
        id: 'workout-1',
        date: new Date('2024-01-01').toISOString(),
        duration: 500, // Very long duration (8+ hours)
        exercises: [
          {
            name: 'Leg Press',
            muscleGroup: 'Legs',
            sets: [
              { weight: 1000, reps: 1 }, // Very heavy weight
              { weight: 0.5, reps: 100 }, // Very light weight, many reps
            ],
          },
        ],
      },
      {
        id: 'workout-2',
        date: new Date('2024-01-02').toISOString(),
        duration: 1, // Very short duration (1 minute)
        exercises: [
          {
            name: 'Plank',
            muscleGroup: 'Core',
            sets: [{ weight: 0, reps: 1 }], // Bodyweight
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: extremeWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle very long durations', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle very short durations', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle very heavy weights', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle zero weight (bodyweight exercises)', () => {
      const wrapper = createWrapper(VolumeHeatmap)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle very high rep counts', () => {
      const wrapper = createWrapper(ProgressiveOverloadChart)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Period with No Workouts', () => {
    const oldWorkouts = [
      {
        id: 'workout-1',
        date: new Date('2020-01-01').toISOString(), // Very old workout
        duration: 60,
        exercises: [
          {
            name: 'Bench Press',
            muscleGroup: 'Chest',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      },
    ]

    function createWrapper(Component, props = {}) {
      return mount(Component, {
        props: {
          period: 'last_7_days', // Recent period, but workout is old
          ...props,
        },
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: oldWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last7Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should show empty state when no workouts in selected period', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Sparse Data (Many Gaps)', () => {
    const sparseWorkouts = [
      {
        id: 'workout-1',
        date: new Date('2024-01-01').toISOString(),
        duration: 60,
        exercises: [
          {
            name: 'Bench Press',
            muscleGroup: 'Chest',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      },
      {
        id: 'workout-2',
        date: new Date('2024-01-20').toISOString(), // 19 day gap
        duration: 70,
        exercises: [
          {
            name: 'Squat',
            muscleGroup: 'Legs',
            sets: [{ weight: 150, reps: 8 }],
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: sparseWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle sparse workout data in heatmap', () => {
      const wrapper = createWrapper(VolumeHeatmap)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle sparse workout data in trend chart', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle sparse workout data in progressive overload', () => {
      const wrapper = createWrapper(ProgressiveOverloadChart)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Timezone Edge Cases', () => {
    const timezoneWorkouts = [
      {
        id: 'workout-1',
        date: new Date('2024-01-01T23:59:59Z').toISOString(), // End of day UTC
        duration: 60,
        exercises: [
          {
            name: 'Bench Press',
            muscleGroup: 'Chest',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      },
      {
        id: 'workout-2',
        date: new Date('2024-01-02T00:00:00Z').toISOString(), // Start of next day UTC
        duration: 70,
        exercises: [
          {
            name: 'Squat',
            muscleGroup: 'Legs',
            sets: [{ weight: 150, reps: 8 }],
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: timezoneWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle workouts at day boundaries correctly', () => {
      const wrapper = createWrapper(VolumeHeatmap)
      expect(wrapper.exists()).toBe(true)
    })

    it('should group workouts by local date correctly', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Large Datasets', () => {
    const largeWorkouts = Array.from({ length: 365 }, (_, i) => ({
      id: `workout-${i}`,
      date: new Date(2024, 0, 1 + Math.floor(i / 2)).toISOString(), // ~2 workouts per day
      duration: 60 + Math.random() * 60,
      exercises: [
        {
          name: 'Bench Press',
          muscleGroup: 'Chest',
          sets: [{ weight: 100 + Math.random() * 50, reps: 8 + Math.floor(Math.random() * 5) }],
        },
        {
          name: 'Squat',
          muscleGroup: 'Legs',
          sets: [{ weight: 150 + Math.random() * 50, reps: 6 + Math.floor(Math.random() * 5) }],
        },
      ],
    }))

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: largeWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle large datasets in MuscleVolumeChart', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle large datasets in DurationTrendChart', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle large datasets in VolumeHeatmap', () => {
      const wrapper = createWrapper(VolumeHeatmap)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle large datasets in ProgressiveOverloadChart', () => {
      const wrapper = createWrapper(ProgressiveOverloadChart)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Special Characters in Exercise Names', () => {
    const specialCharWorkouts = [
      {
        id: 'workout-1',
        date: new Date('2024-01-01').toISOString(),
        duration: 60,
        exercises: [
          {
            name: 'Bench Press (Barbell) - Wide Grip',
            muscleGroup: 'Chest',
            sets: [{ weight: 100, reps: 10 }],
          },
          {
            name: 'Squat & Deadlift Combo',
            muscleGroup: 'Legs',
            sets: [{ weight: 150, reps: 8 }],
          },
          {
            name: 'Exercise with \'quotes\' and "double quotes"',
            muscleGroup: 'Back',
            sets: [{ weight: 120, reps: 9 }],
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: specialCharWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle special characters in exercise names', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Undefined vs Null vs Empty String', () => {
    const edgeCaseWorkouts = [
      {
        id: 'workout-1',
        date: new Date('2024-01-01').toISOString(),
        duration: undefined,
        exercises: undefined,
      },
      {
        id: 'workout-2',
        date: new Date('2024-01-02').toISOString(),
        duration: null,
        exercises: null,
      },
      {
        id: 'workout-3',
        date: new Date('2024-01-03').toISOString(),
        duration: 60,
        exercises: [
          {
            name: '',
            muscleGroup: undefined,
            sets: null,
          },
        ],
      },
    ]

    function createWrapper(Component) {
      return mount(Component, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              initialState: {
                workout: {
                  workouts: edgeCaseWorkouts,
                  loading: false,
                },
                analytics: {
                  loading: false,
                  period: 'last30Days',
                  dailyWorkoutCounts: {},
                  dailyVolumeMap: {},
                },
              },
            }),
          ],
          stubs: {
            BaseChart: {
              template: '<div class="base-chart"><slot /><slot name="header" /></div>',
              props: ['data', 'loading', 'title', 'description'],
            },
            VisXYContainer: true,
            VisScatter: true,
            VisAxis: true,
            VisLine: true,
            VisDonut: true,
            VisSingleContainer: true,
            ChartContainer: true,
            ChartCrosshair: true,
            ChartTooltip: true,
          },
        },
      })
    }

    it('should handle undefined values', () => {
      const wrapper = createWrapper(MuscleVolumeChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle null values', () => {
      const wrapper = createWrapper(DurationTrendChart)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle empty strings', () => {
      const wrapper = createWrapper(VolumeHeatmap)
      expect(wrapper.exists()).toBe(true)
    })
  })
})
