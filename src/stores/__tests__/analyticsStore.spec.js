import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAuthStore } from '@/stores/authStore'
import { useExerciseStore } from '@/stores/exerciseStore'
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
    it('should initialize with period as "last30Days"', () => {
      const store = useAnalyticsStore()
      expect(store.period).toBe('last30Days')
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
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.totalWorkouts).toBe(3)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.volumeLoad).toBe(4500)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.avgVolumePerWorkout).toBe(2000)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.avgVolumePerWorkout).toBe(1250)
    })

    it('should handle division by zero gracefully', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'active', totalVolume: 1000 }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.totalSets).toBe(4)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.totalSets).toBe(2)
    })

    it('should handle workouts with no exercises', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', exercises: [] }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.totalSets).toBe(0)
    })
  })

  describe('restDays', () => {
    it('should calculate days since last workout', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      const mockWorkouts = [
        createMockWorkout({ status: 'completed', completedAt: yesterday }),
        createMockWorkout({ status: 'completed', completedAt: today }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Most recent workout is today, so 0 rest days
      expect(analyticsStore.restDays).toBe(0)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.restDays).toBe(0)
    })

    it('should calculate days since last workout with multiple workouts same day', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      // Multiple workouts on the same day
      const mockWorkouts = [
        createMockWorkout({ status: 'completed', completedAt: twoDaysAgo }),
        createMockWorkout({ status: 'completed', completedAt: twoDaysAgo }),
        createMockWorkout({ status: 'completed', completedAt: twoDaysAgo }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Most recent workout is 2 days ago
      expect(analyticsStore.restDays).toBe(2)
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
      await workoutStore.fetchWorkouts('last7Days')

      // Workout today means 0 rest days
      expect(analyticsStore.restDays).toBe(0)
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
      await workoutStore.fetchWorkouts('last7Days')

      analyticsStore.setPeriod('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      analyticsStore.setPeriod('last7Days') // 7 days

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
      await workoutStore.fetchWorkouts('last7Days')

      analyticsStore.setPeriod('last7Days')

      const result = analyticsStore.volumeByDay
      const todayData = result.find(d => d.date === todayStr)

      expect(todayData?.volume).toBe(2500)
      expect(todayData?.workouts).toBe(1)
    })

    it('should initialize days with no workouts to 0', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

      analyticsStore.setPeriod('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      analyticsStore.setPeriod('last7Days')

      const result = analyticsStore.volumeByDay
      const todayData = result.find(d => d.date === todayStr)

      expect(todayData?.volume).toBe(2500)
      expect(todayData?.workouts).toBe(2)
    })

    it('should sort days in chronological order', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

      analyticsStore.setPeriod('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      analyticsStore.setPeriod('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      analyticsStore.setPeriod('last7Days')

      const result = analyticsStore.volumeByDay

      expect(result.every(day => day.volume === 0)).toBe(true)
    })
  })

  describe('muscleDistribution', () => {
    it('should calculate muscle distribution from exercises', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()
      const exerciseStore = useExerciseStore()

      // Mock fetchExercises to populate exercises for exerciseMap
      fetchCollection.mockImplementation((collection) => {
        if (collection === 'exercises') {
          return Promise.resolve([
            { id: 'exercise-chest', name: 'Bench Press', muscleGroup: 'chest' },
            { id: 'exercise-back', name: 'Pull-up', muscleGroup: 'back' },
          ])
        }
        // For workouts collection
        return Promise.resolve([
          createMockWorkout({
            status: 'completed',
            exercises: [
              {
                exerciseId: 'exercise-chest',
                sets: [{ weight: 100, reps: 10 }, { weight: 100, reps: 10 }],
              },
              {
                exerciseId: 'exercise-back',
                sets: [{ weight: 80, reps: 12 }],
              },
            ],
          }),
        ])
      })

      await exerciseStore.fetchExercises()
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleDistribution

      expect(result).toHaveLength(2)
      expect(result.find(m => m.muscle === 'chest')?.sets).toBe(2)
      expect(result.find(m => m.muscle === 'back')?.sets).toBe(1)
    })

    it('should calculate percentages correctly', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()
      const exerciseStore = useExerciseStore()

      // Set up exercises array for exerciseMap to use
      exerciseStore.exercises = [
        { id: 'exercise-chest', muscleGroup: 'chest' },
        { id: 'exercise-back', muscleGroup: 'back' },
        { id: 'exercise-legs', muscleGroup: 'legs' },
      ]

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              exerciseId: 'exercise-chest',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              exerciseId: 'exercise-back',
              sets: [{ weight: 80, reps: 12 }],
            },
            {
              exerciseId: 'exercise-legs',
              sets: [{ weight: 150, reps: 8 }, { weight: 150, reps: 8 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleDistribution

      // Total: 4 sets, Chest: 1 (25%), Back: 1 (25%), Legs: 2 (50%)
      expect(result.find(m => m.muscle === 'chest')?.percentage).toBe(25)
      expect(result.find(m => m.muscle === 'back')?.percentage).toBe(25)
      expect(result.find(m => m.muscle === 'legs')?.percentage).toBe(50)
    })

    it('should return empty array when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.muscleDistribution).toEqual([])
    })

    it('should aggregate sets from the same muscle group', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()
      const exerciseStore = useExerciseStore()

      // Set up exercises array for exerciseMap to use
      exerciseStore.exercises = [
        { id: 'exercise-chest-1', muscleGroup: 'chest' },
        { id: 'exercise-chest-2', muscleGroup: 'chest' },
      ]

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              exerciseId: 'exercise-chest-1',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              exerciseId: 'exercise-chest-2',
              sets: [{ weight: 90, reps: 12 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleDistribution

      expect(result).toHaveLength(1)
      expect(result[0].muscle).toBe('chest')
      expect(result[0].sets).toBe(2)
      expect(result[0].percentage).toBe(100)
    })

    it('should sort by number of sets in descending order', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()
      const exerciseStore = useExerciseStore()

      // Set up exercises array for exerciseMap to use
      exerciseStore.exercises = [
        { id: 'exercise-chest', muscleGroup: 'chest' },
        { id: 'exercise-legs', muscleGroup: 'legs' },
        { id: 'exercise-back', muscleGroup: 'back' },
      ]

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              exerciseId: 'exercise-chest',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              exerciseId: 'exercise-legs',
              sets: [{ weight: 150, reps: 8 }, { weight: 150, reps: 8 }, { weight: 150, reps: 8 }],
            },
            {
              exerciseId: 'exercise-back',
              sets: [{ weight: 80, reps: 12 }, { weight: 80, reps: 12 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleDistribution

      expect(result[0].muscle).toBe('legs')
      expect(result[1].muscle).toBe('back')
      expect(result[2].muscle).toBe('chest')
    })

    it('should handle exercises without muscleGroup', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()
      const exerciseStore = useExerciseStore()

      // Mock exercise store to return null (exercise not found)
      // Set up empty exercises array (exercise not found scenario)
      exerciseStore.exercises = []

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          exercises: [
            {
              exerciseId: 'unknown-exercise',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleDistribution

      expect(result).toHaveLength(1)
      expect(result[0].muscle).toBe('unknown')
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()
      const exerciseStore = useExerciseStore()

      // Set up exercises array for exerciseMap to use
      exerciseStore.exercises = [
        { id: 'exercise-chest', muscleGroup: 'chest' },
      ]

      const mockWorkouts = [
        createMockWorkout({
          status: 'active',
          exercises: [
            {
              exerciseId: 'exercise-chest',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleDistribution

      expect(result).toEqual([])
    })
  })

  // weekComparison tests removed - deprecated in favor of periodComparison

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
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.currentStreak).toBe(3)
    })

    it('should return 0 when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.bestWorkout

      expect(result?.id).toBe('w2')
      expect(result?.totalVolume).toBe(3000)
    })

    it('should return null when no workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      fetchCollection.mockResolvedValue([])
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.bestWorkout

      expect(result?.id).toBe('w3')
    })
  })

  describe('setPeriod', () => {
    it('should update the period', () => {
      const analyticsStore = useAnalyticsStore()

      expect(analyticsStore.period).toBe('last30Days')

      analyticsStore.setPeriod('last7Days')

      expect(analyticsStore.period).toBe('last7Days')
    })

    it('should update volumeByDay when period changes', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      // Create workouts: 1 from 3 days ago, 1 from 10 days ago
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

      fetchCollection.mockResolvedValue([
        createMockWorkout({
          id: '1',
          status: 'completed',
          completedAt: mockTimestamp(threeDaysAgo),
          totalVolume: 1000
        }),
        createMockWorkout({
          id: '2',
          status: 'completed',
          completedAt: mockTimestamp(tenDaysAgo),
          totalVolume: 2000
        }),
      ])

      await workoutStore.fetchWorkouts('last30Days')

      // Set to last 7 days - should only include workout from 3 days ago
      analyticsStore.setPeriod('last7Days')

      const result = analyticsStore.volumeByDay
      const nonZeroDays = result.filter(d => d.volume > 0)

      expect(nonZeroDays).toHaveLength(1)
      expect(nonZeroDays[0].volume).toBe(1000)
    })

    it('should fall back to default period for invalid period', () => {
      const analyticsStore = useAnalyticsStore()

      analyticsStore.setPeriod('invalidPeriod')

      expect(analyticsStore.period).toBe('last30Days')
    })

    it('should handle all period types', () => {
      const analyticsStore = useAnalyticsStore()

      analyticsStore.setPeriod('last7Days')
      expect(analyticsStore.period).toBe('last7Days')

      analyticsStore.setPeriod('thisMonth')
      expect(analyticsStore.period).toBe('thisMonth')

      analyticsStore.setPeriod('last90Days')
      expect(analyticsStore.period).toBe('last90Days')
    })
  })

  describe('muscleProgress', () => {
    it('should calculate muscle progress for current week', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()
      const exerciseStore = useExerciseStore()

      // Set up exercises array for exerciseMap to use
      exerciseStore.exercises = [
        { id: 'exercise-chest', muscleGroup: 'chest' },
        { id: 'exercise-back', muscleGroup: 'back' },
      ]

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: threeDaysAgo,
          exercises: [
            {
              exerciseId: 'exercise-chest',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              exerciseId: 'exercise-back',
              sets: [{ weight: 80, reps: 12 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleProgress

      expect(result.length).toBeGreaterThan(0)
      expect(result.every(m => m.hasOwnProperty('muscle'))).toBe(true)
      expect(result.every(m => m.hasOwnProperty('percent'))).toBe(true)
      expect(result.every(m => m.hasOwnProperty('color'))).toBe(true)
    })

    it('should calculate percentages based on volume', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()
      const exerciseStore = useExerciseStore()

      // Set up exercises array for exerciseMap to use
      exerciseStore.exercises = [
        { id: 'exercise-chest', muscleGroup: 'chest' },
        { id: 'exercise-legs', muscleGroup: 'legs' },
      ]

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: threeDaysAgo,
          exercises: [
            {
              exerciseId: 'exercise-chest',
              sets: [{ weight: 100, reps: 10 }], // volume: 1000
            },
            {
              exerciseId: 'exercise-legs',
              sets: [{ weight: 150, reps: 10 }], // volume: 1500
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleProgress

      // Total volume: 2500, Chest: 1000 (40%), Legs: 1500 (60%)
      const chest = result.find(m => m.muscle === 'chest')
      const legs = result.find(m => m.muscle === 'legs')

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
      await workoutStore.fetchWorkouts('last7Days')

      const result = analyticsStore.muscleProgress

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].percent).toBeGreaterThanOrEqual(result[i].percent)
      }
    })

    it('should return empty array when no workouts in current period', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      // Create a workout from 40 days ago (outside last30Days default period)
      const fortyDaysAgo = new Date()
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: fortyDaysAgo,
          exercises: [
            {
              primaryMuscle: 'Chest',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last30Days')

      // Default period is last30Days, workout is outside this range
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
      await workoutStore.fetchWorkouts('last7Days')

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
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.muscleProgress).toEqual([])
    })
  })

  describe('avgRpe', () => {
    it('should calculate average RPE from sets with valid RPE values', async () => {
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
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: 6 },
                { weight: 100, reps: 10, rpe: 7 },
              ],
            },
            {
              exerciseId: 'ex2',
              sets: [
                { weight: 80, reps: 12, rpe: 8 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Average: (6 + 7 + 8) / 3 = 7.0
      expect(analyticsStore.avgRpe).toBe(7.0)
    })

    it('should skip sets without RPE (null/undefined)', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 2 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: twoDaysAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: 5 },
                { weight: 100, reps: 10, rpe: null },
                { weight: 100, reps: 10 }, // undefined RPE
                { weight: 100, reps: 10, rpe: 7 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Average: (5 + 7) / 2 = 6.0
      expect(analyticsStore.avgRpe).toBe(6.0)
    })

    it('should return 0 when no sets have RPE data', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: oneDayAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10 }, // no RPE
                { weight: 100, reps: 10, rpe: null },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.avgRpe).toBe(0)
    })

    it('should only consider workouts from last 7 days', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)
      const tenDaysAgo = new Date(now.getTime() - 10 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: threeDaysAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: 8 },
              ],
            },
          ],
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: tenDaysAgo,
          exercises: [
            {
              exerciseId: 'ex2',
              sets: [
                { weight: 80, reps: 12, rpe: 4 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('month') // Fetch wider range

      // Should only count the 3-day-ago workout with RPE 8
      expect(analyticsStore.avgRpe).toBe(8.0)
    })

    it('should skip RPE values of 0', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: oneDayAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: 0 },
                { weight: 100, reps: 10, rpe: 5 },
                { weight: 100, reps: 10, rpe: 7 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Average: (5 + 7) / 2 = 6.0 (skip 0)
      expect(analyticsStore.avgRpe).toBe(6.0)
    })

    it('should skip RPE values outside 1-10 range', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: oneDayAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: -1 },
                { weight: 100, reps: 10, rpe: 5 },
                { weight: 100, reps: 10, rpe: 15 },
                { weight: 100, reps: 10, rpe: 7 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Average: (5 + 7) / 2 = 6.0 (skip -1 and 15)
      expect(analyticsStore.avgRpe).toBe(6.0)
    })

    it('should format result to one decimal place', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: oneDayAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: 6 },
                { weight: 100, reps: 10, rpe: 7 },
                { weight: 100, reps: 10, rpe: 8 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Average: (6 + 7 + 8) / 3 = 7.0 (not 7.000000001)
      expect(analyticsStore.avgRpe).toBe(7.0)
      expect(typeof analyticsStore.avgRpe).toBe('number')
    })

    it('should include all set types (normal, warmup, dropset)', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: oneDayAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 60, reps: 10, rpe: 4, type: 'warmup' },
                { weight: 100, reps: 10, rpe: 8, type: 'normal' },
                { weight: 80, reps: 12, rpe: 9, type: 'dropset' },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Average: (4 + 8 + 9) / 3 = 7.0
      expect(analyticsStore.avgRpe).toBe(7.0)
    })

    it('should handle Firebase Timestamp objects', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 2 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: mockTimestamp(twoDaysAgo),
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: 7 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.avgRpe).toBe(7.0)
    })

    it('should filter out non-completed workouts', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'active',
          completedAt: oneDayAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: 5 },
              ],
            },
          ],
        }),
        createMockWorkout({
          status: 'completed',
          completedAt: oneDayAgo,
          exercises: [
            {
              exerciseId: 'ex2',
              sets: [
                { weight: 100, reps: 10, rpe: 8 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      // Should only count completed workout with RPE 8
      expect(analyticsStore.avgRpe).toBe(8.0)
    })
  })

  describe('quickStats', () => {
    it('should return weight from userStore', async () => {
      const analyticsStore = useAnalyticsStore()
      // Mock userStore with weight
      const { useUserStore } = await import('../userStore')
      const userStore = useUserStore()

      // Mock currentWeight getter
      vi.spyOn(userStore, 'currentWeight', 'get').mockReturnValue(75.5)

      expect(analyticsStore.quickStats.weight).toBe(75.5)
    })

    it('should return null when userStore has no weight', async () => {
      const analyticsStore = useAnalyticsStore()
      const { useUserStore } = await import('../userStore')
      const userStore = useUserStore()

      // Mock currentWeight getter as null
      vi.spyOn(userStore, 'currentWeight', 'get').mockReturnValue(null)

      expect(analyticsStore.quickStats.weight).toBe(null)
    })

    it('should include avgRpe in quickStats', async () => {
      const workoutStore = useWorkoutStore()
      const analyticsStore = useAnalyticsStore()

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000)

      const mockWorkouts = [
        createMockWorkout({
          status: 'completed',
          completedAt: oneDayAgo,
          exercises: [
            {
              exerciseId: 'ex1',
              sets: [
                { weight: 100, reps: 10, rpe: 7 },
              ],
            },
          ],
        }),
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)
      await workoutStore.fetchWorkouts('last7Days')

      expect(analyticsStore.quickStats.avgRpe).toBe(7.0)
    })
  })
})
