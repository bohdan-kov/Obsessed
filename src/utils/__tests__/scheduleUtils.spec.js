import { describe, it, expect } from 'vitest'
import {
  getWeekId,
  getWeekStartDate,
  getWeekEndDate,
  getWeekDays,
  isToday,
  isDayInPast,
  formatWeekLabel,
  getDayNameFromDate,
  getNextWeekId,
  getPreviousWeekId,
  createEmptyDaySchedule,
  createEmptyWeekSchedule,
  getDayStatus,
} from '../scheduleUtils'

describe('scheduleUtils', () => {
  describe('getWeekId', () => {
    it('returns correct week ID for a date', () => {
      // January 8, 2026 is Thursday of week 2
      const date = new Date('2026-01-08')
      const weekId = getWeekId(date)

      expect(weekId).toBe('2026-W02')
    })

    it('handles year boundary correctly', () => {
      // December 29, 2025 is Monday of week 1 of 2026
      const date = new Date('2025-12-29')
      const weekId = getWeekId(date)

      expect(weekId).toBe('2026-W01')
    })

    it('uses current date when no date provided', () => {
      const weekId = getWeekId()

      expect(weekId).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('getWeekStartDate', () => {
    it('returns Monday of the week', () => {
      const monday = getWeekStartDate('2026-W02')

      expect(monday.getDay()).toBe(1) // Monday is 1
      expect(monday.getHours()).toBe(0)
      expect(monday.getMinutes()).toBe(0)
      expect(monday.getSeconds()).toBe(0)
    })

    it('returns correct date for week 1', () => {
      const monday = getWeekStartDate('2026-W01')

      // Week 1 of 2026 starts on December 29, 2025 (ISO 8601)
      expect(monday.getDay()).toBe(1) // Monday
      expect(monday.getFullYear()).toBe(2025)
      expect(monday.getMonth()).toBe(11) // December
      expect(monday.getDate()).toBe(29)
    })
  })

  describe('getWeekEndDate', () => {
    it('returns Sunday of the week', () => {
      const sunday = getWeekEndDate('2026-W02')

      expect(sunday.getDay()).toBe(0) // Sunday is 0
      expect(sunday.getHours()).toBe(23)
      expect(sunday.getMinutes()).toBe(59)
      expect(sunday.getSeconds()).toBe(59)
    })
  })

  describe('getWeekDays', () => {
    it('returns all 7 days with metadata', () => {
      const days = getWeekDays('2026-W02')

      expect(days).toHaveLength(7)
      expect(days[0].name).toBe('monday')
      expect(days[6].name).toBe('sunday')

      days.forEach((day) => {
        expect(day).toHaveProperty('name')
        expect(day).toHaveProperty('date')
        expect(day).toHaveProperty('label')
        expect(day).toHaveProperty('dayOfMonth')
      })
    })

    it('returns correct dates for each day', () => {
      const days = getWeekDays('2026-W02')

      // Week 2 of 2026: January 5-11 (Monday to Sunday)
      expect(days[0].date.getDay()).toBe(1) // Monday
      expect(days[0].date.getMonth()).toBe(0) // January
      expect(days[0].date.getFullYear()).toBe(2026)

      expect(days[6].date.getDay()).toBe(0) // Sunday
      expect(days[6].date.getMonth()).toBe(0) // January
      expect(days[6].date.getFullYear()).toBe(2026)
    })
  })

  describe('isToday', () => {
    it('returns true for current day', () => {
      const today = new Date()
      const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

      expect(isToday(todayName)).toBe(true)
    })

    it('returns false for other days', () => {
      const today = new Date()
      const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

      const otherDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        .filter((day) => day !== todayName)

      otherDays.forEach((day) => {
        expect(isToday(day)).toBe(false)
      })
    })
  })

  describe('isDayInPast', () => {
    it('returns true for days in past weeks', () => {
      const lastWeek = getPreviousWeekId(getWeekId())

      expect(isDayInPast('monday', lastWeek)).toBe(true)
    })

    it('returns false for days in future weeks', () => {
      const nextWeek = getNextWeekId(getWeekId())

      expect(isDayInPast('monday', nextWeek)).toBe(false)
    })
  })

  describe('formatWeekLabel', () => {
    it('formats week label for same month', () => {
      // Week 3 of 2026: January 12-18
      const label = formatWeekLabel('2026-W03', 'en-US')

      expect(label).toContain('Jan')
      expect(label).toMatch(/\d+/)
    })

    it('formats week label for different months', () => {
      // Week 1 of 2026: December 29, 2025 - January 4, 2026
      const label = formatWeekLabel('2026-W01', 'en-US')

      expect(label).toContain('Dec')
      expect(label).toContain('Jan')
    })
  })

  describe('getDayNameFromDate', () => {
    it('returns lowercase day name', () => {
      const date = new Date('2026-01-05') // Monday

      const dayName = getDayNameFromDate(date)

      expect(dayName).toBe('monday')
    })
  })

  describe('getNextWeekId', () => {
    it('returns next week ID', () => {
      const nextWeek = getNextWeekId('2026-W03')

      expect(nextWeek).toBe('2026-W04')
    })

    it('handles year boundary', () => {
      // 2026 has 53 weeks, so use week 53
      const nextWeek = getNextWeekId('2026-W53')

      expect(nextWeek).toMatch(/^2027-W/)
    })
  })

  describe('getPreviousWeekId', () => {
    it('returns previous week ID', () => {
      const prevWeek = getPreviousWeekId('2026-W03')

      expect(prevWeek).toBe('2026-W02')
    })

    it('handles year boundary', () => {
      const prevWeek = getPreviousWeekId('2026-W01')

      // Week before W01 of 2026 is the last week of 2025
      expect(prevWeek).toMatch(/^2025-W/)
    })
  })

  describe('createEmptyDaySchedule', () => {
    it('creates empty day schedule structure', () => {
      const daySchedule = createEmptyDaySchedule()

      expect(daySchedule).toEqual({
        templateId: null,
        templateName: null,
        muscleGroups: [],
        completed: false,
        workoutId: null,
      })
    })
  })

  describe('createEmptyWeekSchedule', () => {
    it('creates empty week schedule with all days', () => {
      const schedule = createEmptyWeekSchedule('2026-W02', 'user-123')

      expect(schedule.id).toBe('2026-W02')
      expect(schedule.userId).toBe('user-123')
      expect(schedule.weekStart).toBeInstanceOf(Date)
      expect(schedule.days).toHaveProperty('monday')
      expect(schedule.days).toHaveProperty('tuesday')
      expect(schedule.days).toHaveProperty('wednesday')
      expect(schedule.days).toHaveProperty('thursday')
      expect(schedule.days).toHaveProperty('friday')
      expect(schedule.days).toHaveProperty('saturday')
      expect(schedule.days).toHaveProperty('sunday')

      Object.values(schedule.days).forEach((day) => {
        expect(day.templateId).toBeNull()
        expect(day.completed).toBe(false)
      })
    })
  })

  describe('getDayStatus', () => {
    it('returns "completed" for completed day', () => {
      const dayData = {
        templateId: 'template-1',
        completed: true,
      }

      expect(getDayStatus(dayData, false)).toBe('completed')
      expect(getDayStatus(dayData, true)).toBe('completed')
    })

    it('returns "rest" for day without template', () => {
      const dayData = {
        templateId: null,
        completed: false,
      }

      expect(getDayStatus(dayData, false)).toBe('rest')
      expect(getDayStatus(dayData, true)).toBe('rest')
    })

    it('returns "missed" for past day with template not completed', () => {
      const dayData = {
        templateId: 'template-1',
        completed: false,
      }

      expect(getDayStatus(dayData, true)).toBe('missed')
    })

    it('returns "planned" for future day with template', () => {
      const dayData = {
        templateId: 'template-1',
        completed: false,
      }

      expect(getDayStatus(dayData, false)).toBe('planned')
    })
  })
})
