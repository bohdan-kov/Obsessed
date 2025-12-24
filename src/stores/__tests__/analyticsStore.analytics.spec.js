import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '../analyticsStore'
import { useWorkoutStore } from '../workoutStore'
import { useAuthStore } from '../authStore'
import { useExerciseStore } from '../exerciseStore'
import { fetchCollection } from '@/firebase/firestore'

// Mock Firebase
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(() => Promise.resolve([])),
  subscribeToCollection: vi.fn(() => vi.fn()),
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
    callback({ uid: 'test-user', email: 'test@test.com' })
    return vi.fn()
  }),
  signOut: vi.fn(),
}))

// Helper to create dates within last 30 days
function daysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

describe('analyticsStore - Analytics Features', () => {
  let analyticsStore
  let workoutStore
  let exerciseStore
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Initialize stores
    authStore = useAuthStore()
    vi.spyOn(authStore, 'uid', 'get').mockReturnValue('test-user')
    vi.spyOn(authStore, 'isAuthenticated', 'get').mockReturnValue(true)

    workoutStore = useWorkoutStore()
    exerciseStore = useExerciseStore()
    analyticsStore = useAnalyticsStore()

    // Mock exercise library
    vi.spyOn(exerciseStore, 'exercises', 'get').mockReturnValue([
      { id: 'ex1', name: 'Bench Press', muscleGroup: 'chest' },
      { id: 'ex2', name: 'Squat', muscleGroup: 'legs' },
      { id: 'ex3', name: 'Deadlift', muscleGroup: 'back' },
      { id: 'ex4', name: 'Shoulder Press', muscleGroup: 'shoulders' },
      { id: 'ex5', name: 'Bicep Curl', muscleGroup: 'biceps' },
    ])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('muscleVolumeOverTime', () => {
    it('returns empty array when no workouts', async () => {
      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts()

      expect(analyticsStore.muscleVolumeOverTime).toEqual([])
    })

    it('aggregates volume by muscle group per week', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(7),
          createdAt: daysAgo(7),
          completedAt: daysAgo(7),
          exercises: [
            {
              exerciseId: 'ex1',
              exerciseName: 'Bench Press',
              sets: [
                { weight: 100, reps: 10 },
                { weight: 100, reps: 8 },
              ],
            },
            {
              exerciseId: 'ex2',
              exerciseName: 'Squat',
              sets: [{ weight: 120, reps: 5 }],
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.muscleVolumeOverTime
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('week')
      expect(result[0]).toHaveProperty('weekStart')
      expect(result[0].chest).toBe(1800) // 100*10 + 100*8
      expect(result[0].legs).toBe(600) // 120*5
    })
  })

  describe('muscleBalance', () => {
    it('returns balance scorecard comparing current vs expected', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(5),
          createdAt: daysAgo(5),
          completedAt: daysAgo(5),
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 100, reps: 10 }], // 1000 chest
            },
            {
              exerciseId: 'ex2',
              sets: [{ weight: 100, reps: 10 }], // 1000 legs
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.muscleBalance
      expect(Array.isArray(result)).toBe(true)

      const chestBalance = result.find((b) => b.muscle === 'chest')
      expect(chestBalance).toBeDefined()
      expect(chestBalance).toHaveProperty('current')
      expect(chestBalance).toHaveProperty('expected')
      expect(chestBalance).toHaveProperty('difference')
      expect(chestBalance).toHaveProperty('status')
      expect(['balanced', 'under_trained', 'over_trained']).toContain(chestBalance.status)
    })
  })

  describe('durationTrendData', () => {
    it('returns empty array when no workouts', async () => {
      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts()

      expect(analyticsStore.durationTrendData).toEqual([])
    })

    it('returns workout duration data sorted by date', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(5),
          createdAt: daysAgo(5),
          completedAt: daysAgo(5),
          duration: 60,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        },
        {
          id: 'w2',
          status: 'completed',
          startedAt: daysAgo(10),
          createdAt: daysAgo(10),
          completedAt: daysAgo(10),
          duration: 45,
          exercises: [
            {
              exerciseId: 'ex2',
              sets: [{ weight: 120, reps: 5 }],
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.durationTrendData
      expect(result.length).toBe(2)
      expect(result[0].duration).toBe(45) // Older first
      expect(result[1].duration).toBe(60)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('volume')
      expect(result[0]).toHaveProperty('exerciseCount')
    })
  })

  describe('durationStats', () => {
    it('returns null when no workouts', async () => {
      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts()

      expect(analyticsStore.durationStats).toBeNull()
    })

    it('calculates duration statistics', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(5),
          createdAt: daysAgo(5),
          completedAt: daysAgo(5),
          duration: 60,
          exercises: [],
        },
        {
          id: 'w2',
          status: 'completed',
          startedAt: daysAgo(10),
          createdAt: daysAgo(10),
          completedAt: daysAgo(10),
          duration: 45,
          exercises: [],
        },
        {
          id: 'w3',
          status: 'completed',
          startedAt: daysAgo(15),
          createdAt: daysAgo(15),
          completedAt: daysAgo(15),
          duration: 75,
          exercises: [],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.durationStats
      expect(result).not.toBeNull()
      expect(result.average).toBeCloseTo(60, 0)
      expect(result.shortest.value).toBe(45)
      expect(result.longest.value).toBe(75)
      expect(result.trend).toHaveProperty('direction')
      expect(['increasing', 'decreasing', 'stable']).toContain(result.trend.direction)
    })
  })

  describe('dailyVolumeMap', () => {
    it('returns empty object when no workouts', async () => {
      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts()

      expect(analyticsStore.dailyVolumeMap).toEqual({})
    })

    it('aggregates volume by date', async () => {
      const testDate = daysAgo(5)
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: testDate,
          createdAt: testDate,
          completedAt: testDate,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        },
        {
          id: 'w2',
          status: 'completed',
          startedAt: testDate,
          createdAt: testDate, // Same day
          completedAt: testDate,
          exercises: [
            {
              exerciseId: 'ex2',
              sets: [{ weight: 50, reps: 10 }],
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.dailyVolumeMap
      const dateKey = Object.keys(result)[0]
      expect(result[dateKey]).toBe(1500) // 1000 + 500
    })
  })

  describe('weeklyVolumeProgression', () => {
    it('returns empty array when no workouts', async () => {
      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts()

      expect(analyticsStore.weeklyVolumeProgression).toEqual([])
    })

    it('calculates weekly volume with change percentage', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(14),
          createdAt: daysAgo(14),
          completedAt: daysAgo(14),
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        },
        {
          id: 'w2',
          status: 'completed',
          startedAt: daysAgo(7),
          createdAt: daysAgo(7),
          completedAt: daysAgo(7),
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 110, reps: 10 }],
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.weeklyVolumeProgression
      expect(result.length).toBe(2)
      expect(result[0].volume).toBe(1000)
      expect(result[1].volume).toBe(1100)
      expect(result[1].change).toBeCloseTo(10, 0) // 10% increase
      expect(['progressing', 'maintaining', 'regressing']).toContain(result[1].status)
    })
  })

  describe('progressiveOverloadStats', () => {
    it('returns null when less than 2 weeks', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(5),
          createdAt: daysAgo(5),
          completedAt: daysAgo(5),
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      expect(analyticsStore.progressiveOverloadStats).toBeNull()
    })

    it('calculates progressive overload statistics', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(21),
          createdAt: daysAgo(21),
          completedAt: daysAgo(21),
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        },
        {
          id: 'w2',
          status: 'completed',
          startedAt: daysAgo(14),
          createdAt: daysAgo(14),
          completedAt: daysAgo(14),
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 105, reps: 10 }],
            },
          ],
        },
        {
          id: 'w3',
          status: 'completed',
          startedAt: daysAgo(7),
          createdAt: daysAgo(7),
          completedAt: daysAgo(7),
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [{ weight: 110, reps: 10 }],
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.progressiveOverloadStats
      expect(result).not.toBeNull()
      expect(result).toHaveProperty('weeksProgressing')
      expect(result).toHaveProperty('totalWeeks')
      expect(result).toHaveProperty('progressRate')
      expect(result).toHaveProperty('avgIncrease')
      expect(result).toHaveProperty('overallStatus')
      expect(result).toHaveProperty('nextWeekTarget')
      expect(['on_track', 'maintaining', 'regressing']).toContain(result.overallStatus)
    })
  })

  describe('exerciseProgressTable', () => {
    it('returns empty array when no workouts', async () => {
      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts()

      expect(analyticsStore.exerciseProgressTable).toEqual([])
    })

    it('aggregates exercise data with trend and PR', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(14),
          createdAt: daysAgo(14),
          completedAt: daysAgo(14),
          exercises: [
            {
              exerciseId: 'ex1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        },
        {
          id: 'w2',
          status: 'completed',
          startedAt: daysAgo(7),
          createdAt: daysAgo(7),
          completedAt: daysAgo(7),
          exercises: [
            {
              exerciseId: 'ex1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 105, reps: 10 }],
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.exerciseProgressTable
      expect(result.length).toBeGreaterThan(0)

      const benchPress = result[0]
      expect(benchPress.name).toBe('Bench Press')
      expect(benchPress.estimated1RM).toBeGreaterThan(0)
      expect(benchPress).toHaveProperty('bestPR')
      expect(benchPress).toHaveProperty('lastPerformed')
      expect(benchPress).toHaveProperty('trend')
      expect(benchPress).toHaveProperty('trendPercentage')
      expect(benchPress).toHaveProperty('status')
      expect(benchPress.history.length).toBeGreaterThan(0)
    })
  })

  describe('allPRs', () => {
    it('returns empty array when no workouts', async () => {
      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts()

      expect(analyticsStore.allPRs).toEqual([])
    })

    it('tracks weight PRs chronologically', async () => {
      const mockWorkouts = [
        {
          id: 'w1',
          status: 'completed',
          startedAt: daysAgo(14),
          createdAt: daysAgo(14),
          completedAt: daysAgo(14),
          exercises: [
            {
              exerciseName: 'Bench Press',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        },
        {
          id: 'w2',
          status: 'completed',
          startedAt: daysAgo(7),
          createdAt: daysAgo(7),
          completedAt: daysAgo(7),
          exercises: [
            {
              exerciseName: 'Bench Press',
              sets: [{ weight: 110, reps: 10 }],
            },
          ],
        },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts()

      const result = analyticsStore.allPRs
      const weightPRs = result.filter((pr) => pr.type === 'weight')
      expect(weightPRs.length).toBeGreaterThan(0)
      expect(weightPRs[0].exercise).toBe('Bench Press')
      expect(weightPRs[0]).toHaveProperty('previous')
      expect(weightPRs[0]).toHaveProperty('new')
      expect(weightPRs[0]).toHaveProperty('increase')
    })
  })
})
