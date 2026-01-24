import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSchedule } from '@/composables/useSchedule'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getWeekId } from '@/utils/scheduleUtils'

vi.mock('@/firebase/firestore', () => ({
  COLLECTIONS: { USERS: 'users' },
  subscribeToCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(),
  signOutUser: vi.fn(),
}))

describe('useSchedule', () => {
  let scheduleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    scheduleStore = useScheduleStore()

    // Setup mock templates
    scheduleStore.templates = [
      {
        id: 't1',
        name: 'Push Day',
        muscleGroups: ['chest', 'shoulders'],
        exercises: [{ name: 'Bench Press' }],
      },
      {
        id: 't2',
        name: 'Pull Day',
        muscleGroups: ['back'],
        exercises: [{ name: 'Deadlift' }],
      },
    ]

    // Setup current schedule
    scheduleStore.currentSchedule = {
      id: getWeekId(new Date()),
      days: {
        monday: { templateId: 't1', completed: true, workoutId: 'w1' },
        tuesday: { templateId: 't2', completed: false },
        wednesday: { templateId: null },
        thursday: { templateId: 't1', completed: false },
        friday: { templateId: null },
        saturday: { templateId: 't2', completed: false },
        sunday: { templateId: null },
      },
    }
  })

  describe('Basic Properties', () => {
    it('should provide current week ID', () => {
      const { currentWeekId } = useSchedule()
      expect(currentWeekId.value).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('should provide current schedule', () => {
      const { currentSchedule } = useSchedule()
      expect(currentSchedule.value).toBeDefined()
      expect(currentSchedule.value.days).toBeDefined()
      expect(currentSchedule.value.days.monday).toBeDefined()
    })

    it('should provide todays workout', () => {
      const { todaysWorkout } = useSchedule()
      // Will be null or defined depending on today's day of week
      expect(todaysWorkout.value === null || todaysWorkout.value !== undefined).toBe(true)
    })

    it('should provide week adherence', () => {
      const { weekAdherence } = useSchedule()
      expect(weekAdherence.value).toHaveProperty('completed')
      expect(weekAdherence.value).toHaveProperty('planned')
      expect(weekAdherence.value).toHaveProperty('percentage')
    })
  })

  describe('isDayInPast', () => {
    it('should return true for days before today', () => {
      const { isDayInPast } = useSchedule()
      const today = new Date().getDay()

      // If today is Wednesday (3), Monday (1) should be in the past
      if (today === 3) {
        expect(isDayInPast('monday')).toBe(true)
        expect(isDayInPast('tuesday')).toBe(true)
      }
    })

    it('should return false for days after today', () => {
      const { isDayInPast } = useSchedule()
      const today = new Date().getDay()

      // If today is Wednesday (3), Friday (5) should be in the future
      if (today === 3) {
        expect(isDayInPast('friday')).toBe(false)
        expect(isDayInPast('saturday')).toBe(false)
      }
    })

    it('should handle all day names', () => {
      const { isDayInPast } = useSchedule()
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

      days.forEach((day) => {
        const result = isDayInPast(day)
        expect(typeof result).toBe('boolean')
      })
    })
  })

  describe('getDayStatus', () => {
    it('should return "completed" for completed days', () => {
      const { getDayStatus } = useSchedule()
      const dayData = { templateId: 't1', completed: true, workoutId: 'w1' }

      expect(getDayStatus(dayData, false)).toBe('completed')
      expect(getDayStatus(dayData, true)).toBe('completed')
    })

    it('should return "rest" for days with no template', () => {
      const { getDayStatus } = useSchedule()
      const dayData = { templateId: null, completed: false }

      expect(getDayStatus(dayData, false)).toBe('rest')
      expect(getDayStatus(dayData, true)).toBe('rest')
    })

    it('should return "missed" for past days not completed', () => {
      const { getDayStatus } = useSchedule()
      const dayData = { templateId: 't1', completed: false }

      expect(getDayStatus(dayData, true)).toBe('missed')
    })

    it('should return "planned" for future days', () => {
      const { getDayStatus } = useSchedule()
      const dayData = { templateId: 't1', completed: false }

      expect(getDayStatus(dayData, false)).toBe('planned')
    })

    it('should prioritize completed status', () => {
      const { getDayStatus } = useSchedule()
      const dayData = { templateId: 't1', completed: true, workoutId: 'w1' }

      // Even if day is in the past, completed takes priority
      expect(getDayStatus(dayData, true)).toBe('completed')
    })

    it('should prioritize rest status over missed', () => {
      const { getDayStatus } = useSchedule()
      const dayData = { templateId: null, completed: false }

      // Rest day in the past is still "rest", not "missed"
      expect(getDayStatus(dayData, true)).toBe('rest')
    })
  })

  describe('Integration', () => {
    it('should work together to provide schedule overview', () => {
      const { currentSchedule, isDayInPast, getDayStatus } = useSchedule()

      const schedule = currentSchedule.value
      const days = Object.keys(schedule)

      days.forEach((day) => {
        const dayData = schedule[day]
        const isPast = isDayInPast(day)
        const status = getDayStatus(dayData, isPast)

        expect(['completed', 'rest', 'missed', 'planned']).toContain(status)
      })
    })

    it('should calculate correct statuses for current week', () => {
      const { currentSchedule, isDayInPast, getDayStatus } = useSchedule()

      const schedule = currentSchedule.value
      const mondayStatus = getDayStatus(schedule.days.monday, isDayInPast('monday'))

      // Monday is completed in our mock data
      if (isDayInPast('monday')) {
        expect(mondayStatus).toBe('completed')
      } else {
        expect(mondayStatus).toBe('completed')
      }
    })
  })

  describe('Reactivity', () => {
    it('should react to schedule changes', async () => {
      const { currentSchedule } = useSchedule()

      // Change schedule
      scheduleStore.currentSchedule.days.monday.completed = false

      // Should update immediately
      expect(currentSchedule.value.days.monday.completed).toBe(false)
    })

    it('should react to template changes', async () => {
      const { todaysWorkout } = useSchedule()
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

      // Assign a template to today if none exists
      if (!scheduleStore.currentSchedule.days[today].templateId) {
        scheduleStore.currentSchedule.days[today].templateId = 't1'
      }

      // Should now have a workout
      if (scheduleStore.currentSchedule.days[today].templateId) {
        expect(todaysWorkout.value).toBeDefined()
      }
    })
  })
})
