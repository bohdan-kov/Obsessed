import { describe, it, expect } from 'vitest'
import { getWeekNumber, startOfWeek, groupWorkoutsByWeek, formatWeekLabel } from '../dateUtils'

describe('dateUtils - Analytics Extensions', () => {
  describe('getWeekNumber', () => {
    it('should return ISO week number', () => {
      // Jan 1, 2024 is Monday (Week 1)
      expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1)

      // Dec 31, 2023 was Sunday (Week 52 of 2023)
      expect(getWeekNumber(new Date(2023, 11, 31))).toBe(52)
    })

    it('should handle mid-year dates', () => {
      // June 17, 2024 (Monday of Week 25)
      expect(getWeekNumber(new Date(2024, 5, 17))).toBe(25)
    })

    it('should handle year transitions correctly', () => {
      // Week containing Jan 4 is always week 1
      // Jan 1, 2024 is Monday - should be week 1
      expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1)

      // Jan 4, 2024 is Thursday - should be week 1
      expect(getWeekNumber(new Date(2024, 0, 4))).toBe(1)
    })

    it('should return consistent week numbers for same week', () => {
      // All days in same week should have same week number
      const monday = new Date(2024, 5, 17)
      const tuesday = new Date(2024, 5, 18)
      const sunday = new Date(2024, 5, 23)

      const weekNum = getWeekNumber(monday)
      expect(getWeekNumber(tuesday)).toBe(weekNum)
      expect(getWeekNumber(sunday)).toBe(weekNum)
    })
  })

  describe('startOfWeek', () => {
    it('should return Monday for any day of the week', () => {
      // Week of June 17-23, 2024
      const monday = new Date(2024, 5, 17)
      const wednesday = new Date(2024, 5, 19)
      const sunday = new Date(2024, 5, 23)

      const mondayStart = startOfWeek(monday)
      expect(mondayStart.getDay()).toBe(1) // Monday
      expect(mondayStart.getDate()).toBe(17)

      const wednesdayStart = startOfWeek(wednesday)
      expect(wednesdayStart.getDay()).toBe(1)
      expect(wednesdayStart.getDate()).toBe(17)

      const sundayStart = startOfWeek(sunday)
      expect(sundayStart.getDay()).toBe(1)
      expect(sundayStart.getDate()).toBe(17)
    })

    it('should return same date if already Monday', () => {
      const monday = new Date(2024, 5, 17)
      const result = startOfWeek(monday)

      expect(result.getDay()).toBe(1)
      expect(result.getDate()).toBe(17)
      expect(result.getMonth()).toBe(5)
      expect(result.getFullYear()).toBe(2024)
    })

    it('should handle Sunday correctly (go to previous Monday)', () => {
      const sunday = new Date(2024, 5, 23) // June 23, 2024
      const result = startOfWeek(sunday)

      expect(result.getDay()).toBe(1) // Monday
      expect(result.getDate()).toBe(17) // June 17, 2024
    })

    it('should set time to 00:00:00', () => {
      const date = new Date(2024, 5, 19, 15, 30, 45) // Wednesday 3:30:45 PM
      const result = startOfWeek(date)

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })

    it('should handle month boundaries', () => {
      const endOfMonth = new Date(2024, 4, 31) // May 31, 2024 (Friday)
      const result = startOfWeek(endOfMonth)

      expect(result.getDay()).toBe(1) // Monday
      expect(result.getDate()).toBe(27) // May 27, 2024
    })
  })

  describe('groupWorkoutsByWeek', () => {
    it('should return empty array for empty workouts', () => {
      expect(groupWorkoutsByWeek([])).toEqual([])
      expect(groupWorkoutsByWeek(null)).toEqual([])
      expect(groupWorkoutsByWeek(undefined)).toEqual([])
    })

    it('should group workouts by week (Monday start)', () => {
      const workouts = [
        { id: '1', createdAt: new Date(2024, 5, 17) }, // Monday
        { id: '2', createdAt: new Date(2024, 5, 19) }, // Wednesday (same week)
        { id: '3', createdAt: new Date(2024, 5, 24) }, // Monday (next week)
      ]

      const result = groupWorkoutsByWeek(workouts)

      expect(result).toHaveLength(2)
      expect(result[0].workouts).toHaveLength(2) // Week 1: workouts 1 & 2
      expect(result[1].workouts).toHaveLength(1) // Week 2: workout 3
    })

    it('should include weekNumber and startDate', () => {
      const workouts = [{ id: '1', createdAt: new Date(2024, 5, 17) }]

      const result = groupWorkoutsByWeek(workouts)

      expect(result[0]).toHaveProperty('weekNumber')
      expect(result[0]).toHaveProperty('startDate')
      expect(result[0].startDate.getDay()).toBe(1) // Monday
    })

    it('should sort weeks chronologically', () => {
      const workouts = [
        { id: '3', createdAt: new Date(2024, 5, 24) }, // Week 2
        { id: '1', createdAt: new Date(2024, 5, 10) }, // Week 1
        { id: '2', createdAt: new Date(2024, 6, 1) }, // Week 3
      ]

      const result = groupWorkoutsByWeek(workouts)

      expect(result).toHaveLength(3)
      expect(result[0].startDate < result[1].startDate).toBe(true)
      expect(result[1].startDate < result[2].startDate).toBe(true)
    })

    it('should skip workouts without createdAt', () => {
      const workouts = [
        { id: '1', createdAt: new Date(2024, 5, 17) },
        { id: '2', createdAt: null },
        { id: '3', createdAt: undefined },
      ]

      const result = groupWorkoutsByWeek(workouts)

      expect(result).toHaveLength(1)
      expect(result[0].workouts).toHaveLength(1)
      expect(result[0].workouts[0].id).toBe('1')
    })

    it('should handle workouts spanning multiple months', () => {
      const workouts = [
        { id: '1', createdAt: new Date(2024, 4, 27) }, // May 27 (Monday)
        { id: '2', createdAt: new Date(2024, 4, 31) }, // May 31 (Friday, same week)
        { id: '3', createdAt: new Date(2024, 5, 3) }, // June 3 (Monday, next week)
      ]

      const result = groupWorkoutsByWeek(workouts)

      expect(result).toHaveLength(2)
      expect(result[0].workouts).toHaveLength(2) // May 27 - May 31
      expect(result[1].workouts).toHaveLength(1) // June 3
    })
  })

  describe('formatWeekLabel', () => {
    it('should format week label with default locale (uk)', () => {
      const date = new Date(2024, 5, 17) // June 17, 2024
      const label = formatWeekLabel(date)

      // Ukrainian format: "17 черв"
      expect(label).toContain('17')
      expect(label).toContain('черв') // June in Ukrainian
    })

    it('should format week label with English locale', () => {
      const date = new Date(2024, 5, 17) // June 17, 2024
      const label = formatWeekLabel(date, 'en')

      // English format: "Jun 17"
      expect(label).toContain('17')
      expect(label).toContain('Jun')
    })

    it('should handle different dates', () => {
      const jan1 = new Date(2024, 0, 1)
      const dec31 = new Date(2024, 11, 31)

      const jan1Label = formatWeekLabel(jan1, 'en')
      const dec31Label = formatWeekLabel(dec31, 'en')

      expect(jan1Label).toContain('Jan')
      expect(jan1Label).toContain('1')

      expect(dec31Label).toContain('Dec')
      expect(dec31Label).toContain('31')
    })

    it('should handle month boundaries', () => {
      const endOfMonth = new Date(2024, 4, 31) // May 31
      const label = formatWeekLabel(endOfMonth, 'en')

      expect(label).toContain('May')
      expect(label).toContain('31')
    })
  })
})
