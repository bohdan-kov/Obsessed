import { describe, it, expect } from 'vitest'
import { getMonthBoundaries, getFirstMondayOnOrBefore, getLastSundayOnOrAfter } from '@/utils/dateUtils'

describe('getMonthBoundaries', () => {
  it('should correctly identify month boundaries when month starts mid-week', () => {
    // January 2025: Wed Jan 1 - Fri Jan 31
    // Grid should start on Monday Dec 30, 2024
    const rangeStart = new Date(2025, 0, 1) // Jan 1, 2025 (Wednesday)
    const rangeEnd = new Date(2025, 0, 31) // Jan 31, 2025

    const gridStart = getFirstMondayOnOrBefore(rangeStart)
    const gridEnd = getLastSundayOnOrAfter(rangeEnd)

    const boundaries = getMonthBoundaries(gridStart, gridEnd)

    // Week 0: Dec 30 (Mon) - Jan 5 (Sun) - Contains Jan 1
    // Week 1: Jan 6 (Mon) - Jan 12 (Sun)
    // Week 2: Jan 13 (Mon) - Jan 19 (Sun)
    // Week 3: Jan 20 (Mon) - Jan 26 (Sun)
    // Week 4: Jan 27 (Mon) - Feb 2 (Sun) - Contains Feb 1

    expect(boundaries).toHaveLength(2)
    expect(boundaries[0]).toEqual({
      month: 0, // January
      year: 2025,
      firstWeek: 0, // Should appear at week 0 because Jan 1 is in week 0
    })
    expect(boundaries[1]).toEqual({
      month: 1, // February
      year: 2025,
      firstWeek: 4,
    })
  })

  it('should correctly identify month boundaries when month starts on Monday', () => {
    // March 2021: Mon Mar 1 - Wed Mar 31
    const rangeStart = new Date(2021, 2, 1) // Mar 1, 2021 (Monday)
    const rangeEnd = new Date(2021, 2, 31) // Mar 31, 2021

    const gridStart = getFirstMondayOnOrBefore(rangeStart)
    const gridEnd = getLastSundayOnOrAfter(rangeEnd)

    const boundaries = getMonthBoundaries(gridStart, gridEnd)

    // March 1 is on Monday, so it should be week 0
    expect(boundaries).toHaveLength(2) // March and April
    expect(boundaries[0]).toEqual({
      month: 2, // March
      year: 2021,
      firstWeek: 0,
    })
  })

  it('should correctly identify month boundaries spanning a year boundary', () => {
    // December 2024 to January 2025
    const rangeStart = new Date(2024, 11, 15) // Dec 15, 2024
    const rangeEnd = new Date(2025, 0, 15) // Jan 15, 2025

    const gridStart = getFirstMondayOnOrBefore(rangeStart)
    const gridEnd = getLastSundayOnOrAfter(rangeEnd)

    const boundaries = getMonthBoundaries(gridStart, gridEnd)

    // Should have boundaries for both December and January
    expect(boundaries.length).toBeGreaterThanOrEqual(1)

    // Find January boundary
    const janBoundary = boundaries.find((b) => b.month === 0 && b.year === 2025)
    expect(janBoundary).toBeDefined()

    // January 1, 2025 is a Wednesday, so it should be in the first week that contains it
    expect(janBoundary.firstWeek).toBeGreaterThanOrEqual(0)
  })

  it('should handle multiple months in a long range', () => {
    // 6 months range
    const rangeStart = new Date(2025, 0, 1) // Jan 1, 2025
    const rangeEnd = new Date(2025, 5, 30) // Jun 30, 2025

    const gridStart = getFirstMondayOnOrBefore(rangeStart)
    const gridEnd = getLastSundayOnOrAfter(rangeEnd)

    const boundaries = getMonthBoundaries(gridStart, gridEnd)

    // Should have entries for Jan, Feb, Mar, Apr, May, Jun (and possibly Jul if Jun 30 week extends)
    expect(boundaries.length).toBeGreaterThanOrEqual(6)

    // Each month should appear exactly once
    const monthCounts = boundaries.reduce((acc, b) => {
      const key = `${b.year}-${b.month}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    Object.values(monthCounts).forEach((count) => {
      expect(count).toBe(1)
    })
  })

  it('should have monotonically increasing week indices', () => {
    const rangeStart = new Date(2025, 0, 1)
    const rangeEnd = new Date(2025, 11, 31)

    const gridStart = getFirstMondayOnOrBefore(rangeStart)
    const gridEnd = getLastSundayOnOrAfter(rangeEnd)

    const boundaries = getMonthBoundaries(gridStart, gridEnd)

    // Week indices should always increase
    for (let i = 1; i < boundaries.length; i++) {
      expect(boundaries[i].firstWeek).toBeGreaterThan(boundaries[i - 1].firstWeek)
    }
  })

  // EDGE CASE TESTS

  describe('Edge Cases: Year Transitions', () => {
    it('should correctly handle December to January transition', () => {
      // December 31, 2024 (Tuesday) to January 1, 2025 (Wednesday)
      // Range: Dec 30 (Mon) - Jan 5 (Sun) = 1 week
      // Only Jan 1 is in this range (Dec 1 is not), so only January boundary expected
      const rangeStart = new Date(2024, 11, 30) // Dec 30, 2024 (Monday)
      const rangeEnd = new Date(2025, 0, 5) // Jan 5, 2025 (Sunday)

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Only January 2025 should have a boundary (Dec 1 is not in range)
      const janBoundary = boundaries.find((b) => b.month === 0 && b.year === 2025)

      expect(janBoundary).toBeDefined()
      expect(janBoundary.firstWeek).toBe(0) // Jan 1 is in week 0

      // Should only have 1 boundary (December's 1st is not in this range)
      expect(boundaries).toHaveLength(1)
    })

    it('should correctly handle year boundaries with multi-week range', () => {
      // Full year transition from Dec 2024 to Jan 2025
      const rangeStart = new Date(2024, 11, 1) // Dec 1, 2024
      const rangeEnd = new Date(2025, 0, 31) // Jan 31, 2025

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Should have at least December and January
      expect(boundaries.length).toBeGreaterThanOrEqual(2)

      // Years should be correct
      const decBoundary = boundaries.find((b) => b.month === 11)
      const janBoundary = boundaries.find((b) => b.month === 0)

      expect(decBoundary.year).toBe(2024)
      expect(janBoundary.year).toBe(2025)
    })

    it('should handle New Year\'s Day on different weekdays', () => {
      // Test multiple years where Jan 1 falls on different weekdays
      const testCases = [
        { year: 2023, expectedDay: 0 }, // Jan 1, 2023 is Sunday
        { year: 2024, expectedDay: 1 }, // Jan 1, 2024 is Monday
        { year: 2025, expectedDay: 3 }, // Jan 1, 2025 is Wednesday
        { year: 2026, expectedDay: 4 }, // Jan 1, 2026 is Thursday
      ]

      testCases.forEach(({ year, expectedDay }) => {
        const janFirst = new Date(year, 0, 1)
        expect(janFirst.getDay()).toBe(expectedDay)

        const rangeStart = new Date(year - 1, 11, 20) // Dec 20 prev year
        const rangeEnd = new Date(year, 0, 10) // Jan 10 current year

        const gridStart = getFirstMondayOnOrBefore(rangeStart)
        const gridEnd = getLastSundayOnOrAfter(rangeEnd)

        const boundaries = getMonthBoundaries(gridStart, gridEnd)

        const janBoundary = boundaries.find((b) => b.month === 0 && b.year === year)
        expect(janBoundary).toBeDefined()
      })
    })
  })

  describe('Edge Cases: Leap Years', () => {
    it('should correctly handle February in leap year (2024)', () => {
      // February 2024 has 29 days
      const rangeStart = new Date(2024, 1, 1) // Feb 1, 2024 (Thursday)
      const rangeEnd = new Date(2024, 1, 29) // Feb 29, 2024 (Thursday)

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Should have February boundary
      const febBoundary = boundaries.find((b) => b.month === 1 && b.year === 2024)
      expect(febBoundary).toBeDefined()
      expect(febBoundary.firstWeek).toBeGreaterThanOrEqual(0)
    })

    it('should correctly handle February in non-leap year (2023)', () => {
      // February 2023 has 28 days
      const rangeStart = new Date(2023, 1, 1) // Feb 1, 2023 (Wednesday)
      const rangeEnd = new Date(2023, 1, 28) // Feb 28, 2023 (Tuesday)

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Should have February boundary
      const febBoundary = boundaries.find((b) => b.month === 1 && b.year === 2023)
      expect(febBoundary).toBeDefined()
      expect(febBoundary.firstWeek).toBeGreaterThanOrEqual(0)
    })

    it('should correctly transition from Feb 28 to Mar 1 in non-leap year', () => {
      // Non-leap year: Feb ends on 28th
      // Range Feb 20 - Mar 10 does not contain Feb 1, only Mar 1
      const rangeStart = new Date(2023, 1, 20) // Feb 20, 2023
      const rangeEnd = new Date(2023, 2, 10) // Mar 10, 2023

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Only March should have a boundary (Feb 1 is not in this range)
      const marBoundary = boundaries.find((b) => b.month === 2 && b.year === 2023)

      expect(marBoundary).toBeDefined()
      expect(boundaries).toHaveLength(1)
    })

    it('should correctly transition from Feb 29 to Mar 1 in leap year', () => {
      // Leap year: Feb has 29 days
      // Range Feb 20 - Mar 10 does not contain Feb 1, only Mar 1
      const rangeStart = new Date(2024, 1, 20) // Feb 20, 2024
      const rangeEnd = new Date(2024, 2, 10) // Mar 10, 2024

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Only March should have a boundary (Feb 1 is not in this range)
      const marBoundary = boundaries.find((b) => b.month === 2 && b.year === 2024)

      expect(marBoundary).toBeDefined()
      expect(boundaries).toHaveLength(1)
    })
  })

  describe('Edge Cases: Invalid Inputs', () => {
    it('should return empty array for single-day range without month start', () => {
      const singleDay = new Date(2025, 5, 15) // Jun 15, 2025

      const gridStart = getFirstMondayOnOrBefore(singleDay)
      const gridEnd = getLastSundayOnOrAfter(singleDay)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Jun 15 week doesn't contain Jun 1, so no boundaries expected
      // (Jun 1, 2025 is Sunday, so the week Jun 9-15 doesn't contain it)
      // The function only returns months whose 1st is in the grid
      expect(boundaries.length).toBe(0)
    })

    it('should return empty array for same start and end date without month start', () => {
      const date = new Date(2025, 3, 20) // Apr 20, 2025

      const boundaries = getMonthBoundaries(date, date)

      // Apr 20 doesn't contain Apr 1, so no boundaries
      // The function only returns months whose 1st is in the grid
      expect(boundaries.length).toBe(0)
    })

    it('should return empty array for very short ranges without month start', () => {
      const rangeStart = new Date(2025, 6, 7) // Jul 7, 2025 (Monday)
      const rangeEnd = new Date(2025, 6, 8) // Jul 8, 2025 (Tuesday)

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Jul 7-8 week doesn't contain Jul 1, so no boundaries
      expect(boundaries.length).toBe(0)
    })
  })

  describe('Edge Cases: Month with Different Lengths', () => {
    it('should handle 31-day months correctly', () => {
      // January, March, May, July, August, October, December have 31 days
      const months31 = [0, 2, 4, 6, 7, 9, 11]

      months31.forEach((month) => {
        const rangeStart = new Date(2025, month, 1)
        const rangeEnd = new Date(2025, month, 31)

        const gridStart = getFirstMondayOnOrBefore(rangeStart)
        const gridEnd = getLastSundayOnOrAfter(rangeEnd)

        const boundaries = getMonthBoundaries(gridStart, gridEnd)

        const monthBoundary = boundaries.find((b) => b.month === month && b.year === 2025)
        expect(monthBoundary).toBeDefined()
      })
    })

    it('should handle 30-day months correctly', () => {
      // April, June, September, November have 30 days
      const months30 = [3, 5, 8, 10]

      months30.forEach((month) => {
        const rangeStart = new Date(2025, month, 1)
        const rangeEnd = new Date(2025, month, 30)

        const gridStart = getFirstMondayOnOrBefore(rangeStart)
        const gridEnd = getLastSundayOnOrAfter(rangeEnd)

        const boundaries = getMonthBoundaries(gridStart, gridEnd)

        const monthBoundary = boundaries.find((b) => b.month === month && b.year === 2025)
        expect(monthBoundary).toBeDefined()
      })
    })
  })

  describe('Edge Cases: Timezone Handling', () => {
    it('should work with dates at midnight local time', () => {
      const rangeStart = new Date(2025, 0, 1, 0, 0, 0, 0)
      const rangeEnd = new Date(2025, 0, 31, 0, 0, 0, 0)

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      expect(boundaries.length).toBeGreaterThanOrEqual(1)
    })

    it('should work with dates at end of day', () => {
      const rangeStart = new Date(2025, 0, 1, 23, 59, 59, 999)
      const rangeEnd = new Date(2025, 0, 31, 23, 59, 59, 999)

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      expect(boundaries.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle dates with time components', () => {
      // Dates with time components - range Apr 15-20 doesn't contain Apr 1
      const rangeStart = new Date(2025, 3, 15, 14, 30, 45)
      const rangeEnd = new Date(2025, 3, 20, 18, 15, 30)

      const gridStart = getFirstMondayOnOrBefore(rangeStart)
      const gridEnd = getLastSundayOnOrAfter(rangeEnd)

      const boundaries = getMonthBoundaries(gridStart, gridEnd)

      // Apr 14-20 week doesn't contain Apr 1
      // The function only returns months whose 1st is in the grid
      expect(boundaries.length).toBe(0)
    })
  })
})
