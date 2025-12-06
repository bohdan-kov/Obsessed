import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PersonalStatsCard from '@/pages/dashboard/components/PersonalStatsCard.vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useAuthStore } from '@/stores/authStore'

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
    WORKOUTS: 'workouts',
  },
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(() => vi.fn()),
  signOut: vi.fn(),
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  Activity: {
    name: 'Activity',
    template: '<svg data-testid="activity-icon"></svg>',
  },
  Scale: {
    name: 'Scale',
    template: '<svg data-testid="scale-icon"></svg>',
  },
}))

describe('PersonalStatsCard', () => {
  let analyticsStore
  let workoutStore
  let authStore
  let exerciseStore

  beforeEach(() => {
    setActivePinia(createPinia())

    authStore = useAuthStore()
    workoutStore = useWorkoutStore()
    exerciseStore = useExerciseStore()
    analyticsStore = useAnalyticsStore()

    // Set authenticated user
    authStore.$patch({
      user: { uid: 'test-user-123', email: 'test@test.com', emailVerified: true },
      initializing: false,
      loading: false,
    })

    // Initialize exercise store (needed by analyticsStore)
    exerciseStore.fetchExercises()
  })

  describe('Component rendering', () => {
    it('should render the card with title and description', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      expect(wrapper.text()).toContain('personalStats.title')
      expect(wrapper.text()).toContain('personalStats.description')
    })

    it('should render two stat cards (RPE and Weight)', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Check for translation keys
      expect(wrapper.text()).toContain('avgRpe')
      expect(wrapper.text()).toContain('weight')
    })

    it('should render activity and scale icons', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      expect(wrapper.find('[data-testid="activity-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="scale-icon"]').exists()).toBe(true)
    })
  })

  describe('RPE color classification', () => {
    it('should show muted colors when RPE is null', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Should show placeholder '--' when no data
      expect(wrapper.text()).toContain('--')
    })

    it('should show green color for low RPE (1-4)', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [
                  { weight: 100, reps: 10, rpe: 3 },
                  { weight: 110, reps: 8, rpe: 4 },
                ],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Check for green color classes in RPE section
      const rpeSection = wrapper.findAll('div.p-2.rounded-md')[0]
      expect(rpeSection.classes()).toContain('bg-green-500/10')

      const rpeIcon = rpeSection.find('[data-testid="activity-icon"]')
      expect(rpeIcon.classes()).toContain('text-green-500')
    })

    it('should show yellow color for medium RPE (5-7)', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [
                  { weight: 100, reps: 10, rpe: 6 },
                  { weight: 110, reps: 8, rpe: 7 },
                ],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Check for yellow color classes in RPE section
      const rpeSection = wrapper.findAll('div.p-2.rounded-md')[0]
      expect(rpeSection.classes()).toContain('bg-yellow-500/10')

      const rpeIcon = rpeSection.find('[data-testid="activity-icon"]')
      expect(rpeIcon.classes()).toContain('text-yellow-500')
    })

    it('should show red color for high RPE (8-10)', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [
                  { weight: 100, reps: 10, rpe: 9 },
                  { weight: 110, reps: 8, rpe: 10 },
                ],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Check for red color classes in RPE section
      const rpeSection = wrapper.findAll('div.p-2.rounded-md')[0]
      expect(rpeSection.classes()).toContain('bg-red-500/10')

      const rpeIcon = rpeSection.find('[data-testid="activity-icon"]')
      expect(rpeIcon.classes()).toContain('text-red-500')
    })

    it('should show muted colors for RPE of 0', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Check for muted color classes when RPE is 0 or null
      const rpeSection = wrapper.findAll('div.p-2.rounded-md')[0]
      expect(rpeSection.classes()).toContain('bg-muted/50')

      const rpeIcon = rpeSection.find('[data-testid="activity-icon"]')
      expect(rpeIcon.classes()).toContain('text-muted-foreground')
    })
  })

  describe('Weight display', () => {
    it('should display weight with unit conversion', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [{ weight: 100, reps: 10 }],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // useUnits is globally mocked with pass-through conversion
      // Should show some weight value (not '--')
      const weightSection = wrapper.findAll('p.text-lg.font-bold.font-mono')[1]
      expect(weightSection.text()).not.toBe('--')
    })

    it('should display placeholder when weight is null', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Check weight stat shows placeholder
      const weightValues = wrapper.findAll('p.text-lg.font-bold.font-mono')

      // The second stat should be weight
      expect(weightValues.length).toBeGreaterThanOrEqual(2)
      expect(weightValues[1].text()).toContain('--')
    })

    it('should show unit label (kg or lbs)', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // useUnits is globally mocked with 'kg' as default
      expect(wrapper.text()).toContain('kg')
    })

    it('should format weight without unit in the number display', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [{ weight: 100, reps: 10 }],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Weight value and unit should be separate
      const weightSection = wrapper.findAll('p.text-lg.font-bold.font-mono')[1]
      const weightText = weightSection.text()

      // Should have numeric value
      expect(weightText).toMatch(/\d+/)
    })
  })

  describe('RPE value display', () => {
    it('should display RPE rounded to 1 decimal place', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [
                  { weight: 100, reps: 10, rpe: 7 },
                  { weight: 110, reps: 8, rpe: 8 },
                  { weight: 105, reps: 9, rpe: 9 },
                ],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // RPE should be displayed with 1 decimal place (avg of 7, 8, 9 = 8.0)
      const rpeValue = wrapper.findAll('p.text-lg.font-bold.font-mono')[0]
      expect(rpeValue.text()).toMatch(/^\d+\.\d$/) // Matches X.X format
    })

    it('should display placeholder when RPE is unavailable', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      const rpeValue = wrapper.findAll('p.text-lg.font-bold.font-mono')[0]
      expect(rpeValue.text()).toBe('--')
    })
  })

  describe('Empty state handling', () => {
    it('should handle empty workout history gracefully', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // Both stats should show placeholders
      expect(wrapper.text()).toContain('--')
    })

    it('should handle workouts without RPE data', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [
                  { weight: 100, reps: 10 }, // No RPE
                ],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // RPE should show placeholder
      const rpeValue = wrapper.findAll('p.text-lg.font-bold.font-mono')[0]
      expect(rpeValue.text()).toBe('--')

      // Weight should still be displayed
      const weightValue = wrapper.findAll('p.text-lg.font-bold.font-mono')[1]
      expect(weightValue.text()).not.toBe('--')
    })
  })

  describe('Responsive layout', () => {
    it('should use 2-column grid layout', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      const grid = wrapper.find('.grid.grid-cols-2')
      expect(grid.exists()).toBe(true)
    })

    it('should have gap between stat cards', () => {
      workoutStore.$patch({ workouts: [] })
      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      const grid = wrapper.find('.grid')
      expect(grid.classes()).toContain('gap-4')
    })
  })

  describe('Color class logic edge cases', () => {
    it('should handle RPE exactly at boundary LOW_MAX', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [{ weight: 100, reps: 10, rpe: 4 }],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // RPE of 4 should be green (LOW_MAX is 4)
      const rpeSection = wrapper.findAll('div.p-2.rounded-md')[0]
      expect(rpeSection.classes()).toContain('bg-green-500/10')
    })

    it('should handle RPE exactly at boundary MEDIUM_MAX', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [{ weight: 100, reps: 10, rpe: 7 }],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // RPE of 7 should be yellow (MEDIUM_MAX is 7)
      const rpeSection = wrapper.findAll('div.p-2.rounded-md')[0]
      expect(rpeSection.classes()).toContain('bg-yellow-500/10')
    })

    it('should handle RPE of 1 (minimum)', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [{ weight: 100, reps: 10, rpe: 1 }],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // RPE of 1 should be green
      const rpeSection = wrapper.findAll('div.p-2.rounded-md')[0]
      expect(rpeSection.classes()).toContain('bg-green-500/10')
    })

    it('should handle RPE of 10 (maximum)', () => {
      const today = new Date()

      workoutStore.$patch({
        workouts: [
          {
            id: 'w1',
            userId: 'test-user-123',
            status: 'completed',
            startedAt: today,
            completedAt: today,
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [{ weight: 100, reps: 10, rpe: 10 }],
              },
            ],
          },
        ],
      })

      analyticsStore.setPeriod('last30Days')

      const wrapper = mount(PersonalStatsCard)

      // RPE of 10 should be red
      const rpeSection = wrapper.findAll('div.p-2.rounded-md')[0]
      expect(rpeSection.classes()).toContain('bg-red-500/10')
    })
  })
})
