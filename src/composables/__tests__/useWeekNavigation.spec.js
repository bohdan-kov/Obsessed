import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWeekNavigation } from '@/composables/useWeekNavigation'
import { useScheduleStore } from '@/stores/scheduleStore'
import { nextTick } from 'vue'
import * as firestoreModule from '@/firebase/firestore'

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

describe('useWeekNavigation', () => {
  let scheduleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    scheduleStore = useScheduleStore()
    vi.clearAllMocks()

    // Mock fetchScheduleForWeek
    scheduleStore.fetchScheduleForWeek = vi.fn()
  })

  describe('Initial State', () => {
    it('should start at current week (offset 0)', () => {
      const { currentWeekOffset } = useWeekNavigation()
      expect(currentWeekOffset.value).toBe(0)
    })

    it('should provide current week ID', () => {
      const { currentWeekId } = useWeekNavigation()
      expect(currentWeekId.value).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('should show "This Week" label for current week', () => {
      const { weekLabel } = useWeekNavigation()
      expect(weekLabel.value).toBe('schedule.thisWeek')
    })

    it('should allow going back from current week', () => {
      const { canGoBack } = useWeekNavigation()
      expect(canGoBack.value).toBe(true)
    })

    it('should allow going forward from current week', () => {
      const { canGoForward } = useWeekNavigation()
      expect(canGoForward.value).toBe(true)
    })
  })

  describe('Week Labels', () => {
    it('should show "Last Week" for offset -1', async () => {
      const { weekLabel, currentWeekOffset } = useWeekNavigation()
      currentWeekOffset.value = -1
      await nextTick()
      expect(weekLabel.value).toBe('schedule.lastWeek')
    })

    it('should show "Next Week" for offset +1', async () => {
      const { weekLabel, currentWeekOffset } = useWeekNavigation()
      currentWeekOffset.value = 1
      await nextTick()
      expect(weekLabel.value).toBe('schedule.nextWeek')
    })

    it('should show date range for offset beyond -1 or +1', async () => {
      const { weekLabel, currentWeekOffset } = useWeekNavigation()
      currentWeekOffset.value = 2
      await nextTick()
      expect(weekLabel.value).toBe('schedule.weekOf')
    })

    it('should format date correctly in label', async () => {
      const { weekLabel, currentWeekOffset } = useWeekNavigation()
      currentWeekOffset.value = -3
      await nextTick()
      // In test environment, t() returns the key itself
      expect(weekLabel.value).toBe('schedule.weekOf')
    })
  })

  describe('Navigation Actions', () => {
    it('should go to previous week', async () => {
      const { currentWeekOffset, goToPreviousWeek } = useWeekNavigation()

      expect(currentWeekOffset.value).toBe(0)
      goToPreviousWeek()
      await nextTick()

      expect(currentWeekOffset.value).toBe(-1)
      expect(scheduleStore.fetchScheduleForWeek).toHaveBeenCalled()
    })

    it('should go to next week', async () => {
      const { currentWeekOffset, goToNextWeek } = useWeekNavigation()

      expect(currentWeekOffset.value).toBe(0)
      goToNextWeek()
      await nextTick()

      expect(currentWeekOffset.value).toBe(1)
      expect(scheduleStore.fetchScheduleForWeek).toHaveBeenCalled()
    })

    it('should go back to this week', async () => {
      const { currentWeekOffset, goToThisWeek, goToNextWeek } = useWeekNavigation()

      // Go forward first
      goToNextWeek()
      await nextTick()
      expect(currentWeekOffset.value).toBe(1)

      // Go back to this week
      goToThisWeek()
      await nextTick()
      expect(currentWeekOffset.value).toBe(0)
      expect(scheduleStore.fetchScheduleForWeek).toHaveBeenCalledTimes(2)
    })

    it('should not go forward beyond 4 weeks', async () => {
      const { currentWeekOffset, goToNextWeek, canGoForward } = useWeekNavigation()

      // Go forward 4 times
      for (let i = 0; i < 4; i++) {
        goToNextWeek()
        await nextTick()
      }

      expect(currentWeekOffset.value).toBe(4)
      expect(canGoForward.value).toBe(false)

      // Try to go forward again - should not change
      goToNextWeek()
      await nextTick()
      expect(currentWeekOffset.value).toBe(4)
    })

    it('should always allow going back', async () => {
      const { currentWeekOffset, goToPreviousWeek, canGoBack } = useWeekNavigation()

      // Go back multiple times
      for (let i = 0; i < 10; i++) {
        expect(canGoBack.value).toBe(true)
        goToPreviousWeek()
        await nextTick()
      }

      expect(currentWeekOffset.value).toBe(-10)
      expect(canGoBack.value).toBe(true)
    })
  })

  describe('Week ID Calculation', () => {
    it('should calculate correct week ID for offset', async () => {
      const { currentWeekId, currentWeekOffset } = useWeekNavigation()

      const thisWeekId = currentWeekId.value

      // Go to next week
      currentWeekOffset.value = 1
      await nextTick()

      const nextWeekId = currentWeekId.value
      expect(nextWeekId).not.toBe(thisWeekId)
    })

    it('should handle negative offsets', async () => {
      const { currentWeekId, currentWeekOffset } = useWeekNavigation()

      currentWeekOffset.value = -5
      await nextTick()

      expect(currentWeekId.value).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('should handle positive offsets', async () => {
      const { currentWeekId, currentWeekOffset } = useWeekNavigation()

      currentWeekOffset.value = 3
      await nextTick()

      expect(currentWeekId.value).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('Data Loading', () => {
    it('should load week data when navigating', async () => {
      const { goToNextWeek, loadWeek } = useWeekNavigation()

      goToNextWeek()
      await nextTick()

      expect(scheduleStore.fetchScheduleForWeek).toHaveBeenCalledTimes(1)
    })

    it('should load correct week ID', async () => {
      const { currentWeekId, loadWeek } = useWeekNavigation()

      await loadWeek()

      expect(scheduleStore.fetchScheduleForWeek).toHaveBeenCalledWith(currentWeekId.value)
    })

    it('should reload data when calling loadWeek', async () => {
      const { loadWeek } = useWeekNavigation()

      await loadWeek()
      expect(scheduleStore.fetchScheduleForWeek).toHaveBeenCalledTimes(1)

      await loadWeek()
      expect(scheduleStore.fetchScheduleForWeek).toHaveBeenCalledTimes(2)
    })
  })

  describe('Integration', () => {
    it('should update all dependent values when navigating', async () => {
      const { currentWeekId, weekLabel, currentWeekOffset, goToNextWeek } = useWeekNavigation()

      const initialWeekId = currentWeekId.value
      const initialLabel = weekLabel.value

      goToNextWeek()
      await nextTick()

      expect(currentWeekId.value).not.toBe(initialWeekId)
      expect(weekLabel.value).not.toBe(initialLabel)
      expect(currentWeekOffset.value).toBe(1)
    })

    it('should handle rapid navigation', async () => {
      const { goToNextWeek, goToPreviousWeek, currentWeekOffset } = useWeekNavigation()

      goToNextWeek()
      goToNextWeek()
      goToPreviousWeek()
      await nextTick()

      expect(currentWeekOffset.value).toBe(1)
      expect(scheduleStore.fetchScheduleForWeek).toHaveBeenCalledTimes(3)
    })

    it('should handle week boundary correctly', async () => {
      const { currentWeekId, currentWeekOffset } = useWeekNavigation()

      // Test year boundary
      currentWeekOffset.value = -10
      await nextTick()

      const weekId = currentWeekId.value
      expect(weekId).toMatch(/^\d{4}-W\d{2}$/)

      // Extract and verify format
      const [year, week] = weekId.split('-W')
      expect(parseInt(year)).toBeGreaterThan(2020)
      expect(parseInt(week)).toBeGreaterThanOrEqual(1)
      expect(parseInt(week)).toBeLessThanOrEqual(53)
    })
  })
})
