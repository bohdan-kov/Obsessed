import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useContributionHeatmap } from '@/composables/useContributionHeatmap'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAuthStore } from '@/stores/authStore'
import { useExerciseStore } from '@/stores/exerciseStore'

// Mock Firebase modules
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  subscribeToCollection: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  fetchDocument: vi.fn(),
  setDocument: vi.fn(),
  subscribeToDocument: vi.fn(),
  COLLECTIONS: {
    USERS: 'users',
    WORKOUTS: 'workouts',
  },
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(() => vi.fn()),
  signOut: vi.fn(),
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}))

describe('useContributionHeatmap', () => {
  let analyticsStore
  let workoutStore
  let authStore
  let exerciseStore

  beforeEach(() => {
    setActivePinia(createPinia())

    authStore = useAuthStore()
    workoutStore = useWorkoutStore()
    exerciseStore = useExerciseStore()
    analyticsStore = useAnalyticsStore()

    // Set authenticated user
    authStore.$patch({
      user: { uid: 'test-user-123', email: 'test@test.com', emailVerified: true },
      initializing: false,
      loading: false,
    })

    // Initialize exercise store (needed by analyticsStore)
    exerciseStore.fetchExercises()
  })

  describe('Grid structure generation', () => {
    it('should generate 365-day grid structure', () => {
      // Set up analytics store with a period
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last365Days')

      const heatmap = useContributionHeatmap()

      // Grid should contain 52-53 weeks (365 days / 7)
      expect(heatmap.totalWeeks.value).toBeGreaterThanOrEqual(52)
      expect(heatmap.totalWeeks.value).toBeLessThanOrEqual(54)

      // Each week should have 7 days
      heatmap.gridData.value.forEach((week) => {
        expect(week).toHaveLength(7)
      })
    })

    it('should start grid on Monday and end on Sunday', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last365Days')

      const heatmap = useContributionHeatmap()
      const gridData = heatmap.gridData.value

      // First day of first week should be Monday (getDay() === 1)
      expect(gridData[0][0].date.getDay()).toBe(1)

      // Last day of last week should be Sunday (getDay() === 0)
      const lastWeek = gridData[gridData.length - 1]
      expect(lastWeek[lastWeek.length - 1].date.getDay()).toBe(0)
    })

    it('should generate consecutive dates', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last365Days')

      const heatmap = useContributionHeatmap()
      const gridData = heatmap.gridData.value

      // Flatten all cells
      const allCells = gridData.flat()

      // Check that each date is exactly 1 day after the previous
      for (let i = 1; i < allCells.length; i++) {
        const prevDate = allCells[i - 1].date
        const currDate = allCells[i].date
        const diffInMs = currDate - prevDate
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

        expect(diffInDays).toBe(1)
      }
    })
  })

  describe('Intensity level calculation', () => {
    it('should assign level 0 for zero workouts', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const gridData = heatmap.gridData.value

      // All cells should have level 0
      gridData.flat().forEach((cell) => {
        expect(cell.level).toBe(0)
        expect(cell.count).toBe(0)
      })
    })

    it('should assign level 1 for 1 workout', () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [{ weight: 100, reps: 10 }],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const todayCell = heatmap.gridData.value
        .flat()
        .find((cell) => cell.isToday)

      expect(todayCell.count).toBe(1)
      expect(todayCell.level).toBe(1)
    })

    it('should assign level 2 for 2 workouts', () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: new Date(today.getTime()),
            completedAt: new Date(today.getTime()),
            exercises: [{ exerciseId: 'bench-press', sets: [{ weight: 100, reps: 10 }] }],
          },
          {
            id: 'w2',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: new Date(today.getTime() + 1000 * 60 * 60), // 1 hour later
            completedAt: new Date(today.getTime() + 1000 * 60 * 60),
            exercises: [{ exerciseId: 'squat', sets: [{ weight: 150, reps: 8 }] }],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const todayCell = heatmap.gridData.value
        .flat()
        .find((cell) => cell.isToday)

      expect(todayCell.count).toBe(2)
      expect(todayCell.level).toBe(2)
    })

    it('should assign level 3 for 3+ workouts', () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      const workouts = []
      for (let i = 0; i < 5; i++) {
        workouts.push({
          id: `w${i}`,
          userId: 'test-user-123',
          status: 'completed',
          startedAt: new Date(today.getTime() + i * 1000 * 60 * 60),
          completedAt: new Date(today.getTime() + i * 1000 * 60 * 60),
          exercises: [{ exerciseId: 'bench-press', sets: [{ weight: 100, reps: 10 }] }],
        })
      }

      workoutStore.$patch({ workouts })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const todayCell = heatmap.gridData.value
        .flat()
        .find((cell) => cell.isToday)

      expect(todayCell.count).toBe(5)
      expect(todayCell.level).toBe(3)
    })
  })

  describe('Period boundaries', () => {
    it('should mark cells within selected period as isInPeriod', () => {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      // Create workouts in last 30 days
      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: new Date(thirtyDaysAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
            completedAt: new Date(thirtyDaysAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
            exercises: [{ exerciseId: 'bench-press', sets: [{ weight: 100, reps: 10 }] }],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()

      // Count cells in period
      const cellsInPeriod = heatmap.gridData.value
        .flat()
        .filter((cell) => cell.isInPeriod)

      // Should have approximately 30 days marked as isInPeriod
      expect(cellsInPeriod.length).toBeGreaterThanOrEqual(28)
      expect(cellsInPeriod.length).toBeLessThanOrEqual(32)
    })

    it('should mark today cell as isToday', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const todayCells = heatmap.gridData.value
        .flat()
        .filter((cell) => cell.isToday)

      // Should have exactly one cell marked as today
      expect(todayCells).toHaveLength(1)
    })
  })

  describe('Month boundaries', () => {
    it('should generate month labels for 365-day grid', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last365Days')

      const heatmap = useContributionHeatmap()

      // Should have approximately 12 month labels (could be 11-13 depending on alignment)
      expect(heatmap.monthLabels.value.length).toBeGreaterThanOrEqual(11)
      expect(heatmap.monthLabels.value.length).toBeLessThanOrEqual(13)
    })

    it('should have monotonically increasing week indices', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last365Days')

      const heatmap = useContributionHeatmap()
      const weekIndices = heatmap.monthLabels.value.map((label) => label.weekIndex)

      // Each week index should be greater than the previous
      for (let i = 1; i < weekIndices.length; i++) {
        expect(weekIndices[i]).toBeGreaterThan(weekIndices[i - 1])
      }
    })

    it('should format month labels according to locale', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last365Days')

      const heatmap = useContributionHeatmap()

      // All month labels should be non-empty strings
      heatmap.monthLabels.value.forEach((monthLabel) => {
        expect(monthLabel.label).toBeTruthy()
        expect(typeof monthLabel.label).toBe('string')
        expect(monthLabel.weekIndex).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Day labels', () => {
    it('should show Mon, Wed, Fri and blank for other days', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()

      expect(heatmap.dayLabels.value).toHaveLength(7)

      // Should have translation keys for Mon, Wed, Fri
      expect(heatmap.dayLabels.value[0]).toContain('mon')
      expect(heatmap.dayLabels.value[1]).toBe('')
      expect(heatmap.dayLabels.value[2]).toContain('wed')
      expect(heatmap.dayLabels.value[3]).toBe('')
      expect(heatmap.dayLabels.value[4]).toContain('fri')
      expect(heatmap.dayLabels.value[5]).toBe('')
      expect(heatmap.dayLabels.value[6]).toBe('')
    })
  })

  describe('isEmpty', () => {
    it('should return true when no workouts exist', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()

      expect(heatmap.isEmpty.value).toBe(true)
    })

    it('should return false when workouts exist', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [{ exerciseId: 'bench-press', sets: [{ weight: 100, reps: 10 }] }],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()

      expect(heatmap.isEmpty.value).toBe(false)
    })
  })

  describe('Color classes', () => {
    it('should assign correct color class for each intensity level', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()

      // Test each level
      expect(heatmap.getColorClass(0)).toBeDefined()
      expect(heatmap.getColorClass(1)).toBeDefined()
      expect(heatmap.getColorClass(2)).toBeDefined()
      expect(heatmap.getColorClass(3)).toBeDefined()
    })

    it('should include color class in cell data', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()

      heatmap.gridData.value.flat().forEach((cell) => {
        expect(cell.colorClass).toBeDefined()
        expect(typeof cell.colorClass).toBe('string')
      })
    })
  })

  describe('Tooltip formatting', () => {
    it('should format tooltip for cell with no workout', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const cell = heatmap.gridData.value[0][0]

      const tooltip = heatmap.formatTooltipText(cell)

      expect(tooltip).toBeTruthy()
      expect(tooltip).toContain('noWorkout')
    })

    it('should format tooltip for cell with workouts', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [{ exerciseId: 'bench-press', sets: [{ weight: 100, reps: 10 }] }],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const todayCell = heatmap.gridData.value.flat().find((cell) => cell.isToday)

      const tooltip = heatmap.formatTooltipText(todayCell)

      expect(tooltip).toBeTruthy()
      expect(tooltip).toContain('workouts')
    })
  })

  describe('Period handling', () => {
    it('should cap allTime period to 365 days', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('allTime')

      const heatmap = useContributionHeatmap()

      expect(heatmap.isCappedToYear.value).toBe(true)

      // Grid should still be 365 days
      expect(heatmap.totalWeeks.value).toBeGreaterThanOrEqual(52)
      expect(heatmap.totalWeeks.value).toBeLessThanOrEqual(54)
    })

    it('should not cap last30Days period', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()

      expect(heatmap.isCappedToYear.value).toBe(false)
    })

    it('should always show 365-day grid structure regardless of period', () => {
      workoutStore.$patch({ workouts: [] })

      // Test multiple periods
      const periods = ['last7Days', 'last30Days', 'thisMonth', 'last365Days', 'allTime']

      periods.forEach((period) => {
        analyticsStore.setPeriod(period)

        const heatmap = useContributionHeatmap()

        // Grid should always be 365 days (52-54 weeks)
        expect(heatmap.totalWeeks.value).toBeGreaterThanOrEqual(52)
        expect(heatmap.totalWeeks.value).toBeLessThanOrEqual(54)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle workouts on year boundaries', () => {
      const newYearsDay = new Date('2025-01-01T12:00:00')
      const newYearsEve = new Date('2024-12-31T23:00:00')

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: newYearsEve,
            completedAt: newYearsEve,
            exercises: [{ exerciseId: 'bench-press', sets: [{ weight: 100, reps: 10 }] }],
          },
          {
            id: 'w2',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: newYearsDay,
            completedAt: newYearsDay,
            exercises: [{ exerciseId: 'squat', sets: [{ weight: 150, reps: 8 }] }],
          },
        ],
      })

      analyticsStore.setPeriod('last365Days')

      const heatmap = useContributionHeatmap()

      // Should not throw and should have valid grid data
      expect(heatmap.gridData.value).toBeDefined()
      expect(heatmap.gridData.value.length).toBeGreaterThan(0)
    })

    it('should handle multiple workouts on the same day', () => {
      const today = new Date()

      const workouts = []
      for (let i = 0; i < 10; i++) {
        workouts.push({
          id: `w${i}`,
          userId: 'test-user-123',
          status: 'completed',
          startedAt: new Date(today.getTime() + i * 1000 * 60 * 60),
          completedAt: new Date(today.getTime() + i * 1000 * 60 * 60),
          exercises: [{ exerciseId: 'bench-press', sets: [{ weight: 100, reps: 10 }] }],
        })
      }

      workoutStore.$patch({ workouts })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const todayCell = heatmap.gridData.value.flat().find((cell) => cell.isToday)

      expect(todayCell.count).toBe(10)
      expect(todayCell.level).toBe(3) // Level 3 for 3+ workouts
    })

    it('should handle incomplete workouts (not marked as completed)', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'active', // Not completed
            startedAt: today,
            exercises: [{ exerciseId: 'bench-press', sets: [{ weight: 100, reps: 10 }] }],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()
      const todayCell = heatmap.gridData.value.flat().find((cell) => cell.isToday)

      // Active workouts should not be counted
      expect(todayCell.count).toBe(0)
    })
  })

  describe('Legend levels', () => {
    it('should provide legend levels array', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const heatmap = useContributionHeatmap()

      expect(heatmap.legendLevels).toEqual([0, 1, 2, 3])
    })
  })
})
