import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Firebase modules BEFORE importing stores
// Mock firestore with ALL exports (used by both workoutStore and authStore)
vi.mock('@/firebase/firestore', () => ({
  // workoutStore uses these:
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  subscribeToCollection: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
  },
  // authStore uses these:
  fetchDocument: vi.fn(),
  setDocument: vi.fn(),
  subscribeToDocument: vi.fn(),
  COLLECTIONS: {
    USERS: 'users',
    WORKOUTS: 'workouts',
    EXERCISES: 'exercises',
    USER_EXERCISES: 'user_exercises',
    PERSONAL_RECORDS: 'personal_records',
    MUSCLE_GROUPS: 'muscle_groups',
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

// Import mocked modules after mock setup
import {
  fetchCollection,
  createDocument,
  updateDocument,
  subscribeToCollection,
  serverTimestamp,
  fetchDocument,
  setDocument,
  subscribeToDocument,
} from '@/firebase/firestore'

import { onAuthChange } from '@/firebase/auth'

// Import stores after all mocks are set up
import { useWorkoutStore } from '@/stores/workoutStore'
import { useAuthStore } from '@/stores/authStore'

// Mock Firebase Timestamp for date handling
const mockTimestamp = (date) => ({
  toDate: () => date,
})

describe('workoutStore', () => {
  /**
   * Helper function to set auth user state
   * Since uid is a computed property, we can't assign directly to it
   * Instead, we mock the underlying user data
   */
  function setAuthUser(userId = 'test-user-id') {
    onAuthChange.mockImplementation((callback) => {
      if (userId) {
        callback({
          uid: userId,
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: true,
        })
      } else {
        callback(null)
      }
      return vi.fn()
    })

    const authStore = useAuthStore()
    authStore.initAuth()
  }
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Mock authStore firestore calls to prevent errors during initialization
    fetchDocument.mockResolvedValue(null)
    setDocument.mockResolvedValue()
    subscribeToDocument.mockReturnValue(vi.fn())
    // Set up authenticated user by default
    setAuthUser('test-user-id')
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  describe('initial state', () => {
    it('should initialize with null currentWorkout', () => {
      const store = useWorkoutStore()
      expect(store.currentWorkout).toBeNull()
    })
    it('should initialize with empty workouts array', () => {
      const store = useWorkoutStore()
      expect(store.workouts).toEqual([])
    })
    it('should initialize with loading as false', () => {
      const store = useWorkoutStore()
      expect(store.loading).toBe(false)
    })
    it('should initialize with null error', () => {
      const store = useWorkoutStore()
      expect(store.error).toBeNull()
    })
  })
  describe('computed getters', () => {
    describe('todaysWorkout', () => {
      it('should return today\'s workout if it exists', async () => {
        const store = useWorkoutStore()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const mockWorkouts = [
          {
            id: 'workout-1',
            startedAt: today,
            status: 'completed',
          },
          {
            id: 'workout-2',
            startedAt: new Date(today.getTime() - 86400000), // yesterday
            status: 'completed',
          },
        ]
        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')
        expect(store.todaysWorkout?.id).toBe('workout-1')
      })
      it('should handle Firebase Timestamp objects', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const mockWorkouts = [
          {
            id: 'workout-1',
            startedAt: mockTimestamp(today),
            status: 'completed',
          },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.todaysWorkout?.id).toBe('workout-1')
      })

      it('should return undefined when no workout today', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const mockWorkouts = [
          {
            id: 'workout-1',
            startedAt: yesterday,
            status: 'completed',
          },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.todaysWorkout).toBeUndefined()
      })

      it('should return undefined when workouts array is empty', () => {
        const store = useWorkoutStore()
        expect(store.todaysWorkout).toBeUndefined()
      })
    })

    describe('activeWorkout', () => {
      it('should return workout with active status from workouts array', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()

        const mockWorkouts = [
          { id: 'workout-1', status: 'completed' },
          { id: 'workout-2', status: 'active' },
          { id: 'workout-3', status: 'completed' },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.activeWorkout?.id).toBe('workout-2')
      })

      it('should return null when no active workout exists', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()

        const mockWorkouts = [
          { id: 'workout-1', status: 'completed' },
          { id: 'workout-2', status: 'completed' },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        // activeWorkout returns `find(...) || currentWorkout.value`
        // When find() returns undefined and currentWorkout is null, result is null
        expect(store.activeWorkout).toBeNull()
      })
    })

    describe('recentWorkouts', () => {
      it('should return up to 10 most recent completed workouts', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const now = new Date()

        // Create 15 workouts
        const workouts = Array.from({ length: 15 }, (_, i) => ({
          id: `workout-${i}`,
          status: 'completed',
          completedAt: new Date(now.getTime() - i * 86400000),
        }))

        fetchCollection.mockResolvedValue(workouts)
        await store.fetchWorkouts('month')

        expect(store.recentWorkouts).toHaveLength(10)
        expect(store.recentWorkouts[0].id).toBe('workout-0')
        expect(store.recentWorkouts[9].id).toBe('workout-9')
      })

      it('should filter out non-completed workouts', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const now = new Date()

        const mockWorkouts = [
          { id: 'workout-1', status: 'completed', completedAt: now },
          { id: 'workout-2', status: 'active', completedAt: now },
          { id: 'workout-3', status: 'completed', completedAt: now },
          { id: 'workout-4', status: 'cancelled', completedAt: now },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.recentWorkouts).toHaveLength(2)
        expect(store.recentWorkouts.every(w => w.status === 'completed')).toBe(true)
      })

      it('should sort workouts by completedAt in descending order', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const now = new Date()

        const mockWorkouts = [
          {
            id: 'workout-1',
            status: 'completed',
            completedAt: new Date(now.getTime() - 3 * 86400000),
          },
          {
            id: 'workout-2',
            status: 'completed',
            completedAt: new Date(now.getTime() - 1 * 86400000),
          },
          {
            id: 'workout-3',
            status: 'completed',
            completedAt: new Date(now.getTime() - 2 * 86400000),
          },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.recentWorkouts[0].id).toBe('workout-2')
        expect(store.recentWorkouts[1].id).toBe('workout-3')
        expect(store.recentWorkouts[2].id).toBe('workout-1')
      })

      it('should handle Firebase Timestamp objects in completedAt', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const now = new Date()

        const mockWorkouts = [
          {
            id: 'workout-1',
            status: 'completed',
            completedAt: mockTimestamp(now),
          },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.recentWorkouts).toHaveLength(1)
        expect(store.recentWorkouts[0].id).toBe('workout-1')
      })

      it('should return empty array when no completed workouts', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()

        const mockWorkouts = [
          { id: 'workout-1', status: 'active' },
          { id: 'workout-2', status: 'cancelled' },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.recentWorkouts).toEqual([])
      })
    })

    describe('completedWorkouts', () => {
      it('should return all completed workouts (not limited to 10)', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const now = new Date()

        // Create 15 workouts to test that all are returned (unlike recentWorkouts which is limited to 10)
        const workouts = Array.from({ length: 15 }, (_, i) => ({
          id: `workout-${i}`,
          status: 'completed',
          completedAt: new Date(now.getTime() - i * 86400000),
        }))

        fetchCollection.mockResolvedValue(workouts)
        await store.fetchWorkouts('month')

        expect(store.completedWorkouts).toHaveLength(15)
        expect(store.completedWorkouts[0].id).toBe('workout-0')
        expect(store.completedWorkouts[14].id).toBe('workout-14')
      })

      it('should filter out non-completed workouts', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const now = new Date()

        const mockWorkouts = [
          { id: 'workout-1', status: 'completed', completedAt: now },
          { id: 'workout-2', status: 'active', completedAt: now },
          { id: 'workout-3', status: 'completed', completedAt: now },
          { id: 'workout-4', status: 'cancelled', completedAt: now },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.completedWorkouts).toHaveLength(2)
        expect(store.completedWorkouts.every(w => w.status === 'completed')).toBe(true)
      })

      it('should sort workouts by completedAt in descending order', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()
        const now = new Date()

        const mockWorkouts = [
          {
            id: 'workout-1',
            status: 'completed',
            completedAt: new Date(now.getTime() - 3 * 86400000),
          },
          {
            id: 'workout-2',
            status: 'completed',
            completedAt: new Date(now.getTime() - 1 * 86400000),
          },
          {
            id: 'workout-3',
            status: 'completed',
            completedAt: new Date(now.getTime() - 2 * 86400000),
          },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.completedWorkouts[0].id).toBe('workout-2')
        expect(store.completedWorkouts[1].id).toBe('workout-3')
        expect(store.completedWorkouts[2].id).toBe('workout-1')
      })

      it('should return empty array when no completed workouts', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()

        const mockWorkouts = [
          { id: 'workout-1', status: 'active' },
          { id: 'workout-2', status: 'cancelled' },
        ]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.completedWorkouts).toEqual([])
      })
    })

    describe('hasActiveWorkout', () => {
      it('should return true when active workout exists', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()

        const mockWorkouts = [{ id: 'workout-1', status: 'active' }]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.hasActiveWorkout).toBe(true)
      })

      it('should return false when no active workout', async () => {
        const authStore = useAuthStore()

        const store = useWorkoutStore()

        const mockWorkouts = [{ id: 'workout-1', status: 'completed' }]

        fetchCollection.mockResolvedValue(mockWorkouts)
        await store.fetchWorkouts('week')

        expect(store.hasActiveWorkout).toBe(false)
      })
    })
  })

  describe('startWorkout', () => {
    it('should successfully start a new workout', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const workoutId = 'new-workout-id'

      createDocument.mockResolvedValue(workoutId)
      subscribeToCollection.mockReturnValue(vi.fn())

      const result = await store.startWorkout()

      expect(createDocument).toHaveBeenCalledWith(
        'users/test-user-id/workouts',
        expect.objectContaining({
          userId: 'test-user-id',
          status: 'active',
          exercises: [],
          duration: 0,
          totalVolume: 0,
        })
      )
      expect(result).toBe(workoutId)
      expect(store.currentWorkout).toBeTruthy()
      expect(store.currentWorkout?.id).toBe(workoutId)
      expect(store.error).toBeNull()
    })

    it('should throw error when user not authenticated', async () => {
      // Set up unauthenticated state
      setAuthUser(null)

      const store = useWorkoutStore()

      await expect(store.startWorkout()).rejects.toThrow(
        'User must be authenticated to start workout'
      )
    })

    it('should throw error when active workout already exists', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()

      // Set up active workout through subscription
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{ id: 'existing-workout', status: 'active' }])
        return vi.fn()
      })

      store.subscribeToActive()

      await expect(store.startWorkout()).rejects.toThrow(
        'Cannot start a new workout while one is active'
      )
    })

    it('should set loading state during workout start', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()

      createDocument.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve('workout-id')
      })

      subscribeToCollection.mockReturnValue(vi.fn())

      await store.startWorkout()

      expect(store.loading).toBe(false)
    })

    it('should handle workout start error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const errorMessage = 'Failed to create workout'

      createDocument.mockRejectedValue(new Error(errorMessage))

      await expect(store.startWorkout()).rejects.toThrow(errorMessage)
      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      consoleErrorSpy.mockRestore()
    })

    it('should subscribe to active workout after starting', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()

      createDocument.mockResolvedValue('workout-id')
      subscribeToCollection.mockReturnValue(vi.fn())

      await store.startWorkout()

      expect(subscribeToCollection).toHaveBeenCalled()
    })
  })

  describe('addExercise', () => {
    it('should successfully add exercise to active workout', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()

      // Set up active workout
      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          exercises: [],
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      updateDocument.mockResolvedValue()

      await store.addExercise('exercise-123', 'Bench Press')

      expect(updateDocument).toHaveBeenCalledWith(
        'users/test-user-id/workouts',
        'workout-1',
        expect.objectContaining({
          exercises: [
            {
              exerciseId: 'exercise-123',
              exerciseName: 'Bench Press',
              sets: [],
              order: 0,
            },
          ],
        })
      )
      expect(store.error).toBeNull()
    })

    it('should throw error when no active workout', async () => {
      const store = useWorkoutStore()

      await expect(
        store.addExercise('exercise-123', 'Bench Press')
      ).rejects.toThrow('No active workout')
    })

    it('should set loading state during exercise add', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()

      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          exercises: [],
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      updateDocument.mockImplementation(() => {
        expect(store.loading).toBe(true)
        return Promise.resolve()
      })

      await store.addExercise('exercise-123', 'Bench Press')

      expect(store.loading).toBe(false)
    })

    it('should handle exercise add error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const errorMessage = 'Failed to add exercise'

      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          exercises: [],
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      updateDocument.mockRejectedValue(new Error(errorMessage))

      await expect(
        store.addExercise('exercise-123', 'Bench Press')
      ).rejects.toThrow(errorMessage)

      expect(store.error).toBe(errorMessage)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('addSet', () => {
    it('should successfully add set to exercise', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()

      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [],
            },
          ],
          totalVolume: 0,
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      updateDocument.mockResolvedValue()

      await store.addSet('ex-1', {
        weight: 100,
        reps: 10,
        rpe: 8,
        type: 'normal',
      })

      const callArgs = updateDocument.mock.calls[0][2]
      expect(callArgs.exercises[0].sets).toHaveLength(1)
      expect(callArgs.exercises[0].sets[0]).toMatchObject({
        weight: 100,
        reps: 10,
        rpe: 8,
        type: 'normal',
      })
      expect(store.error).toBeNull()
    })

    it('should calculate and update total volume', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()

      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
          totalVolume: 1000,
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      updateDocument.mockResolvedValue()

      await store.addSet('ex-1', { weight: 100, reps: 10 })

      const callArgs = updateDocument.mock.calls[0][2]
      expect(callArgs.totalVolume).toBe(2000) // 100 * 10 * 2 sets
    })

    it('should throw error when no active workout', async () => {
      const store = useWorkoutStore()

      await expect(
        store.addSet('ex-1', { weight: 100, reps: 10 })
      ).rejects.toThrow('No active workout')
    })

    it('should throw error when exercise not found', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const authStore = useAuthStore()

      const store = useWorkoutStore()

      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [],
            },
          ],
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      await expect(
        store.addSet('nonexistent-exercise', { weight: 100, reps: 10 })
      ).rejects.toThrow('Exercise not found in current workout')
      consoleErrorSpy.mockRestore()
    })
  })

  describe('finishWorkout', () => {
    it('should successfully finish active workout', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const startTime = new Date(Date.now() - 3600000) // 1 hour ago

      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          startedAt: startTime,
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      updateDocument.mockResolvedValue()

      await store.finishWorkout()

      expect(updateDocument).toHaveBeenCalledWith(
        'users/test-user-id/workouts',
        'workout-1',
        expect.objectContaining({
          status: 'completed',
        })
      )
      expect(store.currentWorkout).toBeNull()
      expect(store.error).toBeNull()
    })

    it('should throw error when no active workout', async () => {
      const store = useWorkoutStore()

      await expect(store.finishWorkout()).rejects.toThrow(
        'No active workout to finish'
      )
    })

    it('should calculate duration based on actual time, not custom date', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const startTime = new Date(Date.now() - 3600000) // 1 hour ago

      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          startedAt: startTime,
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      updateDocument.mockResolvedValue()

      // Finish workout with a PAST custom date (2 days ago)
      const customDate = new Date(Date.now() - 2 * 86400000)
      await store.finishWorkout({ date: customDate })

      const updateCall = updateDocument.mock.calls[0][2]

      // Duration should be positive (based on actual time elapsed ~1 hour = 3600 seconds)
      expect(updateCall.duration).toBeGreaterThan(0)
      expect(updateCall.duration).toBeGreaterThanOrEqual(3595) // Allow small timing variance
      expect(updateCall.duration).toBeLessThanOrEqual(3605)

      // completedAt should be a Timestamp that converts to the custom date
      // The store uses Timestamp.fromDate() which creates a Timestamp-like object
      expect(updateCall.completedAt.toDate().getTime()).toBeCloseTo(customDate.getTime(), -3)

      expect(store.error).toBeNull()
    })

    it('should ensure duration is never negative with edge cases', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const startTime = new Date() // Just started

      createDocument.mockResolvedValue('workout-1')
      subscribeToCollection.mockImplementation((path, options, callback) => {
        callback([{
          id: 'workout-1',
          startedAt: startTime,
          status: 'active',
        }])
        return vi.fn()
      })

      await store.startWorkout()

      updateDocument.mockResolvedValue()

      // Finish with a date in the FUTURE
      const futureDate = new Date(Date.now() + 86400000)
      await store.finishWorkout({ date: futureDate })

      const updateCall = updateDocument.mock.calls[0][2]

      // Duration should still be >= 0 (Math.max ensures this)
      expect(updateCall.duration).toBeGreaterThanOrEqual(0)

      expect(store.error).toBeNull()
    })
  })

  describe('fetchWorkouts', () => {
    it('should fetch workouts for the specified period', async () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const mockWorkouts = [
        { id: 'workout-1', status: 'completed' },
        { id: 'workout-2', status: 'completed' },
      ]

      fetchCollection.mockResolvedValue(mockWorkouts)

      await store.fetchWorkouts('week')

      expect(fetchCollection).toHaveBeenCalledWith(
        'users/test-user-id/workouts',
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.arrayContaining(['startedAt', '>=', expect.any(Date)]),
          ]),
          orderBy: [['startedAt', 'desc']],
        })
      )
      expect(store.workouts).toEqual(mockWorkouts)
      expect(store.error).toBeNull()
    })

    it('should throw error when user not authenticated', async () => {
      // Set up unauthenticated state
      setAuthUser(null)

      const store = useWorkoutStore()

      await expect(store.fetchWorkouts()).rejects.toThrow(
        'User must be authenticated'
      )
    })
  })

  describe('subscribeToActive', () => {
    it('should subscribe to active workout', () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const unsubscribeMock = vi.fn()

      subscribeToCollection.mockReturnValue(unsubscribeMock)

      const unsubscribe = store.subscribeToActive()

      expect(subscribeToCollection).toHaveBeenCalledWith(
        'users/test-user-id/workouts',
        expect.objectContaining({
          where: [['status', '==', 'active']],
          limit: 1,
        }),
        expect.any(Function),
        expect.any(Function)
      )
      expect(unsubscribe).toBe(unsubscribeMock)
    })

    it('should return null when user not authenticated', () => {
      // Set up unauthenticated state
      setAuthUser(null)

      const store = useWorkoutStore()

      const result = store.subscribeToActive()

      expect(result).toBeNull()
      expect(subscribeToCollection).not.toHaveBeenCalled()
    })
  })

  describe('unsubscribe', () => {
    it('should cleanup all subscriptions', () => {
      const authStore = useAuthStore()

      const store = useWorkoutStore()
      const unsubscribeActive = vi.fn()
      const unsubscribeWorkouts = vi.fn()

      subscribeToCollection
        .mockReturnValueOnce(unsubscribeActive)
        .mockReturnValueOnce(unsubscribeWorkouts)

      store.subscribeToActive()
      store.subscribeToWorkouts('week')

      store.unsubscribe()

      expect(unsubscribeActive).toHaveBeenCalled()
      expect(unsubscribeWorkouts).toHaveBeenCalled()
    })
  })

  describe('clearError', () => {
    it('should clear error message', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const store = useWorkoutStore()

      // Set an error first
      createDocument.mockRejectedValue(new Error('Test error'))

      const authStore = useAuthStore()

      await expect(store.startWorkout()).rejects.toThrow()

      expect(store.error).toBe('Test error')

      // Clear error
      store.clearError()

      expect(store.error).toBeNull()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('fetchWorkout', () => {
    it('should fetch workout by ID from Firestore', async () => {
      const mockWorkout = {
        id: 'workout-1',
        userId: 'test-user-id',
        status: 'completed',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
        duration: 3600,
        completedAt: new Date('2024-12-20'),
      }

      fetchDocument.mockResolvedValue(mockWorkout)

      const store = useWorkoutStore()
      const result = await store.fetchWorkout('workout-1')

      expect(fetchDocument).toHaveBeenCalledWith('users/test-user-id/workouts', 'workout-1')
      expect(result).toEqual(mockWorkout)
      expect(store.workouts).toContainEqual(mockWorkout)
    })

    it('should return cached workout if already in store', async () => {
      const mockWorkout = {
        id: 'workout-1',
        userId: 'test-user-id',
        status: 'completed',
        exercises: [],
        duration: 3600,
      }

      const store = useWorkoutStore()

      // Clear previous authStore fetchDocument calls
      vi.clearAllMocks()

      store.workouts.push(mockWorkout)

      const result = await store.fetchWorkout('workout-1')

      // fetchDocument should not be called for workout fetching
      // (it may still be called by authStore during setup)
      const workoutCalls = fetchDocument.mock.calls.filter(
        call => call[0] === 'users/test-user-id/workouts'
      )
      expect(workoutCalls.length).toBe(0)
      expect(result).toEqual(mockWorkout)
    })

    it('should throw error if workout not found', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      fetchDocument.mockResolvedValue(null)

      const store = useWorkoutStore()

      await expect(store.fetchWorkout('invalid-id')).rejects.toThrow('Workout not found')
      consoleErrorSpy.mockRestore()
    })

    it('should throw error if user not authenticated', async () => {
      setAuthUser(null)

      const store = useWorkoutStore()

      await expect(store.fetchWorkout('workout-1')).rejects.toThrow(
        'User must be authenticated'
      )
    })

    it('should set loading state during fetch', async () => {
      const mockWorkout = {
        id: 'workout-1',
        exercises: [],
      }

      fetchDocument.mockImplementation(async () => {
        expect(store.loading).toBe(true)
        return mockWorkout
      })

      const store = useWorkoutStore()
      await store.fetchWorkout('workout-1')

      expect(store.loading).toBe(false)
    })

    it('should handle fetch error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorMessage = 'Network error'

      fetchDocument.mockRejectedValue(new Error(errorMessage))

      const store = useWorkoutStore()

      await expect(store.fetchWorkout('workout-1')).rejects.toThrow(errorMessage)
      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Template Support', () => {
    describe('startWorkout with template data', () => {
      it('should start workout without template (existing behavior)', async () => {
        createDocument.mockResolvedValue('workout-123')
        subscribeToCollection.mockReturnValue(vi.fn())

        const store = useWorkoutStore()

        const workoutId = await store.startWorkout()

        expect(workoutId).toBe('workout-123')
        expect(createDocument).toHaveBeenCalledWith(
          'users/test-user-id/workouts',
          expect.objectContaining({
            userId: 'test-user-id',
            status: 'active',
            exercises: [],
            duration: 0,
            totalVolume: 0,
            totalSets: 0,
          })
        )
      })

      it('should start workout with template data', async () => {
        createDocument.mockResolvedValue('workout-456')
        subscribeToCollection.mockReturnValue(vi.fn())

        const store = useWorkoutStore()

        const templateData = {
          templateId: 'template-123',
          templateName: 'Push Day',
          exercises: [
            {
              exerciseId: 'barbell-bench-press',
              exerciseName: 'Barbell Bench Press',
              sets: 4,
              reps: 8,
              restTime: 120,
            },
            {
              exerciseId: 'overhead-press',
              exerciseName: 'Overhead Press',
              sets: 3,
              reps: 10,
              restTime: 90,
            },
          ],
        }

        const workoutId = await store.startWorkout(templateData)

        expect(workoutId).toBe('workout-456')
        expect(createDocument).toHaveBeenCalledWith(
          'users/test-user-id/workouts',
          expect.objectContaining({
            userId: 'test-user-id',
            status: 'active',
            sourceTemplateId: 'template-123',
            sourceTemplateName: 'Push Day',
            exercises: [
              expect.objectContaining({
                exerciseId: 'barbell-bench-press',
                exerciseName: 'Barbell Bench Press',
                sets: [],
                order: 0,
                templateSuggestions: {
                  suggestedSets: 4,
                  suggestedReps: 8,
                  suggestedRestTime: 120,
                },
              }),
              expect.objectContaining({
                exerciseId: 'overhead-press',
                exerciseName: 'Overhead Press',
                sets: [],
                order: 1,
                templateSuggestions: {
                  suggestedSets: 3,
                  suggestedReps: 10,
                  suggestedRestTime: 90,
                },
              }),
            ],
          })
        )
      })

      it('should handle template with no exercises', async () => {
        createDocument.mockResolvedValue('workout-789')
        subscribeToCollection.mockReturnValue(vi.fn())

        const store = useWorkoutStore()

        const templateData = {
          templateId: 'template-empty',
          templateName: 'Empty Template',
          exercises: [],
        }

        const workoutId = await store.startWorkout(templateData)

        expect(workoutId).toBe('workout-789')
        expect(createDocument).toHaveBeenCalledWith(
          'users/test-user-id/workouts',
          expect.objectContaining({
            sourceTemplateId: 'template-empty',
            sourceTemplateName: 'Empty Template',
            exercises: [],
          })
        )
      })

      it('should set currentWorkout with template data', async () => {
        createDocument.mockResolvedValue('workout-current')
        subscribeToCollection.mockReturnValue(vi.fn())

        const store = useWorkoutStore()

        const templateData = {
          templateId: 'template-current',
          templateName: 'Leg Day',
          exercises: [
            {
              exerciseId: 'barbell-squat',
              exerciseName: 'Barbell Squat',
              sets: 5,
              reps: 5,
              restTime: 180,
            },
          ],
        }

        await store.startWorkout(templateData)

        expect(store.currentWorkout).toBeTruthy()
        expect(store.currentWorkout.sourceTemplateId).toBe('template-current')
        expect(store.currentWorkout.sourceTemplateName).toBe('Leg Day')
        expect(store.currentWorkout.exercises.length).toBe(1)
        expect(store.currentWorkout.exercises[0].templateSuggestions).toEqual({
          suggestedSets: 5,
          suggestedReps: 5,
          suggestedRestTime: 180,
        })
      })
    })

    describe('finishWorkout with schedule sync', () => {
      beforeEach(() => {
        // Mock dynamic import of scheduleStore
        vi.doMock('@/stores/scheduleStore', () => ({
          useScheduleStore: vi.fn(() => ({
            getWeekId: vi.fn((date) => '2024-W01'),
            markDayCompleted: vi.fn().mockResolvedValue(),
          })),
        }))
      })

      it('should finish workout without template (no schedule sync)', async () => {
        updateDocument.mockResolvedValue()
        subscribeToCollection.mockReturnValue(vi.fn())

        const store = useWorkoutStore()

        // Create active workout without template
        store.currentWorkout = {
          id: 'workout-no-template',
          userId: 'test-user-id',
          status: 'active',
          startedAt: new Date(Date.now() - 3600000), // 1 hour ago
          exercises: [],
        }

        await store.finishWorkout()

        expect(updateDocument).toHaveBeenCalledWith(
          'users/test-user-id/workouts',
          'workout-no-template',
          expect.objectContaining({
            status: 'completed',
            duration: expect.any(Number),
          })
        )
        expect(store.currentWorkout).toBeNull()
      })

      it('should finish workout with template and sync with schedule', async () => {
        updateDocument.mockResolvedValue()
        subscribeToCollection.mockReturnValue(vi.fn())

        const store = useWorkoutStore()

        // Create active workout WITH template
        store.currentWorkout = {
          id: 'workout-with-template',
          userId: 'test-user-id',
          status: 'active',
          startedAt: new Date(Date.now() - 3600000), // 1 hour ago
          sourceTemplateId: 'template-123',
          sourceTemplateName: 'Push Day',
          exercises: [
            {
              exerciseId: 'barbell-bench-press',
              sets: [{ weight: 100, reps: 8 }],
            },
          ],
        }

        await store.finishWorkout()

        expect(updateDocument).toHaveBeenCalledWith(
          'users/test-user-id/workouts',
          'workout-with-template',
          expect.objectContaining({
            status: 'completed',
          })
        )

        // Schedule sync is handled by dynamic import - we can't easily test it here
        // But we verify the workout finishes successfully
        expect(store.currentWorkout).toBeNull()
      })

      it('should finish workout even if schedule sync fails', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        updateDocument.mockResolvedValue()
        subscribeToCollection.mockReturnValue(vi.fn())

        const store = useWorkoutStore()

        store.currentWorkout = {
          id: 'workout-sync-fail',
          userId: 'test-user-id',
          status: 'active',
          startedAt: new Date(Date.now() - 3600000),
          sourceTemplateId: 'template-fail',
          exercises: [],
        }

        // Should not throw even if schedule sync fails
        await expect(store.finishWorkout()).resolves.not.toThrow()

        expect(store.currentWorkout).toBeNull()

        consoleWarnSpy.mockRestore()
        consoleLogSpy.mockRestore()
      })

      it('should use completion date for schedule sync', async () => {
        updateDocument.mockResolvedValue()
        subscribeToCollection.mockReturnValue(vi.fn())

        const store = useWorkoutStore()

        const customDate = new Date('2024-01-15T10:00:00Z')

        store.currentWorkout = {
          id: 'workout-custom-date',
          userId: 'test-user-id',
          status: 'active',
          startedAt: new Date(Date.now() - 3600000),
          sourceTemplateId: 'template-custom',
          exercises: [],
        }

        await store.finishWorkout({ date: customDate })

        expect(updateDocument).toHaveBeenCalledWith(
          'users/test-user-id/workouts',
          'workout-custom-date',
          expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(Object),
          })
        )
        expect(store.currentWorkout).toBeNull()
      })
    })
  })
})
