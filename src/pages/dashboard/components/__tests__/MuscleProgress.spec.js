import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MuscleProgress from '../MuscleProgress.vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useAuthStore } from '@/stores/authStore'
import { CONFIG } from '@/constants/config'
import { fetchCollection } from '@/firebase/firestore'

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
    EXERCISES: 'exercises',
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

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: {
    name: 'Card',
    template: '<div class="card"><slot /></div>',
  },
  CardContent: {
    name: 'CardContent',
    template: '<div class="card-content"><slot /></div>',
  },
  CardHeader: {
    name: 'CardHeader',
    template: '<div class="card-header"><slot /></div>',
  },
  CardTitle: {
    name: 'CardTitle',
    template: '<span class="card-title"><slot /></span>',
  },
  CardDescription: {
    name: 'CardDescription',
    template: '<span class="card-description"><slot /></span>',
  },
}))

// Helper to create mock workout with RPE
const createMockWorkout = (rpe, daysAgo = 1) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)

  return {
    id: 'workout-' + Math.random(),
    userId: 'test-user',
    status: 'completed',
    startedAt: date,
    completedAt: date,
    exercises: [
      {
        exerciseId: 'ex1',
        sets: [
          { weight: 100, reps: 10, rpe },
        ],
      },
    ],
    duration: 3600,
    totalVolume: 1000,
  }
}

describe('MuscleProgress', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Set up authenticated user
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'uid', 'get').mockReturnValue('test-user-id')
    vi.spyOn(authStore, 'isAuthenticated', 'get').mockReturnValue(true)
  })

  /**
   * Factory function to create wrapper with store initialized
   */
  async function createWrapper(workouts = []) {
    fetchCollection.mockResolvedValue(workouts)

    const workoutStore = useWorkoutStore()
    const exerciseStore = useExerciseStore()

    // Initialize exercise store with basic data
    exerciseStore.exercises = [
      { id: 'ex1', name: 'Bench Press', muscleGroup: 'chest' },
    ]

    await workoutStore.fetchWorkouts('week')

    return mount(MuscleProgress, {
      global: {
        plugins: [createPinia()],
      },
    })
  }

  describe('avgRpe display', () => {
    it('should display avgRpe value from quickStats', async () => {
      const workouts = [createMockWorkout(7.5)]
      fetchCollection.mockResolvedValue(workouts)

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('7.5')
    })

    it('should display "--" when avgRpe is 0', async () => {
      fetchCollection.mockResolvedValue([])

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('--')
    })

    it('should display "--" when avgRpe is null', async () => {
      fetchCollection.mockResolvedValue([])

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('--')
    })
  })

  describe('RPE color classes', () => {
    it('should apply green color for low RPE (≤4)', async () => {
      const workouts = [createMockWorkout(3.5)]
      fetchCollection.mockResolvedValue(workouts)

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      // Check if green background class exists
      expect(wrapper.html()).toContain('bg-green-500/10')
      expect(wrapper.html()).toContain('text-green-500')
    })

    it('should apply yellow color for medium RPE (5-7)', async () => {
      const workouts = [createMockWorkout(6.0)]
      fetchCollection.mockResolvedValue(workouts)

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-yellow-500/10')
      expect(wrapper.html()).toContain('text-yellow-500')
    })

    it('should apply red color for high RPE (≥8)', async () => {
      const workouts = [createMockWorkout(9.0)]
      fetchCollection.mockResolvedValue(workouts)

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-red-500/10')
      expect(wrapper.html()).toContain('text-red-500')
    })

    it('should apply neutral color when no RPE data', async () => {
      fetchCollection.mockResolvedValue([])

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-muted/50')
      expect(wrapper.html()).toContain('text-muted-foreground')
    })
  })

  describe('icon rendering', () => {
    it('should render Activity icon (not Heart)', async () => {
      fetchCollection.mockResolvedValue([])

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="activity-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="heart-icon"]').exists()).toBe(false)
    })

    it('should render Scale icon for weight', async () => {
      fetchCollection.mockResolvedValue([])

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="scale-icon"]').exists()).toBe(true)
    })
  })

  describe('i18n translation keys', () => {
    it('should use avgRpe translation key', async () => {
      fetchCollection.mockResolvedValue([])

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      // The global mock of $t returns the key itself
      expect(wrapper.text()).toContain('dashboard.muscleProgress.avgRpe')
    })
  })

  describe('edge cases', () => {
    it('should handle avgRpe at LOW_MAX threshold (4)', async () => {
      const workouts = [createMockWorkout(CONFIG.rpe.LOW_MAX)]
      fetchCollection.mockResolvedValue(workouts)

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-green-500/10')
    })

    it('should handle avgRpe at MEDIUM_MAX threshold (7)', async () => {
      const workouts = [createMockWorkout(CONFIG.rpe.MEDIUM_MAX)]
      fetchCollection.mockResolvedValue(workouts)

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-yellow-500/10')
    })

    it('should handle avgRpe just above MEDIUM_MAX (8)', async () => {
      const workouts = [createMockWorkout(CONFIG.rpe.MEDIUM_MAX + 1)]
      fetchCollection.mockResolvedValue(workouts)

      const workoutStore = useWorkoutStore()
      await workoutStore.fetchWorkouts('week')

      const wrapper = mount(MuscleProgress)
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-red-500/10')
    })
  })
})
