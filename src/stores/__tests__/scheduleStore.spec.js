import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useAuthStore } from '@/stores/authStore'
import { getWeekId } from '@/utils/scheduleUtils'
import * as firestoreModule from '@/firebase/firestore'

// Mock Firebase before imports
vi.mock('@/firebase/firestore', () => ({
  COLLECTIONS: {
    USERS: 'users',
  },
  subscribeToCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  fetchCollection: vi.fn(),
  fetchDocument: vi.fn(),
  setDocument: vi.fn(),
  serverTimestamp: vi.fn(() => Date.now()),
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(),
  signOutUser: vi.fn(),
}))

// Mock workoutStore for dynamic import in startWorkoutFromTemplate
const mockStartWorkout = vi.fn()
vi.mock('@/stores/workoutStore', () => ({
  useWorkoutStore: () => ({
    startWorkout: mockStartWorkout,
  }),
}))

describe('scheduleStore', () => {
  let store
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.user = { uid: 'test-user-id' }
    store = useScheduleStore()

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('State Initialization', () => {
    it('should initialize with empty state', () => {
      expect(store.templates).toEqual([])
      expect(store.currentSchedule).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      // Setup mock templates
      store.templates = [
        {
          id: 't1',
          name: 'Push Day',
          muscleGroups: ['chest', 'shoulders'],
          exercises: [{ name: 'Bench Press' }],
          estimatedDuration: 60,
          usageCount: 5,
          lastUsedAt: Date.now(),
        },
        {
          id: 't2',
          name: 'Pull Day',
          muscleGroups: ['back'],
          exercises: [{ name: 'Deadlift' }],
          estimatedDuration: 45,
          usageCount: 3,
          lastUsedAt: Date.now() - 86400000,
        },
        {
          id: 't3',
          name: 'Leg Day',
          muscleGroups: ['legs'],
          exercises: [{ name: 'Squat' }],
          estimatedDuration: 50,
          usageCount: 0,
        },
      ]

      // Setup mock schedule
      store.currentSchedule = {
        weekId: getWeekId(new Date()),
        days: {
          monday: { templateId: 't1', completed: true, workoutId: 'w1' },
          tuesday: { templateId: 't2', completed: false },
          wednesday: { templateId: null },
          thursday: { templateId: 't1', completed: false },
          friday: { templateId: null },
          saturday: { templateId: 't3', completed: false },
          sunday: { templateId: null },
        },
      }
    })

    it('should get template by ID', () => {
      const template = store.getTemplateById('t1')
      expect(template).toBeDefined()
      expect(template.name).toBe('Push Day')
    })

    it('should return undefined for non-existent template', () => {
      const template = store.getTemplateById('non-existent')
      expect(template).toBeUndefined()
    })

    it('should group templates by primary muscle', () => {
      const byMuscle = store.templatesByMuscle
      // Templates are grouped by their PRIMARY muscle (first in array)
      expect(byMuscle.chest).toHaveLength(1)
      expect(byMuscle.chest[0].name).toBe('Push Day')
      expect(byMuscle.back).toHaveLength(1)
      expect(byMuscle.back[0].name).toBe('Pull Day')
      expect(byMuscle.legs).toHaveLength(1)
      expect(byMuscle.legs[0].name).toBe('Leg Day')
    })

    it('should get templates sorted by usage', () => {
      const byUsage = store.templatesByUsage
      expect(byUsage).toHaveLength(3)
      expect(byUsage[0].name).toBe('Push Day')
      expect(byUsage[1].name).toBe('Pull Day')
    })

    it('should get current week schedule', () => {
      const schedule = store.currentSchedule
      expect(schedule).toBeDefined()
      expect(schedule.days.monday.templateId).toBe('t1')
    })

    it('should get todays workout', () => {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const todaysWorkout = store.todaysWorkout

      // todaysWorkout should always return the day object
      expect(todaysWorkout).toBeDefined()
      expect(todaysWorkout).toHaveProperty('templateId')

      // Check if template is assigned based on actual schedule data
      if (store.currentSchedule.days[today]?.templateId) {
        expect(todaysWorkout.templateId).toBeTruthy()
      } else {
        expect(todaysWorkout.templateId).toBeNull()
      }
    })

    it('should calculate week adherence', () => {
      const adherence = store.weekAdherence
      expect(adherence).toHaveProperty('completed')
      expect(adherence).toHaveProperty('planned')
      expect(adherence).toHaveProperty('percentage')
      expect(adherence.completed).toBe(1)
      expect(adherence.planned).toBe(4)
      expect(adherence.percentage).toBe(25)
    })

    it('should handle zero planned workouts in adherence', () => {
      store.currentSchedule = {
        weekId: getWeekId(new Date()),
        days: {
          monday: { templateId: null },
          tuesday: { templateId: null },
          wednesday: { templateId: null },
          thursday: { templateId: null },
          friday: { templateId: null },
          saturday: { templateId: null },
          sunday: { templateId: null },
        },
      }

      const adherence = store.weekAdherence
      expect(adherence.percentage).toBe(0)
    })
  })

  describe('Template Actions', () => {
    it('should create a template', async () => {
      const mockTemplate = {
        id: 'new-template-id',
        name: 'New Template',
        exercises: [
          {
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 10,
            restTime: 90,
          },
        ],
        muscleGroups: ['chest'],
        estimatedDuration: 30,
        usageCount: 0,
        lastUsedAt: null,
        createdAt: Date.now(),
      }

      firestoreModule.createDocument.mockResolvedValue(mockTemplate.id)

      firestoreModule.fetchCollection.mockResolvedValue([mockTemplate])

      const result = await store.createTemplate({
        name: 'New Template',
        exercises: [
          {
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 10,
            restTime: 90,
          },
        ],
      })

      expect(firestoreModule.createDocument).toHaveBeenCalled()
      expect(result).toBe(mockTemplate.id)
      expect(store.templates).toContainEqual(expect.objectContaining({ id: mockTemplate.id }))
    })

    it('should update a template', async () => {
      store.templates = [
        {
          id: 't1',
          name: 'Old Name',
          exercises: [
            {
              exerciseId: 'squat',
              exerciseName: 'Squat',
              sets: 3,
              reps: 10,
              restTime: 90,
            },
          ],
          muscleGroups: ['legs'],
        },
      ]

      firestoreModule.updateDocument.mockResolvedValue()
      firestoreModule.fetchCollection.mockResolvedValue([
        {
          id: 't1',
          name: 'New Name',
          exercises: [
            {
              exerciseId: 'squat',
              exerciseName: 'Squat',
              sets: 3,
              reps: 10,
              restTime: 90,
            },
          ],
          muscleGroups: ['legs'],
        },
      ])

      await store.updateTemplate('t1', { name: 'New Name' })

      expect(firestoreModule.updateDocument).toHaveBeenCalled()
      const updated = store.templates.find((t) => t.id === 't1')
      expect(updated.name).toBe('New Name')
    })

    it('should delete a template', async () => {
      store.templates = [
        { id: 't1', name: 'Template 1' },
        { id: 't2', name: 'Template 2' },
      ]

      firestoreModule.deleteDocument.mockResolvedValue()

      await store.deleteTemplate('t1')

      expect(firestoreModule.deleteDocument).toHaveBeenCalled()
      expect(store.templates).toHaveLength(1)
      expect(store.templates[0].id).toBe('t2')
    })

  })

  describe('Schedule Actions', () => {
    it('should assign template to day', async () => {
      const weekId = getWeekId(new Date())
      store.templates = [
        {
          id: 't1',
          name: 'Template 1',
          muscleGroups: ['legs'],
          exercises: [
            {
              exerciseId: 'squat',
              exerciseName: 'Squat',
              sets: 3,
              reps: 10,
              restTime: 90,
            },
          ],
        },
      ]
      store.currentSchedule = {
        id: weekId,
        days: {
          monday: { templateId: null, templateName: null, muscleGroups: [], completed: false, workoutId: null },
        },
      }

      vi.mocked(firestoreModule.updateDocument).mockResolvedValue()
      vi.mocked(firestoreModule.fetchDocument).mockResolvedValue({
        id: weekId,
        days: {
          monday: {
            templateId: 't1',
            templateName: 'Template 1',
            muscleGroups: ['legs'],
            completed: false,
            workoutId: null,
          },
        },
      })

      await store.assignTemplateToDay(weekId, 'monday', 't1')

      expect(firestoreModule.updateDocument).toHaveBeenCalled()
      expect(store.currentSchedule.days.monday.templateId).toBe('t1')
    })

    it('should mark day as completed', async () => {
      const weekId = getWeekId(new Date())
      store.currentSchedule = {
        id: weekId,
        days: {
          monday: { templateId: 't1', templateName: 'Template 1', muscleGroups: [], completed: false, workoutId: null },
        },
      }

      vi.mocked(firestoreModule.updateDocument).mockResolvedValue()

      await store.markDayCompleted(weekId, 'monday', 'workout-id')

      expect(firestoreModule.updateDocument).toHaveBeenCalled()
      expect(store.currentSchedule.days.monday.completed).toBe(true)
      expect(store.currentSchedule.days.monday.workoutId).toBe('workout-id')
    })

    it('should remove template from day', async () => {
      const weekId = getWeekId(new Date())
      store.currentSchedule = {
        id: weekId,
        days: {
          monday: {
            templateId: 't1',
            templateName: 'Template 1',
            muscleGroups: ['legs'],
            completed: true,
            workoutId: 'w1',
          },
        },
      }

      vi.mocked(firestoreModule.updateDocument).mockResolvedValue()
      vi.mocked(firestoreModule.fetchDocument).mockResolvedValue({
        id: weekId,
        days: {
          monday: {
            templateId: null,
            templateName: null,
            muscleGroups: [],
            completed: false,
            workoutId: null,
          },
        },
      })

      await store.removeTemplateFromDay(weekId, 'monday')

      expect(firestoreModule.updateDocument).toHaveBeenCalled()
      expect(store.currentSchedule.days.monday.templateId).toBeNull()
    })
  })

  describe('Start Workout From Template', () => {
    let consoleErrorSpy

    beforeEach(() => {
      // Reset the mockStartWorkout mock before each test
      mockStartWorkout.mockReset()

      // Suppress console.error for error propagation tests
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Setup mock template
      store.templates = [
        {
          id: 't1',
          name: 'Push Day',
          muscleGroups: ['chest', 'shoulders'],
          exercises: [
            {
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              sets: 3,
              reps: 10,
              targetWeight: 80,
              restTime: 90,
              notes: 'Focus on form',
            },
            {
              exerciseId: 'shoulder-press',
              exerciseName: 'Shoulder Press',
              sets: 3,
              reps: 12,
              targetWeight: 40,
              restTime: 60,
              notes: '',
            },
          ],
          usageCount: 2,
          lastUsedAt: new Date('2026-01-01'),
        },
      ]
    })

    afterEach(() => {
      // Restore console.error after each test
      consoleErrorSpy?.mockRestore()
    })

    it('should successfully start workout from template', async () => {
      const mockWorkoutId = 'workout-123'

      // Mock workoutStore.startWorkout to return workoutId
      mockStartWorkout.mockResolvedValue(mockWorkoutId)

      const workoutId = await store.startWorkoutFromTemplate('t1')

      expect(workoutId).toBe(mockWorkoutId)

      // Verify startWorkout was called with correct template data
      expect(mockStartWorkout).toHaveBeenCalledTimes(1)
      expect(mockStartWorkout).toHaveBeenCalledWith({
        templateId: 't1',
        templateName: 'Push Day',
        exercises: expect.arrayContaining([
          expect.objectContaining({
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
          }),
        ]),
      })

      // Note: Usage tracking (usageCount, lastUsedAt) is updated when workout FINISHES,
      // not when it starts. See scheduleStore.recordTemplateUsage().
    })

    it('should throw error if template not found', async () => {
      await expect(store.startWorkoutFromTemplate('non-existent')).rejects.toThrow('Template not found')
    })

    it('should throw error if user not authenticated', async () => {
      authStore.user = null

      await expect(store.startWorkoutFromTemplate('t1')).rejects.toThrow(
        'User must be authenticated to start workout',
      )
    })

    it('should propagate workoutStore errors', async () => {
      // Mock workoutStore.startWorkout to throw error
      mockStartWorkout.mockRejectedValue(new Error('Cannot start a new workout while one is active'))

      await expect(store.startWorkoutFromTemplate('t1')).rejects.toThrow(
        'Cannot start a new workout while one is active',
      )
    })

    it('should set loading and error state correctly on success', async () => {
      const mockWorkoutId = 'workout-123'
      mockStartWorkout.mockResolvedValue(mockWorkoutId)

      // Verify loading state is set during operation
      const promise = store.startWorkoutFromTemplate('t1')
      expect(store.loading).toBe(true)

      await promise

      // Verify loading is reset after completion
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should format template data correctly for workoutStore', async () => {
      const mockWorkoutId = 'workout-123'

      // Capture the templateData passed to startWorkout
      mockStartWorkout.mockImplementation((templateData) => {
        return Promise.resolve(mockWorkoutId)
      })

      await store.startWorkoutFromTemplate('t1')

      // Verify the exact format of template data passed to workoutStore
      expect(mockStartWorkout).toHaveBeenCalledWith({
        templateId: 't1',
        templateName: 'Push Day',
        exercises: [
          {
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 10,
            targetWeight: 80,
            restTime: 90,
            notes: 'Focus on form',
          },
          {
            exerciseId: 'shoulder-press',
            exerciseName: 'Shoulder Press',
            sets: 3,
            reps: 12,
            targetWeight: 40,
            restTime: 60,
            notes: '',
          },
        ],
      })
    })
  })

  describe('Utility Methods', () => {
    it('should get week ID for a date', () => {
      const date = new Date('2026-01-12') // Monday of week 3 in 2026
      const weekId = store.getWeekId(date)
      expect(weekId).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('should get week start date from week ID', () => {
      const weekStart = store.getWeekStartDate('2026-W02')
      expect(weekStart.getDay()).toBe(1) // Monday
    })
  })

  describe('Error Handling', () => {
    let consoleErrorSpy

    beforeEach(() => {
      // Suppress console.error for error tests
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      // Restore console.error after each test
      consoleErrorSpy?.mockRestore()
    })

    it('should handle validation errors in createTemplate', async () => {
      // Missing exercises - should fail validation
      await expect(store.createTemplate({ name: 'Test' })).rejects.toThrow(
        'At least one exercise is required',
      )
    })

    it('should handle errors when template not found', async () => {
      const weekId = getWeekId(new Date())
      store.currentSchedule = { monday: { templateId: null } }

      // Try to assign non-existent template
      await expect(store.assignTemplateToDay(weekId, 'monday', 'non-existent')).rejects.toThrow(
        'Template not found',
      )
    })
  })
})
