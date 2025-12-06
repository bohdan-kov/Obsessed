import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  normalizeDate,
  getStartOfDay,
  getStartOfWeek,
  getStartOfMonth,
  subDays,
  addDays,
  diffInDays,
  isSameDay,
  isWithinRange,
  getThisMonthRange,
  getLastMonthRange,
  getThisWeekRange,
  getLastWeekRange,
  getLastNDaysRange,
  getRollingRange,
  getComparisonRollingRange,
  getThisYearRange,
  getLastYearRange,
  getMonthBeforeLastRange,
  getAllTimeRange,
  formatDate,
} from '@/utils/dateUtils'

describe('dateUtils', () => {
  beforeEach(() => {
    // Use fake timers for consistent testing
    vi.useFakeTimers()
    // Set to a known date: Monday, January 15, 2024, 10:30:00
    vi.setSystemTime(new Date('2024-01-15T10:30:00'))
  })

  describe('normalizeDate', () => {
    it('should handle Date objects', () => {
      const date = new Date('2024-01-15')
      const result = normalizeDate(date)
      expect(result).toBeInstanceOf(Date)
      expect(result.getTime()).toBe(date.getTime())
    })

    it('should handle Firebase Timestamp objects', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15'),
      }
      const result = normalizeDate(mockTimestamp)
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
    })

    it('should handle ISO string', () => {
      const isoString = '2024-01-15T00:00:00.000Z'
      const result = normalizeDate(isoString)
      expect(result).toBeInstanceOf(Date)
    })

    it('should return current date if no input', () => {
      const result = normalizeDate(null)
      expect(result).toBeInstanceOf(Date)
      // Should be approximately current time
      expect(result.getFullYear()).toBe(2024)
    })
  })

  describe('getStartOfDay', () => {
    it('should set time to 00:00:00.000', () => {
      const date = new Date('2024-01-15T15:30:45.123')
      const result = getStartOfDay(date)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })

    it('should preserve date components', () => {
      const date = new Date('2024-01-15T15:30:00')
      const result = getStartOfDay(date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
    })
  })

  describe('getStartOfWeek', () => {
    it('should return Monday when startDay is 1', () => {
      // Jan 15, 2024 is a Monday
      const date = new Date('2024-01-15')
      const result = getStartOfWeek(date, 1)
      expect(result.getDay()).toBe(1) // Monday
    })

    it('should handle dates in middle of week', () => {
      // Jan 17, 2024 is a Wednesday
      const date = new Date('2024-01-17')
      const result = getStartOfWeek(date, 1)
      expect(result.getDay()).toBe(1) // Should return Monday
      expect(result.getDate()).toBe(15) // Jan 15 is Monday
    })

    it('should handle Sunday as start of week', () => {
      const date = new Date('2024-01-17')
      const result = getStartOfWeek(date, 0)
      expect(result.getDay()).toBe(0) // Sunday
      expect(result.getDate()).toBe(14) // Jan 14 is Sunday
    })
  })

  describe('getStartOfMonth', () => {
    it('should return first day of month', () => {
      const date = new Date('2024-01-15')
      const result = getStartOfMonth(date)
      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(0)
      expect(result.getFullYear()).toBe(2024)
    })

    it('should set time to 00:00:00', () => {
      const date = new Date('2024-01-15T15:30:00')
      const result = getStartOfMonth(date)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })
  })

  describe('subDays', () => {
    it('should subtract days correctly', () => {
      const date = new Date('2024-01-15')
      const result = subDays(date, 5)
      expect(result.getDate()).toBe(10)
      expect(result.getMonth()).toBe(0)
    })

    it('should handle month boundaries', () => {
      const date = new Date('2024-01-05')
      const result = subDays(date, 10)
      expect(result.getDate()).toBe(26)
      expect(result.getMonth()).toBe(11) // December
      expect(result.getFullYear()).toBe(2023)
    })
  })

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-15')
      const result = addDays(date, 5)
      expect(result.getDate()).toBe(20)
      expect(result.getMonth()).toBe(0)
    })

    it('should handle month boundaries', () => {
      const date = new Date('2024-01-25')
      const result = addDays(date, 10)
      expect(result.getDate()).toBe(4)
      expect(result.getMonth()).toBe(1) // February
    })
  })

  describe('diffInDays', () => {
    it('should calculate positive difference', () => {
      const dateA = new Date('2024-01-15')
      const dateB = new Date('2024-01-10')
      const result = diffInDays(dateA, dateB)
      expect(result).toBe(5)
    })

    it('should calculate negative difference', () => {
      const dateA = new Date('2024-01-10')
      const dateB = new Date('2024-01-15')
      const result = diffInDays(dateA, dateB)
      expect(result).toBe(-5)
    })

    it('should ignore time component', () => {
      const dateA = new Date('2024-01-15T23:59:59')
      const dateB = new Date('2024-01-14T00:00:01')
      const result = diffInDays(dateA, dateB)
      expect(result).toBe(1)
    })

    it('should return 0 for same day', () => {
      const dateA = new Date('2024-01-15T10:00:00')
      const dateB = new Date('2024-01-15T20:00:00')
      const result = diffInDays(dateA, dateB)
      expect(result).toBe(0)
    })
  })

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const dateA = new Date('2024-01-15T10:00:00')
      const dateB = new Date('2024-01-15T20:00:00')
      expect(isSameDay(dateA, dateB)).toBe(true)
    })

    it('should return false for different days', () => {
      const dateA = new Date('2024-01-15')
      const dateB = new Date('2024-01-16')
      expect(isSameDay(dateA, dateB)).toBe(false)
    })

    it('should ignore time', () => {
      const dateA = new Date('2024-01-15T23:59:59')
      const dateB = new Date('2024-01-15T00:00:01')
      expect(isSameDay(dateA, dateB)).toBe(true)
    })
  })

  describe('isWithinRange', () => {
    it('should return true for date within range', () => {
      const date = new Date('2024-01-15')
      const start = new Date('2024-01-10')
      const end = new Date('2024-01-20')
      expect(isWithinRange(date, start, end)).toBe(true)
    })

    it('should return true for date at range boundaries', () => {
      const start = new Date('2024-01-10')
      const end = new Date('2024-01-20')
      expect(isWithinRange(start, start, end)).toBe(true)
      expect(isWithinRange(end, start, end)).toBe(true)
    })

    it('should return false for date outside range', () => {
      const date = new Date('2024-01-25')
      const start = new Date('2024-01-10')
      const end = new Date('2024-01-20')
      expect(isWithinRange(date, start, end)).toBe(false)
    })
  })

  describe('getThisMonthRange', () => {
    it('should return start and end of current month', () => {
      const { start, end } = getThisMonthRange()
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(0) // January
      expect(end.getDate()).toBe(15) // Current date
      expect(end.getMonth()).toBe(0)
    })
  })

  describe('getLastMonthRange', () => {
    it('should return start and end of previous month', () => {
      const { start, end } = getLastMonthRange()
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(11) // December 2023
      expect(start.getFullYear()).toBe(2023)
      expect(end.getDate()).toBe(31)
      expect(end.getMonth()).toBe(11) // December 2023
    })
  })

  describe('getThisWeekRange', () => {
    it('should return Monday to today', () => {
      const { start, end } = getThisWeekRange()
      expect(start.getDay()).toBe(1) // Monday
      expect(start.getDate()).toBe(15) // Jan 15 is Monday
      expect(end.getDate()).toBe(15) // Today
    })
  })

  describe('getLastWeekRange', () => {
    it('should return previous Monday to Sunday', () => {
      const { start, end } = getLastWeekRange()
      expect(start.getDay()).toBe(1) // Monday
      expect(start.getDate()).toBe(8) // Previous Monday
      expect(end.getDay()).toBe(0) // Sunday
      expect(end.getDate()).toBe(14) // Previous Sunday
    })
  })

  describe('getLastNDaysRange', () => {
    it('should return correct range for N days', () => {
      const { start, end } = getLastNDaysRange(7)
      expect(diffInDays(end, start)).toBe(6) // 7 days inclusive
      expect(end.getDate()).toBe(15) // Today
      expect(start.getDate()).toBe(9) // 7 days ago (including today)
    })

    it('should handle single day', () => {
      const { start, end } = getLastNDaysRange(1)
      expect(isSameDay(start, end)).toBe(true)
    })
  })

  describe('getRollingRange', () => {
    it('should return correct 7-day range', () => {
      const { start, end } = getRollingRange(7)
      expect(diffInDays(end, start)).toBe(6) // 7 days inclusive
      expect(end.getDate()).toBe(15) // Today
      expect(start.getDate()).toBe(9) // 7 days ago (including today)
    })

    it('should return correct 30-day range', () => {
      const { start, end } = getRollingRange(30)
      expect(diffInDays(end, start)).toBe(29) // 30 days inclusive
      expect(end.getDate()).toBe(15) // Today
    })

    it('should handle single day', () => {
      const { start, end } = getRollingRange(1)
      expect(isSameDay(start, end)).toBe(true)
    })
  })

  describe('getComparisonRollingRange', () => {
    it('should return previous 7 days before current range', () => {
      const current = getRollingRange(7)
      const comparison = getComparisonRollingRange(7)

      // Comparison should end the day before current starts
      expect(diffInDays(current.start, comparison.end)).toBe(1)

      // Comparison should be same length (7 days)
      expect(diffInDays(comparison.end, comparison.start)).toBe(6)
    })

    it('should return previous 30 days before current range', () => {
      const current = getRollingRange(30)
      const comparison = getComparisonRollingRange(30)

      // Comparison should end the day before current starts
      expect(diffInDays(current.start, comparison.end)).toBe(1)

      // Comparison should be same length (30 days)
      expect(diffInDays(comparison.end, comparison.start)).toBe(29)
    })
  })

  describe('getThisYearRange', () => {
    it('should return Jan 1 to today', () => {
      const { start, end } = getThisYearRange()
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(0) // January
      expect(start.getFullYear()).toBe(2024)
      expect(end.getDate()).toBe(15) // Today
      expect(end.getMonth()).toBe(0)
      expect(end.getFullYear()).toBe(2024)
    })
  })

  describe('getLastYearRange', () => {
    it('should return full previous calendar year', () => {
      const { start, end } = getLastYearRange()
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(0) // January
      expect(start.getFullYear()).toBe(2023)
      expect(end.getDate()).toBe(31)
      expect(end.getMonth()).toBe(11) // December
      expect(end.getFullYear()).toBe(2023)
    })
  })

  describe('getMonthBeforeLastRange', () => {
    it('should return 2 months ago', () => {
      // Current: Jan 2024, Last: Dec 2023, MonthBeforeLast: Nov 2023
      const { start, end } = getMonthBeforeLastRange()
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(10) // November (0-indexed)
      expect(start.getFullYear()).toBe(2023)
      expect(end.getDate()).toBe(30) // November has 30 days
      expect(end.getMonth()).toBe(10)
      expect(end.getFullYear()).toBe(2023)
    })
  })

  describe('getAllTimeRange', () => {
    it('should return from 2020 to today', () => {
      const { start, end } = getAllTimeRange()
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(0) // January
      expect(start.getFullYear()).toBe(2020)
      expect(end.getFullYear()).toBe(2024)
    })
  })

  describe('formatDate', () => {
    it('should format date with default locale', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date, 'en')
      expect(result).toMatch(/Jan/)
      expect(result).toMatch(/15/)
      expect(result).toMatch(/2024/)
    })

    it('should handle Ukrainian locale', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date, 'uk')
      // Ukrainian month name for January
      expect(result).toBeTruthy()
      expect(result).toMatch(/15/)
    })
  })
})
