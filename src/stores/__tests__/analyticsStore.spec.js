import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '../analyticsStore'
import { useWorkoutStore } from '../workoutStore'
import { useAuthStore } from '../authStore'
import { fetchCollection } from '@/firebase/firestore'

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
  },
}))

vi.mock('@/firebase/auth', () => ({
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  createAccount: vi.fn(),
  signOut: vi.fn(),
  onAuthChange: vi.fn(),
  resetPassword: vi.fn(),
  sendVerificationEmail: vi.fn(),
}))

// Mock Firebase Timestamp for date handling
const mockTimestamp = (date) => ({
  toDate: () => date,
})

// Helper to create mock workout data
const createMockWorkout = (overrides = {}) => {
  const now = new Date()
  return {
    id: 'workout-' + Math.random().toString(36).substr(2, 9),
    userId: 'test-user',
    status: 'completed',
    startedAt: now,
    completedAt: now,
    exercises: [],
    duration: 3600,
    totalVolume: 0,
    ...overrides,
  }
}

describe('analyticsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Set up authenticated user in authStore
    // We need to mock the authStore.uid getter since workoutStore checks it
    const authStore = useAuthStore()

    // Mock initAuth to simulate authenticated user
    vi.spyOn(authStore, 'uid', 'get').mockReturnValue('test-user-id')
    vi.spyOn(authStore, 'isAuthenticated', 'get').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with period as "2weeks"', () => {
      const store = useAnalyticsStore()
      expect(store.period).toBe('2weeks')
    })
  })

  describe('totalWorkouts', () => {
    it('should return count of completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      // Mock fetchCollection to return workouts
      const mockWorkouts = [
        createMockWorkout({ status: 'completed' }),
        createMockWorkout({ status: 'completed' }),
        createMockWorkout({ status: 'active' }),
        createMockWorkout({ status: 'completed' }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.totalWorkouts).toBe(3)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.totalWorkouts).toBe(0)
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'active' }),
        createMockWorkout({ status: 'cancelled' }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.totalWorkouts).toBe(0)
    })
  })

  describe('volumeLoad', () => {
    it('should calculate total volume from all completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', totalVolume: 1000 }),
        createMockWorkout({ status: 'completed', totalVolume: 2000 }),
        createMockWorkout({ status: 'completed', totalVolume: 1500 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.volumeLoad).toBe(4500)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.volumeLoad).toBe(0)
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', totalVolume: 1000 }),
        createMockWorkout({ status: 'active', totalVolume: 500 }),
        createMockWorkout({ status: 'cancelled', totalVolume: 300 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.volumeLoad).toBe(1000)
    })

    it('should handle workouts with missing totalVolume', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', totalVolume: 1000 }),
        createMockWorkout({ status: 'completed', totalVolume: undefined }),
        createMockWorkout({ status: 'completed', totalVolume: null }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.volumeLoad).toBe(1000)
    })
  })

  describe('avgVolumePerWorkout', () => {
    it('should calculate average volume per workout', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', totalVolume: 1000 }),
        createMockWorkout({ status: 'completed', totalVolume: 2000 }),
        createMockWorkout({ status: 'completed', totalVolume: 3000 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.avgVolumePerWorkout).toBe(2000)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.avgVolumePerWorkout).toBe(0)
    })

    it('should round the average to nearest integer', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', totalVolume: 1000 }),
        createMockWorkout({ status: 'completed', totalVolume: 1500 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.avgVolumePerWorkout).toBe(1250)
    })

    it('should handle division by zero gracefully', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'active', totalVolume: 1000 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.avgVolumePerWorkout).toBe(0)
    })
  })

  describe('totalSets', () => {
    it('should calculate total number of sets from all completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            { sets: [{ weight: 100, reps: 10 }, { weight: 100, reps: 10 }] },
            { sets: [{ weight: 50, reps: 12 }] },
          ],
        }),
        createMockWorkout({
          status: 'completed',
          exercises: [
            { sets: [{ weight: 80, reps: 8 }] },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.totalSets).toBe(4)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.totalSets).toBe(0)
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'active',
          exercises: [
            { sets: [{ weight: 100, reps: 10 }] },
          ],
        }),
        createMockWorkout({
          status: 'completed',
          exercises: [
            { sets: [{ weight: 100, reps: 10 }, { weight: 100, reps: 10 }] },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.totalSets).toBe(2)
    })

    it('should handle workouts with no exercises', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', exercises: [] }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.totalSets).toBe(0)
    })
  })

  describe('restDays', () => {
    it('should calculate rest days in period', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', completedAt: today }),
        createMockWorkout({ status: 'completed', completedAt: yesterday }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      // Period is '2weeks' by default (14 days)
      // 14 days total - 2 unique workout days = 12 rest days
      expect(analyticsStore.restDays).toBe(12)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.restDays).toBe(0)
    })

    it('should count unique workout days correctly', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()

      // Multiple workouts on the same day should count as 1 workout day
      const mockWorkouts = [
        createMockWorkout({ status: 'completed', completedAt: today }),
        createMockWorkout({ status: 'completed', completedAt: today }),
        createMockWorkout({ status: 'completed', completedAt: today }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      // Set period to 'week' (7 days)
      analyticsStore.setPeriod('week')

      // 7 days total - 1 unique workout day = 6 rest days
      expect(analyticsStore.restDays).toBe(6)
    })

    it('should handle Firebase Timestamp objects', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: mockTimestamp(today),
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week')

      expect(analyticsStore.restDays).toBe(6)
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()

      const mockWorkouts = [
        createMockWorkout({ status: 'active', completedAt: today }),
        createMockWorkout({ status: 'cancelled', completedAt: today }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week')

      expect(analyticsStore.restDays).toBe(0)
    })
  })

  describe('volumeByDay', () => {
    it('should create daily volume data for the period', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: new Date(),
          totalVolume: 1000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week') // 7 days

      const result = analyticsStore.volumeByDay

      expect(result).toHaveLength(7)
      expect(result.every(day => day.hasOwnProperty('date'))).toBe(true)
      expect(result.every(day => day.hasOwnProperty('volume'))).toBe(true)
      expect(result.every(day => day.hasOwnProperty('workouts'))).toBe(true)
    })

    it('should fill in volume data for workout days', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: today,
          totalVolume: 2500,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week')

      const result = analyticsStore.volumeByDay
      const todayData = result.find(d => d.date === todayStr)

      expect(todayData?.volume).toBe(2500)
      expect(todayData?.workouts).toBe(1)
    })

    it('should initialize days with no workouts to 0', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week')

      const result = analyticsStore.volumeByDay

      expect(result.every(day => day.volume === 0)).toBe(true)
      expect(result.every(day => day.workouts === 0)).toBe(true)
    })

    it('should aggregate multiple workouts on the same day', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: today,
          totalVolume: 1000,
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: today,
          totalVolume: 1500,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week')

      const result = analyticsStore.volumeByDay
      const todayData = result.find(d => d.date === todayStr)

      expect(todayData?.volume).toBe(2500)
      expect(todayData?.workouts).toBe(2)
    })

    it('should sort days in chronological order', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week')

      const result = analyticsStore.volumeByDay

      for (let i = 1; i < result.length; i++) {
        const prevDate = new Date(result[i - 1].date)
        const currDate = new Date(result[i].date)
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime())
      }
    })

    it('should handle Firebase Timestamp objects', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: mockTimestamp(today),
          totalVolume: 1000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week')

      const result = analyticsStore.volumeByDay

      expect(result.some(day => day.volume > 0)).toBe(true)
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()

      const mockWorkouts = [
        createMockWorkout({
          status: 'active',
          completedAt: today,
          totalVolume: 1000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      analyticsStore.setPeriod('week')

      const result = analyticsStore.volumeByDay

      expect(result.every(day => day.volume === 0)).toBe(true)
    })
  })

  describe('muscleDistribution', () => {
    it('should calculate muscle distribution from exercises', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }, { weight: 100, reps: 10 }],
            },
            {
              primaryMuscle: 'Back',
              sets: [{ weight: 80, reps: 12 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleDistribution

      expect(result).toHaveLength(2)
      expect(result.find(m => m.muscle === 'Chest')?.sets).toBe(2)
      expect(result.find(m => m.muscle === 'Back')?.sets).toBe(1)
    })

    it('should calculate percentages correctly', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              primaryMuscle: 'Back',
              sets: [{ weight: 80, reps: 12 }],
            },
            {
              primaryMuscle: 'Legs',
              sets: [{ weight: 150, reps: 8 }, { weight: 150, reps: 8 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleDistribution

      // Total: 4 sets, Chest: 1 (25%), Back: 1 (25%), Legs: 2 (50%)
      expect(result.find(m => m.muscle === 'Chest')?.percentage).toBe(25)
      expect(result.find(m => m.muscle === 'Back')?.percentage).toBe(25)
      expect(result.find(m => m.muscle === 'Legs')?.percentage).toBe(50)
    })

    it('should return empty array when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.muscleDistribution).toEqual([])
    })

    it('should aggregate sets from the same muscle group', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 90, reps: 12 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleDistribution

      expect(result).toHaveLength(1)
      expect(result[0].muscle).toBe('Chest')
      expect(result[0].sets).toBe(2)
      expect(result[0].percentage).toBe(100)
    })

    it('should sort by number of sets in descending order', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              primaryMuscle: 'Legs',
              sets: [{ weight: 150, reps: 8 }, { weight: 150, reps: 8 }, { weight: 150, reps: 8 }],
            },
            {
              primaryMuscle: 'Back',
              sets: [{ weight: 80, reps: 12 }, { weight: 80, reps: 12 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleDistribution

      expect(result[0].muscle).toBe('Legs')
      expect(result[1].muscle).toBe('Back')
      expect(result[2].muscle).toBe('Chest')
    })

    it('should handle exercises without primaryMuscle', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleDistribution

      expect(result).toHaveLength(1)
      expect(result[0].muscle).toBe('Unknown')
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'active',
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.muscleDistribution).toEqual([])
    })

    it('should handle zero total sets', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleDistribution

      expect(result).toEqual([])
    })
  })

  describe('weekComparison', () => {
    it('should compare current week with previous week', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const currentWeekDate = new Date(now.getTime() - 2 * 86400000) // 2 days ago
      const prevWeekDate = new Date(now.getTime() - 10 * 86400000) // 10 days ago

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: currentWeekDate,
          totalVolume: 2000,
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: prevWeekDate,
          totalVolume: 1500,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      expect(result.currentWeek.workouts).toBe(1)
      expect(result.currentWeek.volume).toBe(2000)
      expect(result.previousWeek.workouts).toBe(1)
      expect(result.previousWeek.volume).toBe(1500)
    })

    it('should calculate volume change percentage', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const currentWeekDate = new Date(now.getTime() - 2 * 86400000)
      const prevWeekDate = new Date(now.getTime() - 10 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: currentWeekDate,
          totalVolume: 3000,
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: prevWeekDate,
          totalVolume: 2000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      // (3000 - 2000) / 2000 * 100 = 50%
      expect(result.change.volumePercentage).toBe(50)
    })

    it('should handle division by zero when previous week has no volume', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const currentWeekDate = new Date(now.getTime() - 2 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: currentWeekDate,
          totalVolume: 2000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      expect(result.change.volumePercentage).toBe(0)
    })

    it('should calculate average volume per workout for each week', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const currentWeekDate1 = new Date(now.getTime() - 2 * 86400000)
      const currentWeekDate2 = new Date(now.getTime() - 3 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: currentWeekDate1,
          totalVolume: 2000,
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: currentWeekDate2,
          totalVolume: 3000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      expect(result.currentWeek.avgVolume).toBe(2500) // (2000 + 3000) / 2
    })

    it('should return 0 for avgVolume when no workouts in week', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      expect(result.currentWeek.avgVolume).toBe(0)
      expect(result.previousWeek.avgVolume).toBe(0)
    })

    it('should calculate workout count difference', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const currentWeekDate = new Date(now.getTime() - 2 * 86400000)
      const prevWeekDate1 = new Date(now.getTime() - 10 * 86400000)
      const prevWeekDate2 = new Date(now.getTime() - 11 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: currentWeekDate,
          totalVolume: 2000,
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: prevWeekDate1,
          totalVolume: 1500,
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: prevWeekDate2,
          totalVolume: 1500,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      expect(result.change.workouts).toBe(-1) // 1 - 2 = -1
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const currentWeekDate = new Date(now.getTime() - 2 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'active',
          completedAt: currentWeekDate,
          totalVolume: 2000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      expect(result.currentWeek.workouts).toBe(0)
    })

    it('should handle Firebase Timestamp objects', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const currentWeekDate = new Date(now.getTime() - 2 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: mockTimestamp(currentWeekDate),
          totalVolume: 2000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      expect(result.currentWeek.workouts).toBe(1)
    })

    it('should handle negative volume change', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const currentWeekDate = new Date(now.getTime() - 2 * 86400000)
      const prevWeekDate = new Date(now.getTime() - 10 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: currentWeekDate,
          totalVolume: 1000,
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: prevWeekDate,
          totalVolume: 2000,
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      const result = analyticsStore.weekComparison

      // (1000 - 2000) / 2000 * 100 = -50%
      expect(result.change.volumePercentage).toBe(-50)
      expect(result.change.volume).toBe(-1000)
    })
  })

  describe('currentStreak', () => {
    it('should calculate current workout streak', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(today.getDate() - 2)

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', completedAt: today }),
        createMockWorkout({ status: 'completed', completedAt: yesterday }),
        createMockWorkout({ status: 'completed', completedAt: twoDaysAgo }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.currentStreak).toBe(3)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.currentStreak).toBe(0)
    })

    it('should break streak on missing day', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const threeDaysAgo = new Date(today)
      threeDaysAgo.setDate(today.getDate() - 3)

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', completedAt: today }),
        createMockWorkout({ status: 'completed', completedAt: yesterday }),
        // Missing day 2
        createMockWorkout({ status: 'completed', completedAt: threeDaysAgo }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.currentStreak).toBe(2)
    })

    it('should handle multiple workouts on the same day', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', completedAt: today }),
        createMockWorkout({ status: 'completed', completedAt: today }),
        createMockWorkout({ status: 'completed', completedAt: today }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.currentStreak).toBe(1)
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const mockWorkouts = [
        createMockWorkout({ status: 'active', completedAt: today }),
        createMockWorkout({ status: 'cancelled', completedAt: today }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.currentStreak).toBe(0)
    })

    it('should handle Firebase Timestamp objects', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: mockTimestamp(today),
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: mockTimestamp(yesterday),
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.currentStreak).toBe(2)
    })

    it('should return 0 when most recent workout is not today or yesterday', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', completedAt: threeDaysAgo }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.currentStreak).toBe(0)
    })
  })

  describe('bestWorkout', () => {
    it('should return workout with highest volume', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ id: 'w1', status: 'completed', totalVolume: 1000 }),
        createMockWorkout({ id: 'w2', status: 'completed', totalVolume: 3000 }),
        createMockWorkout({ id: 'w3', status: 'completed', totalVolume: 2000 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.bestWorkout

      expect(result?.id).toBe('w2')
      expect(result?.totalVolume).toBe(3000)
    })

    it('should return null when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.bestWorkout).toBeNull()
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ id: 'w1', status: 'completed', totalVolume: 1000 }),
        createMockWorkout({ id: 'w2', status: 'active', totalVolume: 5000 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.bestWorkout

      expect(result?.id).toBe('w1')
    })

    it('should handle workouts with missing totalVolume', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ id: 'w1', status: 'completed', totalVolume: undefined }),
        createMockWorkout({ id: 'w2', status: 'completed', totalVolume: null }),
        createMockWorkout({ id: 'w3', status: 'completed', totalVolume: 1000 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.bestWorkout

      expect(result?.id).toBe('w3')
    })
  })

  describe('setPeriod', () => {
    it('should update the period', () => {
      const analyticsStore = useAnalyticsStore()

      expect(analyticsStore.period).toBe('2weeks')

      analyticsStore.setPeriod('month')

      expect(analyticsStore.period).toBe('month')
    })

    it('should trigger workout refetch with new period', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      // Mock fetchWorkouts to track calls
      const fetchWorkoutsSpy = vi.spyOn(workoutStore, 'fetchWorkouts')

      analyticsStore.setPeriod('week')

      expect(fetchWorkoutsSpy).toHaveBeenCalledWith('week')
    })

    it('should map 2weeks to month for workout fetch', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const fetchWorkoutsSpy = vi.spyOn(workoutStore, 'fetchWorkouts')

      analyticsStore.setPeriod('2weeks')

      expect(fetchWorkoutsSpy).toHaveBeenCalledWith('month')
    })

    it('should handle all period types', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const fetchWorkoutsSpy = vi.spyOn(workoutStore, 'fetchWorkouts')

      analyticsStore.setPeriod('week')
      expect(fetchWorkoutsSpy).toHaveBeenCalledWith('week')

      analyticsStore.setPeriod('month')
      expect(fetchWorkoutsSpy).toHaveBeenCalledWith('month')

      analyticsStore.setPeriod('quarter')
      expect(fetchWorkoutsSpy).toHaveBeenCalledWith('quarter')
    })
  })

  describe('muscleProgress', () => {
    it('should calculate muscle progress for current week', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: threeDaysAgo,
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              primaryMuscle: 'Back',
              sets: [{ weight: 80, reps: 12 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleProgress

      expect(result.length).toBeGreaterThan(0)
      expect(result.every(m => m.hasOwnProperty('muscle'))).toBe(true)
      expect(result.every(m => m.hasOwnProperty('percent'))).toBe(true)
      expect(result.every(m => m.hasOwnProperty('color'))).toBe(true)
    })

    it('should calculate percentages based on volume', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: threeDaysAgo,
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }], // volume: 1000
            },
            {
              primaryMuscle: 'Legs',
              sets: [{ weight: 150, reps: 10 }], // volume: 1500
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleProgress

      // Total volume: 2500, Chest: 1000 (40%), Legs: 1500 (60%)
      const chest = result.find(m => m.muscle === 'Chest')
      const legs = result.find(m => m.muscle === 'Legs')

      expect(chest?.percent).toBe(40)
      expect(legs?.percent).toBe(60)
    })

    it('should sort by percentage in descending order', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: threeDaysAgo,
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              primaryMuscle: 'Legs',
              sets: [{ weight: 200, reps: 10 }],
            },
            {
              primaryMuscle: 'Back',
              sets: [{ weight: 150, reps: 10 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      const result = analyticsStore.muscleProgress

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].percent).toBeGreaterThanOrEqual(result[i].percent)
      }
    })

    it('should return empty array when no workouts in current week', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: twoWeeksAgo,
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month')

      expect(analyticsStore.muscleProgress).toEqual([])
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'active',
          completedAt: threeDaysAgo,
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.muscleProgress).toEqual([])
    })

    it('should handle zero total volume', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: threeDaysAgo,
          exercises: [],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('week')

      expect(analyticsStore.muscleProgress).toEqual([])
    })
  })
})
