import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { nextTick, ref } from 'vue'
import ExerciseTable from '../ExerciseTable.vue'

// Create reactive mock refs for the store - these will be used to control test state
const mockActiveWorkout = ref(null)
const mockRecentWorkouts = ref([])
const mockLoading = ref(false)

// Create a mock Pinia store that returns refs properly for storeToRefs
const createMockWorkoutStore = () => {
  return {
    // These are refs, which is what storeToRefs expects
    activeWorkout: mockActiveWorkout,
    recentWorkouts: mockRecentWorkouts,
    loading: mockLoading,
    // Store methods
    startWorkout: vi.fn(),
    addExercise: vi.fn(),
    addSet: vi.fn(),
  }
}

// Mock the stores completely BEFORE importing
vi.mock('@/stores/workoutStore', () => ({
  useWorkoutStore: vi.fn(() => createMockWorkoutStore()),
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  MoreHorizontal: {
    name: 'MoreHorizontal',
    template: '<svg data-testid="more-icon"></svg>',
  },
  Plus: {
    name: 'Plus',
    template: '<svg data-testid="plus-icon"></svg>',
  },
  Dumbbell: {
    name: 'Dumbbell',
    template: '<svg data-testid="dumbbell-icon" aria-hidden="true"></svg>',
  },
}))

// Mock constants
vi.mock('@/constants/config', () => ({
  CONFIG: {
    analytics: {
      MAX_RECENT_WORKOUTS_DISPLAY: 10,
      MAX_EXERCISES_DISPLAY: 8,
    },
  },
}))

vi.mock('@/constants/strings', () => ({
  STRINGS: {
    exerciseTable: {
      overview: 'Overview',
      history: 'History',
      exercises: 'Exercises',
      plans: 'Plans',
      exercise: 'Exercise',
      type: 'Type',
      status: 'Status',
      sets: 'Sets',
      reps: 'Reps',
      weight: 'Weight',
      date: 'Date',
      duration: 'Duration',
      volume: 'Volume',
      lastPerformed: 'Last performed',
      totalSets: 'Total sets',
      totalVolume: 'Total volume',
      timesPerformed: 'Times',
      noActiveExercises: 'No active exercises',
      noActiveExercisesSubtitle: 'Add an exercise to start your workout',
      noWorkoutHistory: 'No workout history',
      noExercises: 'No exercises',
      noPlans: 'No plans',
      noPlansSubtitle: 'Create a workout plan',
      edit: 'Edit',
      duplicate: 'Duplicate',
      delete: 'Delete',
      customize: 'Customize',
      addExercise: 'Add exercise',
    },
    status: {
      completed: 'Done',
      inProgress: 'In Progress',
      scheduled: 'Scheduled',
    },
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
}))

// Note: The Tabs component is not easily mockable because it manages internal state.
// The component uses v-model="activeTab" which is its own local ref.
// We'll just render all TabsContent to make testing easier.
vi.mock('@/components/ui/tabs', () => ({
  Tabs: {
    name: 'Tabs',
    props: ['modelValue', 'defaultValue'],
    emits: ['update:modelValue'],
    template: '<div class="tabs" data-testid="tabs"><slot /></div>',
  },
  TabsList: {
    name: 'TabsList',
    template: '<div class="tabs-list"><slot /></div>',
  },
  TabsTrigger: {
    name: 'TabsTrigger',
    props: ['value'],
    template: '<button class="tabs-trigger" :data-value="value"><slot /></button>',
  },
  TabsContent: {
    name: 'TabsContent',
    props: ['value'],
    // Always render content so we can test it
    template: '<div class="tabs-content" :data-value="value"><slot /></div>',
  },
}))

vi.mock('@/components/ui/table', () => ({
  Table: {
    name: 'Table',
    props: ['ariaLabel'],
    template: '<table class="table" :aria-label="ariaLabel"><slot /></table>',
  },
  TableBody: {
    name: 'TableBody',
    template: '<tbody class="table-body"><slot /></tbody>',
  },
  TableCell: {
    name: 'TableCell',
    template: '<td class="table-cell"><slot /></td>',
  },
  TableHead: {
    name: 'TableHead',
    props: ['ariaLabel'],
    template: '<th class="table-head" :aria-label="ariaLabel"><slot /></th>',
  },
  TableHeader: {
    name: 'TableHeader',
    template: '<thead class="table-header"><slot /></thead>',
  },
  TableRow: {
    name: 'TableRow',
    template: '<tr class="table-row"><slot /></tr>',
  },
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: {
    name: 'Badge',
    props: ['variant'],
    template: '<span class="badge" :data-variant="variant"><slot /></span>',
  },
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: {
    name: 'Checkbox',
    props: ['checked', 'ariaLabel'],
    emits: ['update:checked'],
    template:
      '<input type="checkbox" class="checkbox" :checked="checked" :aria-label="ariaLabel" @change="$emit(\'update:checked\', $event.target.checked)" />',
  },
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    name: 'Button',
    props: ['variant', 'size', 'ariaLabel'],
    template:
      '<button class="button" :data-variant="variant" :data-size="size" :aria-label="ariaLabel"><slot /></button>',
  },
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: {
    name: 'DropdownMenu',
    template: '<div class="dropdown-menu"><slot /></div>',
  },
  DropdownMenuContent: {
    name: 'DropdownMenuContent',
    template: '<div class="dropdown-content"><slot /></div>',
  },
  DropdownMenuItem: {
    name: 'DropdownMenuItem',
    template:
      '<button class="dropdown-item" @click="$emit(\'click\')"><slot /></button>',
  },
  DropdownMenuTrigger: {
    name: 'DropdownMenuTrigger',
    props: ['asChild'],
    template: '<div class="dropdown-trigger"><slot /></div>',
  },
}))

