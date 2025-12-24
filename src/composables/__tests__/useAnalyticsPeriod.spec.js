import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAnalyticsPeriod, PERIOD_OPTIONS } from '../useAnalyticsPeriod'
import { subDays } from '@/utils/dateUtils'

// Mock router
const mockRoute = {
  query: {},
}

const mockReplace = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('useAnalyticsPeriod', () => {
  beforeEach(() => {
    mockRoute.query = {}
    mockReplace.mockClear()
  })

  describe('initialization', () => {
    it('should initialize with default period', () => {
      const { selectedPeriod } = useAnalyticsPeriod()

      expect(selectedPeriod.value).toBe('last_30_days')
    })

    it('should initialize with custom initial period', () => {
      const { selectedPeriod } = useAnalyticsPeriod({
        initialPeriod: 'last_90_days',
      })

      expect(selectedPeriod.value).toBe('last_90_days')
    })

    it('should initialize from URL query param when syncWithUrl is true', () => {
      mockRoute.query.period = 'last_7_days'

      const { selectedPeriod } = useAnalyticsPeriod({ syncWithUrl: true })

      expect(selectedPeriod.value).toBe('last_7_days')
    })

    it('should ignore URL when syncWithUrl is false', () => {
      mockRoute.query.period = 'last_7_days'

      const { selectedPeriod } = useAnalyticsPeriod({ syncWithUrl: false })

      expect(selectedPeriod.value).toBe('last_30_days')
    })
  })

  describe('periodOption', () => {
    it('should return correct period option configuration', () => {
      const { periodOption } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      expect(periodOption.value).toEqual({
        value: 'last_7_days',
        label: 'analytics.periodSelector.last7days',
        days: 7,
      })
    })

    it('should fall back to default if period is invalid', () => {
      const { selectedPeriod, periodOption } = useAnalyticsPeriod()

      selectedPeriod.value = 'invalid-period'

      expect(periodOption.value.value).toBe('last_30_days')
    })
  })

  describe('dateRange', () => {
    it('should calculate correct date range for 7 days', () => {
      const { dateRange } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const range = dateRange.value

      expect(range.days).toBe(7)
      expect(range.isAllTime).toBe(false)
      expect(range.start).toBeInstanceOf(Date)
      expect(range.end).toBeInstanceOf(Date)

      // Check that start is roughly 7 days ago
      const expectedStart = subDays(new Date(), 7)
      const daysDiff = Math.abs((range.start - expectedStart) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBeLessThan(1) // Within 1 day tolerance
    })

    it('should calculate correct date range for 30 days', () => {
      const { dateRange } = useAnalyticsPeriod({ initialPeriod: 'last_30_days' })

      const range = dateRange.value

      expect(range.days).toBe(30)
      expect(range.isAllTime).toBe(false)
    })

    it('should calculate correct date range for 90 days', () => {
      const { dateRange } = useAnalyticsPeriod({ initialPeriod: 'last_90_days' })

      const range = dateRange.value

      expect(range.days).toBe(90)
      expect(range.isAllTime).toBe(false)
    })

    it('should return null start for all time period', () => {
      const { dateRange } = useAnalyticsPeriod({ initialPeriod: 'allTime' })

      const range = dateRange.value

      expect(range.start).toBeNull()
      expect(range.days).toBeNull()
      expect(range.isAllTime).toBe(true)
      expect(range.end).toBeInstanceOf(Date)
    })

    it('should set start time to beginning of day', () => {
      const { dateRange } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const range = dateRange.value

      expect(range.start.getHours()).toBe(0)
      expect(range.start.getMinutes()).toBe(0)
      expect(range.start.getSeconds()).toBe(0)
    })

    it('should set end time to end of day', () => {
      const { dateRange } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const range = dateRange.value

      expect(range.end.getHours()).toBe(23)
      expect(range.end.getMinutes()).toBe(59)
      expect(range.end.getSeconds()).toBe(59)
    })
  })

  describe('isAllTime', () => {
    it('should return true for all time period', () => {
      const { isAllTime } = useAnalyticsPeriod({ initialPeriod: 'allTime' })

      expect(isAllTime.value).toBe(true)
    })

    it('should return false for specific periods', () => {
      const { isAllTime } = useAnalyticsPeriod({ initialPeriod: 'last_30_days' })

      expect(isAllTime.value).toBe(false)
    })
  })

  describe('changePeriod', () => {
    it('should change the selected period', () => {
      const { selectedPeriod, changePeriod } = useAnalyticsPeriod()

      changePeriod('last_7_days')

      expect(selectedPeriod.value).toBe('last_7_days')
    })

    it('should sync with URL when syncWithUrl is true', () => {
      const { changePeriod } = useAnalyticsPeriod({ syncWithUrl: true })

      changePeriod('last_90_days')

      expect(mockReplace).toHaveBeenCalledWith({
        query: {
          period: 'last_90_days',
        },
      })
    })

    it('should not sync with URL when syncWithUrl is false', () => {
      const { changePeriod } = useAnalyticsPeriod({ syncWithUrl: false })

      changePeriod('last_90_days')

      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('should use default for invalid period', () => {
      const { selectedPeriod, changePeriod } = useAnalyticsPeriod()

      // Mock console.warn to avoid test output
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      changePeriod('invalid-period')

      expect(selectedPeriod.value).toBe('last_30_days')
      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe('resetPeriod', () => {
    it('should reset to default period', () => {
      const { selectedPeriod, changePeriod, resetPeriod } = useAnalyticsPeriod()

      changePeriod('last_90_days')
      expect(selectedPeriod.value).toBe('last_90_days')

      resetPeriod()
      expect(selectedPeriod.value).toBe('last_30_days')
    })
  })

  describe('filterByPeriod', () => {
    const mockItems = [
      { id: 1, createdAt: subDays(new Date(), 5) },
      { id: 2, createdAt: subDays(new Date(), 15) },
      { id: 3, createdAt: subDays(new Date(), 45) },
      { id: 4, createdAt: subDays(new Date(), 100) },
    ]

    it('should filter items within 7 day period', () => {
      const { filterByPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const filtered = filterByPeriod(mockItems)

      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe(1)
    })

    it('should filter items within 30 day period', () => {
      const { filterByPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_30_days' })

      const filtered = filterByPeriod(mockItems)

      expect(filtered.length).toBe(2)
      expect(filtered.map((i) => i.id)).toEqual([1, 2])
    })

    it('should filter items within 90 day period', () => {
      const { filterByPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_90_days' })

      const filtered = filterByPeriod(mockItems)

      expect(filtered.length).toBe(3)
      expect(filtered.map((i) => i.id)).toEqual([1, 2, 3])
    })

    it('should return all items for all time period', () => {
      const { filterByPeriod } = useAnalyticsPeriod({ initialPeriod: 'allTime' })

      const filtered = filterByPeriod(mockItems)

      expect(filtered.length).toBe(4)
    })

    it('should handle custom date key', () => {
      const items = [
        { id: 1, customDate: subDays(new Date(), 5) },
        { id: 2, customDate: subDays(new Date(), 45) },
      ]

      const { filterByPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_30_days' })

      const filtered = filterByPeriod(items, 'customDate')

      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe(1)
    })

    it('should handle Date objects and ISO strings', () => {
      const items = [
        { id: 1, createdAt: new Date() },
        { id: 2, createdAt: new Date().toISOString() },
      ]

      const { filterByPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const filtered = filterByPeriod(items)

      expect(filtered.length).toBe(2)
    })

    it('should return empty array for null or invalid input', () => {
      const { filterByPeriod } = useAnalyticsPeriod()

      expect(filterByPeriod(null)).toEqual([])
      expect(filterByPeriod(undefined)).toEqual([])
      expect(filterByPeriod('not-an-array')).toEqual([])
    })

    it('should filter out items without date field', () => {
      const items = [
        { id: 1, createdAt: new Date() },
        { id: 2 }, // Missing createdAt
        { id: 3, createdAt: null },
      ]

      const { filterByPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const filtered = filterByPeriod(items)

      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe(1)
    })
  })

  describe('isDateInPeriod', () => {
    it('should return true for dates within period', () => {
      const { isDateInPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const recentDate = subDays(new Date(), 3)
      expect(isDateInPeriod(recentDate)).toBe(true)
    })

    it('should return false for dates outside period', () => {
      const { isDateInPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const oldDate = subDays(new Date(), 30)
      expect(isDateInPeriod(oldDate)).toBe(false)
    })

    it('should return true for all dates in all time period', () => {
      const { isDateInPeriod } = useAnalyticsPeriod({ initialPeriod: 'allTime' })

      const veryOldDate = subDays(new Date(), 1000)
      expect(isDateInPeriod(veryOldDate)).toBe(true)
    })

    it('should handle ISO string dates', () => {
      const { isDateInPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const recentDate = subDays(new Date(), 3).toISOString()
      expect(isDateInPeriod(recentDate)).toBe(true)
    })
  })

  describe('period navigation', () => {
    describe('getNextPeriod', () => {
      it('should return next period option', () => {
        const { getNextPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

        const next = getNextPeriod()

        expect(next.value).toBe('last_30_days')
      })

      it('should return null at end of list', () => {
        const { getNextPeriod } = useAnalyticsPeriod({ initialPeriod: 'allTime' })

        const next = getNextPeriod()

        expect(next).toBeNull()
      })
    })

    describe('getPreviousPeriod', () => {
      it('should return previous period option', () => {
        const { getPreviousPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_30_days' })

        const prev = getPreviousPeriod()

        expect(prev.value).toBe('last_7_days')
      })

      it('should return null at start of list', () => {
        const { getPreviousPeriod } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

        const prev = getPreviousPeriod()

        expect(prev).toBeNull()
      })
    })

    describe('goToNextPeriod', () => {
      it('should navigate to next period', () => {
        const { selectedPeriod, goToNextPeriod } = useAnalyticsPeriod({
          initialPeriod: 'last_7_days',
        })

        goToNextPeriod()

        expect(selectedPeriod.value).toBe('last_30_days')
      })

      it('should do nothing at end of list', () => {
        const { selectedPeriod, goToNextPeriod } = useAnalyticsPeriod({
          initialPeriod: 'allTime',
        })

        goToNextPeriod()

        expect(selectedPeriod.value).toBe('allTime')
      })
    })

    describe('goToPreviousPeriod', () => {
      it('should navigate to previous period', () => {
        const { selectedPeriod, goToPreviousPeriod } = useAnalyticsPeriod({
          initialPeriod: 'last_30_days',
        })

        goToPreviousPeriod()

        expect(selectedPeriod.value).toBe('last_7_days')
      })

      it('should do nothing at start of list', () => {
        const { selectedPeriod, goToPreviousPeriod } = useAnalyticsPeriod({
          initialPeriod: 'last_7_days',
        })

        goToPreviousPeriod()

        expect(selectedPeriod.value).toBe('last_7_days')
      })
    })
  })

  describe('getPeriodLabel', () => {
    it('should return translation key for period', () => {
      const { getPeriodLabel } = useAnalyticsPeriod({ initialPeriod: 'last_7_days' })

      const label = getPeriodLabel()

      expect(label).toBe('analytics.periodSelector.last7days')
    })
  })

  describe('PERIOD_OPTIONS constant', () => {
    it('should export period options', () => {
      expect(PERIOD_OPTIONS).toBeInstanceOf(Array)
      expect(PERIOD_OPTIONS.length).toBe(4)

      PERIOD_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('days')
      })
    })

    it('should include all expected periods', () => {
      const values = PERIOD_OPTIONS.map((o) => o.value)

      expect(values).toContain('last_7_days')
      expect(values).toContain('last_30_days')
      expect(values).toContain('last_90_days')
      expect(values).toContain('allTime')
    })
  })
})