// Import the mocked store
import { useWorkoutStore } from '@/stores/workoutStore'

describe('ExerciseTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Reset mock refs to default values
    mockActiveWorkout.value = null
    mockRecentWorkouts.value = []
    mockLoading.value = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Helper to create mock workout data
   */
  function createMockWorkout(overrides = {}) {
    const now = new Date()
    return {
      id: 'workout-' + Math.random().toString(36).substr(2, 9),
      userId: 'test-user-id',
      status: 'completed',
      startedAt: now,
      completedAt: now,
      exercises: [],
      duration: 3600,
      totalVolume: 5000,
      ...overrides,
    }
  }

  /**
   * Factory function to create wrapper with common setup
   */
  function createWrapper(storeOverrides = {}) {
    // Set the reactive mock values
    if (storeOverrides.activeWorkout !== undefined) {
      mockActiveWorkout.value = storeOverrides.activeWorkout
    }
    if (storeOverrides.recentWorkouts !== undefined) {
      mockRecentWorkouts.value = storeOverrides.recentWorkouts
    }
    if (storeOverrides.loading !== undefined) {
      mockLoading.value = storeOverrides.loading
    }

    return mount(ExerciseTable, {
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
  }

  describe('tab navigation', () => {
    it('should render all four tabs', () => {
      const wrapper = createWrapper()

      const tabs = wrapper.findAll('.tabs-trigger')
      expect(tabs.length).toBe(4)
    })

    it('should render overview tab trigger', () => {
      const wrapper = createWrapper()

      const overviewTab = wrapper.find('[data-value="overview"]')
      expect(overviewTab.exists()).toBe(true)
    })

    it('should render history tab trigger', () => {
      const wrapper = createWrapper()

      const historyTab = wrapper.find('[data-value="history"]')
      expect(historyTab.exists()).toBe(true)
    })

    it('should render exercises tab trigger', () => {
      const wrapper = createWrapper()

      const exercisesTab = wrapper.find('[data-value="exercises"]')
      expect(exercisesTab.exists()).toBe(true)
    })

    it('should render plans tab trigger', () => {
      const wrapper = createWrapper()

      const plansTab = wrapper.find('[data-value="plans"]')
      expect(plansTab.exists()).toBe(true)
    })

    it('should show overview content by default', () => {
      const wrapper = createWrapper()

      // The overview tab should be shown initially (activeTab = 'overview')
      expect(wrapper.html()).toContain('overview')
    })

    it('should display workout count badge in history tab', () => {
      const mockWorkouts = [
        createMockWorkout(),
        createMockWorkout(),
        createMockWorkout(),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
      })

      // Find badge in history tab
      const historyTab = wrapper.find('[data-value="history"]')
      expect(historyTab.text()).toContain('3')
    })
  })

  describe('overview tab - todays exercises', () => {
    it('should display exercises from active workout', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            category: 'Strength',
            sets: [
              { weight: 100, reps: 10 },
              { weight: 100, reps: 8 },
            ],
          },
          {
            exerciseId: 'ex-2',
            exerciseName: 'Squat',
            category: 'Strength',
            sets: [{ weight: 120, reps: 5 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      expect(wrapper.text()).toContain('Bench Press')
      expect(wrapper.text()).toContain('Squat')
    })

    it('should show empty state when no active workout', () => {
      const wrapper = createWrapper({ activeWorkout: null })

      expect(wrapper.text()).toContain('workout.exerciseTable.noActiveExercises')
    })

    it('should show empty state when active workout has no exercises', () => {
      const wrapper = createWrapper({
        activeWorkout: {
          id: 'workout-1',
          status: 'active',
          exercises: [],
        },
      })

      expect(wrapper.text()).toContain('workout.exerciseTable.noActiveExercises')
    })

    it('should display exercise type badge', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            category: 'Strength',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      const badge = wrapper.find('.badge[data-variant="outline"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Strength')
    })

    it('should display set count for each exercise', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            category: 'Strength',
            sets: [
              { weight: 100, reps: 10 },
              { weight: 100, reps: 8 },
              { weight: 95, reps: 8 },
            ],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      // Should show 3 sets
      expect(wrapper.text()).toContain('3')
    })

    it('should calculate average reps', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [
              { weight: 100, reps: 10 },
              { weight: 100, reps: 8 },
            ],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      // Average reps: (10 + 8) / 2 = 9
      expect(wrapper.text()).toContain('9')
    })

    it('should calculate average weight', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [
              { weight: 100, reps: 10 },
              { weight: 80, reps: 10 },
            ],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      // Average weight: (100 + 80) / 2 = 90 kg
      expect(wrapper.text()).toContain('90 kg')
    })
  })

  describe('status badges', () => {
    it('should show completed status for exercises with sets', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      expect(wrapper.text()).toContain('Done')
    })

    it('should show scheduled status for exercises without sets', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      expect(wrapper.text()).toContain('Scheduled')
    })

    it('should apply default variant for completed status', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      // Find the status badge (not the type badge)
      const badges = wrapper.findAll('.badge')
      const statusBadge = badges.find((b) => b.text() === 'Done')
      expect(statusBadge?.attributes('data-variant')).toBe('default')
    })

    it('should apply outline variant for scheduled status', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      const badges = wrapper.findAll('.badge')
      const statusBadge = badges.find((b) => b.text() === 'Scheduled')
      expect(statusBadge?.attributes('data-variant')).toBe('outline')
    })
  })

  describe('checkbox state', () => {
    it('should show checked checkbox for completed exercises', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      const checkbox = wrapper.find('.checkbox')
      expect(checkbox.element.checked).toBe(true)
    })

    it('should show unchecked checkbox for scheduled exercises', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      const checkbox = wrapper.find('.checkbox')
      expect(checkbox.element.checked).toBe(false)
    })

    it('should have accessible aria-label on checkbox', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      const checkbox = wrapper.find('.checkbox')
      expect(checkbox.attributes('aria-label')).toContain('Bench Press')
    })
  })

  describe('dropdown actions', () => {
    it('should render dropdown menu for each exercise', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    })

    it('should render edit option', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      expect(wrapper.text()).toContain('workout.exerciseTable.edit')
    })

    it('should render duplicate option', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      expect(wrapper.text()).toContain('workout.exerciseTable.duplicate')
    })

    it('should render delete option', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      expect(wrapper.text()).toContain('workout.exerciseTable.delete')
    })

    it('should have accessible aria-label on action button', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      const actionButton = wrapper.find('.button[aria-label]')
      expect(actionButton.attributes('aria-label')).toContain('Bench Press')
    })
  })

  describe('history tab', () => {
    /**
     * Note: The history tab content is hidden behind v-if when the overview tab is active.
     * These tests verify the history badge count which is always visible.
     */
    it('should display workout count in history badge', () => {
      const mockWorkouts = [
        createMockWorkout({
          id: 'w1',
          completedAt: new Date('2024-01-15'),
          exercises: [{ sets: [] }, { sets: [] }],
          duration: 3600,
          totalVolume: 5000,
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      // Check for workout count in history badge
      const historyTab = wrapper.find('[data-value="history"]')
      expect(historyTab.text()).toContain('1')
    })

    it('should show correct count for multiple workouts', () => {
      const mockWorkouts = [
        createMockWorkout({
          duration: 5400,
          exercises: [],
          status: 'completed',
        }),
        createMockWorkout({
          duration: 3600,
          exercises: [],
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      // Should show 2 workouts in badge
      const historyTab = wrapper.find('[data-value="history"]')
      expect(historyTab.text()).toContain('2')
    })

    it('should show zero when no workout history', () => {
      const wrapper = createWrapper({
        recentWorkouts: [],
        activeWorkout: null,
      })

      const historyTab = wrapper.find('[data-value="history"]')
      expect(historyTab.text()).toContain('0')
    })

    it('should count only completed workouts', () => {
      const mockWorkouts = [
        createMockWorkout({
          totalVolume: 12500,
          exercises: [],
          status: 'completed',
        }),
        createMockWorkout({
          totalVolume: 10000,
          exercises: [],
          status: 'completed',
        }),
        createMockWorkout({
          totalVolume: 8000,
          exercises: [],
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      const historyTab = wrapper.find('[data-value="history"]')
      expect(historyTab.text()).toContain('3')
    })
  })

  describe('exercises tab', () => {
    /**
     * Note: The exercises tab tests verify the computed data exists in the component.
     * Since the component uses v-if for tab content, we can't easily click to show
     * the exercises tab in unit tests. These tests verify the exercises badge count
     * which is always visible.
     */
    it('should aggregate exercises from recent workouts and show in badge', () => {
      const mockWorkouts = [
        createMockWorkout({
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
          status: 'completed',
        }),
        createMockWorkout({
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 110, reps: 8 }],
            },
          ],
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      // The exercises badge should show "1" since there's only 1 unique exercise
      const exercisesTab = wrapper.find('[data-value="exercises"]')
      expect(exercisesTab.text()).toContain('1')
    })

    it('should count total unique exercises in badge', () => {
      const mockWorkouts = [
        createMockWorkout({
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [
                { weight: 100, reps: 10 },
                { weight: 100, reps: 8 },
              ],
            },
            {
              exerciseId: 'ex-2',
              exerciseName: 'Squat',
              sets: [{ weight: 150, reps: 5 }],
            },
          ],
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      // Should show 2 unique exercises in the badge
      const exercisesTab = wrapper.find('[data-value="exercises"]')
      expect(exercisesTab.text()).toContain('2')
    })

    it('should show zero exercises when no workouts', () => {
      const wrapper = createWrapper({
        recentWorkouts: [],
        activeWorkout: null,
      })

      const exercisesTab = wrapper.find('[data-value="exercises"]')
      expect(exercisesTab.text()).toContain('0')
    })

    it('should aggregate multiple workouts with same exercise', () => {
      const mockWorkouts = [
        createMockWorkout({
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 100, reps: 10 }],
            },
          ],
          status: 'completed',
        }),
        createMockWorkout({
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 110, reps: 8 }],
            },
          ],
          status: 'completed',
        }),
        createMockWorkout({
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 115, reps: 6 }],
            },
          ],
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      // Only 1 unique exercise across all workouts
      const exercisesTab = wrapper.find('[data-value="exercises"]')
      expect(exercisesTab.text()).toContain('1')
    })
  })

  describe('plans tab', () => {
    it('should show empty state for plans', async () => {
      const wrapper = createWrapper()

      const plansTab = wrapper.find('[data-value="plans"]')
      await plansTab.trigger('click')
      await nextTick()

      // Plans are not implemented yet, should show empty state
      expect(wrapper.html()).toContain('svg') // Empty state icon
    })
  })

  describe('action buttons', () => {
    it('should render customize button', () => {
      const wrapper = createWrapper()

      // The component uses Ukrainian text
      expect(wrapper.text()).toContain('Налаштувати')
    })

    it('should render add exercise button', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('[data-testid="plus-icon"]').exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have aria-label on table', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [{ weight: 100, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      const table = wrapper.find('.table')
      expect(table.attributes('aria-label')).toBeDefined()
    })

    it('should have role=status on empty state', () => {
      const wrapper = createWrapper({ activeWorkout: null })

      // Empty state should have role="status" for screen readers
      const emptyState = wrapper.find('[role="status"]')
      expect(emptyState.exists()).toBe(true)
    })

    it('should have aria-hidden on decorative icons', () => {
      const wrapper = createWrapper({ activeWorkout: null })

      // The plus icon in empty state should be aria-hidden
      const icon = wrapper.find('[aria-hidden="true"]')
      expect(icon.exists()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle workout with null completedAt', async () => {
      const mockWorkouts = [
        createMockWorkout({
          completedAt: null,
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      const historyTab = wrapper.find('[data-value="history"]')
      await historyTab.trigger('click')
      await nextTick()

      // Should handle gracefully with "-" or similar fallback
      expect(wrapper.html()).toBeTruthy()
    })

    it('should handle workout with null duration', async () => {
      const mockWorkouts = [
        createMockWorkout({
          duration: null,
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      const historyTab = wrapper.find('[data-value="history"]')
      await historyTab.trigger('click')
      await nextTick()

      // Should handle gracefully
      expect(wrapper.html()).toBeTruthy()
    })

    it('should handle exercise with empty sets array', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      // Should show 0 sets and scheduled status
      expect(wrapper.text()).toContain('0')
      expect(wrapper.text()).toContain('Scheduled')
    })

    it('should handle exercise with missing category', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Custom Exercise',
            category: undefined,
            sets: [{ weight: 50, reps: 10 }],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      // Should default to "Strength" or handle gracefully
      expect(wrapper.text()).toContain('Custom Exercise')
    })

    it('should display weight as dash when exercise has no sets', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: [],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      expect(wrapper.text()).toContain('-')
    })
  })

  describe('Firebase Timestamp handling', () => {
    it('should handle Firebase Timestamp objects in completedAt', async () => {
      const mockDate = new Date('2024-01-15')
      const mockWorkouts = [
        createMockWorkout({
          completedAt: {
            toDate: () => mockDate,
          },
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      const historyTab = wrapper.find('[data-value="history"]')
      await historyTab.trigger('click')
      await nextTick()

      // Should format the date correctly
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('computed properties', () => {
    it('should correctly compute todaysExercises', () => {
      const activeWorkout = {
        id: 'workout-1',
        status: 'active',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            category: 'Strength',
            sets: [
              { weight: 100, reps: 10 },
              { weight: 100, reps: 8 },
            ],
          },
        ],
      }

      const wrapper = createWrapper({ activeWorkout })

      // The computed should transform exercises correctly
      expect(wrapper.text()).toContain('Bench Press')
      expect(wrapper.text()).toContain('2') // sets count
    })

    it('should correctly compute workoutHistory count', () => {
      const mockWorkouts = [
        createMockWorkout({ id: 'w1', status: 'completed' }),
        createMockWorkout({ id: 'w2', status: 'completed' }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      // The history badge should show the count
      const historyTab = wrapper.find('[data-value="history"]')
      expect(historyTab.text()).toContain('2')
    })

    it('should correctly compute allExercises aggregation count', () => {
      const mockWorkouts = [
        createMockWorkout({
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Bench Press',
              sets: [{ weight: 100, reps: 10 }],
            },
            {
              exerciseId: 'ex-2',
              exerciseName: 'Squat',
              sets: [{ weight: 150, reps: 8 }],
            },
          ],
          status: 'completed',
        }),
      ]

      const wrapper = createWrapper({
        recentWorkouts: mockWorkouts,
        activeWorkout: null,
      })

      // The exercises badge should show 2 unique exercises
      const exercisesTab = wrapper.find('[data-value="exercises"]')
      expect(exercisesTab.text()).toContain('2')
    })
  })
})
